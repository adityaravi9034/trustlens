import { UsageRecord, BillingUsage, SubscriptionPlan } from './types';
import { PlanManager } from './plans';

export interface UsageTracker {
  recordUsage(userId: string, type: 'analysis' | 'api_call' | 'export', quantity?: number, metadata?: Record<string, any>): Promise<void>;
  getUsage(userId: string, startDate: Date, endDate: Date): Promise<BillingUsage>;
  checkLimits(userId: string, planId: string): Promise<{ allowed: boolean; reason?: string }>;
  resetUsage(userId: string): Promise<void>;
}

export class InMemoryUsageTracker implements UsageTracker {
  private usageRecords: Map<string, UsageRecord[]> = new Map();
  private userPlans: Map<string, string> = new Map();

  async recordUsage(
    userId: string,
    type: 'analysis' | 'api_call' | 'export',
    quantity: number = 1,
    metadata?: Record<string, any>
  ): Promise<void> {
    const records = this.usageRecords.get(userId) || [];

    const newRecord: UsageRecord = {
      id: `${userId}-${Date.now()}-${Math.random()}`,
      userId,
      subscriptionId: `sub_${userId}`, // This would come from user subscription lookup
      type,
      quantity,
      timestamp: new Date(),
      metadata
    };

    records.push(newRecord);
    this.usageRecords.set(userId, records);

    console.log(`Recorded usage: ${type} x${quantity} for user ${userId}`);
  }

  async getUsage(userId: string, startDate: Date, endDate: Date): Promise<BillingUsage> {
    const records = this.usageRecords.get(userId) || [];
    const periodRecords = records.filter(
      record => record.timestamp >= startDate && record.timestamp <= endDate
    );

    // Calculate usage by type
    const usage = {
      analysisCredits: periodRecords
        .filter(r => r.type === 'analysis')
        .reduce((sum, r) => sum + r.quantity, 0),
      apiCalls: periodRecords
        .filter(r => r.type === 'api_call')
        .reduce((sum, r) => sum + r.quantity, 0),
      exports: periodRecords
        .filter(r => r.type === 'export')
        .reduce((sum, r) => sum + r.quantity, 0)
    };

    // Get user's plan limits
    const planId = this.userPlans.get(userId) || 'free';
    const plan = PlanManager.getPlan(planId);
    const limits = plan ? {
      analysisCredits: plan.limits.analysisCredits,
      apiCalls: plan.limits.apiCalls,
      exports: 1000 // Default export limit
    } : {
      analysisCredits: 100,
      apiCalls: 500,
      exports: 10
    };

    // Calculate overages
    const overages = {
      analysisCredits: Math.max(0, usage.analysisCredits - (limits.analysisCredits === -1 ? Infinity : limits.analysisCredits)),
      apiCalls: Math.max(0, usage.apiCalls - (limits.apiCalls === -1 ? Infinity : limits.apiCalls)),
      exports: Math.max(0, usage.exports - limits.exports)
    };

    return {
      userId,
      subscriptionId: `sub_${userId}`,
      period: { start: startDate, end: endDate },
      usage,
      limits,
      overages
    };
  }

  async checkLimits(userId: string, planId: string): Promise<{ allowed: boolean; reason?: string }> {
    const plan = PlanManager.getPlan(planId);
    if (!plan) {
      return { allowed: false, reason: 'Invalid plan' };
    }

    // Get current month's usage
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const billingUsage = await this.getUsage(userId, monthStart, monthEnd);

    // Check analysis credits
    if (plan.limits.analysisCredits !== -1 && billingUsage.usage.analysisCredits >= plan.limits.analysisCredits) {
      return { allowed: false, reason: 'Analysis credit limit exceeded' };
    }

    // Check API calls
    if (plan.limits.apiCalls !== -1 && billingUsage.usage.apiCalls >= plan.limits.apiCalls) {
      return { allowed: false, reason: 'API call limit exceeded' };
    }

    return { allowed: true };
  }

  async resetUsage(userId: string): Promise<void> {
    // In a real implementation, you might archive old usage instead of deleting
    this.usageRecords.set(userId, []);
    console.log(`Reset usage for user ${userId}`);
  }

  // Helper method to set user plans (in real implementation, this would come from subscription service)
  setUserPlan(userId: string, planId: string): void {
    this.userPlans.set(userId, planId);
  }

