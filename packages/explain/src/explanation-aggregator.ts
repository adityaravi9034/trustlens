/**
 * Explanation Aggregator
 *
 * Combines multiple explanation methods (SHAP, LIME, attention, rationales)
 * into coherent, comprehensive explanations
 */

import {
  ExplanationRequest,
  ExplanationResult,
  AggregatedExplanation,
  ExplanationConfig,
  ExplanationQuality
} from './types';
import { RationaleExtractor } from './rationale-extractor';

export class ExplanationAggregator {
  private config: ExplanationConfig;
  private rationaleExtractor: RationaleExtractor;

  constructor(config: ExplanationConfig) {
    this.config = config;
    this.rationaleExtractor = new RationaleExtractor('packages/model/artifacts/text-v1');
  }

  /**
   * Generate comprehensive explanation using multiple methods
   */
  async generateExplanation(request: ExplanationRequest): Promise<AggregatedExplanation> {
    console.log(`🔍 Generating comprehensive explanation using ${this.config.methods.length} methods`);

    const startTime = Date.now();

    try {
      // Generate explanations using different methods
      const explanations = await this.generateMultipleExplanations(request);

      // Aggregate explanations
      const aggregated = await this.aggregateExplanations(explanations);

      // Evaluate explanation quality if requested
      if (this.config.evaluation.faithfulness || this.config.evaluation.plausibility) {
        await this.evaluateExplanationQuality(aggregated, request);
      }

      console.log(`✅ Explanation generation complete in ${Date.now() - startTime}ms`);

      return aggregated;
    } catch (error) {
      console.error(`Error generating explanation:`, error);
      throw error;
    }
  }

  /**
   * Generate explanations using multiple methods
   */
  private async generateMultipleExplanations(
    request: ExplanationRequest
  ): Promise<ExplanationResult[]> {
    const explanations: ExplanationResult[] = [];

    // Generate explanations for each requested method
    for (const method of this.config.methods) {
      try {
        const explanation = await this.generateSingleExplanation(request, method);
        explanations.push(explanation);
      } catch (error) {
        console.warn(`Failed to generate ${method} explanation:`, error);
      }
    }

    return explanations;
  }

  /**
   * Generate explanation using a single method
   */
  private async generateSingleExplanation(
    request: ExplanationRequest,
    method: string
  ): Promise<ExplanationResult> {
    const startTime = Date.now();

    switch (method) {
      case 'rationale':
        return this.generateRationaleExplanation(request, startTime);

      case 'shap':
        return this.generateSHAPExplanation(request, startTime);

      case 'attention':
        return this.generateAttentionExplanation(request, startTime);

      case 'counterfactual':
        return this.generateCounterfactualExplanation(request, startTime);

      case 'lime':
        return this.generateLIMEExplanation(request, startTime);

      default:
        throw new Error(`Unknown explanation method: ${method}`);
    }
  }

  /**
   * Generate rationale-based explanation
   */
  private async generateRationaleExplanation(
    request: ExplanationRequest,
    startTime: number
  ): Promise<ExplanationResult> {
    const rationale = await this.rationaleExtractor.extractRationales(request);

    // Convert rationales to text explanation format
    const textExplanation = {
      spans: rationale.rationales.map(r => ({
        start: r.start,
        end: r.end,
        text: r.text,
        importance: r.score,
        label: r.label,
        confidence: r.score
      })),
      tokens: this.extractTokensFromRationales(rationale.rationales, request.text),
      sentences: this.extractSentencesFromRationales(rationale.rationales, request.text)
    };

    return {
      method: 'rationale',
      textExplanation,
      rationale,
      metadata: {
        processingTime: Date.now() - startTime,
        modelVersion: 'rationale-v1',
        confidence: this.calculateRationaleConfidence(rationale),
        faithfulness: 0.85,
        plausibility: 0.90
      }
    };
  }

