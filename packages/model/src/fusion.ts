/**
 * Multimodal Fusion System
 *
 * Combines text and image analysis for comprehensive manipulation detection
 * Supports early, late, and intermediate fusion strategies
 */

import { ClassificationResult, FusionConfig, ImageFeatures } from './types';
import { TextClassifier } from './text-classifier';
import { ImagePersuasionDetector, ImageAnalysisResult } from './image-classifier';

export interface MultimodalResult {
  textAnalysis: ClassificationResult;
  imageAnalysis: ImageAnalysisResult[];
  fusedScores: Record<string, number>;
  fusedPredictions: Record<string, boolean>;
  overallManipulationScore: number;
  crossModalAttention: Array<{
    textSpan: { start: number; end: number; text: string };
    imageRegion: { x: number; y: number; width: number; height: number };
    attentionWeight: number;
  }>;
  explanation: {
    primaryMode: 'text' | 'image' | 'both';
    keyFactors: string[];
    confidence: number;
  };
  metadata: {
    fusionStrategy: string;
    processingTime: number;
    textWeight: number;
    imageWeight: number;
  };
}

export class MultimodalFusionSystem {
  private textClassifier: TextClassifier;
  private imageDetector: ImagePersuasionDetector;
  private config: FusionConfig;

  constructor(
    textClassifier: TextClassifier,
    imageDetector: ImagePersuasionDetector,
    config: FusionConfig
  ) {
    this.textClassifier = textClassifier;
    this.imageDetector = imageDetector;
    this.config = config;
  }

  /**
   * Analyze content with text and images using multimodal fusion
   */
  async analyzeMultimodal(
    text: string,
    imageUrls: string[]
  ): Promise<MultimodalResult> {
    const startTime = Date.now();

    console.log(`🔗 Starting multimodal analysis: text + ${imageUrls.length} images`);

    try {
      // Parallel analysis
      const [textAnalysis, imageAnalyses] = await Promise.all([
        this.textClassifier.classify(text),
        this.imageDetector.analyzeBatch(imageUrls)
      ]);

      // Apply fusion strategy
      const fusedScores = await this.fuseAnalyses(textAnalysis, imageAnalyses);

      // Generate cross-modal attention
      const crossModalAttention = await this.generateCrossModalAttention(
        text, textAnalysis, imageAnalyses
      );

      // Calculate final predictions
      const fusedPredictions = this.applyFusedThreshold(fusedScores, 0.5);

      // Calculate overall manipulation score
      const overallManipulationScore = this.calculateOverallScore(fusedScores);

      // Generate explanation
      const explanation = this.generateExplanation(
        textAnalysis, imageAnalyses, fusedScores, crossModalAttention
      );

      const processingTime = Date.now() - startTime;

      return {
        textAnalysis,
        imageAnalysis: imageAnalyses,
        fusedScores,
        fusedPredictions,
        overallManipulationScore,
        crossModalAttention,
        explanation,
        metadata: {
          fusionStrategy: this.config.strategy,
          processingTime,
          textWeight: this.config.textWeight,
          imageWeight: this.config.imageWeight
        }
      };
    } catch (error) {
      console.error(`Error in multimodal analysis:`, error);
      throw error;
    }
  }

  /**
   * Fuse text and image analyses based on strategy
   */
  private async fuseAnalyses(
    textAnalysis: ClassificationResult,
    imageAnalyses: ImageAnalysisResult[]
  ): Promise<Record<string, number>> {
    switch (this.config.strategy) {
      case 'early':
        return this.earlyFusion(textAnalysis, imageAnalyses);
      case 'late':
        return this.lateFusion(textAnalysis, imageAnalyses);
      case 'intermediate':
        return this.intermediateFusion(textAnalysis, imageAnalyses);
      default:
        throw new Error(`Unknown fusion strategy: ${this.config.strategy}`);
    }
  }

  /**
   * Early fusion - combine features before classification
   */
  private async earlyFusion(
    textAnalysis: ClassificationResult,
    imageAnalyses: ImageAnalysisResult[]
  ): Promise<Record<string, number>> {
    console.log(`🔀 Applying early fusion...`);

    const fusedScores: Record<string, number> = {};

    // Get base text scores
    for (const [label, textScore] of Object.entries(textAnalysis.calibratedScores)) {
      let fusedScore = textScore * this.config.textWeight;

      // Find relevant image features for this label
      const imageContribution = this.getImageContributionForLabel(label, imageAnalyses);
      fusedScore += imageContribution * this.config.imageWeight;

      // Normalize
      fusedScore = fusedScore / (this.config.textWeight + this.config.imageWeight);

      // Apply cross-modal enhancement
      if (this.config.attentionMechanism !== 'none') {
        fusedScore = this.applyCrossModalAttention(fusedScore, textScore, imageContribution);
      }

      fusedScores[label] = Math.max(0, Math.min(1, fusedScore));
    }

    return fusedScores;
  }