  // Get usage summary for reporting
  async getUsageSummary(userId: string): Promise<{
    currentMonth: BillingUsage;
    lastMonth: BillingUsage;
    yearToDate: BillingUsage;
  }> {
    const now = new Date();

    // Current month
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Last month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Year to date
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31);

    const [currentMonth, lastMonth, yearToDate] = await Promise.all([
      this.getUsage(userId, currentMonthStart, currentMonthEnd),
      this.getUsage(userId, lastMonthStart, lastMonthEnd),
      this.getUsage(userId, yearStart, yearEnd)
    ]);

    return { currentMonth, lastMonth, yearToDate };
  }

  // Get usage trends for analytics
  async getUsageTrends(userId: string, months: number = 12): Promise<{
    labels: string[];
    analysisCredits: number[];
    apiCalls: number[];
    exports: number[];
  }> {
    const trends = {
      labels: [] as string[],
      analysisCredits: [] as number[],
      apiCalls: [] as number[],
      exports: [] as number[]
    };

    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const usage = await this.getUsage(userId, monthStart, monthEnd);

      trends.labels.push(monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      trends.analysisCredits.push(usage.usage.analysisCredits);
      trends.apiCalls.push(usage.usage.apiCalls);
      trends.exports.push(usage.usage.exports);
    }

    return trends;
  }

  // Calculate overage charges
  calculateOverageCharges(usage: BillingUsage, planId: string): {
    analysisCredits: number;
    apiCalls: number;
    exports: number;
    total: number;
  } {
    const plan = PlanManager.getPlan(planId);
    if (!plan) {
      return { analysisCredits: 0, apiCalls: 0, exports: 0, total: 0 };
    }

    // Define overage rates (in cents)
    const overageRates = {
      analysisCredits: 1, // $0.01 per credit
      apiCalls: 0.1, // $0.001 per call
      exports: 10 // $0.10 per export
    };

    const charges = {
      analysisCredits: usage.overages.analysisCredits * overageRates.analysisCredits,
      apiCalls: usage.overages.apiCalls * overageRates.apiCalls,
      exports: usage.overages.exports * overageRates.exports,
      total: 0
    };

    charges.total = charges.analysisCredits + charges.apiCalls + charges.exports;

    return charges;
  }

  // Get recommendations for plan upgrades
  async getUpgradeRecommendations(userId: string): Promise<{
    recommended: boolean;
    currentPlan: string;
    suggestedPlan: string;
    savings: number;
    reason: string;
  }> {
    const currentPlanId = this.userPlans.get(userId) || 'free';
    const currentPlan = PlanManager.getPlan(currentPlanId);

    if (!currentPlan) {
      return {
        recommended: false,
        currentPlan: currentPlanId,
        suggestedPlan: '',
        savings: 0,
        reason: 'Current plan not found'
      };
    }

    // Get last 3 months usage
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const usage = await this.getUsage(userId, threeMonthsAgo, now);

    // Calculate average monthly usage
    const avgMonthlyUsage = {
      analysisCredits: Math.ceil(usage.usage.analysisCredits / 3),
      apiCalls: Math.ceil(usage.usage.apiCalls / 3)
    };

    // Find recommended plan
    const recommendedPlanId = PlanManager.getRecommendedPlan(avgMonthlyUsage);

    if (recommendedPlanId === currentPlanId) {
      return {
        recommended: false,
        currentPlan: currentPlanId,
        suggestedPlan: recommendedPlanId,
        savings: 0,
        reason: 'Current plan is optimal'
      };
    }

    // Calculate potential savings
    const suggestedPlan = PlanManager.getPlan(recommendedPlanId);
    const overageCharges = this.calculateOverageCharges(usage, currentPlanId);
    const monthlySavings = overageCharges.total / 100 - (suggestedPlan ? suggestedPlan.price - currentPlan.price : 0);

    return {
      recommended: true,
      currentPlan: currentPlanId,
      suggestedPlan: recommendedPlanId,
      savings: monthlySavings,
      reason: monthlySavings > 0
        ? `You could save $${monthlySavings.toFixed(2)}/month by upgrading`
        : `Upgrade recommended to avoid overage charges`
    };
  }
}