/**
 * Rationale Extraction System
 *
 * Extracts human-readable rationales that explain model predictions
 * with evidence-based reasoning chains
 */

import { RationaleExplanation, ExplanationRequest } from './types';

export class RationaleExtractor {
  private modelPath: string;
  private extractorModel: any = null;

  constructor(modelPath: string) {
    this.modelPath = modelPath;
  }

  /**
   * Extract rationales for a given prediction
   */
  async extractRationales(request: ExplanationRequest): Promise<RationaleExplanation> {
    console.log(`🔍 Extracting rationales for text analysis...`);

    try {
      // Load rationale extraction model if needed
      if (!this.extractorModel) {
        await this.loadRationaleModel();
      }

      // Extract rationale spans
      const rationales = await this.extractRationaleSpans(request.text);

      // Build reasoning chains
      const chains = await this.buildReasoningChains(request.text, rationales);

      return {
        rationales,
        chains
      };
    } catch (error) {
      console.error(`Error extracting rationales:`, error);
      throw error;
    }
  }

  /**
   * Extract rationale spans from text
   */
  private async extractRationaleSpans(text: string): Promise<RationaleExplanation['rationales']> {
    const rationales: RationaleExplanation['rationales'] = [];

    // Split text into sentences for analysis
    const sentences = this.splitIntoSentences(text);

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const startIndex = this.findSentenceStart(text, sentence, i);

      // Analyze sentence for manipulation patterns
      const analysis = await this.analyzeSentence(sentence);

      if (analysis.hasRationale) {
        // Extract specific rationale spans within the sentence
        const spans = await this.extractSpansFromSentence(sentence, startIndex, analysis);
        rationales.push(...spans);
      }
    }

    // Sort by importance score
    rationales.sort((a, b) => b.score - a.score);