  /**
   * Late fusion - combine decisions after separate classification
   */
  private async lateFusion(
    textAnalysis: ClassificationResult,
    imageAnalyses: ImageAnalysisResult[]
  ): Promise<Record<string, number>> {
    console.log(`🔀 Applying late fusion...`);

    const fusedScores: Record<string, number> = {};

    for (const [label, textScore] of Object.entries(textAnalysis.calibratedScores)) {
      // Get image prediction for this label
      const imageScore = this.getImageScoreForLabel(label, imageAnalyses);

      // Weighted combination
      const fusedScore = (textScore * this.config.textWeight + imageScore * this.config.imageWeight) /
                        (this.config.textWeight + this.config.imageWeight);

      // Apply fusion enhancement based on agreement
      const agreement = 1 - Math.abs(textScore - imageScore);
      const enhancedScore = fusedScore + (agreement - 0.5) * 0.1;

      fusedScores[label] = Math.max(0, Math.min(1, enhancedScore));
    }

    return fusedScores;
  }

  /**
   * Intermediate fusion - combine at hidden layer level
   */
  private async intermediateFusion(
    textAnalysis: ClassificationResult,
    imageAnalyses: ImageAnalysisResult[]
  ): Promise<Record<string, number>> {
    console.log(`🔀 Applying intermediate fusion...`);

    // For intermediate fusion, we simulate hidden layer interaction
    const fusedScores: Record<string, number> = {};

    for (const [label, textScore] of Object.entries(textAnalysis.calibratedScores)) {
      const imageScore = this.getImageScoreForLabel(label, imageAnalyses);

      // Simulate hidden layer interaction
      const hiddenInteraction = this.simulateHiddenLayerFusion(textScore, imageScore, label);

      // Apply learned fusion weights (would be trained in real implementation)
      const fusedScore = this.applyLearnedFusionWeights(textScore, imageScore, hiddenInteraction, label);

      fusedScores[label] = Math.max(0, Math.min(1, fusedScore));
    }

    return fusedScores;
  }

  /**
   * Get image contribution for specific manipulation label
   */
  private getImageContributionForLabel(
    label: string,
    imageAnalyses: ImageAnalysisResult[]
  ): number {
    if (imageAnalyses.length === 0) return 0;

    let totalContribution = 0;

    for (const imageAnalysis of imageAnalyses) {
      let contribution = 0;

      switch (label) {
        case 'fear_framing':
          contribution = Math.max(
            imageAnalysis.persuasionCues.red_dominance || 0,
            imageAnalysis.persuasionCues.high_contrast || 0,
            imageAnalysis.persuasionCues.emotional_faces || 0
          );
          break;

        case 'outrage_framing':
          contribution = Math.max(
            imageAnalysis.persuasionCues.warm_colors || 0,
            imageAnalysis.persuasionCues.emotional_faces || 0,
            imageAnalysis.persuasionCues.high_contrast || 0
          );
          break;

        case 'loaded_language':
          contribution = Math.max(
            imageAnalysis.persuasionCues.text_overlay || 0,
            imageAnalysis.persuasionCues.headline_emphasis || 0,
            imageAnalysis.persuasionCues.saturation_boost || 0
          );
          break;

        case 'ad_hominem':
          contribution = Math.max(
            imageAnalysis.persuasionCues.facial_appeal || 0,
            imageAnalysis.persuasionCues.eye_contact || 0
          );
          break;

        case 'cherry_picking':
          contribution = Math.max(
            imageAnalysis.persuasionCues.central_focus || 0,
            imageAnalysis.persuasionCues.rule_of_thirds || 0
          );
          break;

        case 'confirmation_bias':
          contribution = Math.max(
            imageAnalysis.persuasionCues.patriotic_symbols || 0,
            imageAnalysis.persuasionCues.religious_symbols || 0
          );
          break;

        case 'missing_citations':
          contribution = Math.max(
            imageAnalysis.persuasionCues.text_overlay || 0,
            imageAnalysis.persuasionCues.corporate_logos || 0
          );
          break;

        default:
          // Generic visual persuasion contribution
          contribution = Math.max(
            imageAnalysis.persuasionCues.central_focus || 0,
            imageAnalysis.persuasionCues.emotional_faces || 0,
            imageAnalysis.persuasionCues.high_contrast || 0
          ) * 0.5;
      }

      totalContribution += contribution * imageAnalysis.confidence;
    }

    return totalContribution / imageAnalyses.length;
  }

