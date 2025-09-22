/**
 * Authentication middleware for TrustLens API
 */

import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { User, AuthTokens } from '../types';
import { DatabaseService } from '../services/database';

export interface AuthenticatedRequest extends Request {
  user?: User;
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    reset: number;
  };
}

export class AuthService {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.auth.bcryptRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateTokens(userId: string): AuthTokens {
    const accessToken = jwt.sign(
      { userId, type: 'access' },
      config.auth.jwtSecret as string,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      config.auth.jwtSecret as string,
      { expiresIn: '7d' }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour
    };
  }

  async verifyToken(token: string): Promise<{ userId: string; type: string }> {
    try {
      const decoded = jwt.verify(token, config.auth.jwtSecret as string) as any;
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async generateApiKey(): Promise<string> {
    const randomBytes = require('crypto').randomBytes(32);
    return `tl_${randomBytes.toString('hex')}`;
  }

  async createUser(email: string, password: string, plan: string = 'free'): Promise<User> {
    const existingUser = await this.db.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await this.hashPassword(password);
    const apiKey = await this.generateApiKey();
    const credits = config.credits[plan as keyof typeof config.credits] as number || config.credits.free;

    const user: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
      email,
      hashedPassword,
      plan: plan as any,
      apiKey,
      credits,
    };

    return this.db.createUser(user);
  }

  async authenticateUser(email: string, password: string): Promise<User> {
    const user = await this.db.getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await this.verifyPassword(password, user.hashedPassword);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    return user;
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.db.getUserById(userId);
  }

  async getUserByApiKey(apiKey: string): Promise<User | null> {
    return this.db.getUserByApiKey(apiKey);
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const decoded = await this.verifyToken(refreshToken);

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid refresh token');
    }

    const user = await this.getUserById(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    return this.generateTokens(user.id);
  }

  async deductCredits(userId: string, amount: number): Promise<void> {
    await this.db.deductCredits(userId, amount);
  }
}

export const requireAuth = (authService: AuthService) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const apiKey = req.headers['x-api-key'] as string;

      let user: User | null = null;

      if (apiKey) {
        // API key authentication
        user = await authService.getUserByApiKey(apiKey);
        if (!user) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'INVALID_API_KEY',
              message: 'Invalid API key'
            }
          });
        }
      } else if (authHeader?.startsWith('Bearer ')) {
        // JWT authentication
        const token = authHeader.slice(7);
        const decoded = await authService.verifyToken(token);

        if (decoded.type !== 'access') {
          return res.status(401).json({
            success: false,
            error: {
              code: 'INVALID_TOKEN_TYPE',
              message: 'Invalid token type'
            }
          });
        }

        user = await authService.getUserById(decoded.userId);
        if (!user) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found'
            }
          });
        }
      } else {
        return res.status(401).json({
          success: false,
          error: {
            code: 'MISSING_AUTH',
            message: 'Authentication required'
          }
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: error instanceof Error ? error.message : 'Authentication failed'
        }
      });
    }
  };
};

export const requireCredits = (minimumCredits: number = 1) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required'
        }
      });
    }

    if (req.user.credits < minimumCredits) {
      return res.status(402).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_CREDITS',
          message: 'Insufficient credits',
          details: {
            required: minimumCredits,
            available: req.user.credits
          }
        }
      });
    }

    next();
  };
};