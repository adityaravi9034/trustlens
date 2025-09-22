/**
 * User management routes for TrustLens API
 */

import { Router, Response } from 'express';
import Joi from 'joi';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth';
import { DatabaseService } from '../services/database';
import { ApiResponse, UsageStats } from '../types';

export const createUserRoutes = (authService: any, db: DatabaseService): Router => {
  const router = Router();

  // Validation schemas
  const updateProfileSchema = Joi.object({
    email: Joi.string().email().optional(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).optional()
      .messages({
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
      })
  });

  // GET /users/profile
  router.get('/profile',
    requireAuth(authService),
    async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
      try {
        const user = req.user!;

        const safeUser = {
          id: user.id,
          email: user.email,
          plan: user.plan,
          credits: user.credits,
          apiKey: user.apiKey,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        };

        res.json({
          success: true,
          data: safeUser,
          meta: {
            requestId: req.headers['x-request-id'] as string || 'unknown',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        });

      } catch (error) {
        console.error('Profile retrieval error:', error);

        res.status(500).json({
          success: false,
          error: {
            code: 'PROFILE_RETRIEVAL_FAILED',
            message: 'Failed to retrieve user profile'
          }
        });
      }
    }
  );

  // PUT /users/profile
  router.put('/profile',
    requireAuth(authService),
    async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
      try {
        const { error, value } = updateProfileSchema.validate(req.body);
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

        const updates: any = {};

        if (value.email && value.email !== req.user!.email) {
          // Check if new email is already taken
          const existingUser = await authService.getUserByEmail(value.email);
          if (existingUser && existingUser.id !== req.user!.id) {
            return res.status(409).json({
              success: false,
              error: {
                code: 'EMAIL_TAKEN',
                message: 'Email address is already in use'
              }
            });
          }
          updates.email = value.email;
        }

        if (value.password) {
          updates.hashedPassword = await authService.hashPassword(value.password);
        }

        if (Object.keys(updates).length === 0) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'NO_UPDATES',
              message: 'No valid updates provided'
            }
          });
        }

        const updatedUser = await db.updateUser(req.user!.id, updates);

        if (!updatedUser) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User not found'
            }
          });
        }

        const safeUser = {
          id: updatedUser.id,
          email: updatedUser.email,
          plan: updatedUser.plan,
          credits: updatedUser.credits,
          apiKey: updatedUser.apiKey,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt
        };

        res.json({
          success: true,
          data: safeUser,
          meta: {
            requestId: req.headers['x-request-id'] as string || 'unknown',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        });

      } catch (error) {
        console.error('Profile update error:', error);

        res.status(500).json({
          success: false,
          error: {
            code: 'PROFILE_UPDATE_FAILED',
            message: 'Failed to update user profile'
          }
        });
      }
    }
  );

  // GET /users/usage
  router.get('/usage',
    requireAuth(authService),
    async (req: AuthenticatedRequest, res: Response<ApiResponse<UsageStats>>) => {
      try {
        const stats = await db.getUserStats(req.user!.id);

        res.json({
          success: true,
          data: stats,
          meta: {
            requestId: req.headers['x-request-id'] as string || 'unknown',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        });

      } catch (error) {
        console.error('Usage stats error:', error);

        res.status(500).json({
          success: false,
          error: {
            code: 'USAGE_STATS_FAILED',
            message: 'Failed to retrieve usage statistics'
          }
        });
      }
    }
  );

  // POST /users/credits/purchase
  router.post('/credits/purchase',
    requireAuth(authService),
    async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
      try {
        const { amount, paymentMethodId } = req.body;

        if (!amount || !paymentMethodId) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'MISSING_PARAMETERS',
              message: 'Amount and payment method ID are required'
            }
          });
        }

        if (amount < 100 || amount > 100000) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_AMOUNT',
              message: 'Credit amount must be between 100 and 100,000'
            }
          });
        }

        // This would integrate with Stripe for payment processing
        // For now, return a mock response
        const creditsPurchased = amount;
        const cost = Math.ceil(amount / 100); // $0.01 per credit

        // In a real implementation, process payment here
        // If successful, add credits to user account
        await db.updateUser(req.user!.id, {
          credits: req.user!.credits + creditsPurchased
        });

        res.json({
          success: true,
          data: {
            creditsPurchased,
            cost,
            newBalance: req.user!.credits + creditsPurchased,
            transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          },
          meta: {
            requestId: req.headers['x-request-id'] as string || 'unknown',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        });

      } catch (error) {
        console.error('Credit purchase error:', error);

        res.status(500).json({
          success: false,
          error: {
            code: 'CREDIT_PURCHASE_FAILED',
            message: 'Failed to purchase credits'
          }
        });
      }
    }
  );

  // DELETE /users/account
  router.delete('/account',
    requireAuth(authService),
    async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
      try {
        const { confirmEmail } = req.body;

        if (confirmEmail !== req.user!.email) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'EMAIL_MISMATCH',
              message: 'Email confirmation does not match account email'
            }
          });
        }

        // In a real implementation, this would:
        // 1. Cancel any active subscriptions
        // 2. Delete user data according to privacy policy
        // 3. Send confirmation email
        // For now, just mark as deleted or remove from database

        // Note: In production, consider soft deletion for audit purposes
        await db.updateUser(req.user!.id, {
          email: `deleted_${Date.now()}@deleted.local`,
          hashedPassword: 'deleted',
          apiKey: undefined,
          credits: 0
        });

        res.json({
          success: true,
          data: {
            message: 'Account deleted successfully'
          },
          meta: {
            requestId: req.headers['x-request-id'] as string || 'unknown',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        });

      } catch (error) {
        console.error('Account deletion error:', error);

        res.status(500).json({
          success: false,
          error: {
            code: 'ACCOUNT_DELETION_FAILED',
            message: 'Failed to delete account'
          }
        });
      }
    }
  );

  return router;
};