  /**
   * Generate SHAP explanation (mock implementation)
   */
  private async generateSHAPExplanation(
    request: ExplanationRequest,
    startTime: number
  ): Promise<ExplanationResult> {
    console.log(`📊 Generating SHAP explanation...`);

    // Mock SHAP implementation
    const words = request.text.split(/\s+/);
    const tokens = words.map((word, index) => ({
      token: word,
      importance: (Math.random() - 0.5) * 2, // -1 to 1
      position: index
    }));

    // Generate spans from high-importance tokens
    const spans = this.generateSpansFromTokens(tokens, request.text);

    const textExplanation = {
      spans,
      tokens,
      sentences: this.generateSentenceImportances(request.text, tokens)
    };

    return {
      method: 'shap',
      textExplanation,
      metadata: {
        processingTime: Date.now() - startTime,
        modelVersion: 'shap-v1',
        confidence: 0.75,
        faithfulness: 0.80,
        plausibility: 0.65
      }
    };
  }

  /**
   * Generate attention-based explanation (mock implementation)
   */
  private async generateAttentionExplanation(
    request: ExplanationRequest,
    startTime: number
  ): Promise<ExplanationResult> {
    console.log(`👁️  Generating attention explanation...`);

    const words = request.text.split(/\s+/);

    // Mock attention weights
    const tokenAttention = words.map((word, index) => ({
      token: word,
      attention: Math.random(),
      layer: Math.floor(Math.random() * 12), // 0-11 for 12-layer model
      head: Math.floor(Math.random() * 12)   // 0-11 for 12-head attention
    }));

    // Generate sentence-level attention
    const sentences = this.splitIntoSentences(request.text);
    const sentenceAttention = sentences.map((sentence, index) => ({
      sentence,
      attention: Math.random(),
      startToken: index * 10, // Mock calculation
      endToken: (index + 1) * 10
    }));

    const attention = {
      tokenAttention,
      sentenceAttention
    };

    // Convert to text explanation format
    const textExplanation = this.convertAttentionToTextExplanation(attention, request.text);

    return {
      method: 'attention',
      textExplanation,
      attention,
      metadata: {
        processingTime: Date.now() - startTime,
        modelVersion: 'attention-v1',
        confidence: 0.70,
        faithfulness: 0.75,
        plausibility: 0.60
      }
    };
  }

  /**
   * Generate counterfactual explanation (mock implementation)
   */
  private async generateCounterfactualExplanation(
    request: ExplanationRequest,
    startTime: number
  ): Promise<ExplanationResult> {
    console.log(`🔄 Generating counterfactual explanation...`);

    // Mock counterfactual generation
    const counterfactuals = await this.generateCounterfactuals(request.text);

    return {
      method: 'counterfactual',
      counterfactual: counterfactuals,
      metadata: {
        processingTime: Date.now() - startTime,
        modelVersion: 'counterfactual-v1',
        confidence: 0.65,
        faithfulness: 0.70,
        plausibility: 0.85
      }
    };
  }

  /**
   * Generate LIME explanation (mock implementation)
   */
  private async generateLIMEExplanation(
    request: ExplanationRequest,
    startTime: number
  ): Promise<ExplanationResult> {
    console.log(`🟢 Generating LIME explanation...`);

    // Mock LIME implementation - similar to SHAP but with different methodology
    const words = request.text.split(/\s+/);
    const tokens = words.map((word, index) => ({
      token: word,
      importance: Math.random() * 2 - 1, // -1 to 1, but different distribution than SHAP
      position: index
    }));

    const textExplanation = {
      spans: this.generateSpansFromTokens(tokens, request.text),
      tokens,
      sentences: this.generateSentenceImportances(request.text, tokens)
    };

    return {
      method: 'lime',
      textExplanation,
      metadata: {
        processingTime: Date.now() - startTime,
        modelVersion: 'lime-v1',
        confidence: 0.72,
        faithfulness: 0.78,
        plausibility: 0.68
      }
    };
  }

  /**
   * Aggregate multiple explanations into consensus
   */
  private async aggregateExplanations(
    explanations: ExplanationResult[]
  ): Promise<AggregatedExplanation> {
    console.log(`🔗 Aggregating ${explanations.length} explanations...`);

    // Extract top spans from each explanation
    const allSpans = this.extractAllSpans(explanations);

    // Build consensus
    const consensus = await this.buildConsensus(allSpans, explanations);

    // Find disagreements
    const disagreements = this.findDisagreements(explanations);

    // Generate summary
    const summary = this.generateSummary(consensus, explanations);

    return {
      primaryExplanations: explanations,
      consensus,
      disagreements,
      summary
    };
  }

