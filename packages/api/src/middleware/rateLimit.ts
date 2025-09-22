/**
 * Rate limiting middleware for TrustLens API
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { AuthenticatedRequest } from './auth';

interface RateLimitStore {
  get(key: string): Promise<{ totalHits: number; resetTime: Date } | undefined>;
  increment(key: string, windowMs: number): Promise<{ totalHits: number; resetTime: Date }>;
  decrement(key: string): Promise<void>;
  resetAll(): Promise<void>;
  resetKey(key: string): Promise<void>;
}

class RedisRateLimitStore implements RateLimitStore {
  private redis: any;

  constructor(redisClient: any) {
    this.redis = redisClient;
  }

  async get(key: string) {
    const pipeline = this.redis.pipeline();
    pipeline.get(`rl:${key}`);
    pipeline.pttl(`rl:${key}`);

    const [hits, ttl] = await pipeline.exec();

    if (!hits[1] || hits[1] === null) {
      return undefined;
    }

    const totalHits = parseInt(hits[1]);
    const resetTime = new Date(Date.now() + ttl[1]);

    return { totalHits, resetTime };
  }

  async increment(key: string, windowMs: number) {
    const pipeline = this.redis.pipeline();
    pipeline.multi();
    pipeline.incr(`rl:${key}`);
    pipeline.pexpire(`rl:${key}`, windowMs);
    pipeline.exec();

    const result = await pipeline.exec();
    const totalHits = result[1][1];
    const resetTime = new Date(Date.now() + windowMs);

    return { totalHits, resetTime };
  }

  async decrement(key: string) {
    await this.redis.decr(`rl:${key}`);
  }

  async resetAll() {
    const keys = await this.redis.keys('rl:*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async resetKey(key: string) {
    await this.redis.del(`rl:${key}`);
  }
}

export const createRateLimiter = (redisClient?: any) => {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    limit: (req: AuthenticatedRequest) => {
      if (!req.user) {
        return config.rateLimit.free;
      }

      switch (req.user.plan) {
        case 'basic':
          return config.rateLimit.basic;
        case 'pro':
          return config.rateLimit.pro;
        case 'enterprise':
          return config.rateLimit.enterprise;
        default:
          return config.rateLimit.free;
      }
    },
    keyGenerator: (req: AuthenticatedRequest) => {
      if (req.user) {
        return `user:${req.user.id}`;
      }
      return `ip:${req.ip}`;
    },
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later'
      }
    },
    handler: (req: AuthenticatedRequest, res: Response) => {
      console.warn(`Rate limit exceeded for ${req.user ? `user ${req.user.id}` : `IP ${req.ip}`}`);
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later'
        }
      });
    },
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    }
  });
};

export const createApiKeyRateLimit = (redisClient?: any) => {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    limit: (req: AuthenticatedRequest) => {
      if (!req.user) {
        return 5; // Very low limit for unauthenticated API key requests
      }

      // Higher limits for API key usage
      switch (req.user.plan) {
        case 'basic':
          return config.rateLimit.basic * 2;
        case 'pro':
          return config.rateLimit.pro * 2;
        case 'enterprise':
          return config.rateLimit.enterprise * 2;
        default:
          return config.rateLimit.free;
      }
    },
    keyGenerator: (req: AuthenticatedRequest) => {
      const apiKey = req.headers['x-api-key'] as string;
      if (apiKey) {
        return `apikey:${apiKey.slice(-8)}`;
      }
      return `ip:${req.ip}`;
    },
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'API_RATE_LIMIT_EXCEEDED',
        message: 'API rate limit exceeded, please upgrade your plan'
      }
    }
  });
};

export const addRateLimitHeaders = () => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user && req.rateLimitInfo) {
      res.set({
        'X-RateLimit-Limit': req.rateLimitInfo.limit.toString(),
        'X-RateLimit-Remaining': req.rateLimitInfo.remaining.toString(),
        'X-RateLimit-Reset': new Date(req.rateLimitInfo.reset).toISOString()
      });
    }
    next();
  };
};