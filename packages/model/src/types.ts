/**
 * Type definitions for TrustLens ML models
 */

export interface ModelConfig {
  modelName: string;
  maxLength: number;
  batchSize: number;
  learningRate: number;
  epochs: number;
  warmupSteps: number;
  weightDecay: number;
  dropout: number;
  seed: number;
}

export interface TrainingConfig extends ModelConfig {
  trainPath: string;
  validPath: string;
  outputDir: string;
  saveSteps: number;
  evalSteps: number;
  loggingSteps: number;
  calibration: boolean;
  mixedPrecision: boolean;
  gradientAccumulation: number;
}

export interface ClassificationResult {
  scores: Record<string, number>;
  predictions: Record<string, boolean>;
  uncertainty: Record<string, number>;
  calibratedScores: Record<string, number>;
  overall: number;
  metadata: {
    modelVersion: string;
    timestamp: string;
    processingTime: number;
  };
}

export interface TrainingExample {
  text: string;
  labels: Record<string, number>; // label -> probability
  metadata?: {
    source?: string;
    url?: string;
    length?: number;
  };
}

export interface ModelArtifacts {
  modelPath: string;
  tokenizerPath: string;
  configPath: string;
  calibrationPath?: string;
  onnxPath?: string;
  metrics: TrainingMetrics;
}

export interface TrainingMetrics {
  epoch: number;
  trainLoss: number;
  validLoss: number;
  macroF1: number;
  microF1: number;
  precision: Record<string, number>;
  recall: Record<string, number>;
  calibrationECE: number;
  oodAUC?: number;
  trainingTime: string;
  labelDistribution: Record<string, number>;
}

export interface InferenceConfig {
  modelPath: string;
  batchSize: number;
  maxLength: number;
  useONNX: boolean;
  deviceType: 'cpu' | 'gpu';
  calibrated: boolean;
  threshold: number;
}

export interface CalibrationConfig {
  method: 'temperature' | 'platt' | 'isotonic';
  validationSplit: number;
  crossValidationFolds?: number;
}

export interface ExportConfig {
  format: 'onnx' | 'tensorrt' | 'tflite';
  quantization: 'none' | 'int8' | 'fp16';
  optimization: boolean;
  targetDevice: 'cpu' | 'gpu' | 'edge';
}

export interface ImageFeatures {
  colorHistogram: number[];
  edgeFeatures: number[];
  textureFeatures: number[];
  faceFeatures?: {
    faceCount: number;
    expressions: Record<string, number>;
    demographics: Record<string, number>;
  };
  objectFeatures?: {
    objects: Array<{
      label: string;
      confidence: number;
      bbox: [number, number, number, number];
    }>;
  };
  symbolFeatures?: {
    symbols: string[];
    flags: string[];
    logos: string[];
  };
}

export interface FusionConfig {
  strategy: 'early' | 'late' | 'intermediate';
  textWeight: number;
  imageWeight: number;
  fusionLayers: number[];
  attentionMechanism: 'none' | 'cross' | 'self';
}

export interface TaxonomyLabel {
  name: string;
  category: 'emotional_framing' | 'rhetorical_devices' | 'bias_types' | 'misinformation_risk';
  description: string;
  examples: string[];
  prevalence: number; // Expected prevalence in dataset
  difficulty: 'easy' | 'medium' | 'hard';
}

