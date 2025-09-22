'use client';

import React, { useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/ui/toaster';

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    analysisCredits: number;
    apiCalls: number;
    exportFormats: string[];
    customRules: boolean;
    prioritySupport: boolean;
  };
  popular?: boolean;
  cta: string;
}

const monthlyPlans: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic analysis capabilities',
    price: 0,
    interval: 'month',
    features: [
      'Basic manipulation detection',
      'Limited analysis credits',
      'Community support',
      'Standard explanations'
    ],
    limits: {
      analysisCredits: 100,
      apiCalls: 500,
      exportFormats: ['JSON'],
      customRules: false,
      prioritySupport: false
    },
    cta: 'Get Started'
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Advanced analysis for professionals and small teams',
    price: 29,
    interval: 'month',
    features: [
      'Advanced manipulation detection',
      'Multimodal analysis (text + images)',
      'Detailed explanations and confidence scores',
      'API access',
      'Export to multiple formats',
      'Email support'
    ],
    limits: {
      analysisCredits: 5000,
      apiCalls: 25000,
      exportFormats: ['JSON', 'CSV', 'PDF'],
      customRules: true,
      prioritySupport: false
    },
    popular: true,
    cta: 'Start Free Trial'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Full-scale solution for organizations',
    price: 99,
    interval: 'month',
    features: [
      'Unlimited analysis',
      'Custom model training',
      'Advanced explainability features',
      'Dedicated API access',
      'Custom integrations',
      'Priority support',
      'SLA guarantees',
      'On-premise deployment options'
    ],
    limits: {
      analysisCredits: -1,
      apiCalls: -1,
      exportFormats: ['JSON', 'CSV', 'PDF', 'Excel', 'XML'],
      customRules: true,
      prioritySupport: true
    },
    cta: 'Contact Sales'
  }
];

const annualPlans: PricingTier[] = [
  {
    ...monthlyPlans[0],
    id: 'free_annual'
  },
  {
    ...monthlyPlans[1],
    id: 'pro_annual',
    name: 'Pro (Annual)',
    price: 290,
    interval: 'year'
  },
  {
    ...monthlyPlans[2],
    id: 'enterprise_annual',
    name: 'Enterprise (Annual)',
    price: 990,
    interval: 'year'
  }
];

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [loading, setLoading] = useState<string | null>(null);
  const { addToast } = useToast();

  const currentPlans = billingInterval === 'month' ? monthlyPlans : annualPlans;

  const handleSelectPlan = async (planId: string) => {
    setLoading(planId);

    try {
      if (planId === 'free' || planId === 'free_annual') {
        // Handle free plan signup
        addToast({
          type: 'success',
          title: 'Welcome to TrustLens!',
          description: 'Your free account is ready to use.'
        });
        return;
      }

      if (planId.includes('enterprise')) {
        // Handle enterprise contact
        addToast({
          type: 'info',
          title: 'Enterprise Contact',
          description: 'Our sales team will contact you shortly.'
        });
        return;
      }

      // Simulate checkout for paid plans
      await new Promise(resolve => setTimeout(resolve, 2000));

      addToast({
        type: 'success',
        title: 'Redirecting to Checkout',
        description: 'You will be redirected to our secure payment page.'
      });

    } catch (error) {
      addToast({
        type: 'error',
        title: 'Subscription Error',
        description: 'Failed to start subscription. Please try again.'
      });
    } finally {
      setLoading(null);
    }
  };

  const formatPrice = (price: number, interval: 'month' | 'year') => {
    if (price === 0) return 'Free';

    const formattedPrice = `$${price}`;
    return interval === 'year' ? `${formattedPrice}/year` : `${formattedPrice}/month`;
  };

  const getAnnualSavings = (monthlyPrice: number, annualPrice: number) => {
    if (monthlyPrice === 0) return 0;
    const monthlyCost = monthlyPrice * 12;
    return Math.round(((monthlyCost - annualPrice) / monthlyCost) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl">
            Choose Your Plan
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Select the perfect plan for your content analysis needs. Start with our free tier
            and upgrade as you grow.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="mt-12 flex justify-center">
          <div className="bg-white p-1 rounded-lg border border-gray-200">
            <button
              className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                billingInterval === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setBillingInterval('month')}
            >
              Monthly
            </button>
            <button
              className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                billingInterval === 'year'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setBillingInterval('year')}
            >
              Annual
              <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {currentPlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg ${
                plan.popular ? 'ring-2 ring-blue-600 scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-2 text-sm font-medium rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="mt-2 text-gray-600">{plan.description}</p>
                  <div className="mt-6">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(plan.price, plan.interval)}
                    </span>
                    {plan.price > 0 && billingInterval === 'year' && (
                      <p className="text-sm text-green-600 mt-1">
                        Save {getAnnualSavings(
                          monthlyPlans.find(p => p.name.split(' ')[0] === plan.name.split(' ')[0])?.price || 0,
                          plan.price
                        )}% annually
                      </p>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Limits */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Usage Limits</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>
                      <strong>Analysis Credits:</strong>{' '}
                      {plan.limits.analysisCredits === -1 ? 'Unlimited' : plan.limits.analysisCredits.toLocaleString()}
                    </div>
                    <div>
                      <strong>API Calls:</strong>{' '}
                      {plan.limits.apiCalls === -1 ? 'Unlimited' : plan.limits.apiCalls.toLocaleString()}
                    </div>
                    <div>
                      <strong>Export Formats:</strong> {plan.limits.exportFormats.join(', ')}
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  className={`mt-8 w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  } ${loading === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading === plan.id}
                >
                  {loading === plan.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    plan.cta
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately,
                and we'll prorate any payments.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards (Visa, MasterCard, American Express) and PayPal.
                All payments are processed securely through Stripe.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Yes! Pro plans include a 14-day free trial, and Enterprise plans include a 30-day trial.
                No credit card required to start.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What happens if I exceed my limits?
              </h3>
              <p className="text-gray-600">
                We'll notify you when you're approaching your limits. Overage charges apply at reasonable rates,
                or you can upgrade to a higher plan.
              </p>
            </div>
          </div>
        </div>

        {/* Enterprise CTA */}
        <div className="mt-20 bg-blue-600 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Need a Custom Solution?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Contact our sales team for custom pricing, on-premise deployment,
            or specialized features for your organization.
          </p>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Contact Sales
          </button>
        </div>
      </div>
    </div>
  );
}