    return rationales.slice(0, 10); // Top 10 rationales
  }

  /**
   * Split text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    // Simple sentence splitting - in production would use more sophisticated NLP
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10); // Filter out very short fragments
  }

  /**
   * Find the start index of a sentence in the original text
   */
  private findSentenceStart(text: string, sentence: string, sentenceIndex: number): number {
    const cleanSentence = sentence.replace(/[^\w\s]/g, '');
    const cleanText = text.replace(/[^\w\s]/g, '');

    let searchStart = 0;
    for (let i = 0; i < sentenceIndex; i++) {
      const prevSentence = this.splitIntoSentences(text)[i];
      if (prevSentence) {
        const cleanPrev = prevSentence.replace(/[^\w\s]/g, '');
        const foundIndex = cleanText.indexOf(cleanPrev, searchStart);
        if (foundIndex !== -1) {
          searchStart = foundIndex + cleanPrev.length;
        }
      }
    }

    const foundIndex = cleanText.indexOf(cleanSentence, searchStart);
    return foundIndex !== -1 ? foundIndex : 0;
  }

  /**
   * Analyze sentence for manipulation patterns
   */
  private async analyzeSentence(sentence: string): Promise<{
    hasRationale: boolean;
    patterns: Array<{
      type: string;
      confidence: number;
      spans: Array<{ start: number; end: number; text: string }>;
    }>;
    label: string;
    score: number;
  }> {
    const analysis = {
      hasRationale: false,
      patterns: [] as any[],
      label: '',
      score: 0
    };

    // Check for fear framing patterns
    const fearAnalysis = this.analyzeFearFraming(sentence);
    if (fearAnalysis.confidence > 0.3) {
      analysis.hasRationale = true;
      analysis.patterns.push(fearAnalysis);
      analysis.label = 'fear_framing';
      analysis.score = Math.max(analysis.score, fearAnalysis.confidence);
    }

    // Check for loaded language
    const loadedAnalysis = this.analyzeLoadedLanguage(sentence);
    if (loadedAnalysis.confidence > 0.3) {
      analysis.hasRationale = true;
      analysis.patterns.push(loadedAnalysis);
      if (!analysis.label) analysis.label = 'loaded_language';
      analysis.score = Math.max(analysis.score, loadedAnalysis.confidence);
    }

    // Check for emotional appeals
    const emotionalAnalysis = this.analyzeEmotionalAppeals(sentence);
    if (emotionalAnalysis.confidence > 0.3) {
      analysis.hasRationale = true;
      analysis.patterns.push(emotionalAnalysis);
      if (!analysis.label) analysis.label = 'emotional_appeal';
      analysis.score = Math.max(analysis.score, emotionalAnalysis.confidence);
    }

    // Check for logical fallacies
    const fallacyAnalysis = this.analyzeLogicalFallacies(sentence);
    if (fallacyAnalysis.confidence > 0.3) {
      analysis.hasRationale = true;
      analysis.patterns.push(fallacyAnalysis);
      if (!analysis.label) analysis.label = 'logical_fallacy';
      analysis.score = Math.max(analysis.score, fallacyAnalysis.confidence);
    }

    // Check for bias indicators
    const biasAnalysis = this.analyzeBiasIndicators(sentence);
    if (biasAnalysis.confidence > 0.3) {
      analysis.hasRationale = true;
      analysis.patterns.push(biasAnalysis);
      if (!analysis.label) analysis.label = 'bias_indicator';
      analysis.score = Math.max(analysis.score, biasAnalysis.confidence);
    }

    return analysis;
  }

  /**
   * Analyze fear framing patterns
   */
  private analyzeFearFraming(sentence: string): {
    type: string;
    confidence: number;
    spans: Array<{ start: number; end: number; text: string }>;
  } {
    const fearWords = [
      'catastrophic', 'disaster', 'crisis', 'dangerous', 'threat', 'terrifying',
      'devastating', 'alarming', 'shocking', 'horrifying', 'panic', 'chaos'
    ];

    const fearPhrases = [
      'before it\'s too late',
      'time is running out',
      'could be the end',
      'unprecedented threat',
      'grave consequences',
      'imminent danger'
    ];

    const spans: Array<{ start: number; end: number; text: string }> = [];
    let confidence = 0;

    // Check for fear words
    for (const word of fearWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      let match;
      while ((match = regex.exec(sentence)) !== null) {
        spans.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0]
        });
        confidence += 0.2;
      }
    }

    // Check for fear phrases (higher weight)
    for (const phrase of fearPhrases) {
      const index = sentence.toLowerCase().indexOf(phrase.toLowerCase());
      if (index !== -1) {
        spans.push({
          start: index,
          end: index + phrase.length,
          text: phrase
        });
        confidence += 0.4;
      }
    }

    return {
      type: 'fear_framing',
      confidence: Math.min(1, confidence),
      spans
    };
  }

  /**
   * Analyze loaded language patterns
   */
  private analyzeLoadedLanguage(sentence: string): {
    type: string;
    confidence: number;
    spans: Array<{ start: number; end: number; text: string }>;
  } {
    const loadedWords = [
      'regime', 'thugs', 'extremist', 'radical', 'fanatic', 'cult',
      'puppet', 'corrupt', 'crooked', 'sleazy', 'shady', 'evil',
      'hero', 'patriot', 'freedom', 'liberty', 'salvation'
    ];

    const spans: Array<{ start: number; end: number; text: string }> = [];
    let confidence = 0;

    for (const word of loadedWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      let match;
      while ((match = regex.exec(sentence)) !== null) {
        spans.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0]
        });
        confidence += 0.3;
      }
    }

    return {
      type: 'loaded_language',
      confidence: Math.min(1, confidence),
      spans
    };
  }

  /**
   * Analyze emotional appeals
   */
  private analyzeEmotionalAppeals(sentence: string): {
    type: string;
    confidence: number;
    spans: Array<{ start: number; end: number; text: string }>;
  } {
    const emotionalWords = [
      'heartbreaking', 'inspiring', 'outrageous', 'disgusting', 'beautiful',
      'amazing', 'incredible', 'unbelievable', 'shocking', 'stunning'
    ];

    const intensifiers = [
      'extremely', 'incredibly', 'absolutely', 'completely', 'totally',
      'utterly', 'perfectly', 'exceptionally'
    ];

    const spans: Array<{ start: number; end: number; text: string }> = [];
    let confidence = 0;

    // Check for emotional words
    for (const word of emotionalWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      let match;
      while ((match = regex.exec(sentence)) !== null) {
        spans.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0]
        });
        confidence += 0.25;
      }
    }

    // Check for intensifiers
    for (const intensifier of intensifiers) {
      const regex = new RegExp(`\\b${intensifier}\\b`, 'gi');
      let match;
      while ((match = regex.exec(sentence)) !== null) {
        spans.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0]
        });
        confidence += 0.15;
      }
    }

    return {
      type: 'emotional_appeal',
      confidence: Math.min(1, confidence),
      spans
    };
  }

  /**
   * Analyze logical fallacies
   */
  private analyzeLogicalFallacies(sentence: string): {
    type: string;
    confidence: number;
    spans: Array<{ start: number; end: number; text: string }>;
  } {
    const fallacyPatterns = [
      // Ad hominem indicators
      { pattern: /\b(he|she|they) (is|are) (just|clearly|obviously) (a|an) (\w+)/gi, type: 'ad_hominem', weight: 0.6 },

      // False dilemma indicators
      { pattern: /\b(either|only two|just two) (choices|options|ways)/gi, type: 'false_dilemma', weight: 0.7 },

      // Strawman indicators
      { pattern: /\b(so you're saying|what they really want|in other words)/gi, type: 'strawman', weight: 0.5 },

      // Appeal to authority
      { pattern: /\b(experts agree|scientists say|studies show) (that|how)/gi, type: 'appeal_to_authority', weight: 0.4 }
    ];

    const spans: Array<{ start: number; end: number; text: string }> = [];
    let confidence = 0;
    let fallacyType = 'logical_fallacy';

    for (const { pattern, type, weight } of fallacyPatterns) {
      let match;
      pattern.lastIndex = 0; // Reset regex
      while ((match = pattern.exec(sentence)) !== null) {
        spans.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0]
        });
        confidence += weight;
        fallacyType = type;
      }
    }

    return {
      type: fallacyType,
      confidence: Math.min(1, confidence),
      spans
    };
  }

  /**
   * Analyze bias indicators
   */
  private analyzeBiasIndicators(sentence: string): {
    type: string;
    confidence: number;
    spans: Array<{ start: number; end: number; text: string }>;
  } {
    const biasIndicators = [
      // Selection bias
      { pattern: /\b(some|several|many) (people|experts|studies) (say|claim|believe)/gi, type: 'selection_bias', weight: 0.4 },

      // Confirmation bias
      { pattern: /\b(as expected|predictably|obviously|clearly)/gi, type: 'confirmation_bias', weight: 0.3 },

      // False balance
      { pattern: /\b(both sides|fair and balanced|equal time)/gi, type: 'false_balance', weight: 0.5 },

      // Unverifiable claims
      { pattern: /\b(anonymous source|rumor has it|it is said)/gi, type: 'unverifiable_claims', weight: 0.6 }
    ];

    const spans: Array<{ start: number; end: number; text: string }> = [];
    let confidence = 0;
    let biasType = 'bias_indicator';

    for (const { pattern, type, weight } of biasIndicators) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(sentence)) !== null) {
        spans.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0]
        });
        confidence += weight;
        biasType = type;
      }
    }

    return {
      type: biasType,
      confidence: Math.min(1, confidence),
      spans
    };
  }

  /**
   * Extract spans from sentence analysis
   */
  private async extractSpansFromSentence(
    sentence: string,
    sentenceStart: number,
    analysis: any
  ): Promise<RationaleExplanation['rationales']> {
    const rationales: RationaleExplanation['rationales'] = [];

    for (const pattern of analysis.patterns) {
      for (const span of pattern.spans) {
        const evidence = await this.generateEvidence(sentence, span, pattern.type);

        rationales.push({
          text: span.text,
          start: sentenceStart + span.start,
          end: sentenceStart + span.end,
          label: pattern.type,
          score: pattern.confidence,
          evidence
        });
      }
    }

    return rationales;
  }

  /**
   * Generate evidence for a rationale
   */
  private async generateEvidence(
    sentence: string,
    span: any,
    type: string
  ): Promise<Array<{
    type: 'linguistic' | 'semantic' | 'contextual';
    feature: string;
    value: number;
  }>> {
    const evidence: Array<{
      type: 'linguistic' | 'semantic' | 'contextual';
      feature: string;
      value: number;
    }> = [];

    // Linguistic evidence
    evidence.push({
      type: 'linguistic',
      feature: 'word_length',
      value: span.text.length / 20 // Normalized
    });

    evidence.push({
      type: 'linguistic',
      feature: 'capitalization',
      value: (span.text.match(/[A-Z]/g) || []).length / span.text.length
    });

    // Semantic evidence based on type
    switch (type) {
      case 'fear_framing':
        evidence.push({
          type: 'semantic',
          feature: 'threat_semantics',
          value: 0.8
        });
        break;

      case 'loaded_language':
        evidence.push({
          type: 'semantic',
          feature: 'emotional_valence',
          value: 0.7
        });
        break;

      case 'logical_fallacy':
        evidence.push({
          type: 'semantic',
          feature: 'reasoning_pattern',
          value: 0.6
        });
        break;
    }

    // Contextual evidence
    evidence.push({
      type: 'contextual',
      feature: 'sentence_position',
      value: this.calculatePositionImportance(sentence, span)
    });

    evidence.push({
      type: 'contextual',
      feature: 'surrounding_context',
      value: this.calculateContextualRelevance(sentence, span)
    });

    return evidence;
  }

  /**
   * Calculate position importance in sentence
   */
  private calculatePositionImportance(sentence: string, span: any): number {
    const relativePosition = span.start / sentence.length;

    // Beginning and end of sentences are typically more important
    if (relativePosition < 0.2 || relativePosition > 0.8) {
      return 0.8;
    } else {
      return 0.4;
    }
  }

  /**
   * Calculate contextual relevance
   */
  private calculateContextualRelevance(sentence: string, span: any): number {
    // Mock contextual relevance calculation
    const surroundingWords = this.getSurroundingWords(sentence, span, 3);
    const relevanceScore = surroundingWords.length > 0 ? 0.6 : 0.3;

    return relevanceScore;
  }

  /**
   * Get surrounding words for context
   */
  private getSurroundingWords(sentence: string, span: any, windowSize: number): string[] {
    const words = sentence.split(/\s+/);
    const spanWords = span.text.split(/\s+/);

    // Find span position in words
    let spanStartWord = -1;
    for (let i = 0; i <= words.length - spanWords.length; i++) {
      const candidate = words.slice(i, i + spanWords.length).join(' ');
      if (candidate.toLowerCase().includes(span.text.toLowerCase())) {
        spanStartWord = i;
        break;
      }
    }

    if (spanStartWord === -1) return [];

    const start = Math.max(0, spanStartWord - windowSize);
    const end = Math.min(words.length, spanStartWord + spanWords.length + windowSize);

    return words.slice(start, end);
  }

  /**
   * Build reasoning chains from rationales
   */
  private async buildReasoningChains(
    text: string,
    rationales: RationaleExplanation['rationales']
  ): Promise<RationaleExplanation['chains']> {
    const chains: RationaleExplanation['chains'] = [];

    // Group rationales by label
    const rationalesByLabel = this.groupRationalesByLabel(rationales);

    for (const [label, labelRationales] of Object.entries(rationalesByLabel)) {
      if (labelRationales.length > 0) {
        const chain = await this.buildReasoningChain(label, labelRationales, text);
        chains.push(chain);
      }
    }

    // Sort chains by confidence
    chains.sort((a, b) => b.confidence - a.confidence);

    return chains.slice(0, 5); // Top 5 reasoning chains
  }

  /**
   * Group rationales by label
   */
  private groupRationalesByLabel(
    rationales: RationaleExplanation['rationales']
  ): Record<string, RationaleExplanation['rationales']> {
    const grouped: Record<string, RationaleExplanation['rationales']> = {};

    for (const rationale of rationales) {
      if (!grouped[rationale.label]) {
        grouped[rationale.label] = [];
      }
      grouped[rationale.label].push(rationale);
    }

    return grouped;
  }

  /**
   * Build reasoning chain for a specific label
   */
  private async buildReasoningChain(
    label: string,
    rationales: RationaleExplanation['rationales'],
    text: string
  ): Promise<{
    reasoning: string[];
    confidence: number;
    label: string;
  }> {
    const reasoning: string[] = [];

    // Sort rationales by importance
    const sortedRationales = rationales.sort((a, b) => b.score - a.score);

    // Build reasoning steps
    reasoning.push(`Detected ${label.replace(/_/g, ' ')} in the content:`);

    for (const rationale of sortedRationales.slice(0, 3)) { // Top 3 rationales
      const evidenceDesc = this.describeEvidence(rationale.evidence);
      reasoning.push(`"${rationale.text}" - ${evidenceDesc} (confidence: ${(rationale.score * 100).toFixed(0)}%)`);
    }

    // Add contextual reasoning
    const contextualReasoning = this.generateContextualReasoning(label, sortedRationales, text);
    reasoning.push(...contextualReasoning);

    // Calculate overall confidence
    const avgScore = rationales.reduce((sum, r) => sum + r.score, 0) / rationales.length;
    const confidence = Math.min(0.95, avgScore + 0.1); // Slight boost for multiple evidence

    return {
      reasoning,
      confidence,
      label
    };
  }

  /**
   * Describe evidence in human-readable form
   */
  private describeEvidence(evidence: RationaleExplanation['rationales'][0]['evidence']): string {
    const descriptions: string[] = [];

    for (const item of evidence) {
      switch (item.feature) {
        case 'threat_semantics':
          descriptions.push('uses threatening language');
          break;
        case 'emotional_valence':
          descriptions.push('emotionally charged wording');
          break;
        case 'reasoning_pattern':
          descriptions.push('flawed reasoning pattern');
          break;
        case 'sentence_position':
          if (item.value > 0.6) descriptions.push('strategically positioned');
          break;
        case 'word_length':
          if (item.value > 0.5) descriptions.push('emphasized through length');
          break;
        case 'capitalization':
          if (item.value > 0.3) descriptions.push('uses capitalization for emphasis');
          break;
      }
    }

    return descriptions.length > 0 ? descriptions.join(', ') : 'shows manipulation indicators';
  }

  /**
   * Generate contextual reasoning
   */
  private generateContextualReasoning(
    label: string,
    rationales: RationaleExplanation['rationales'],
    text: string
  ): string[] {
    const reasoning: string[] = [];

    switch (label) {
      case 'fear_framing':
        reasoning.push('These fear-inducing terms are designed to create anxiety and urgency');
        if (rationales.length > 2) {
          reasoning.push('The repeated use of fear language amplifies the emotional impact');
        }
        break;

      case 'loaded_language':
        reasoning.push('This emotionally charged language bypasses rational analysis');
        reasoning.push('Such terms carry implicit positive or negative associations');
        break;

      case 'logical_fallacy':
        reasoning.push('This reasoning pattern deflects from the actual argument');
        reasoning.push('Logical fallacies weaken the credibility of the claims');
        break;

      case 'bias_indicator':
        reasoning.push('These patterns suggest selective presentation of information');
        reasoning.push('Bias indicators may lead to incomplete or skewed understanding');
        break;

      default:
        reasoning.push(`This ${label.replace(/_/g, ' ')} pattern can influence reader perception`);
    }

    return reasoning;
  }

  /**
   * Load rationale extraction model
   */
  private async loadRationaleModel(): Promise<void> {
    console.log(`🧠 Loading rationale extraction model...`);

    // Mock model loading
    this.extractorModel = {
      type: 'sequence_labeling',
      architecture: 'bert_based_rationale_extractor',
      loaded: true
    };

    console.log(`✅ Rationale extraction model loaded`);
  }

  /**
   * Get model information
   */
  getModelInfo(): any {
    return {
      modelPath: this.modelPath,
      isLoaded: this.extractorModel !== null,
      capabilities: [
        'fear_framing_detection',
        'loaded_language_analysis',
        'emotional_appeal_identification',
        'logical_fallacy_detection',
        'bias_indicator_analysis',
        'reasoning_chain_generation'
      ]
    };
  }
}