export const MANIPULATION_TAXONOMY: Record<string, TaxonomyLabel> = {
  fear_framing: {
    name: 'fear_framing',
    category: 'emotional_framing',
    description: 'Content that uses fear-based appeals to influence opinion',
    examples: ['catastrophic consequences', 'existential threats', 'panic-inducing language'],
    prevalence: 0.15,
    difficulty: 'medium'
  },
  outrage_framing: {
    name: 'outrage_framing',
    category: 'emotional_framing',
    description: 'Content designed to provoke anger and outrage',
    examples: ['inflammatory language', 'moral indignation', 'righteous anger'],
    prevalence: 0.12,
    difficulty: 'medium'
  },
  sentiment_amplification: {
    name: 'sentiment_amplification',
    category: 'emotional_framing',
    description: 'Excessive use of emotional intensifiers',
    examples: ['extreme adjectives', 'hyperbolic claims', 'emotional amplifiers'],
    prevalence: 0.18,
    difficulty: 'easy'
  },
  ad_hominem: {
    name: 'ad_hominem',
    category: 'rhetorical_devices',
    description: 'Attacks on person rather than argument',
    examples: ['character assassination', 'personal attacks', 'credibility attacks'],
    prevalence: 0.08,
    difficulty: 'hard'
  },
  strawman: {
    name: 'strawman',
    category: 'rhetorical_devices',
    description: 'Misrepresenting opponent\'s position',
    examples: ['oversimplification', 'mischaracterization', 'distortion'],
    prevalence: 0.06,
    difficulty: 'hard'
  },
  false_dilemma: {
    name: 'false_dilemma',
    category: 'rhetorical_devices',
    description: 'Presenting only two options when more exist',
    examples: ['binary thinking', 'either-or fallacy', 'false choice'],
    prevalence: 0.05,
    difficulty: 'medium'
  },
  cherry_picking: {
    name: 'cherry_picking',
    category: 'rhetorical_devices',
    description: 'Selective presentation of evidence',
    examples: ['selective data', 'confirmation bias', 'one-sided evidence'],
    prevalence: 0.10,
    difficulty: 'hard'
  },
  loaded_language: {
    name: 'loaded_language',
    category: 'rhetorical_devices',
    description: 'Emotionally charged or biased language',
    examples: ['propaganda terms', 'charged vocabulary', 'biased framing'],
    prevalence: 0.14,
    difficulty: 'medium'
  },
  euphemism: {
    name: 'euphemism',
    category: 'rhetorical_devices',
    description: 'Softening harsh realities with pleasant language',
    examples: ['corporate speak', 'political euphemisms', 'sanitized language'],
    prevalence: 0.07,
    difficulty: 'medium'
  },
  selection_bias: {
    name: 'selection_bias',
    category: 'bias_types',
    description: 'Biased selection of information or sources',
    examples: ['cherry-picked sources', 'unrepresentative samples', 'selective inclusion'],
    prevalence: 0.09,
    difficulty: 'hard'
  },
  confirmation_bias: {
    name: 'confirmation_bias',
    category: 'bias_types',
    description: 'Favoring information that confirms existing beliefs',
    examples: ['echo chamber', 'selective interpretation', 'bias confirmation'],
    prevalence: 0.11,
    difficulty: 'medium'
  },
  false_balance: {
    name: 'false_balance',
    category: 'bias_types',
    description: 'Giving equal weight to unequal evidence',
    examples: ['both-sides-ism', 'false equivalence', 'artificial balance'],
    prevalence: 0.04,
    difficulty: 'hard'
  },
  source_imbalance: {
    name: 'source_imbalance',
    category: 'bias_types',
    description: 'Uneven representation of sources or viewpoints',
    examples: ['one-sided sourcing', 'expert shopping', 'biased attribution'],
    prevalence: 0.08,
    difficulty: 'medium'
  },
  unverifiable_claims: {
    name: 'unverifiable_claims',
    category: 'misinformation_risk',
    description: 'Claims that cannot be independently verified',
    examples: ['anonymous sources', 'unsubstantiated claims', 'rumor-based reporting'],
    prevalence: 0.13,
    difficulty: 'medium'
  },
  missing_citations: {
    name: 'missing_citations',
    category: 'misinformation_risk',
    description: 'Factual claims without proper attribution',
    examples: ['unsourced statistics', 'missing references', 'uncredited claims'],
    prevalence: 0.16,
    difficulty: 'easy'
  },
  rumor_score: {
    name: 'rumor_score',
    category: 'misinformation_risk',
    description: 'Content based on rumors or speculation',
    examples: ['gossip-based reporting', 'unconfirmed reports', 'speculative content'],
    prevalence: 0.06,
    difficulty: 'medium'
  },
  novelty: {
    name: 'novelty',
    category: 'misinformation_risk',
    description: 'Excessive claims of uniqueness or breaking news',
    examples: ['clickbait headlines', 'sensational claims', 'artificial urgency'],
    prevalence: 0.12,
    difficulty: 'easy'
  }
};