  /**
   * Get aggregated image score for label
   */
  private getImageScoreForLabel(
    label: string,
    imageAnalyses: ImageAnalysisResult[]
  ): number {
    if (imageAnalyses.length === 0) return 0;

    const contribution = this.getImageContributionForLabel(label, imageAnalyses);

    // Convert contribution to probability-like score
    return Math.min(1, contribution * 1.2);
  }

  /**
   * Apply cross-modal attention mechanism
   */
  private applyCrossModalAttention(
    fusedScore: number,
    textScore: number,
    imageScore: number
  ): number {
    if (this.config.attentionMechanism === 'none') {
      return fusedScore;
    }

    // Calculate attention weights based on confidence and agreement
    const textConfidence = 1 - Math.abs(textScore - 0.5) * 2; // Higher when score is extreme
    const imageConfidence = 1 - Math.abs(imageScore - 0.5) * 2;
    const agreement = 1 - Math.abs(textScore - imageScore);

    // Attention enhancement
    const attentionBoost = agreement * Math.min(textConfidence, imageConfidence) * 0.1;

    return Math.max(0, Math.min(1, fusedScore + attentionBoost));
  }

  /**
   * Simulate hidden layer fusion for intermediate strategy
   */
  private simulateHiddenLayerFusion(
    textScore: number,
    imageScore: number,
    label: string
  ): number {
    // Simulate non-linear hidden layer interactions
    const interaction1 = Math.tanh(textScore * 2 - 1) * Math.tanh(imageScore * 2 - 1);
    const interaction2 = Math.sin(textScore * Math.PI) * Math.cos(imageScore * Math.PI);
    const interaction3 = Math.sqrt(textScore * imageScore);

    // Weighted combination (weights would be learned)
    return (interaction1 * 0.5 + interaction2 * 0.3 + interaction3 * 0.2 + 1) / 2;
  }

  /**
   * Apply learned fusion weights
   */
  private applyLearnedFusionWeights(
    textScore: number,
    imageScore: number,
    hiddenInteraction: number,
    label: string
  ): number {
    // Mock learned weights (would be trained in real implementation)
    const weights = this.getLabelSpecificWeights(label);

    return weights.text * textScore +
           weights.image * imageScore +
           weights.interaction * hiddenInteraction;
  }

  /**
   * Get label-specific fusion weights
   */
  private getLabelSpecificWeights(label: string): { text: number; image: number; interaction: number } {
    const weights: Record<string, { text: number; image: number; interaction: number }> = {
      fear_framing: { text: 0.4, image: 0.5, interaction: 0.1 },
      outrage_framing: { text: 0.3, image: 0.6, interaction: 0.1 },
      loaded_language: { text: 0.7, image: 0.2, interaction: 0.1 },
      ad_hominem: { text: 0.8, image: 0.1, interaction: 0.1 },
      cherry_picking: { text: 0.6, image: 0.3, interaction: 0.1 },
      missing_citations: { text: 0.9, image: 0.05, interaction: 0.05 }
    };

    return weights[label] || { text: 0.6, image: 0.3, interaction: 0.1 };
  }

  /**
   * Generate cross-modal attention visualization
   */
  private async generateCrossModalAttention(
    text: string,
    textAnalysis: ClassificationResult,
    imageAnalyses: ImageAnalysisResult[]
  ): Promise<MultimodalResult['crossModalAttention']> {
    const attention: MultimodalResult['crossModalAttention'] = [];

    if (imageAnalyses.length === 0) return attention;

    // Find important text spans
    const importantSpans = this.findImportantTextSpans(text, textAnalysis);

    // Find important image regions
    const importantRegions = this.findImportantImageRegions(imageAnalyses);

    // Create cross-modal attention mappings
    for (const span of importantSpans) {
      for (const region of importantRegions) {
        const attentionWeight = this.calculateAttentionWeight(span, region);

        if (attentionWeight > 0.3) {
          attention.push({
            textSpan: span,
            imageRegion: region,
            attentionWeight
          });
        }
      }
    }

    // Sort by attention weight
    attention.sort((a, b) => b.attentionWeight - a.attentionWeight);

    return attention.slice(0, 10); // Top 10 attention mappings
  }