  /**
   * Extract all spans from explanations
   */
  private extractAllSpans(explanations: ExplanationResult[]): Array<{
    text: string;
    start: number;
    end: number;
    importance: number;
    method: string;
    label?: string;
  }> {
    const allSpans: Array<{
      text: string;
      start: number;
      end: number;
      importance: number;
      method: string;
      label?: string;
    }> = [];

    for (const explanation of explanations) {
      if (explanation.textExplanation) {
        for (const span of explanation.textExplanation.spans) {
          allSpans.push({
            text: span.text,
            start: span.start,
            end: span.end,
            importance: span.importance,
            method: explanation.method,
            label: span.label
          });
        }
      }
    }

    return allSpans;
  }

  /**
   * Build consensus from multiple explanations
   */
  private async buildConsensus(
    allSpans: any[],
    explanations: ExplanationResult[]
  ): Promise<AggregatedExplanation['consensus']> {
    // Group overlapping spans
    const spanGroups = this.groupOverlappingSpans(allSpans);

    // Calculate consensus importance and agreement
    const topSpans = spanGroups
      .map(group => {
        const avgImportance = group.reduce((sum, span) => sum + Math.abs(span.importance), 0) / group.length;
        const agreement = group.length / explanations.length; // How many methods agree

        return {
          text: group[0].text,
          start: group[0].start,
          end: group[0].end,
          importance: avgImportance,
          agreement
        };
      })
      .filter(span => span.agreement >= 0.5) // At least 50% agreement
      .sort((a, b) => (b.importance * b.agreement) - (a.importance * a.agreement))
      .slice(0, this.config.visualization.maxSpans);

    // Extract key factors
    const keyFactors = await this.extractKeyFactors(topSpans, explanations);

    // Calculate overall confidence
    const confidence = this.calculateConsensusConfidence(explanations, topSpans);

    return {
      topSpans,
      keyFactors,
      confidence
    };
  }

  /**
   * Group overlapping spans
   */
  private groupOverlappingSpans(spans: any[]): any[][] {
    const groups: any[][] = [];

    for (const span of spans) {
      let addedToGroup = false;

      for (const group of groups) {
        // Check if span overlaps with any span in the group
        if (group.some(groupSpan => this.spansOverlap(span, groupSpan))) {
          group.push(span);
          addedToGroup = true;
          break;
        }
      }

      if (!addedToGroup) {
        groups.push([span]);
      }
    }

    return groups;
  }

  /**
   * Check if two spans overlap
   */
  private spansOverlap(span1: any, span2: any): boolean {
    const threshold = 0.5; // 50% overlap required

    const overlap = Math.max(0, Math.min(span1.end, span2.end) - Math.max(span1.start, span2.start));
    const minLength = Math.min(span1.end - span1.start, span2.end - span2.start);

    return overlap / minLength >= threshold;
  }

