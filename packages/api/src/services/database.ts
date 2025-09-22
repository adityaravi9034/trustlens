/**
 * Database service for TrustLens API
 */

import { Pool, PoolClient } from 'pg';
import { config } from '../config';
import { User } from '../types';

export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: config.database.url,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      min: config.database.pool.min,
      max: config.database.pool.max,
    });

    this.pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });
  }

  async initialize(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await this.createTables(client);
      console.log('📊 Database initialized successfully');
    } finally {
      client.release();
    }
  }

  private async createTables(client: PoolClient): Promise<void> {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        hashed_password VARCHAR(255) NOT NULL,
        plan VARCHAR(50) NOT NULL DEFAULT 'free',
        api_key VARCHAR(255) UNIQUE,
        credits INTEGER NOT NULL DEFAULT 100,
        subscription_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS analyses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        text_content TEXT,
        image_urls TEXT[],
        url VARCHAR(2048),
        scores JSONB NOT NULL,
        predictions JSONB NOT NULL,
        explanations JSONB,
        metadata JSONB NOT NULL,
        credits_used INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS api_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        endpoint VARCHAR(255) NOT NULL,
        method VARCHAR(10) NOT NULL,
        status_code INTEGER NOT NULL,
        response_time INTEGER NOT NULL,
        credits_used INTEGER DEFAULT 0,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);
      CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
      CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at);
      CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);
      CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at);
    `);

    // Update trigger for updated_at
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  async getUserByApiKey(apiKey: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE api_key = $1',
      [apiKey]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const result = await this.pool.query(
      `INSERT INTO users (email, hashed_password, plan, api_key, credits, subscription_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user.email, user.hashedPassword, user.plan, user.apiKey, user.credits, user.subscriptionId]
    );

    return this.mapRowToUser(result.rows[0]);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
        const dbKey = this.camelToSnake(key);
        fields.push(`${dbKey} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      return this.getUserById(id);
    }

    values.push(id);
    const result = await this.pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  async deductCredits(userId: string, amount: number): Promise<void> {
    await this.pool.query(
      'UPDATE users SET credits = credits - $1 WHERE id = $2 AND credits >= $1',
      [amount, userId]
    );
  }

  async saveAnalysis(analysis: {
    userId: string;
    textContent?: string;
    imageUrls?: string[];
    url?: string;
    scores: any;
    predictions: any;
    explanations?: any;
    metadata: any;
    creditsUsed: number;
  }): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO analyses (user_id, text_content, image_urls, url, scores, predictions, explanations, metadata, credits_used)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        analysis.userId,
        analysis.textContent,
        analysis.imageUrls,
        analysis.url,
        JSON.stringify(analysis.scores),
        JSON.stringify(analysis.predictions),
        analysis.explanations ? JSON.stringify(analysis.explanations) : null,
        JSON.stringify(analysis.metadata),
        analysis.creditsUsed
      ]
    );

    return result.rows[0].id;
  }

  async logApiUsage(usage: {
    userId?: string;
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
    creditsUsed?: number;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.pool.query(
      `INSERT INTO api_usage (user_id, endpoint, method, status_code, response_time, credits_used, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        usage.userId,
        usage.endpoint,
        usage.method,
        usage.statusCode,
        usage.responseTime,
        usage.creditsUsed || 0,
        usage.ipAddress,
        usage.userAgent
      ]
    );
  }

  async getUserAnalyses(userId: string, limit: number = 50, offset: number = 0) {
    const result = await this.pool.query(
      `SELECT id, text_content, image_urls, url, scores, predictions, explanations, metadata, credits_used, created_at
       FROM analyses
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows.map(row => ({
      id: row.id,
      textContent: row.text_content,
      imageUrls: row.image_urls,
      url: row.url,
      scores: row.scores,
      predictions: row.predictions,
      explanations: row.explanations,
      metadata: row.metadata,
      creditsUsed: row.credits_used,
      createdAt: row.created_at
    }));
  }

  async getUserStats(userId: string) {
    const result = await this.pool.query(
      `SELECT
         COUNT(*) as total_requests,
         SUM(credits_used) as credits_used,
         AVG((scores->>'overall')::float) as average_score
       FROM analyses
       WHERE user_id = $1`,
      [userId]
    );

    const categoryResult = await this.pool.query(
      `SELECT
         jsonb_object_keys(predictions) as category,
         COUNT(*) as count
       FROM analyses
       WHERE user_id = $1
       GROUP BY category
       ORDER BY count DESC
       LIMIT 10`,
      [userId]
    );

    return {
      totalRequests: parseInt(result.rows[0].total_requests || '0'),
      creditsUsed: parseInt(result.rows[0].credits_used || '0'),
      analysesPerformed: parseInt(result.rows[0].total_requests || '0'),
      averageScore: parseFloat(result.rows[0].average_score || '0'),
      topCategories: categoryResult.rows
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      hashedPassword: row.hashed_password,
      plan: row.plan,
      apiKey: row.api_key,
      credits: row.credits,
      subscriptionId: row.subscription_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}