  /**
   * Find important spans in text
   */
  private findImportantTextSpans(
    text: string,
    textAnalysis: ClassificationResult
  ): Array<{ start: number; end: number; text: string }> {
    const spans: Array<{ start: number; end: number; text: string }> = [];

    // Mock important span detection
    const words = text.split(/\s+/);
    let currentIndex = 0;

    for (let i = 0; i < words.length; i += 3) { // Every 3 words
      const spanWords = words.slice(i, Math.min(i + 3, words.length));
      const spanText = spanWords.join(' ');

      if (Math.random() > 0.7) { // 30% chance of being important
        spans.push({
          start: currentIndex,
          end: currentIndex + spanText.length,
          text: spanText
        });
      }

      currentIndex += spanText.length + 1;
    }

    return spans.slice(0, 5); // Top 5 spans
  }

  /**
   * Find important regions in images
   */
  private findImportantImageRegions(
    imageAnalyses: ImageAnalysisResult[]
  ): Array<{ x: number; y: number; width: number; height: number }> {
    const regions: Array<{ x: number; y: number; width: number; height: number }> = [];

    for (const imageAnalysis of imageAnalyses) {
      // Extract high-attention regions from saliency maps
      const saliencyMap = imageAnalysis.saliencyMaps.find(map => map.type === 'attention');

      if (saliencyMap) {
        // Find peaks in saliency map
        const peaks = this.findSaliencyPeaks(saliencyMap.data);

        for (const peak of peaks) {
          regions.push({
            x: peak.x * 25, // Scale from 32x32 to image size
            y: peak.y * 25,
            width: 50,
            height: 50
          });
        }
      }
    }

    return regions.slice(0, 8); // Top 8 regions
  }

  /**
   * Find peaks in saliency map
   */
  private findSaliencyPeaks(
    saliencyData: number[][]
  ): Array<{ x: number; y: number; value: number }> {
    const peaks: Array<{ x: number; y: number; value: number }> = [];
    const threshold = 0.6;

    for (let i = 1; i < saliencyData.length - 1; i++) {
      for (let j = 1; j < saliencyData[i].length - 1; j++) {
        const value = saliencyData[i][j];

        if (value > threshold) {
          // Check if it's a local maximum
          const isLocalMax = value > saliencyData[i-1][j] &&
                            value > saliencyData[i+1][j] &&
                            value > saliencyData[i][j-1] &&
                            value > saliencyData[i][j+1];

          if (isLocalMax) {
            peaks.push({ x: j, y: i, value });
          }
        }
      }
    }

    return peaks.sort((a, b) => b.value - a.value).slice(0, 5);
  }

  /**
   * Calculate attention weight between text span and image region
   */
  private calculateAttentionWeight(
    textSpan: { start: number; end: number; text: string },
    imageRegion: { x: number; y: number; width: number; height: number }
  ): number {
    // Mock attention calculation
    let weight = 0.3; // Base weight

    // Semantic similarity (mock)
    const semanticSimilarity = this.calculateSemanticSimilarity(textSpan.text, imageRegion);
    weight += semanticSimilarity * 0.4;

    // Position correlation (mock)
    const positionCorrelation = this.calculatePositionCorrelation(textSpan, imageRegion);
    weight += positionCorrelation * 0.3;

    return Math.max(0, Math.min(1, weight));
  }

  /**
   * Calculate semantic similarity between text and image region
   */
  private calculateSemanticSimilarity(text: string, region: any): number {
    // Mock semantic similarity using keyword matching
    const emotionalWords = ['fear', 'angry', 'happy', 'sad', 'surprise'];
    const visualWords = ['red', 'bright', 'dark', 'face', 'symbol'];

    const textLower = text.toLowerCase();
    let similarity = 0;

    for (const word of [...emotionalWords, ...visualWords]) {
      if (textLower.includes(word)) {
        similarity += 0.2;
      }
    }

    return Math.min(1, similarity);
  }

  /**
   * Calculate position correlation
   */
  private calculatePositionCorrelation(textSpan: any, imageRegion: any): number {
    // Mock position correlation
    return Math.random() * 0.5;
  }

