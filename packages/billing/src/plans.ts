import { SubscriptionPlan } from './types';

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic analysis capabilities',
    price: 0,
    currency: 'usd',
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
      exportFormats: ['json'],
      customRules: false,
      prioritySupport: false
    },
    stripePriceId: '',
    stripeProductId: ''
  },

  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Advanced analysis for professionals and small teams',
    price: 29,
    currency: 'usd',
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
      exportFormats: ['json', 'csv', 'pdf'],
      customRules: true,
      prioritySupport: false
    },
    stripePriceId: 'price_pro_monthly',
    stripeProductId: 'prod_trustlens_pro'
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Full-scale solution for organizations and research institutions',
    price: 99,
    currency: 'usd',
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
      analysisCredits: -1, // Unlimited
      apiCalls: -1, // Unlimited
      exportFormats: ['json', 'csv', 'pdf', 'excel', 'xml'],
      customRules: true,
      prioritySupport: true
    },
    stripePriceId: 'price_enterprise_monthly',
    stripeProductId: 'prod_trustlens_enterprise'
  },

  research: {
    id: 'research',
    name: 'Research',
    description: 'Special pricing for academic institutions and researchers',
    price: 19,
    currency: 'usd',
    interval: 'month',
    features: [
      'Academic discount',
      'Research-grade datasets',
      'Model interpretability tools',
      'Academic collaboration features',
      'Citation support',
      'Research community access'
    ],
    limits: {
      analysisCredits: 10000,
      apiCalls: 50000,
      exportFormats: ['json', 'csv', 'pdf', 'bibtex'],
      customRules: true,
      prioritySupport: false
    },
    stripePriceId: 'price_research_monthly',
    stripeProductId: 'prod_trustlens_research'
  }
};

export const ANNUAL_PLANS: Record<string, SubscriptionPlan> = {
  pro_annual: {
    ...SUBSCRIPTION_PLANS.pro,
    id: 'pro_annual',
    name: 'Pro (Annual)',
    price: 290, // 2 months free
    interval: 'year',
    stripePriceId: 'price_pro_annual',
    stripeProductId: 'prod_trustlens_pro'
  },

  enterprise_annual: {
    ...SUBSCRIPTION_PLANS.enterprise,
    id: 'enterprise_annual',
    name: 'Enterprise (Annual)',
    price: 990, // 2 months free
    interval: 'year',
    stripePriceId: 'price_enterprise_annual',
    stripeProductId: 'prod_trustlens_enterprise'
  },

  research_annual: {
    ...SUBSCRIPTION_PLANS.research,
    id: 'research_annual',
    name: 'Research (Annual)',
    price: 190, // 2 months free
    interval: 'year',
    stripePriceId: 'price_research_annual',
    stripeProductId: 'prod_trustlens_research'
  }
};

export const ALL_PLANS = { ...SUBSCRIPTION_PLANS, ...ANNUAL_PLANS };

export class PlanManager {
  static getPlan(planId: string): SubscriptionPlan | null {
    return ALL_PLANS[planId] || null;
  }

  static getAllPlans(): SubscriptionPlan[] {
    return Object.values(ALL_PLANS);
  }

  static getMonthlyPlans(): SubscriptionPlan[] {
    return Object.values(SUBSCRIPTION_PLANS);
  }

  static getAnnualPlans(): SubscriptionPlan[] {
    return Object.values(ANNUAL_PLANS);
  }

  static isPlanValid(planId: string): boolean {
    return planId in ALL_PLANS;
  }

  static getUpgradePath(currentPlanId: string, targetPlanId: string): 'upgrade' | 'downgrade' | 'sidegrade' | null {
    const currentPlan = this.getPlan(currentPlanId);
    const targetPlan = this.getPlan(targetPlanId);

    if (!currentPlan || !targetPlan) return null;

    const planHierarchy = ['free', 'research', 'pro', 'enterprise'];
    const currentIndex = planHierarchy.indexOf(currentPlan.id.replace('_annual', ''));
    const targetIndex = planHierarchy.indexOf(targetPlan.id.replace('_annual', ''));

    if (currentIndex < targetIndex) return 'upgrade';
    if (currentIndex > targetIndex) return 'downgrade';
    return 'sidegrade';
  }

  static calculateProration(currentPlan: SubscriptionPlan, targetPlan: SubscriptionPlan, daysRemaining: number): number {
    if (currentPlan.interval !== targetPlan.interval) {
      // Complex calculation for interval changes
      const dailyCurrentRate = currentPlan.price / (currentPlan.interval === 'month' ? 30 : 365);
      const dailyTargetRate = targetPlan.price / (targetPlan.interval === 'month' ? 30 : 365);

      return Math.round((dailyTargetRate - dailyCurrentRate) * daysRemaining * 100) / 100;
    }

    const dailyDifference = (targetPlan.price - currentPlan.price) / (currentPlan.interval === 'month' ? 30 : 365);
    return Math.round(dailyDifference * daysRemaining * 100) / 100;
  }

  static getTrialDays(planId: string): number {
    const plan = this.getPlan(planId);
    if (!plan) return 0;

    // Free plan has no trial
    if (plan.id === 'free') return 0;

    // Research and Pro get 14 days
    if (plan.id.includes('research') || plan.id.includes('pro')) return 14;

    // Enterprise gets 30 days
    if (plan.id.includes('enterprise')) return 30;

    return 0;
  }

  static getRecommendedPlan(usage: { analysisCredits: number; apiCalls: number }): string {
    if (usage.analysisCredits <= 100 && usage.apiCalls <= 500) {
      return 'free';
    } else if (usage.analysisCredits <= 5000 && usage.apiCalls <= 25000) {
      return 'pro';
    } else {
      return 'enterprise';
    }
  }
}