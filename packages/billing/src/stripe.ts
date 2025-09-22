import Stripe from 'stripe';
import {
  BillingConfig,
  CreateCustomerRequest,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  CheckoutSessionRequest,
  BillingPortalRequest,
  UserSubscription,
  PaymentMethod
} from './types';
import { PlanManager } from './plans';

export class StripeService {
  private stripe: Stripe;
  private config: BillingConfig;

  constructor(config: BillingConfig) {
    this.config = config;
    this.stripe = new Stripe(config.stripeSecretKey, {
      apiVersion: '2023-10-16',
      typescript: true
    });
  }

  // Customer Management
  async createCustomer(request: CreateCustomerRequest): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email: request.email,
        name: request.name,
        address: request.address,
        metadata: {
          userId: request.userId,
          ...request.metadata
        }
      });

      return customer;
    } catch (error) {
      throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      if (customer.deleted) {
        throw new Error('Customer has been deleted');
      }
      return customer as Stripe.Customer;
    } catch (error) {
      throw new Error(`Failed to retrieve customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateCustomer(customerId: string, updates: Partial<CreateCustomerRequest>): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.update(customerId, {
        email: updates.email,
        name: updates.name,
        address: updates.address,
        metadata: updates.metadata
      });

      return customer;
    } catch (error) {
      throw new Error(`Failed to update customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Subscription Management
  async createSubscription(request: CreateSubscriptionRequest): Promise<UserSubscription> {
    try {
      const plan = PlanManager.getPlan(request.planId);
      if (!plan) {
        throw new Error(`Invalid plan ID: ${request.planId}`);
      }

      // Get or create customer
      let customer: Stripe.Customer;
      try {
        // Assume we have customer ID from userId lookup
        customer = await this.getCustomerByUserId(request.userId);
      } catch {
        // Create customer if not found
        customer = await this.createCustomer({
          userId: request.userId,
          email: `user-${request.userId}@trustlens.ai` // This should come from user service
        });
      }

      const subscriptionData: Stripe.SubscriptionCreateParams = {
        customer: customer.id,
        items: [{ price: plan.stripePriceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: request.userId,
          planId: request.planId,
          ...request.metadata
        }
      };

      if (request.paymentMethodId) {
        subscriptionData.default_payment_method = request.paymentMethodId;
      }

      if (request.trialDays) {
        subscriptionData.trial_period_days = request.trialDays;
      }

      if (request.couponCode) {
        subscriptionData.coupon = request.couponCode;
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionData);

      return this.mapSubscriptionToUserSubscription(subscription, request.userId, request.planId);
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSubscription(subscriptionId: string): Promise<UserSubscription> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

      // Extract userId and planId from metadata
      const userId = subscription.metadata.userId;
      const planId = subscription.metadata.planId;

      if (!userId || !planId) {
        throw new Error('Subscription missing required metadata');
      }

      return this.mapSubscriptionToUserSubscription(subscription, userId, planId);
    } catch (error) {
      throw new Error(`Failed to retrieve subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateSubscription(request: UpdateSubscriptionRequest): Promise<UserSubscription> {
    try {
      const updateData: Stripe.SubscriptionUpdateParams = {
        metadata: request.metadata
      };

      if (request.planId) {
        const plan = PlanManager.getPlan(request.planId);
        if (!plan) {
          throw new Error(`Invalid plan ID: ${request.planId}`);
        }

        updateData.items = [{ price: plan.stripePriceId }];
        updateData.proration_behavior = request.prorationBehavior || 'create_prorations';
      }

      if (request.quantity !== undefined) {
        // Quantity is handled via items array
        if (updateData.items && updateData.items[0]) {
          updateData.items[0].quantity = request.quantity;
        }
      }

      const subscription = await this.stripe.subscriptions.update(request.subscriptionId, updateData);

      const userId = subscription.metadata.userId;
      const planId = request.planId || subscription.metadata.planId;

      return this.mapSubscriptionToUserSubscription(subscription, userId, planId);
    } catch (error) {
      throw new Error(`Failed to update subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async cancelSubscription(subscriptionId: string, immediately: boolean = false): Promise<UserSubscription> {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: !immediately
      });

      if (immediately) {
        await this.stripe.subscriptions.cancel(subscriptionId);
      }

      const userId = subscription.metadata.userId;
      const planId = subscription.metadata.planId;

      return this.mapSubscriptionToUserSubscription(subscription, userId, planId);
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Payment Methods
  async getPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      return paymentMethods.data.map(pm => ({
        id: pm.id,
        type: 'card',
        card: {
          brand: pm.card?.brand || '',
          last4: pm.card?.last4 || '',
          expMonth: pm.card?.exp_month || 0,
          expYear: pm.card?.exp_year || 0
        },
        isDefault: false // This would need to be determined from customer's default payment method
      }));
    } catch (error) {
      throw new Error(`Failed to retrieve payment methods: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<void> {
    try {
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });
    } catch (error) {
      throw new Error(`Failed to attach payment method: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);
    } catch (error) {
      throw new Error(`Failed to detach payment method: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Checkout Sessions
  async createCheckoutSession(request: CheckoutSessionRequest): Promise<Stripe.Checkout.Session> {
    try {
      const plan = PlanManager.getPlan(request.planId);
      if (!plan) {
        throw new Error(`Invalid plan ID: ${request.planId}`);
      }

      const sessionData: Stripe.Checkout.SessionCreateParams = {
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1
          }
        ],
        success_url: request.successUrl,
        cancel_url: request.cancelUrl,
        client_reference_id: request.userId,
        metadata: {
          userId: request.userId,
          planId: request.planId,
          ...request.metadata
        }
      };

      if (request.trialDays) {
        sessionData.subscription_data = {
          trial_period_days: request.trialDays
        };
      }

      if (request.couponCode) {
        sessionData.discounts = [{ coupon: request.couponCode }];
      }

      const session = await this.stripe.checkout.sessions.create(sessionData);

      return session;
    } catch (error) {
      throw new Error(`Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Billing Portal
  async createBillingPortalSession(request: BillingPortalRequest): Promise<Stripe.BillingPortal.Session> {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: request.customerId,
        return_url: request.returnUrl
      });

      return session;
    } catch (error) {
      throw new Error(`Failed to create billing portal session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Invoices
  async getUpcomingInvoice(customerId: string): Promise<any> {
    try {
      const invoice = await this.stripe.invoices.retrieveUpcoming({
        customer: customerId
      });

      return invoice;
    } catch (error) {
      throw new Error(`Failed to retrieve upcoming invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getInvoices(customerId: string, limit: number = 10): Promise<Stripe.Invoice[]> {
    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit
      });

      return invoices.data;
    } catch (error) {
      throw new Error(`Failed to retrieve invoices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Usage Records (for metered billing)
  async recordUsage(subscriptionItemId: string, quantity: number, timestamp?: number): Promise<Stripe.UsageRecord> {
    try {
      const usageRecord = await this.stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
        quantity,
        timestamp: timestamp || Math.floor(Date.now() / 1000),
        action: 'increment'
      });

      return usageRecord;
    } catch (error) {
      throw new Error(`Failed to record usage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper Methods
  private async getCustomerByUserId(userId: string): Promise<Stripe.Customer> {
    const customers = await this.stripe.customers.list({
      limit: 1,
      email: `user-${userId}@trustlens.ai` // This is a simplified lookup
    });

    if (customers.data.length === 0) {
      throw new Error('Customer not found');
    }

    return customers.data[0];
  }

  private mapSubscriptionToUserSubscription(
    subscription: Stripe.Subscription,
    userId: string,
    planId: string
  ): UserSubscription {
    return {
      id: subscription.id,
      userId,
      planId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      status: this.mapSubscriptionStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
      metadata: subscription.metadata
    };
  }

  private mapSubscriptionStatus(stripeStatus: string): UserSubscription['status'] {
    switch (stripeStatus) {
      case 'active':
        return 'active';
      case 'canceled':
        return 'canceled';
      case 'past_due':
        return 'past_due';
      case 'incomplete':
        return 'incomplete';
      case 'trialing':
        return 'trialing';
      default:
        return 'incomplete';
    }
  }

  // Webhook signature verification
  constructEvent(body: string | Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(body, signature, this.config.stripeWebhookSecret);
  }
}