  /**
   * Apply threshold to fused scores
   */
  private applyFusedThreshold(
    fusedScores: Record<string, number>,
    threshold: number
  ): Record<string, boolean> {
    const predictions: Record<string, boolean> = {};

    for (const [label, score] of Object.entries(fusedScores)) {
      predictions[label] = score >= threshold;
    }

    return predictions;
  }

  /**
   * Calculate overall manipulation score from fused results
   */
  private calculateOverallScore(fusedScores: Record<string, number>): number {
    // Weight by category importance
    let weightedSum = 0;
    let totalWeight = 0;

    const categoryWeights = {
      emotional_framing: 1.2,
      rhetorical_devices: 1.5,
      bias_types: 1.3,
      misinformation_risk: 1.4
    };

    for (const [label, score] of Object.entries(fusedScores)) {
      const category = this.getLabelCategory(label);
      const weight = categoryWeights[category as keyof typeof categoryWeights] || 1.0;

      weightedSum += score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Get category for label
   */
  private getLabelCategory(label: string): string {
    const categoryMap: Record<string, string> = {
      fear_framing: 'emotional_framing',
      outrage_framing: 'emotional_framing',
      sentiment_amplification: 'emotional_framing',
      ad_hominem: 'rhetorical_devices',
      strawman: 'rhetorical_devices',
      false_dilemma: 'rhetorical_devices',
      cherry_picking: 'rhetorical_devices',
      loaded_language: 'rhetorical_devices',
      euphemism: 'rhetorical_devices',
      selection_bias: 'bias_types',
      confirmation_bias: 'bias_types',
      false_balance: 'bias_types',
      source_imbalance: 'bias_types',
      unverifiable_claims: 'misinformation_risk',
      missing_citations: 'misinformation_risk',
      rumor_score: 'misinformation_risk',
      novelty: 'misinformation_risk'
    };

    return categoryMap[label] || 'unknown';
  }

  /**
   * Generate explanation for multimodal result
   */
  private generateExplanation(
    textAnalysis: ClassificationResult,
    imageAnalyses: ImageAnalysisResult[],
    fusedScores: Record<string, number>,
    crossModalAttention: MultimodalResult['crossModalAttention']
  ): MultimodalResult['explanation'] {
    // Determine primary mode
    const textConfidence = Object.values(textAnalysis.calibratedScores).reduce((sum, score) => sum + score, 0) / Object.keys(textAnalysis.calibratedScores).length;
    const imageConfidence = imageAnalyses.length > 0 ?
      imageAnalyses.reduce((sum, analysis) => sum + analysis.confidence, 0) / imageAnalyses.length : 0;

    let primaryMode: 'text' | 'image' | 'both';
    if (Math.abs(textConfidence - imageConfidence) < 0.1) {
      primaryMode = 'both';
    } else if (textConfidence > imageConfidence) {
      primaryMode = 'text';
    } else {
      primaryMode = 'image';
    }

    // Identify key factors
    const keyFactors: string[] = [];

    // Top text factors
    const topTextLabels = Object.entries(textAnalysis.calibratedScores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .filter(([, score]) => score > 0.5)
      .map(([label]) => label);

    keyFactors.push(...topTextLabels.map(label => `Text: ${label.replace(/_/g, ' ')}`));

    // Top image factors
    if (imageAnalyses.length > 0) {
      const topImageCues = Object.entries(imageAnalyses[0].persuasionCues)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 2)
        .filter(([, score]) => score > 0.4)
        .map(([cue]) => cue);

      keyFactors.push(...topImageCues.map(cue => `Visual: ${cue.replace(/_/g, ' ')}`));
    }

    // Cross-modal factors
    if (crossModalAttention.length > 0) {
      keyFactors.push(`Cross-modal: ${crossModalAttention.length} text-image correlations`);
    }

    // Calculate explanation confidence
    const fusedConfidence = Object.values(fusedScores).reduce((sum, score) => sum + Math.abs(score - 0.5), 0) / Object.keys(fusedScores).length;
    const explanationConfidence = Math.min(0.95, 0.5 + fusedConfidence);

    return {
      primaryMode,
      keyFactors: keyFactors.slice(0, 5), // Top 5 factors
      confidence: explanationConfidence
    };
  }

  /**
   * Get fusion configuration
   */
  getFusionConfig(): FusionConfig {
    return this.config;
  }

  /**
   * Update fusion configuration
   */
  updateFusionConfig(newConfig: Partial<FusionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}