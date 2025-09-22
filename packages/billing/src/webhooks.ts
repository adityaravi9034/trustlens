import Stripe from 'stripe';
import { StripeService } from './stripe';
import { StripeWebhookEventType, WebhookEvent } from './types';

export interface WebhookHandler {
  handleWebhook(event: Stripe.Event): Promise<void>;
}

export class StripeWebhookHandler implements WebhookHandler {
  private stripeService: StripeService;
  private eventStore?: WebhookEventStore;

  constructor(stripeService: StripeService, eventStore?: WebhookEventStore) {
    this.stripeService = stripeService;
    this.eventStore = eventStore;
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    // Store the event for audit trail
    if (this.eventStore) {
      await this.eventStore.storeEvent({
        id: event.id,
        type: event.type,
        data: event.data
      });
    }

    try {
      switch (event.type as StripeWebhookEventType) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event);
          break;

        case 'invoice.payment_succeeded':
          await this.handleInvoicePaymentSucceeded(event);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event);
          break;

        case 'customer.created':
          await this.handleCustomerCreated(event);
          break;

        case 'customer.updated':
          await this.handleCustomerUpdated(event);
          break;

        case 'payment_method.attached':
          await this.handlePaymentMethodAttached(event);
          break;

        case 'payment_method.detached':
          await this.handlePaymentMethodDetached(event);
          break;

        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }

      // Mark event as processed
      if (this.eventStore) {
        await this.eventStore.markProcessed(event.id);
      }
    } catch (error) {
      console.error(`Error processing webhook ${event.id}:`, error);

      // Store error for debugging
      if (this.eventStore) {
        await this.eventStore.storeError(event.id, error instanceof Error ? error.message : 'Unknown error');
      }

      throw error;
    }
  }

  private async handleSubscriptionCreated(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;
    console.log(`Subscription created: ${subscription.id}`);

    // Update user's subscription status in your database
    // This would typically involve calling your user service
    const userId = subscription.metadata.userId;
    if (userId) {
      await this.updateUserSubscription(userId, subscription);
    }

    // Send welcome email
    await this.sendWelcomeEmail(subscription);

    // Set up usage tracking if needed
    await this.initializeUsageTracking(subscription);
  }

  private async handleSubscriptionUpdated(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;
    console.log(`Subscription updated: ${subscription.id}`);

    const userId = subscription.metadata.userId;
    if (userId) {
      await this.updateUserSubscription(userId, subscription);
    }

    // Handle plan changes
    const previousAttributes = event.data.previous_attributes as Partial<Stripe.Subscription>;
    if (previousAttributes?.items) {
      await this.handlePlanChange(subscription, previousAttributes);
    }

    // Handle trial ending
    if (subscription.status === 'active' && previousAttributes?.status === 'trialing') {
      await this.handleTrialEnded(subscription);
    }
  }

  private async handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
    const subscription = event.data.object as Stripe.Subscription;
    console.log(`Subscription deleted: ${subscription.id}`);

    const userId = subscription.metadata.userId;
    if (userId) {
      await this.downgradeUserToFree(userId);
    }

    // Send cancellation email
    await this.sendCancellationEmail(subscription);

    // Clean up any scheduled jobs
    await this.cleanupSubscriptionJobs(subscription);
  }

  private async handleInvoicePaymentSucceeded(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;
    console.log(`Invoice payment succeeded: ${invoice.id}`);

    // Update payment status
    await this.recordSuccessfulPayment(invoice);

    // Reset any usage counters if it's a new billing period
    if (invoice.billing_reason === 'subscription_cycle') {
      await this.resetUsageCounters(invoice.subscription as string);
    }

    // Send receipt email
    await this.sendReceiptEmail(invoice);
  }

  private async handleInvoicePaymentFailed(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;
    console.log(`Invoice payment failed: ${invoice.id}`);

    // Record failed payment
    await this.recordFailedPayment(invoice);

    // Send payment failure notification
    await this.sendPaymentFailureEmail(invoice);

    // Check if subscription should be suspended
    const subscription = await this.stripeService.getSubscription(invoice.subscription as string);
    if (subscription.status === 'past_due') {
      await this.suspendUserAccess(subscription.userId);
    }
  }

  private async handleCustomerCreated(event: Stripe.Event): Promise<void> {
    const customer = event.data.object as Stripe.Customer;
    console.log(`Customer created: ${customer.id}`);

    // Link customer to user in your system
    const userId = customer.metadata.userId;
    if (userId) {
      await this.linkCustomerToUser(userId, customer.id);
    }
  }

  private async handleCustomerUpdated(event: Stripe.Event): Promise<void> {
    const customer = event.data.object as Stripe.Customer;
    console.log(`Customer updated: ${customer.id}`);

    // Update customer information in your system
    const userId = customer.metadata.userId;
    if (userId) {
      await this.updateCustomerInfo(userId, customer);
    }
  }

  private async handlePaymentMethodAttached(event: Stripe.Event): Promise<void> {
    const paymentMethod = event.data.object as Stripe.PaymentMethod;
    console.log(`Payment method attached: ${paymentMethod.id}`);

    // Update user's payment methods
    if (paymentMethod.customer) {
      await this.updateUserPaymentMethods(paymentMethod.customer as string);
    }
  }

  private async handlePaymentMethodDetached(event: Stripe.Event): Promise<void> {
    const paymentMethod = event.data.object as Stripe.PaymentMethod;
    console.log(`Payment method detached: ${paymentMethod.id}`);

    // Update user's payment methods
    if (paymentMethod.customer) {
      await this.updateUserPaymentMethods(paymentMethod.customer as string);
    }
  }

  // Helper methods - these would integrate with your user service and notification system
  private async updateUserSubscription(userId: string, subscription: Stripe.Subscription): Promise<void> {
    // Implementation would call your user service to update subscription status
    console.log(`Updating subscription for user ${userId}`);
  }

  private async downgradeUserToFree(userId: string): Promise<void> {
    // Implementation would downgrade user to free plan
    console.log(`Downgrading user ${userId} to free plan`);
  }

  private async sendWelcomeEmail(subscription: Stripe.Subscription): Promise<void> {
    // Implementation would send welcome email
    console.log(`Sending welcome email for subscription ${subscription.id}`);
  }

  private async sendCancellationEmail(subscription: Stripe.Subscription): Promise<void> {
    // Implementation would send cancellation email
    console.log(`Sending cancellation email for subscription ${subscription.id}`);
  }

  private async sendReceiptEmail(invoice: Stripe.Invoice): Promise<void> {
    // Implementation would send receipt email
    console.log(`Sending receipt for invoice ${invoice.id}`);
  }

  private async sendPaymentFailureEmail(invoice: Stripe.Invoice): Promise<void> {
    // Implementation would send payment failure notification
    console.log(`Sending payment failure notification for invoice ${invoice.id}`);
  }

  private async initializeUsageTracking(subscription: Stripe.Subscription): Promise<void> {
    // Implementation would set up usage tracking
    console.log(`Initializing usage tracking for subscription ${subscription.id}`);
  }

  private async resetUsageCounters(subscriptionId: string): Promise<void> {
    // Implementation would reset usage counters for new billing period
    console.log(`Resetting usage counters for subscription ${subscriptionId}`);
  }

  private async handlePlanChange(subscription: Stripe.Subscription, previousAttributes: Partial<Stripe.Subscription>): Promise<void> {
    // Implementation would handle plan change logic
    console.log(`Handling plan change for subscription ${subscription.id}`);
  }

  private async handleTrialEnded(subscription: Stripe.Subscription): Promise<void> {
    // Implementation would handle trial ending
    console.log(`Trial ended for subscription ${subscription.id}`);
  }

  private async recordSuccessfulPayment(invoice: Stripe.Invoice): Promise<void> {
    // Implementation would record successful payment
    console.log(`Recording successful payment for invoice ${invoice.id}`);
  }

  private async recordFailedPayment(invoice: Stripe.Invoice): Promise<void> {
    // Implementation would record failed payment
    console.log(`Recording failed payment for invoice ${invoice.id}`);
  }

  private async suspendUserAccess(userId: string): Promise<void> {
    // Implementation would suspend user access
    console.log(`Suspending access for user ${userId}`);
  }

  private async linkCustomerToUser(userId: string, customerId: string): Promise<void> {
    // Implementation would link customer to user
    console.log(`Linking customer ${customerId} to user ${userId}`);
  }

  private async updateCustomerInfo(userId: string, customer: Stripe.Customer): Promise<void> {
    // Implementation would update customer info
    console.log(`Updating customer info for user ${userId}`);
  }

  private async updateUserPaymentMethods(customerId: string): Promise<void> {
    // Implementation would update user's payment methods
    console.log(`Updating payment methods for customer ${customerId}`);
  }

  private async cleanupSubscriptionJobs(subscription: Stripe.Subscription): Promise<void> {
    // Implementation would clean up any scheduled jobs
    console.log(`Cleaning up jobs for subscription ${subscription.id}`);
  }
}

export interface WebhookEventStore {
  storeEvent(event: WebhookEvent): Promise<void>;
  markProcessed(eventId: string): Promise<void>;
  storeError(eventId: string, error: string): Promise<void>;
  getEvent(eventId: string): Promise<WebhookEvent | null>;
  getUnprocessedEvents(): Promise<WebhookEvent[]>;
}

export class InMemoryWebhookEventStore implements WebhookEventStore {
  private events: Map<string, WebhookEvent> = new Map();

  async storeEvent(event: WebhookEvent): Promise<void> {
    this.events.set(event.id, { ...event });
  }

  async markProcessed(eventId: string): Promise<void> {
    const event = this.events.get(eventId);
    if (event) {
      event.processedAt = new Date();
      this.events.set(eventId, event);
    }
  }

  async storeError(eventId: string, error: string): Promise<void> {
    const event = this.events.get(eventId);
    if (event) {
      event.error = error;
      this.events.set(eventId, event);
    }
  }

  async getEvent(eventId: string): Promise<WebhookEvent | null> {
    return this.events.get(eventId) || null;
  }

  async getUnprocessedEvents(): Promise<WebhookEvent[]> {
    return Array.from(this.events.values()).filter(event => !event.processedAt);
  }
}