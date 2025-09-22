/**
 * Express application setup for TrustLens API
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import winston from 'winston';
import { config, validateConfig } from './config';
import { DatabaseService } from './services/database';
import { AnalysisService } from './services/analysis';
import { AuthService } from './middleware/auth';
import { createRateLimiter, createApiKeyRateLimit, addRateLimitHeaders } from './middleware/rateLimit';
import { createAuthRoutes } from './routes/auth';
import { createAnalysisRoutes } from './routes/analysis';
import { createUserRoutes } from './routes/users';
import { ApiResponse, HealthStatus } from './types';

export class TrustLensAPI {
  public app: express.Application;
  private db: DatabaseService;
  private analysisService: AnalysisService;
  private authService: AuthService;
  private logger!: winston.Logger;
  private redisClient: any;

  constructor() {
    this.app = express();
    this.setupLogger();
    this.db = new DatabaseService();
    this.analysisService = new AnalysisService();
    this.authService = new AuthService(this.db);
    this.setupRedis();
  }

  private setupLogger(): void {
    this.logger = winston.createLogger({
      level: config.env === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });

    if (config.env === 'production') {
      this.logger.add(new winston.transports.File({
        filename: 'error.log',
        level: 'error'
      }));
      this.logger.add(new winston.transports.File({
        filename: 'combined.log'
      }));
    }
  }

  private setupRedis(): void {
    if (config.env !== 'development') {
      try {
        const redis = require('redis');
        this.redisClient = redis.createClient({
          url: config.redis.url
        });

        this.redisClient.on('error', (err: Error) => {
          this.logger.error('Redis connection error:', err);
        });

        this.redisClient.on('connect', () => {
          this.logger.info('📡 Connected to Redis');
        });

        this.redisClient.connect();
      } catch (error) {
        this.logger.warn('Redis not available, falling back to memory store');
      }
    }
  }

  public async initialize(): Promise<void> {
    try {
      // Validate configuration
      validateConfig();

      // Initialize services
      if (config.env !== 'development') {
        await this.db.initialize();
      } else {
        this.logger.info('Skipping database initialization in development mode');
      }
      await this.analysisService.initialize();

      // Setup middleware
      this.setupMiddleware();

      // Setup routes
      this.setupRoutes();

      // Setup error handling
      this.setupErrorHandling();

      this.logger.info('🚀 TrustLens API initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize API:', error);
      throw error;
    }
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Allow for API usage
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.env === 'production'
        ? ['https://trustlens.ai', 'https://app.trustlens.ai']
        : true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID']
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request ID middleware
    this.app.use((req, res, next) => {
      req.headers['x-request-id'] = req.headers['x-request-id'] ||
        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      next();
    });

    // Logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();

      res.on('finish', () => {
        const duration = Date.now() - start;
        this.logger.info('API Request', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.headers['x-request-id']
        });
      });

      next();
    });

    // Rate limiting
    const rateLimiter = createRateLimiter(this.redisClient);
    const apiKeyRateLimit = createApiKeyRateLimit(this.redisClient);

    this.app.use('/api/v1/auth', rateLimiter);
    this.app.use('/api/v1/analysis', apiKeyRateLimit);
    this.app.use('/api/v1/users', rateLimiter);

    // Add rate limit headers
    this.app.use(addRateLimitHeaders());
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', async (req: Request, res: Response<ApiResponse<HealthStatus>>) => {
      try {
        const [dbHealth, redisHealth, modelHealth] = await Promise.all([
          this.db.healthCheck(),
          this.redisClient ? this.redisClient.ping().then(() => true).catch(() => false) : true,
          this.analysisService.healthCheck()
        ]);

        const status = dbHealth && modelHealth ? 'healthy' : 'degraded';

        res.json({
          success: true,
          data: {
            status,
            services: {
              database: dbHealth,
              redis: redisHealth,
              model: modelHealth
            },
            uptime: process.uptime(),
            version: '1.0.0'
          },
          meta: {
            requestId: req.headers['x-request-id'] as string || 'unknown',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        });

      } catch (error) {
        this.logger.error('Health check failed:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'HEALTH_CHECK_FAILED',
            message: 'Health check failed'
          }
        });
      }
    });

    // API version info
    this.app.get('/api/v1/info', async (req: Request, res: Response<ApiResponse<any>>) => {
      try {
        const modelInfo = await this.analysisService.getModelInfo();

        res.json({
          success: true,
          data: {
            version: '1.0.0',
            name: 'TrustLens API',
            description: 'AI-powered manipulation, bias & deception detection',
            models: modelInfo,
            endpoints: {
              auth: '/api/v1/auth',
              analysis: '/api/v1/analysis',
              users: '/api/v1/users'
            },
            limits: {
              maxTextLength: 50000,
              maxImageUrls: 5,
              maxBatchSize: 10
            }
          },
          meta: {
            requestId: req.headers['x-request-id'] as string || 'unknown',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        });

      } catch (error) {
        this.logger.error('Info endpoint failed:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'INFO_FAILED',
            message: 'Failed to retrieve API information'
          }
        });
      }
    });

    // Mount route handlers
    this.app.use('/api/v1/auth', createAuthRoutes(this.authService, this.db));
    this.app.use('/api/v1/analysis', createAnalysisRoutes(this.analysisService, this.authService, this.db));
    this.app.use('/api/v1/users', createUserRoutes(this.authService, this.db));

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Endpoint not found'
        }
      });
    });
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      this.logger.error('Unhandled error:', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        requestId: req.headers['x-request-id']
      });

      // Don't leak error details in production
      const message = config.env === 'production'
        ? 'Internal server error'
        : error.message;

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message
        }
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled promise rejection:', { reason, promise });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception:', error);
      process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      this.logger.info('SIGTERM received, shutting down gracefully');
      this.shutdown();
    });

    process.on('SIGINT', () => {
      this.logger.info('SIGINT received, shutting down gracefully');
      this.shutdown();
    });
  }

  public listen(port: number = config.port): void {
    this.app.listen(port, config.host, () => {
      this.logger.info(`🌐 TrustLens API listening on ${config.host}:${port}`);
      this.logger.info(`📊 Environment: ${config.env}`);
    });
  }

  public async shutdown(): Promise<void> {
    try {
      this.logger.info('Shutting down TrustLens API...');

      if (this.redisClient) {
        await this.redisClient.quit();
      }

      await this.db.close();

      this.logger.info('TrustLens API shutdown complete');
      process.exit(0);

    } catch (error) {
      this.logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}