/**
 * Type definitions for explainability system
 */

export interface ExplanationRequest {
  text: string;
  imageUrls?: string[];
  modelPath: string;
  method: 'shap' | 'lime' | 'attention' | 'counterfactual' | 'rationale';
  config?: {
    numSamples?: number;
    maxFeatures?: number;
    threshold?: number;
    targetLabel?: string;
  };
}

export interface TextExplanation {
  spans: Array<{
    start: number;
    end: number;
    text: string;
    importance: number;
    label: string;
    confidence: number;
  }>;
  tokens: Array<{
    token: string;
    importance: number;
    position: number;
  }>;
  sentences: Array<{
    sentence: string;
    importance: number;
    startIndex: number;
    endIndex: number;
  }>;
}

export interface ImageExplanation {
  saliencyMaps: Array<{
    label: string;
    map: number[][];
    method: string;
  }>;
  regions: Array<{
    bbox: [number, number, number, number];
    importance: number;
    label: string;
    description: string;
  }>;
  pixels: Array<{
    x: number;
    y: number;
    importance: number;
    rgb: [number, number, number];
  }>;
}

export interface CounterfactualExplanation {
  originalText: string;
  counterfactuals: Array<{
    text: string;
    edits: Array<{
      type: 'insert' | 'delete' | 'replace';
      position: number;
      original: string;
      replacement: string;
    }>;
    scoreDelta: Record<string, number>;
    plausibility: number;
    minimality: number;
  }>;
  keyPhrases: Array<{
    phrase: string;
    importance: number;
    alternatives: string[];
  }>;
}

export interface RationaleExplanation {
  rationales: Array<{
    text: string;
    start: number;
    end: number;
    label: string;
    score: number;
    evidence: Array<{
      type: 'linguistic' | 'semantic' | 'contextual';
      feature: string;
      value: number;
    }>;
  }>;
  chains: Array<{
    reasoning: string[];
    confidence: number;
    label: string;
  }>;
}

export interface AttentionExplanation {
  tokenAttention: Array<{
    token: string;
    attention: number;
    layer: number;
    head: number;
  }>;
  sentenceAttention: Array<{
    sentence: string;
    attention: number;
    startToken: number;
    endToken: number;
  }>;
  crossAttention?: Array<{
    textToken: string;
    imageRegion: [number, number, number, number];
    attention: number;
  }>;
}

export interface ExplanationResult {
  method: string;
  textExplanation?: TextExplanation;
  imageExplanation?: ImageExplanation;
  counterfactual?: CounterfactualExplanation;
  rationale?: RationaleExplanation;
  attention?: AttentionExplanation;
  metadata: {
    processingTime: number;
    modelVersion: string;
    confidence: number;
    faithfulness?: number;
    plausibility?: number;
  };
}

export interface AggregatedExplanation {
  primaryExplanations: ExplanationResult[];
  consensus: {
    topSpans: Array<{
      text: string;
      start: number;
      end: number;
      importance: number;
      agreement: number; // Across methods
    }>;
    keyFactors: Array<{
      factor: string;
      importance: number;
      evidence: string[];
    }>;
    confidence: number;
  };
  disagreements: Array<{
    span: string;
    methods: string[];
    importanceScores: number[];
  }>;
  summary: {
    primaryReason: string;
    supportingEvidence: string[];
    uncertainty: number;
  };
}

export interface ExplanationConfig {
  methods: Array<'shap' | 'lime' | 'attention' | 'counterfactual' | 'rationale'>;
  aggregation: 'weighted' | 'consensus' | 'majority';
  visualization: {
    highlightThreshold: number;
    maxSpans: number;
    colorScheme: 'importance' | 'label' | 'confidence';
  };
  evaluation: {
    faithfulness: boolean;
    plausibility: boolean;
    stability: boolean;
  };
}

export interface ExplanationQuality {
  faithfulness: number; // How well explanation reflects model
  plausibility: number; // How believable to humans
  stability: number; // Consistency across similar inputs
  comprehensibility: number; // How easy to understand
  actionability: number; // How useful for decision-making
}

export interface SHAPConfig {
  background: 'random' | 'mean' | 'zero';
  numSamples: number;
  maxEvals: number;
  linkFunction: 'identity' | 'logit';
}

export interface LIMEConfig {
  numFeatures: number;
  numSamples: number;
  distance: 'cosine' | 'euclidean';
  kernelWidth: number;
}