import Stripe from 'stripe';

export interface BillingConfig {
  stripeSecretKey: string;
  stripePublishableKey: string;
  stripeWebhookSecret: string;
  environment: 'development' | 'staging' | 'production';
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    analysisCredits: number;
    apiCalls: number;
    exportFormats: string[];
    customRules: boolean;
    prioritySupport: boolean;
  };
  stripePriceId: string;
  stripeProductId: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  metadata?: Record<string, any>;
}

export interface UsageRecord {
  id: string;
  userId: string;
  subscriptionId: string;
  type: 'analysis' | 'api_call' | 'export';
  quantity: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface BillingUsage {
  userId: string;
  subscriptionId: string;
  period: {
    start: Date;
    end: Date;
  };
  usage: {
    analysisCredits: number;
    apiCalls: number;
    exports: number;
  };
  limits: {
    analysisCredits: number;
    apiCalls: number;
    exports: number;
  };
  overages: {
    analysisCredits: number;
    apiCalls: number;
    exports: number;
  };
}

export interface PaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

export interface Invoice {
  id: string;
  userId: string;
  stripeInvoiceId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  paidAt?: Date;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  quantity: number;
  unitAmount: number;
  type: 'subscription' | 'usage' | 'overage';
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  processedAt?: Date;
  error?: string;
}

export type StripeWebhookEventType =
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'
  | 'customer.created'
  | 'customer.updated'
  | 'payment_method.attached'
  | 'payment_method.detached';

export interface CreateSubscriptionRequest {
  userId: string;
  planId: string;
  paymentMethodId?: string;
  couponCode?: string;
  trialDays?: number;
  metadata?: Record<string, any>;
}

export interface UpdateSubscriptionRequest {
  subscriptionId: string;
  planId?: string;
  quantity?: number;
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
  metadata?: Record<string, any>;
}

export interface CreateCustomerRequest {
  userId: string;
  email: string;
  name?: string;
  address?: Stripe.AddressParam;
  metadata?: Record<string, any>;
}

export interface BillingPortalRequest {
  customerId: string;
  returnUrl: string;
}

export interface CheckoutSessionRequest {
  userId: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
  couponCode?: string;
  metadata?: Record<string, any>;
}