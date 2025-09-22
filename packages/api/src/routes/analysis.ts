/**
 * Analysis routes for TrustLens API
 */

import { Router, Response } from 'express';
import Joi from 'joi';
import { AuthenticatedRequest, requireAuth, requireCredits } from '../middleware/auth';
import { AnalysisService } from '../services/analysis';
import { DatabaseService } from '../services/database';
import { AnalysisRequest, AnalysisResponse, ApiResponse } from '../types';

export const createAnalysisRoutes = (
  analysisService: AnalysisService,
  authService: any,
  db: DatabaseService
): Router => {
  const router = Router();

  // Validation schema
  const analysisSchema = Joi.object({
    text: Joi.string().max(50000).when('url', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.when('imageUrls', {
        is: Joi.array().min(1),
        then: Joi.optional(),
        otherwise: Joi.required()
      })
    }),
    imageUrls: Joi.array().items(Joi.string().uri()).max(5).optional(),
    url: Joi.string().uri().optional(),
    options: Joi.object({
      includeExplanations: Joi.boolean().default(false),
      methods: Joi.array().items(
        Joi.string().valid('shap', 'lime', 'attention', 'counterfactual', 'rationale')
      ).default(['rationale']),
      threshold: Joi.number().min(0).max(1).default(0.1)
    }).optional()
  });

  // POST /analysis/analyze
  router.post('/analyze',
    requireAuth(authService),
    requireCredits(1),
    async (req: AuthenticatedRequest, res: Response<ApiResponse<AnalysisResponse>>) => {
      const startTime = Date.now();

      try {
        const { error, value } = analysisSchema.validate(req.body);
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

        const analysisRequest = value as AnalysisRequest;

        // Calculate credit cost
        let creditsRequired = 1; // Base cost
        if (analysisRequest.options?.includeExplanations) {
          creditsRequired *= 2; // Double cost for explanations
        }
        if (analysisRequest.imageUrls && analysisRequest.imageUrls.length > 0) {
          creditsRequired = Math.ceil(creditsRequired * 1.5); // 50% more for multimodal
        }

        // Check if user has enough credits
        if (req.user!.credits < creditsRequired) {
          return res.status(402).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_CREDITS',
              message: 'Insufficient credits for this analysis',
              details: {
                required: creditsRequired,
                available: req.user!.credits
              }
            }
          });
        }

        // Perform analysis
        const result = await analysisService.analyzeContent(analysisRequest);

        // Deduct credits
        await authService.deductCredits(req.user!.id, result.metadata.creditsUsed);

        // Save analysis to database
        const analysisId = await db.saveAnalysis({
          userId: req.user!.id,
          textContent: analysisRequest.text,
          imageUrls: analysisRequest.imageUrls,
          url: analysisRequest.url,
          scores: result.scores,
          predictions: result.predictions,
          explanations: result.explanations,
          metadata: result.metadata,
          creditsUsed: result.metadata.creditsUsed
        });

        // Log API usage
        const responseTime = Date.now() - startTime;
        await db.logApiUsage({
          userId: req.user!.id,
          endpoint: '/analysis/analyze',
          method: 'POST',
          statusCode: 200,
          responseTime,
          creditsUsed: result.metadata.creditsUsed,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        // Update result with database ID
        result.id = analysisId;

        res.json({
          success: true,
          data: result,
          meta: {
            requestId: req.headers['x-request-id'] as string || result.id,
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        });

      } catch (error) {
        console.error('Analysis error:', error);

        const responseTime = Date.now() - startTime;
        await db.logApiUsage({
          userId: req.user?.id,
          endpoint: '/analysis/analyze',
          method: 'POST',
          statusCode: 500,
          responseTime,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.status(500).json({
          success: false,
          error: {
            code: 'ANALYSIS_FAILED',
            message: error instanceof Error ? error.message : 'Analysis failed'
          }
        });
      }
    }
  );

  // GET /analysis/history
  router.get('/history',
    requireAuth(authService),
    async (req: AuthenticatedRequest, res: Response<ApiResponse<any[]>>) => {
      try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const offset = (page - 1) * limit;

        const analyses = await db.getUserAnalyses(req.user!.id, limit, offset);

        res.json({
          success: true,
          data: analyses,
          meta: {
            requestId: req.headers['x-request-id'] as string || 'unknown',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        });

      } catch (error) {
        console.error('History retrieval error:', error);

        res.status(500).json({
          success: false,
          error: {
            code: 'HISTORY_RETRIEVAL_FAILED',
            message: 'Failed to retrieve analysis history'
          }
        });
      }
    }
  );

  // GET /analysis/stats
  router.get('/stats',
    requireAuth(authService),
    async (req: AuthenticatedRequest, res: Response<ApiResponse<any>>) => {
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
        console.error('Stats retrieval error:', error);

        res.status(500).json({
          success: false,
          error: {
            code: 'STATS_RETRIEVAL_FAILED',
            message: 'Failed to retrieve user statistics'
          }
        });
      }
    }
  );

  // POST /analysis/batch
  router.post('/batch',
    requireAuth(authService),
    async (req: AuthenticatedRequest, res: Response<ApiResponse<AnalysisResponse[]>>) => {
      try {
        const { analyses } = req.body;

        if (!Array.isArray(analyses) || analyses.length === 0) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_BATCH',
              message: 'Analyses array is required and must not be empty'
            }
          });
        }

        if (analyses.length > 10) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'BATCH_TOO_LARGE',
              message: 'Maximum 10 analyses per batch'
            }
          });
        }

        // Validate each analysis
        const validatedAnalyses = [];
        for (const analysis of analyses) {
          const { error, value } = analysisSchema.validate(analysis);
          if (error) {
            return res.status(400).json({
              success: false,
              error: {
                code: 'BATCH_VALIDATION_ERROR',
                message: 'Invalid analysis in batch',
                details: error.details.map(d => d.message)
              }
            });
          }
          validatedAnalyses.push(value);
        }

        // Calculate total credits required
        let totalCredits = 0;
        for (const analysis of validatedAnalyses) {
          let credits = 1;
          if (analysis.options?.includeExplanations) credits *= 2;
          if (analysis.imageUrls && analysis.imageUrls.length > 0) credits = Math.ceil(credits * 1.5);
          totalCredits += credits;
        }

        if (req.user!.credits < totalCredits) {
          return res.status(402).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_CREDITS',
              message: 'Insufficient credits for batch analysis',
              details: {
                required: totalCredits,
                available: req.user!.credits
              }
            }
          });
        }

        // Process batch analyses
        const results: AnalysisResponse[] = [];
        let totalCreditsUsed = 0;

        for (const analysis of validatedAnalyses) {
          try {
            const result = await analysisService.analyzeContent(analysis);

            // Save to database
            const analysisId = await db.saveAnalysis({
              userId: req.user!.id,
              textContent: analysis.text,
              imageUrls: analysis.imageUrls,
              url: analysis.url,
              scores: result.scores,
              predictions: result.predictions,
              explanations: result.explanations,
              metadata: result.metadata,
              creditsUsed: result.metadata.creditsUsed
            });

            result.id = analysisId;
            results.push(result);
            totalCreditsUsed += result.metadata.creditsUsed;

          } catch (error) {
            console.error('Batch analysis item failed:', error);
            // Continue with other analyses but record the failure
            results.push({
              id: 'failed',
              scores: { manipulation: 0, bias: 0, deception: 0, overall: 0, calibrated: { manipulation: 0, bias: 0, deception: 0, overall: 0 } },
              predictions: {},
              metadata: {
                processingTime: 0,
                model: 'error',
                creditsUsed: 0,
                requestId: 'error'
              }
            });
          }
        }

        // Deduct credits
        await authService.deductCredits(req.user!.id, totalCreditsUsed);

        res.json({
          success: true,
          data: results,
          meta: {
            requestId: req.headers['x-request-id'] as string || 'unknown',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        });

      } catch (error) {
        console.error('Batch analysis error:', error);

        res.status(500).json({
          success: false,
          error: {
            code: 'BATCH_ANALYSIS_FAILED',
            message: 'Batch analysis failed'
          }
        });
      }
    }
  );

  return router;
};