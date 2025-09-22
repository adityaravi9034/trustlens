/**
 * Content Cleaning and Normalization Pipeline
 *
 * Processes raw scraped content into clean, structured documents
 * suitable for ML training and analysis.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { SourceDocument, CleanDocument } from './types';

export class ContentCleaner {
  private minLength: number;
  private maxLength: number;
  private language: string;

  constructor(options: {
    minLength?: number;
    maxLength?: number;
    language?: string;
  } = {}) {
    this.minLength = options.minLength || 200;
    this.maxLength = options.maxLength || 50000;
    this.language = options.language || 'en';
  }

  /**
   * Clean documents from input directory and save to output directory
   */
  async cleanDirectory(inputDir: string, outputDir: string): Promise<void> {
    console.log(`🧹 Starting content cleaning from ${inputDir} to ${outputDir}`);

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Read all JSONL files from input directory
    const files = await fs.readdir(inputDir);
    const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));

    let totalProcessed = 0;
    let totalCleaned = 0;

    for (const file of jsonlFiles) {
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(outputDir, file.replace('.jsonl', '_clean.jsonl'));

      console.log(`📄 Processing ${file}...`);

      const { processed, cleaned } = await this.cleanFile(inputPath, outputPath);
      totalProcessed += processed;
      totalCleaned += cleaned;

      console.log(`✅ ${file}: ${cleaned}/${processed} documents cleaned`);
    }

    console.log(`🎉 Cleaning complete: ${totalCleaned}/${totalProcessed} documents cleaned`);
  }

  /**
   * Clean a single JSONL file
   */
  private async cleanFile(inputPath: string, outputPath: string): Promise<{
    processed: number;
    cleaned: number;
  }> {
    const content = await fs.readFile(inputPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());

    const cleanedDocuments: CleanDocument[] = [];

    for (const line of lines) {
      try {
        const sourceDoc: SourceDocument = JSON.parse(line);
        const cleanDoc = await this.cleanDocument(sourceDoc);

        if (cleanDoc) {
          cleanedDocuments.push(cleanDoc);
        }
      } catch (error) {
        console.error(`Error parsing line in ${inputPath}:`, error);
      }
    }

    // Save cleaned documents
    const jsonlContent = cleanedDocuments
      .map(doc => JSON.stringify(doc))
      .join('\n');

    await fs.writeFile(outputPath, jsonlContent, 'utf8');

    return {
      processed: lines.length,
      cleaned: cleanedDocuments.length
    };
  }

  /**
   * Clean a single document
   */
  async cleanDocument(sourceDoc: SourceDocument): Promise<CleanDocument | null> {
    try {
      // Extract and clean text content
      const cleanText = this.cleanText(sourceDoc.content);

      // Check if document meets quality criteria
      if (!this.isValidDocument(cleanText, sourceDoc)) {
        return null;
      }

      // Clean title
      const cleanTitle = this.cleanText(sourceDoc.title);

      // Process images (validate URLs, remove duplicates)
      const cleanImages = this.cleanImages(sourceDoc.images, sourceDoc.url);

      // Calculate quality metrics
      const qualityScore = this.calculateQualityScore(cleanText, sourceDoc);

      return {
        url: sourceDoc.url,
        title: cleanTitle,
        text: cleanText,
        images: cleanImages,
        wordCount: this.countWords(cleanText),
        language: this.detectLanguage(cleanText) || sourceDoc.language,
        source: sourceDoc.source,
        cleanedAt: new Date(),
        metadata: {
          originalLength: sourceDoc.content.length,
          cleanedLength: cleanText.length,
          qualityScore
        }
      };
    } catch (error) {
      console.error(`Error cleaning document ${sourceDoc.url}:`, error);
      return null;
    }
  }

  /**
   * Clean and normalize text content
   */
  private cleanText(text: string): string {
    if (!text) return '';

    let cleaned = text;

    // Remove excessive whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');

    // Remove control characters
    cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');

    // Remove email addresses
    cleaned = cleaned.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');

    // Remove phone numbers (basic pattern)
    cleaned = cleaned.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');

    // Remove URLs (but keep domain for context)
    cleaned = cleaned.replace(/https?:\/\/(www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(\/[^\s]*)?/g, '[URL:$2]');

    // Normalize quotes
    cleaned = cleaned.replace(/[""]/g, '"');
    cleaned = cleaned.replace(/['']/g, "'");

    // Remove repeated punctuation
    cleaned = cleaned.replace(/([.!?]){2,}/g, '$1');

    // Clean up spacing around punctuation
    cleaned = cleaned.replace(/\s+([.!?,:;])/g, '$1');
    cleaned = cleaned.replace(/([.!?])\s*([A-Z])/g, '$1 $2');

    // Remove leading/trailing whitespace
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Validate document quality
   */
  private isValidDocument(text: string, sourceDoc: SourceDocument): boolean {
    // Check minimum length
    if (text.length < this.minLength) {
      return false;
    }

    // Check maximum length
    if (text.length > this.maxLength) {
      return false;
    }

    // Check for sufficient content (not just navigation/boilerplate)
    const wordCount = this.countWords(text);
    if (wordCount < 50) {
      return false;
    }

    // Check language (if specified)
    if (this.language !== 'auto') {
      const detectedLang = this.detectLanguage(text);
      if (detectedLang && detectedLang !== this.language) {
        return false;
      }
    }

    // Check for spammy content
    if (this.isSpammy(text)) {
      return false;
    }

    // Check for valid title
    if (!sourceDoc.title || sourceDoc.title.length < 10) {
      return false;
    }

    return true;
  }

  /**
   * Simple spam detection
   */
  private isSpammy(text: string): boolean {
    const lowerText = text.toLowerCase();

    // Common spam indicators
    const spamPatterns = [
      /click here/gi,
      /buy now/gi,
      /limited time/gi,
      /call now/gi,
      /free trial/gi,
      /subscribe/gi
    ];

    let spamScore = 0;
    for (const pattern of spamPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        spamScore += matches.length;
      }
    }

    // Check for excessive capitalization
    const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (capsRatio > 0.1) {
      spamScore += 5;
    }

    // Check for excessive punctuation
    const punctRatio = (text.match(/[!?]{2,}/g) || []).length / text.length;
    if (punctRatio > 0.01) {
      spamScore += 5;
    }

    return spamScore > 10;
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Basic language detection (simplified)
   */
  private detectLanguage(text: string): string | null {
    // This is a very basic implementation
    // In production, use a proper language detection library

    const sample = text.slice(0, 1000).toLowerCase();

    // Common English words
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const englishScore = englishWords.reduce((score, word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = sample.match(regex);
      return score + (matches ? matches.length : 0);
    }, 0);

    // Simple threshold
    if (englishScore > 5) {
      return 'en';
    }

    return null;
  }

  /**
   * Calculate document quality score
   */
  private calculateQualityScore(text: string, sourceDoc: SourceDocument): number {
    let score = 0.5; // Base score

    // Length score
    const wordCount = this.countWords(text);
    if (wordCount > 100) score += 0.1;
    if (wordCount > 500) score += 0.1;
    if (wordCount > 1000) score += 0.1;

    // Structure score
    if (sourceDoc.title && sourceDoc.title.length > 20) score += 0.1;
    if (sourceDoc.images && sourceDoc.images.length > 0) score += 0.05;
    if (sourceDoc.publishedAt) score += 0.05;

    // Content quality indicators
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;

    if (avgSentenceLength > 50 && avgSentenceLength < 200) score += 0.1;

    // Readability indicators
    const complexWords = text.split(/\s+/).filter(word => word.length > 8).length;
    const complexityRatio = complexWords / wordCount;
    if (complexityRatio > 0.1 && complexityRatio < 0.3) score += 0.1;

    return Math.min(1.0, Math.max(0.0, score));
  }

  /**
   * Clean and validate image URLs
   */
  private cleanImages(images: string[], baseUrl: string): string[] {
    const cleanImages: string[] = [];
    const seen = new Set<string>();

    for (const img of images) {
      try {
        // Convert relative URLs to absolute
        const imgUrl = new URL(img, baseUrl).toString();

        // Check if we've seen this URL before
        if (seen.has(imgUrl)) continue;
        seen.add(imgUrl);

        // Basic validation
        if (this.isValidImageUrl(imgUrl)) {
          cleanImages.push(imgUrl);
        }
      } catch (error) {
        // Invalid URL, skip
      }
    }

    return cleanImages;
  }

  /**
   * Validate image URL
   */
  private isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);

      // Check protocol
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }

      // Check file extension
      const pathname = urlObj.pathname.toLowerCase();
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      const hasImageExtension = imageExtensions.some(ext => pathname.endsWith(ext));

      // Also check for common image URL patterns
      const isImageUrl = hasImageExtension ||
                         pathname.includes('/image') ||
                         pathname.includes('/img') ||
                         pathname.includes('/photo');

      return isImageUrl;
    } catch (error) {
      return false;
    }
  }
}