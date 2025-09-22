import { Router } from 'express';
import { z } from 'zod';

const router = Router();

// Mock billing data for demonstration
const mockPlans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    limits: { analysisCredits: 100, apiCalls: 500 }
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    interval: 'month',
    limits: { analysisCredits: 5000, apiCalls: 25000 }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    interval: 'month',
    limits: { analysisCredits: -1, apiCalls: -1 }
  }
];

const createCheckoutSessionSchema = z.object({
  planId: z.string(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  trialDays: z.number().optional()
});

const createPortalSessionSchema = z.object({
  returnUrl: z.string().url()
});

// Get available plans
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    data: mockPlans
  });
});

// Create checkout session
router.post('/checkout', async (req, res) => {
  try {
    const body = createCheckoutSessionSchema.parse(req.body);

    // In a real implementation, this would:
    // 1. Validate the plan exists
    // 2. Create a Stripe checkout session
    // 3. Return the session URL

    const sessionId = `cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      success: true,
      data: {
        sessionId,
        url: `https://checkout.stripe.com/pay/${sessionId}`,
        message: 'Mock checkout session created'
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Invalid request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create customer portal session
router.post('/portal', async (req, res) => {
  try {
    const body = createPortalSessionSchema.parse(req.body);

    // In a real implementation, this would:
    // 1. Get customer ID from authenticated user
    // 2. Create a Stripe billing portal session
    // 3. Return the portal URL

    const sessionId = `bps_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      success: true,
      data: {
        sessionId,
        url: `https://billing.stripe.com/p/session/${sessionId}`,
        message: 'Mock portal session created'
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Invalid request',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user subscription
router.get('/subscription', async (req, res) => {
  // In a real implementation, this would get the authenticated user's subscription

  const mockSubscription = {
    id: 'sub_mock123',
    planId: 'pro',
    status: 'active',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cancelAtPeriodEnd: false
  };

  res.json({
    success: true,
    data: mockSubscription
  });
});

// Get usage statistics
router.get('/usage', async (req, res) => {
  const mockUsage = {
    period: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      end: new Date()
    },
    usage: {
      analysisCredits: Math.floor(Math.random() * 1000),
      apiCalls: Math.floor(Math.random() * 5000),
      exports: Math.floor(Math.random() * 50)
    },
    limits: {
      analysisCredits: 5000,
      apiCalls: 25000,
      exports: 1000
    }
  };

  res.json({
    success: true,
    data: mockUsage
  });
});

// Cancel subscription
router.post('/subscription/cancel', async (req, res) => {
  try {
    // In a real implementation, this would:
    // 1. Get user's subscription
    // 2. Cancel the Stripe subscription
    // 3. Update the local database

    res.json({
      success: true,
      message: 'Subscription canceled successfully',
      data: {
        canceledAt: new Date(),
        effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Webhooks endpoint
router.post('/webhooks/stripe', async (req, res) => {
  try {
    // In a real implementation, this would:
    // 1. Verify the webhook signature
    // 2. Process the webhook event
    // 3. Update local database accordingly

    const event = req.body;
    console.log('Received webhook:', event.type);

    // Mock webhook processing
    switch (event.type) {
      case 'invoice.payment_succeeded':
        console.log('Payment succeeded:', event.data.object.id);
        break;
      case 'invoice.payment_failed':
        console.log('Payment failed:', event.data.object.id);
        break;
      case 'customer.subscription.updated':
        console.log('Subscription updated:', event.data.object.id);
        break;
      default:
        console.log('Unhandled event type:', event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
});

export default router;