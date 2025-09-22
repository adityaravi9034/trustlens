/**
 * Type definitions for TrustLens data operations
 */

export interface SourceDocument {
  url: string;
  title: string;
  content: string;
  html?: string;
  images: string[];
  publishedAt?: Date;
  source: string;
  language: string;
  metadata?: Record<string, any>;
}

export interface CleanDocument {
  url: string;
  title: string;
  text: string;
  images: string[];
  wordCount: number;
  language: string;
  source: string;
  cleanedAt: Date;
  metadata: {
    originalLength: number;
    cleanedLength: number;
    qualityScore: number;
  };
}

export interface LabelingFunction {
  name: string;
  description: string;
  pattern: RegExp | string;
  labels: string[];
  confidence: number;
  apply: (document: CleanDocument) => LabelResult[];
}

export interface LabelResult {
  label: string;
  confidence: number;
  spans: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  rationale: string;
}

export interface WeakLabel {
  documentId: string;
  labels: Record<string, number>; // label -> probability
  labelingFunctions: string[];
  coverage: number;
  conflicts: Array<{
    functions: string[];
    label: string;
    confidence: number;
  }>;
}

export interface IngestionConfig {
  sources: Array<{
    name: string;
    type: 'rss' | 'sitemap' | 'api' | 'manual';
    url: string;
    selectors?: {
      title?: string;
      content?: string;
      images?: string;
      publishedAt?: string;
    };
    respectRobots: boolean;
    rateLimit: number; // requests per second
    maxPages?: number;
  }>;
  language: string;
  outputDir: string;
  filters: {
    minLength: number;
    maxLength: number;
    allowedDomains?: string[];
    blockedDomains?: string[];
  };
}

export interface ManipulationTaxonomy {
  emotionalFraming: {
    fear: LabelingFunction;
    outrage: LabelingFunction;
    sentimentAmplification: LabelingFunction;
  };
  rhetoricalDevices: {
    adHominem: LabelingFunction;
    strawman: LabelingFunction;
    falseDilemma: LabelingFunction;
    cherryPicking: LabelingFunction;
    loadedLanguage: LabelingFunction;
    euphemism: LabelingFunction;
  };
  biasTypes: {
    selectionBias: LabelingFunction;
    confirmationBias: LabelingFunction;
    falseBalance: LabelingFunction;
    sourceImbalance: LabelingFunction;
  };
  misinformationRisk: {
    unverifiableClaims: LabelingFunction;
    missingCitations: LabelingFunction;
    rumorScore: LabelingFunction;
    novelty: LabelingFunction;
  };
}