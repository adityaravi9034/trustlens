export interface AnalysisRequest {
  content: string;
  metadata?: {
    url?: string;
    type?: string;
    timestamp?: string;
  };
}

export interface AnalysisResult {
  trustScore: number;
  categories: Record<string, number>;
  explanation: string;
  confidence: number;
  error?: string;
}

export interface SDKConfig {
  apiKey: string;
  baseURL: string;
}

export class TrustLensSDK {
  private config: SDKConfig;

  constructor(config: SDKConfig) {
    this.config = config;
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    try {
      const response = await fetch(`${this.config.baseURL}/v1/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('TrustLens analysis failed:', error);
      return {
        trustScore: 0.5,
        categories: {},
        explanation: 'Analysis failed',
        confidence: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  static version = '1.0.0';
}