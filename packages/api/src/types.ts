/**
 * API type definitions for TrustLens platform
 */

export interface User {
  id: string;
  email: string;
  hashedPassword: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  apiKey?: string;
  credits: number;
  subscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  plan?: 'free' | 'basic' | 'pro';
}

export interface AnalysisRequest {
  text?: string;
  imageUrls?: string[];
  url?: string;
  options?: {
    includeExplanations?: boolean;
    methods?: Array<'shap' | 'lime' | 'attention' | 'counterfactual' | 'rationale'>;
    threshold?: number;
  };
}

export interface AnalysisResponse {
  id: string;
  scores: {
    manipulation: number;
    bias: number;
    deception: number;
    overall: number;
    calibrated: {
      manipulation: number;
      bias: number;
      deception: number;
      overall: number;
    };
  };
  predictions: {
    [category: string]: {
      score: number;
      confidence: number;
      label: string;
    };
  };
  explanations?: {
    primary: string;
    evidence: string[];
    rationales: Array<{
      text: string;
      importance: number;
      evidence: string[];
    }>;
    uncertainty: number;
  };
  metadata: {
    processingTime: number;
    model: string;
    creditsUsed: number;
    requestId: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    version: string;
  };
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export interface UsageStats {
  totalRequests: number;
  creditsUsed: number;
  analysesPerformed: number;
  averageScore: number;
  topCategories: Array<{
    category: string;
    count: number;
  }>;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: boolean;
    redis: boolean;
    model: boolean;
  };
  uptime: number;
  version: string;
}