  /**
   * Extract key factors from consensus
   */
  private async extractKeyFactors(
    topSpans: any[],
    explanations: ExplanationResult[]
  ): Promise<Array<{
    factor: string;
    importance: number;
    evidence: string[];
  }>> {
    const factors: Array<{
      factor: string;
      importance: number;
      evidence: string[];
    }> = [];

    // Extract factors from rationale explanations
    for (const explanation of explanations) {
      if (explanation.rationale) {
        for (const chain of explanation.rationale.chains) {
          factors.push({
            factor: chain.label.replace(/_/g, ' '),
            importance: chain.confidence,
            evidence: chain.reasoning
          });
        }
      }
    }

    // Extract factors from high-importance spans
    const spanFactors = topSpans
      .filter(span => span.importance > 0.6)
      .map(span => ({
        factor: `High-impact phrase: "${span.text}"`,
        importance: span.importance,
        evidence: [`This phrase shows strong manipulation indicators (${(span.agreement * 100).toFixed(0)}% method agreement)`]
      }));

    factors.push(...spanFactors);

    // Sort by importance and return top factors
    return factors
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5);
  }

  /**
   * Calculate consensus confidence
   */
  private calculateConsensusConfidence(
    explanations: ExplanationResult[],
    topSpans: any[]
  ): number {
    // Base confidence from individual explanations
    const avgConfidence = explanations.reduce((sum, exp) => sum + exp.metadata.confidence, 0) / explanations.length;

    // Boost confidence when methods agree
    const avgAgreement = topSpans.length > 0 ?
      topSpans.reduce((sum, span) => sum + span.agreement, 0) / topSpans.length : 0;

    // Combine confidence and agreement
    return Math.min(0.95, avgConfidence * 0.7 + avgAgreement * 0.3);
  }

  /**
   * Find disagreements between methods
   */
  private findDisagreements(explanations: ExplanationResult[]): AggregatedExplanation['disagreements'] {
    const disagreements: AggregatedExplanation['disagreements'] = [];

    // Find spans that have high importance in one method but low in others
    const allSpans = this.extractAllSpans(explanations);
    const spanGroups = this.groupOverlappingSpans(allSpans);

    for (const group of spanGroups) {
      if (group.length > 1) {
        const importanceScores = group.map(span => span.importance);
        const methods = group.map(span => span.method);

        // Check for significant disagreement (high variance)
        const avgImportance = importanceScores.reduce((sum, score) => sum + score, 0) / importanceScores.length;
        const variance = importanceScores.reduce((sum, score) => sum + Math.pow(score - avgImportance, 2), 0) / importanceScores.length;

        if (variance > 0.25) { // Significant disagreement threshold
          disagreements.push({
            span: group[0].text,
            methods,
            importanceScores
          });
        }
      }
    }

    return disagreements.slice(0, 5); // Top 5 disagreements
  }

  /**
   * Generate explanation summary
   */
  private generateSummary(
    consensus: AggregatedExplanation['consensus'],
    explanations: ExplanationResult[]
  ): AggregatedExplanation['summary'] {
    // Find primary reason (highest confidence factor)
    const primaryReason = consensus.keyFactors.length > 0 ?
      consensus.keyFactors[0].factor : 'Content shows manipulation indicators';

    // Collect supporting evidence
    const supportingEvidence: string[] = [];

    if (consensus.topSpans.length > 0) {
      supportingEvidence.push(`${consensus.topSpans.length} high-impact phrases identified`);

      const highAgreementSpans = consensus.topSpans.filter(span => span.agreement >= 0.75);
      if (highAgreementSpans.length > 0) {
        supportingEvidence.push(`${highAgreementSpans.length} phrases show strong consensus across methods`);
      }
    }

    // Add method-specific evidence
    const methodsUsed = explanations.map(exp => exp.method);
    supportingEvidence.push(`Analysis confirmed by ${methodsUsed.length} independent methods: ${methodsUsed.join(', ')}`);

    // Calculate uncertainty
    const avgConfidence = explanations.reduce((sum, exp) => exp.metadata.confidence, 0) / explanations.length;
    const uncertainty = 1 - avgConfidence;

    return {
      primaryReason,
      supportingEvidence: supportingEvidence.slice(0, 4), // Top 4 pieces of evidence
      uncertainty
    };
  }

  /**
   * Evaluate explanation quality
   */
  private async evaluateExplanationQuality(
    aggregated: AggregatedExplanation,
    request: ExplanationRequest
  ): Promise<void> {
    console.log(`📏 Evaluating explanation quality...`);

    // Mock quality evaluation
    const quality: ExplanationQuality = {
      faithfulness: 0.82,
      plausibility: 0.78,
      stability: 0.75,
      comprehensibility: 0.85,
      actionability: 0.80
    };

    // Add quality metrics to metadata
    for (const explanation of aggregated.primaryExplanations) {
      explanation.metadata.faithfulness = quality.faithfulness;
      explanation.metadata.plausibility = quality.plausibility;
    }
  }

  /**
   * Helper methods for text processing
   */
  private splitIntoSentences(text: string): string[] {
    return text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  }

  private extractTokensFromRationales(rationales: any[], text: string): any[] {
    const words = text.split(/\s+/);
    return words.map((word, index) => {
      const importance = this.getTokenImportanceFromRationales(word, index, rationales);
      return {
        token: word,
        importance,
        position: index
      };
    });
  }

  private extractSentencesFromRationales(rationales: any[], text: string): any[] {
    const sentences = this.splitIntoSentences(text);
    return sentences.map((sentence, index) => {
      const importance = this.getSentenceImportanceFromRationales(sentence, rationales);
      return {
        sentence,
        importance,
        startIndex: index * 50, // Mock calculation
        endIndex: (index + 1) * 50
      };
    });
  }

  private getTokenImportanceFromRationales(word: string, index: number, rationales: any[]): number {
    let importance = 0;
    for (const rationale of rationales) {
      if (rationale.text.includes(word)) {
        importance = Math.max(importance, rationale.score);
      }
    }
    return importance;
  }

  private getSentenceImportanceFromRationales(sentence: string, rationales: any[]): number {
    let importance = 0;
    for (const rationale of rationales) {
      if (sentence.includes(rationale.text)) {
        importance = Math.max(importance, rationale.score);
      }
    }
    return importance;
  }

  private calculateRationaleConfidence(rationale: any): number {
    if (rationale.rationales.length === 0) return 0.3;

    const avgScore = rationale.rationales.reduce((sum: number, r: any) => sum + r.score, 0) / rationale.rationales.length;
    const chainConfidence = rationale.chains.length > 0 ?
      rationale.chains.reduce((sum: number, c: any) => sum + c.confidence, 0) / rationale.chains.length : 0.5;

    return (avgScore + chainConfidence) / 2;
  }

  private generateSpansFromTokens(tokens: any[], text: string): any[] {
    const spans: any[] = [];
    let currentPos = 0;

    for (const token of tokens) {
      if (Math.abs(token.importance) > 0.3) {
        const start = text.indexOf(token.token, currentPos);
        if (start !== -1) {
          spans.push({
            start,
            end: start + token.token.length,
            text: token.token,
            importance: Math.abs(token.importance),
            label: token.importance > 0 ? 'supporting' : 'contradicting',
            confidence: Math.abs(token.importance)
          });
        }
      }
      currentPos += token.token.length + 1;
    }

    return spans.sort((a, b) => b.importance - a.importance).slice(0, 10);
  }

  private generateSentenceImportances(text: string, tokens: any[]): any[] {
    const sentences = this.splitIntoSentences(text);
    return sentences.map((sentence, index) => {
      const sentenceTokens = tokens.filter(token => sentence.includes(token.token));
      const avgImportance = sentenceTokens.length > 0 ?
        sentenceTokens.reduce((sum, token) => sum + Math.abs(token.importance), 0) / sentenceTokens.length : 0;

      return {
        sentence,
        importance: avgImportance,
        startIndex: index * 50,
        endIndex: (index + 1) * 50
      };
    });
  }

  private convertAttentionToTextExplanation(attention: any, text: string): any {
    const spans = attention.tokenAttention
      .filter((token: any) => token.attention > 0.5)
      .map((token: any) => {
        const start = text.indexOf(token.token);
        return {
          start,
          end: start + token.token.length,
          text: token.token,
          importance: token.attention,
          label: 'attention',
          confidence: token.attention
        };
      })
      .sort((a: any, b: any) => b.importance - a.importance)
      .slice(0, 10);

    return {
      spans,
      tokens: attention.tokenAttention,
      sentences: attention.sentenceAttention.map((s: any) => ({
        sentence: s.sentence,
        importance: s.attention,
        startIndex: s.startToken,
        endIndex: s.endToken
      }))
    };
  }

  private async generateCounterfactuals(text: string): Promise<any> {
    // Mock counterfactual generation
    const words = text.split(/\s+/);
    const counterfactuals = [];

    // Generate a few counterfactuals by removing or replacing key words
    for (let i = 0; i < Math.min(3, words.length); i++) {
      const edits = [{
        type: 'delete' as const,
        position: i,
        original: words[i],
        replacement: ''
      }];

      counterfactuals.push({
        text: words.filter((_, index) => index !== i).join(' '),
        edits,
        scoreDelta: { manipulation: -0.3 },
        plausibility: 0.7,
        minimality: 0.8
      });
    }

    return {
      originalText: text,
      counterfactuals,
      keyPhrases: []
    };
  }
}