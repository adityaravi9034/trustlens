/**
 * Authentication routes for TrustLens API
 */

import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { AuthService } from '../middleware/auth';
import { DatabaseService } from '../services/database';
import { ApiResponse, LoginRequest, RegisterRequest, AuthTokens } from '../types';

export const createAuthRoutes = (authService: AuthService, db: DatabaseService): Router => {
  const router = Router();

  // Validation schemas
  const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
  });

  const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
      .messages({
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      }),
    plan: Joi.string().valid('free', 'basic', 'pro').default('free')
  });

  // POST /auth/register
  router.post('/register', async (req: Request, res: Response<ApiResponse<{ user: any; tokens: AuthTokens }>>) => {
    try {
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.details.map(d => d.message)
          }
        });
      }

      const { email, password, plan } = value as RegisterRequest;

      const user = await authService.createUser(email, password, plan);
      const tokens = authService.generateTokens(user.id);

      // Don't return sensitive data
      const safeUser = {
        id: user.id,
        email: user.email,
        plan: user.plan,
        credits: user.credits,
        createdAt: user.createdAt
      };

      res.status(201).json({
        success: true,
        data: {
          user: safeUser,
          tokens
        },
        meta: {
          requestId: req.headers['x-request-id'] as string || 'unknown',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });

    } catch (error) {
      console.error('Registration error:', error);

      if (error instanceof Error && error.message === 'User already exists') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'User with this email already exists'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: 'Failed to create user account'
        }
      });
    }
  });

  // POST /auth/login
  router.post('/login', async (req: Request, res: Response<ApiResponse<{ user: any; tokens: AuthTokens }>>) => {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.details.map(d => d.message)
          }
        });
      }

      const { email, password } = value as LoginRequest;

      const user = await authService.authenticateUser(email, password);
      const tokens = authService.generateTokens(user.id);

      // Log the login
      await db.logApiUsage({
        userId: user.id,
        endpoint: '/auth/login',
        method: 'POST',
        statusCode: 200,
        responseTime: 0,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Don't return sensitive data
      const safeUser = {
        id: user.id,
        email: user.email,
        plan: user.plan,
        credits: user.credits,
        apiKey: user.apiKey,
        createdAt: user.createdAt
      };

      res.json({
        success: true,
        data: {
          user: safeUser,
          tokens
        },
        meta: {
          requestId: req.headers['x-request-id'] as string || 'unknown',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });

    } catch (error) {
      console.error('Login error:', error);

      if (error instanceof Error && error.message === 'Invalid credentials') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: 'Login failed'
        }
      });
    }
  });

  // POST /auth/refresh
  router.post('/refresh', async (req: Request, res: Response<ApiResponse<AuthTokens>>) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REFRESH_TOKEN',
            message: 'Refresh token is required'
          }
        });
      }

      const tokens = await authService.refreshTokens(refreshToken);

      res.json({
        success: true,
        data: tokens,
        meta: {
          requestId: req.headers['x-request-id'] as string || 'unknown',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });

    } catch (error) {
      console.error('Token refresh error:', error);

      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token'
        }
      });
    }
  });

  // POST /auth/api-key/regenerate
  router.post('/api-key/regenerate', async (req: Request, res: Response<ApiResponse<{ apiKey: string }>>) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'MISSING_AUTH',
            message: 'Bearer token required'
          }
        });
      }

      const token = authHeader.slice(7);
      const decoded = await authService.verifyToken(token);

      if (decoded.type !== 'access') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN_TYPE',
            message: 'Access token required'
          }
        });
      }

      const user = await authService.getUserById(decoded.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        });
      }

      const newApiKey = await authService.generateApiKey();
      await db.updateUser(user.id, { apiKey: newApiKey });

      res.json({
        success: true,
        data: {
          apiKey: newApiKey
        },
        meta: {
          requestId: req.headers['x-request-id'] as string || 'unknown',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });

    } catch (error) {
      console.error('API key regeneration error:', error);

      res.status(500).json({
        success: false,
        error: {
          code: 'API_KEY_REGENERATION_FAILED',
          message: 'Failed to regenerate API key'
        }
      });
    }
  });

  return router;
};