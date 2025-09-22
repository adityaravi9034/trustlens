/**
 * Weak Supervision System
 *
 * Implements Snorkel-style weak supervision for generating probabilistic labels
 * from multiple labeling functions with conflict resolution.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { CleanDocument, LabelingFunction, LabelResult, WeakLabel } from './types';
import { TaxonomyLabeler } from './labeling';

export interface LabelModelConfig {
  maxIterations: number;
  convergenceThreshold: number;
  learningRate: number;
  regularization: number;
}

export class WeakSupervisionSystem {
  private labeler: TaxonomyLabeler;
  private config: LabelModelConfig;

  constructor(config: Partial<LabelModelConfig> = {}) {
    this.labeler = new TaxonomyLabeler();
    this.config = {
      maxIterations: 100,
      convergenceThreshold: 0.001,
      learningRate: 0.01,
      regularization: 0.01,
      ...config
    };
  }

  /**
   * Apply weak supervision to a directory of clean documents
   */
  async labelDirectory(inputDir: string, outputDir: string): Promise<void> {
    console.log(`🏷️  Starting weak supervision labeling from ${inputDir} to ${outputDir}`);

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Read all clean documents
    const documents = await this.loadDocuments(inputDir);
    console.log(`📚 Loaded ${documents.length} documents for labeling`);

    // Apply labeling functions to all documents
    console.log(`🔧 Applying labeling functions...`);
    const labelMatrix = await this.applyLabelingFunctions(documents);

    // Train label model to resolve conflicts
    console.log(`🧠 Training label model...`);
    const labelModel = await this.trainLabelModel(labelMatrix);

    // Generate final probabilistic labels
    console.log(`📊 Generating probabilistic labels...`);
    const weakLabels = await this.generateWeakLabels(documents, labelMatrix, labelModel);

    // Save results
    await this.saveWeakLabels(weakLabels, outputDir);

    // Generate summary statistics
    const stats = this.generateStatistics(weakLabels, labelMatrix);
    await this.saveStatistics(stats, outputDir);

    console.log(`✅ Weak supervision complete: ${weakLabels.length} documents labeled`);
    console.log(`📈 Coverage: ${(stats.coverage * 100).toFixed(1)}%, Conflicts: ${(stats.conflictRate * 100).toFixed(1)}%`);
  }

  /**
   * Load clean documents from input directory
   */
  private async loadDocuments(inputDir: string): Promise<CleanDocument[]> {
    const documents: CleanDocument[] = [];
    const files = await fs.readdir(inputDir);
    const jsonlFiles = files.filter(f => f.endsWith('_clean.jsonl'));

    for (const file of jsonlFiles) {
      const filePath = path.join(inputDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const document: CleanDocument = JSON.parse(line);
          documents.push(document);
        } catch (error) {
          console.error(`Error parsing document in ${file}:`, error);
        }
      }
    }

    return documents;
  }

  /**
   * Apply all labeling functions to create label matrix
   */
  private async applyLabelingFunctions(documents: CleanDocument[]): Promise<LabelMatrix> {
    const labelMatrix = new LabelMatrix();
    const labelingFunctions = this.getAllLabelingFunctions();

    for (let docIndex = 0; docIndex < documents.length; docIndex++) {
      const document = documents[docIndex];

      for (let lfIndex = 0; lfIndex < labelingFunctions.length; lfIndex++) {
        const lf = labelingFunctions[lfIndex];

        try {
          const results = lf.apply(document);

          for (const result of results) {
            labelMatrix.setVote(docIndex, lfIndex, result.label, result.confidence);
          }
        } catch (error) {
          console.error(`Error applying LF ${lf.name} to document ${docIndex}:`, error);
          // Set abstain vote (no prediction)
          labelMatrix.setAbstain(docIndex, lfIndex);
        }
      }

      if (docIndex % 100 === 0) {
        console.log(`📝 Processed ${docIndex}/${documents.length} documents`);
      }
    }

    return labelMatrix;
  }

  /**
   * Train label model using expectation maximization
   */
  private async trainLabelModel(labelMatrix: LabelMatrix): Promise<LabelModel> {
    const labelModel = new LabelModel(labelMatrix.getLabels(), labelMatrix.getLabelingFunctions());

    console.log(`🎯 Training label model with ${labelMatrix.getDocumentCount()} documents...`);

    let previousLogLikelihood = -Infinity;

    for (let iteration = 0; iteration < this.config.maxIterations; iteration++) {
      // E-step: Estimate true labels given current parameters
      const posteriors = labelModel.estimatePosteriors(labelMatrix);

      // M-step: Update labeling function parameters
      labelModel.updateParameters(labelMatrix, posteriors, this.config.regularization);

      // Check convergence
      const logLikelihood = labelModel.computeLogLikelihood(labelMatrix);
      const improvement = logLikelihood - previousLogLikelihood;

      if (iteration % 10 === 0) {
        console.log(`📈 Iteration ${iteration}: Log-likelihood = ${logLikelihood.toFixed(4)}, Improvement = ${improvement.toFixed(6)}`);
      }

      if (improvement < this.config.convergenceThreshold) {
        console.log(`🎯 Converged after ${iteration} iterations`);
        break;
      }

      previousLogLikelihood = logLikelihood;
    }

    return labelModel;
  }

  /**
   * Generate final weak labels using trained model
   */
  private async generateWeakLabels(
    documents: CleanDocument[],
    labelMatrix: LabelMatrix,
    labelModel: LabelModel
  ): Promise<WeakLabel[]> {
    const weakLabels: WeakLabel[] = [];
    const posteriors = labelModel.estimatePosteriors(labelMatrix);

    for (let docIndex = 0; docIndex < documents.length; docIndex++) {
      const document = documents[docIndex];
      const docPosteriors = posteriors[docIndex];

      // Get labeling function votes for this document
      const lfVotes = labelMatrix.getDocumentVotes(docIndex);
      const activeLFs = lfVotes
        .map((vote, lfIndex) => vote.label !== 'ABSTAIN' ? labelMatrix.getLabelingFunctions()[lfIndex] : null)
        .filter(lf => lf !== null) as string[];

      // Find conflicts
      const conflicts = this.findConflicts(lfVotes, labelMatrix.getLabelingFunctions());

      // Calculate coverage (fraction of LFs that voted)
      const coverage = activeLFs.length / labelMatrix.getLabelingFunctions().length;

      const weakLabel: WeakLabel = {
        documentId: `${document.source}_${document.url}`,
        labels: docPosteriors,
        labelingFunctions: activeLFs,
        coverage,
        conflicts
      };

      weakLabels.push(weakLabel);
    }

    return weakLabels;
  }

  /**
   * Find conflicts between labeling functions
   */
  private findConflicts(
    votes: Array<{ label: string; confidence: number }>,
    lfNames: string[]
  ): Array<{ functions: string[]; label: string; confidence: number }> {
    const conflicts: Array<{ functions: string[]; label: string; confidence: number }> = [];
    const labelGroups = new Map<string, Array<{ lfIndex: number; confidence: number }>>();

    // Group votes by label
    for (let i = 0; i < votes.length; i++) {
      const vote = votes[i];
      if (vote.label !== 'ABSTAIN') {
        if (!labelGroups.has(vote.label)) {
          labelGroups.set(vote.label, []);
        }
        labelGroups.get(vote.label)!.push({ lfIndex: i, confidence: vote.confidence });
      }
    }

    // Find conflicting labels (multiple labels for same document)
    const labels = Array.from(labelGroups.keys());
    if (labels.length > 1) {
      for (const label of labels) {
        const group = labelGroups.get(label)!;
        if (group.length > 0) {
          conflicts.push({
            functions: group.map(g => lfNames[g.lfIndex]),
            label,
            confidence: group.reduce((sum, g) => sum + g.confidence, 0) / group.length
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Get all labeling functions from taxonomy
   */
  private getAllLabelingFunctions(): LabelingFunction[] {
    // This would typically come from the TaxonomyLabeler
    // For now, we'll create a mock set based on our taxonomy
    return [
      {
        name: 'fear_framing',
        description: 'Detects fear-based framing',
        pattern: /fear|dangerous|threat/gi,
        labels: ['fear_framing'],
        confidence: 0.7,
        apply: (doc) => this.labeler.labelDocument(doc)
      },
      // Add other labeling functions here...
    ];
  }

  /**
   * Save weak labels to output directory
   */
  private async saveWeakLabels(weakLabels: WeakLabel[], outputDir: string): Promise<void> {
    const outputPath = path.join(outputDir, 'weak_labels.jsonl');
    const jsonlContent = weakLabels.map(label => JSON.stringify(label)).join('\n');
    await fs.writeFile(outputPath, jsonlContent, 'utf8');
    console.log(`💾 Saved ${weakLabels.length} weak labels to weak_labels.jsonl`);
  }

  /**
   * Generate statistics about the weak supervision process
   */
  private generateStatistics(weakLabels: WeakLabel[], labelMatrix: LabelMatrix): WeakSupervisionStats {
    const totalDocuments = weakLabels.length;
    const totalLFs = labelMatrix.getLabelingFunctions().length;

    // Coverage statistics
    const coverageScores = weakLabels.map(wl => wl.coverage);
    const coverage = coverageScores.reduce((sum, c) => sum + c, 0) / totalDocuments;

    // Conflict statistics
    const conflictCounts = weakLabels.map(wl => wl.conflicts.length);
    const conflictRate = conflictCounts.filter(c => c > 0).length / totalDocuments;

    // Label distribution
    const labelCounts = new Map<string, number>();
    for (const wl of weakLabels) {
      for (const [label, probability] of Object.entries(wl.labels)) {
        if (probability > 0.5) { // Count as positive if probability > 0.5
          labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
        }
      }
    }

    // Labeling function agreement
    const lfAgreement = this.calculateLFAgreement(labelMatrix);

    return {
      totalDocuments,
      totalLabelingFunctions: totalLFs,
      coverage,
      conflictRate,
      labelDistribution: Object.fromEntries(labelCounts),
      labelingFunctionAgreement: lfAgreement
    };
  }

  /**
   * Calculate agreement between labeling functions
   */
  private calculateLFAgreement(labelMatrix: LabelMatrix): Record<string, number> {
    const lfNames = labelMatrix.getLabelingFunctions();
    const agreement: Record<string, number> = {};

    for (let i = 0; i < lfNames.length; i++) {
      for (let j = i + 1; j < lfNames.length; j++) {
        const lf1 = lfNames[i];
        const lf2 = lfNames[j];

        let agreements = 0;
        let comparisons = 0;

        for (let docIndex = 0; docIndex < labelMatrix.getDocumentCount(); docIndex++) {
          const votes = labelMatrix.getDocumentVotes(docIndex);
          const vote1 = votes[i];
          const vote2 = votes[j];

          if (vote1.label !== 'ABSTAIN' && vote2.label !== 'ABSTAIN') {
            comparisons++;
            if (vote1.label === vote2.label) {
              agreements++;
            }
          }
        }

        if (comparisons > 0) {
          agreement[`${lf1}_${lf2}`] = agreements / comparisons;
        }
      }
    }

    return agreement;
  }

  /**
   * Save statistics to output directory
   */
  private async saveStatistics(stats: WeakSupervisionStats, outputDir: string): Promise<void> {
    const statsPath = path.join(outputDir, 'weak_supervision_stats.json');
    await fs.writeFile(statsPath, JSON.stringify(stats, null, 2), 'utf8');
    console.log(`📊 Saved weak supervision statistics to weak_supervision_stats.json`);
  }
}

/**
 * Label matrix to store labeling function votes
 */
class LabelMatrix {
  private votes: Array<Array<{ label: string; confidence: number }>> = [];
  private labels: Set<string> = new Set();
  private labelingFunctions: string[] = [];

  setVote(docIndex: number, lfIndex: number, label: string, confidence: number): void {
    this.ensureSize(docIndex, lfIndex);
    this.votes[docIndex][lfIndex] = { label, confidence };
    this.labels.add(label);
  }

  setAbstain(docIndex: number, lfIndex: number): void {
    this.ensureSize(docIndex, lfIndex);
    this.votes[docIndex][lfIndex] = { label: 'ABSTAIN', confidence: 0 };
  }

  private ensureSize(docIndex: number, lfIndex: number): void {
    // Ensure votes array is large enough
    while (this.votes.length <= docIndex) {
      this.votes.push([]);
    }

    while (this.votes[docIndex].length <= lfIndex) {
      this.votes[docIndex].push({ label: 'ABSTAIN', confidence: 0 });
    }

    // Ensure labeling functions array is large enough
    while (this.labelingFunctions.length <= lfIndex) {
      this.labelingFunctions.push(`LF_${lfIndex}`);
    }
  }

  getDocumentVotes(docIndex: number): Array<{ label: string; confidence: number }> {
    return this.votes[docIndex] || [];
  }

  getDocumentCount(): number {
    return this.votes.length;
  }

  getLabels(): string[] {
    return Array.from(this.labels).filter(l => l !== 'ABSTAIN');
  }

  getLabelingFunctions(): string[] {
    return this.labelingFunctions;
  }
}

/**
 * Label model for weak supervision
 */
class LabelModel {
  private labels: string[];
  private labelingFunctions: string[];
  private accuracies: Map<string, number> = new Map();
  private classPriors: Map<string, number> = new Map();

  constructor(labels: string[], labelingFunctions: string[]) {
    this.labels = labels;
    this.labelingFunctions = labelingFunctions;

    // Initialize with uniform priors
    for (const label of labels) {
      this.classPriors.set(label, 1.0 / labels.length);
    }

    // Initialize with moderate accuracy
    for (const lf of labelingFunctions) {
      this.accuracies.set(lf, 0.7);
    }
  }

  estimatePosteriors(labelMatrix: LabelMatrix): Array<Record<string, number>> {
    const posteriors: Array<Record<string, number>> = [];

    for (let docIndex = 0; docIndex < labelMatrix.getDocumentCount(); docIndex++) {
      const votes = labelMatrix.getDocumentVotes(docIndex);
      const docPosteriors: Record<string, number> = {};

      // Initialize with class priors
      for (const label of this.labels) {
        docPosteriors[label] = this.classPriors.get(label) || 0;
      }

      // Update based on labeling function votes
      let totalWeight = 0;

      for (let lfIndex = 0; lfIndex < votes.length; lfIndex++) {
        const vote = votes[lfIndex];
        if (vote.label !== 'ABSTAIN') {
          const lfName = this.labelingFunctions[lfIndex];
          const accuracy = this.accuracies.get(lfName) || 0.5;
          const weight = vote.confidence * accuracy;

          if (this.labels.includes(vote.label)) {
            docPosteriors[vote.label] += weight;
            totalWeight += weight;
          }
        }
      }

      // Normalize
      if (totalWeight > 0) {
        for (const label of this.labels) {
          docPosteriors[label] /= totalWeight;
        }
      }

      posteriors.push(docPosteriors);
    }

    return posteriors;
  }

  updateParameters(
    labelMatrix: LabelMatrix,
    posteriors: Array<Record<string, number>>,
    regularization: number
  ): void {
    // Update class priors
    for (const label of this.labels) {
      let priorSum = 0;
      for (const posterior of posteriors) {
        priorSum += posterior[label] || 0;
      }
      this.classPriors.set(label, priorSum / posteriors.length);
    }

    // Update labeling function accuracies
    for (let lfIndex = 0; lfIndex < this.labelingFunctions.length; lfIndex++) {
      const lfName = this.labelingFunctions[lfIndex];
      let correct = 0;
      let total = 0;

      for (let docIndex = 0; docIndex < labelMatrix.getDocumentCount(); docIndex++) {
        const votes = labelMatrix.getDocumentVotes(docIndex);
        const vote = votes[lfIndex];

        if (vote.label !== 'ABSTAIN' && this.labels.includes(vote.label)) {
          const posterior = posteriors[docIndex][vote.label] || 0;
          correct += posterior * vote.confidence;
          total += vote.confidence;
        }
      }

      if (total > 0) {
        // Apply regularization to prevent overfitting
        const accuracy = (correct + regularization) / (total + 2 * regularization);
        this.accuracies.set(lfName, Math.max(0.1, Math.min(0.9, accuracy)));
      }
    }
  }

  computeLogLikelihood(labelMatrix: LabelMatrix): number {
    const posteriors = this.estimatePosteriors(labelMatrix);
    let logLikelihood = 0;

    for (let docIndex = 0; docIndex < posteriors.length; docIndex++) {
      const docPosterior = posteriors[docIndex];
      let docLikelihood = 0;

      for (const [label, probability] of Object.entries(docPosterior)) {
        if (probability > 0) {
          docLikelihood += probability * Math.log(probability);
        }
      }

      logLikelihood += docLikelihood;
    }

    return logLikelihood;
  }
}

/**
 * Statistics interface for weak supervision results
 */
interface WeakSupervisionStats {
  totalDocuments: number;
  totalLabelingFunctions: number;
  coverage: number;
  conflictRate: number;
  labelDistribution: Record<string, number>;
  labelingFunctionAgreement: Record<string, number>;
}