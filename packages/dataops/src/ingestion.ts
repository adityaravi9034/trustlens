/**
 * Web Content Ingestion Pipeline
 *
 * Responsible for crawling and collecting content from various sources
 * while respecting robots.txt and rate limits.
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import robotsParser from 'robots-parser';
import { promises as fs } from 'fs';
import path from 'path';
import { SourceDocument, IngestionConfig } from './types';

export class ContentIngester {
  private config: IngestionConfig;
  private robotsCache = new Map<string, any>();
  private requestQueue: Array<{ url: string; source: string }> = [];
  private isProcessing = false;

  constructor(config: IngestionConfig) {
    this.config = config;
  }

  /**
   * Start the ingestion process for all configured sources
   */
  async ingest(): Promise<void> {
    console.log(`🕷️  Starting ingestion for ${this.config.sources.length} sources`);

    for (const source of this.config.sources) {
      console.log(`📡 Processing source: ${source.name} (${source.type})`);

      try {
        await this.ingestSource(source);
      } catch (error) {
        console.error(`❌ Failed to ingest source ${source.name}:`, error);
      }
    }

    // Process the request queue with rate limiting
    await this.processRequestQueue();
  }

  /**
   * Ingest content from a specific source
   */
  private async ingestSource(source: IngestionConfig['sources'][0]): Promise<void> {
    switch (source.type) {
      case 'rss':
        await this.ingestRSS(source);
        break;
      case 'sitemap':
        await this.ingestSitemap(source);
        break;
      case 'api':
        await this.ingestAPI(source);
        break;
      case 'manual':
        await this.ingestManualList(source);
        break;
      default:
        throw new Error(`Unsupported source type: ${source.type}`);
    }
  }

  /**
   * Ingest from RSS feeds
   */
  private async ingestRSS(source: IngestionConfig['sources'][0]): Promise<void> {
    const response = await axios.get(source.url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'TrustLens/1.0 (+https://trustlens.ai/bot)'
      }
    });

    const $ = cheerio.load(response.data, { xmlMode: true });

    $('item').each((_, item) => {
      const $item = $(item);
      const link = $item.find('link').text().trim();

      if (link && this.shouldProcessUrl(link)) {
        this.requestQueue.push({ url: link, source: source.name });
      }
    });

    console.log(`📰 Found ${this.requestQueue.length} articles from RSS feed`);
  }

  /**
   * Ingest from XML sitemaps
   */
  private async ingestSitemap(source: IngestionConfig['sources'][0]): Promise<void> {
    const response = await axios.get(source.url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'TrustLens/1.0 (+https://trustlens.ai/bot)'
      }
    });

    const $ = cheerio.load(response.data, { xmlMode: true });

    $('url loc').each((_, loc) => {
      const url = $(loc).text().trim();

      if (url && this.shouldProcessUrl(url)) {
        this.requestQueue.push({ url, source: source.name });
      }
    });

    console.log(`🗺️  Found ${this.requestQueue.length} URLs from sitemap`);
  }

  /**
   * Ingest from API endpoints
   */
  private async ingestAPI(source: IngestionConfig['sources'][0]): Promise<void> {
    // Implementation would depend on specific API format
    console.log(`🔌 API ingestion for ${source.name} - implementation needed`);
  }

  /**
   * Ingest from manual URL list
   */
  private async ingestManualList(source: IngestionConfig['sources'][0]): Promise<void> {
    // For manual lists, source.url could contain a JSON file with URLs
    try {
      const response = await axios.get(source.url);
      const urls = Array.isArray(response.data) ? response.data : [source.url];

      for (const url of urls) {
        if (this.shouldProcessUrl(url)) {
          this.requestQueue.push({ url, source: source.name });
        }
      }
    } catch (error) {
      // If it's not a JSON file, treat as single URL
      if (this.shouldProcessUrl(source.url)) {
        this.requestQueue.push({ url: source.url, source: source.name });
      }
    }
  }

  /**
   * Process the request queue with rate limiting and robots.txt compliance
   */
  private async processRequestQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    console.log(`⚡ Processing ${this.requestQueue.length} URLs in queue`);

    const documents: SourceDocument[] = [];
    let processed = 0;
    let errors = 0;

    for (const request of this.requestQueue) {
      try {
        // Check rate limit
        await this.waitForRateLimit();

        // Check robots.txt
        if (!(await this.isAllowedByRobots(request.url))) {
          console.log(`🤖 Skipping ${request.url} - blocked by robots.txt`);
          continue;
        }

        // Scrape the page
        const document = await this.scrapePage(request.url, request.source);
        if (document) {
          documents.push(document);
          processed++;
        }

        // Stop if we've reached max pages for any source
        const sourceConfig = this.config.sources.find(s => s.name === request.source);
        if (sourceConfig?.maxPages && processed >= sourceConfig.maxPages) {
          console.log(`📊 Reached max pages (${sourceConfig.maxPages}) for source ${request.source}`);
          break;
        }

      } catch (error) {
        console.error(`❌ Error processing ${request.url}:`, error);
        errors++;
      }
    }

    // Save documents to output directory
    await this.saveDocuments(documents);

    console.log(`✅ Ingestion complete: ${processed} documents processed, ${errors} errors`);
    this.isProcessing = false;
  }

  /**
   * Check if URL should be processed based on filters
   */
  private shouldProcessUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);

      // Check allowed domains
      if (this.config.filters.allowedDomains?.length) {
        const allowed = this.config.filters.allowedDomains.some(domain =>
          urlObj.hostname.includes(domain)
        );
        if (!allowed) return false;
      }

      // Check blocked domains
      if (this.config.filters.blockedDomains?.length) {
        const blocked = this.config.filters.blockedDomains.some(domain =>
          urlObj.hostname.includes(domain)
        );
        if (blocked) return false;
      }

      return true;
    } catch (error) {
      return false; // Invalid URL
    }
  }

  /**
   * Check robots.txt compliance
   */
  private async isAllowedByRobots(url: string): Promise<boolean> {
    try {
      const urlObj = new URL(url);
      const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;

      if (!this.robotsCache.has(urlObj.host)) {
        try {
          const response = await axios.get(robotsUrl, { timeout: 5000 });
          const robots = robotsParser(robotsUrl, response.data);
          this.robotsCache.set(urlObj.host, robots);
        } catch (error) {
          // If no robots.txt or error, assume allowed
          this.robotsCache.set(urlObj.host, null);
        }
      }

      const robots = this.robotsCache.get(urlObj.host);
      if (!robots) return true;

      return robots.isAllowed(url, 'TrustLens');
    } catch (error) {
      return true; // Default to allowed if error
    }
  }

  /**
   * Rate limiting
   */
  private async waitForRateLimit(): Promise<void> {
    const delay = 1000 / 2; // 2 requests per second default
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Scrape content from a single page
   */
  private async scrapePage(url: string, sourceName: string): Promise<SourceDocument | null> {
    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'TrustLens/1.0 (+https://trustlens.ai/bot)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        maxRedirects: 3
      });

      if (response.headers['content-type']?.includes('text/html')) {
        return this.extractContent(response.data, url, sourceName);
      }

      return null;
    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error);
      return null;
    }
  }

  /**
   * Extract structured content from HTML
   */
  private extractContent(html: string, url: string, sourceName: string): SourceDocument {
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $('script, style, nav, footer, aside, .advertisement, .ad').remove();

    // Extract title
    let title = $('h1').first().text().trim() ||
                $('title').text().trim() ||
                $('meta[property="og:title"]').attr('content') ||
                '';

    // Extract main content
    let content = '';

    // Try common content selectors
    const contentSelectors = [
      'article',
      '.content',
      '.post-content',
      '.article-body',
      '.entry-content',
      'main',
      '#content'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length && element.text().trim().length > content.length) {
        content = element.text().trim();
      }
    }

    // Fallback to body if no content found
    if (!content) {
      content = $('body').text().trim();
    }

    // Extract images
    const images: string[] = [];
    $('img').each((_, img) => {
      const src = $(img).attr('src');
      if (src) {
        try {
          const imgUrl = new URL(src, url).toString();
          images.push(imgUrl);
        } catch (error) {
          // Invalid URL, skip
        }
      }
    });

    // Extract publish date
    let publishedAt: Date | undefined;
    const dateSelectors = [
      'meta[property="article:published_time"]',
      'meta[name="date"]',
      'time[datetime]',
      '.date',
      '.published'
    ];

    for (const selector of dateSelectors) {
      const dateText = $(selector).attr('content') || $(selector).attr('datetime') || $(selector).text();
      if (dateText) {
        const date = new Date(dateText);
        if (!isNaN(date.getTime())) {
          publishedAt = date;
          break;
        }
      }
    }

    return {
      url,
      title,
      content,
      html,
      images,
      publishedAt,
      source: sourceName,
      language: this.config.language,
      metadata: {
        scrapedAt: new Date().toISOString(),
        contentLength: content.length,
        imageCount: images.length
      }
    };
  }

  /**
   * Save documents to output directory
   */
  private async saveDocuments(documents: SourceDocument[]): Promise<void> {
    // Ensure output directory exists
    await fs.mkdir(this.config.outputDir, { recursive: true });

    // Group documents by source
    const documentsBySource = new Map<string, SourceDocument[]>();
    for (const doc of documents) {
      if (!documentsBySource.has(doc.source)) {
        documentsBySource.set(doc.source, []);
      }
      documentsBySource.get(doc.source)!.push(doc);
    }

    // Save each source to separate file
    for (const [source, sourceDocs] of documentsBySource) {
      const filename = `${source}_${Date.now()}.jsonl`;
      const filepath = path.join(this.config.outputDir, filename);

      const jsonlContent = sourceDocs
        .map(doc => JSON.stringify(doc))
        .join('\n');

      await fs.writeFile(filepath, jsonlContent, 'utf8');
      console.log(`💾 Saved ${sourceDocs.length} documents to ${filename}`);
    }

    // Create manifest file
    const manifest = {
      timestamp: new Date().toISOString(),
      totalDocuments: documents.length,
      sources: Array.from(documentsBySource.keys()),
      config: this.config
    };

    await fs.writeFile(
      path.join(this.config.outputDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf8'
    );

    console.log(`📊 Created manifest with ${documents.length} total documents`);
  }
}