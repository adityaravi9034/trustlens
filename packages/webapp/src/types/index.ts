/**
 * Type definitions for TrustLens Web Application
 */

export interface User {
  id: string;
  email: string;
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  credits: number;
  apiKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
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

export interface AnalysisResult {
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
  createdAt?: string;
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

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: string[];
  limits: {
    requestsPerMonth: number;
    batchSize: number;
    explanations: boolean;
    apiAccess: boolean;
  };
}

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export type ScoreLevel = 'low' | 'medium' | 'high';

export interface AnalysisHistory {
  analyses: AnalysisResult[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: any;
}