/**
 * Configuration management for TrustLens API
 */
import 'dotenv/config';

export interface ApiConfig {
  port: number;
  host: string;
  env: 'development' | 'staging' | 'production';

  // Database
  database: {
    url: string;
    ssl: boolean;
    pool: {
      min: number;
      max: number;
    };
  };

  // Redis
  redis: {
    url: string;
    ttl: number;
  };

  // Authentication
  auth: {
    jwtSecret: string;
    jwtExpiry: string;
    refreshExpiry: string;
    bcryptRounds: number;
  };

  // Rate limiting
  rateLimit: {
    windowMs: number;
    free: number;
    basic: number;
    pro: number;
    enterprise: number;
  };

  // Credits
  credits: {
    free: number;
    basic: number;
    pro: number;
    enterprise: number;
    analysisBase: number;
    explanationMultiplier: number;
  };

  // External services
  stripe: {
    publicKey: string;
    secretKey: string;
    webhookSecret: string;
  };

  // Models
  models: {
    textPath: string;
    imagePath: string;
    fusionPath: string;
  };
}

export const config: ApiConfig = {
  port: parseInt(process.env.PORT || '8000'),
  host: process.env.HOST || '0.0.0.0',
  env: (process.env.NODE_ENV as any) || 'development',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/trustlens',
    ssl: process.env.NODE_ENV === 'production',
    pool: {
      min: 2,
      max: 10,
    },
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: 3600, // 1 hour
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    jwtExpiry: '1h',
    refreshExpiry: '7d',
    bcryptRounds: 12,
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    free: 10,
    basic: 100,
    pro: 1000,
    enterprise: 10000,
  },

  credits: {
    free: 100,
    basic: 1000,
    pro: 10000,
    enterprise: 100000,
    analysisBase: 1,
    explanationMultiplier: 2,
  },

  stripe: {
    publicKey: process.env.STRIPE_PUBLIC_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  models: {
    textPath: process.env.TEXT_MODEL_PATH || './models/text-classifier.onnx',
    imagePath: process.env.IMAGE_MODEL_PATH || './models/image-classifier.onnx',
    fusionPath: process.env.FUSION_MODEL_PATH || './models/fusion-model.onnx',
  },
};

export const validateConfig = (): void => {
  const required = [
    'JWT_SECRET',
  ];

  // Only require DATABASE_URL in production
  if (config.env === 'production') {
    required.push('DATABASE_URL');
  }

  if (config.env === 'production') {
    required.push(
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'REDIS_URL'
    );
  }

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};