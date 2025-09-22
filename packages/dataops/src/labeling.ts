/**
 * Manipulation Detection Labeling Functions
 *
 * Rule-based and pattern-based labeling functions for detecting
 * various forms of manipulation, bias, and deceptive framing.
 */

import { CleanDocument, LabelingFunction, LabelResult, ManipulationTaxonomy } from './types';

export class TaxonomyLabeler {
  private taxonomy: ManipulationTaxonomy;

  constructor() {
    this.taxonomy = this.createManipulationTaxonomy();
  }

  /**
   * Apply all labeling functions to a document
   */
  async labelDocument(document: CleanDocument): Promise<LabelResult[]> {
    const results: LabelResult[] = [];

    // Apply all labeling functions
    const allFunctions = this.getAllLabelingFunctions();

    for (const lf of allFunctions) {
      try {
        const labelResults = lf.apply(document);
        results.push(...labelResults);
      } catch (error) {
        console.error(`Error applying labeling function ${lf.name}:`, error);
      }
    }

    return results;
  }

  /**
   * Get all labeling functions from taxonomy
   */
  private getAllLabelingFunctions(): LabelingFunction[] {
    const functions: LabelingFunction[] = [];

    // Emotional framing
    functions.push(
      this.taxonomy.emotionalFraming.fear,
      this.taxonomy.emotionalFraming.outrage,
      this.taxonomy.emotionalFraming.sentimentAmplification
    );

    // Rhetorical devices
    functions.push(
      this.taxonomy.rhetoricalDevices.adHominem,
      this.taxonomy.rhetoricalDevices.strawman,
      this.taxonomy.rhetoricalDevices.falseDilemma,
      this.taxonomy.rhetoricalDevices.cherryPicking,
      this.taxonomy.rhetoricalDevices.loadedLanguage,
      this.taxonomy.rhetoricalDevices.euphemism
    );

    // Bias types
    functions.push(
      this.taxonomy.biasTypes.selectionBias,
      this.taxonomy.biasTypes.confirmationBias,
      this.taxonomy.biasTypes.falseBalance,
      this.taxonomy.biasTypes.sourceImbalance
    );

    // Misinformation risk
    functions.push(
      this.taxonomy.misinformationRisk.unverifiableClaims,
      this.taxonomy.misinformationRisk.missingCitations,
      this.taxonomy.misinformationRisk.rumorScore,
      this.taxonomy.misinformationRisk.novelty
    );

    return functions;
  }

  /**
   * Create the manipulation taxonomy with labeling functions
   */
  private createManipulationTaxonomy(): ManipulationTaxonomy {
    return {
      emotionalFraming: {
        fear: this.createFearFramingLF(),
        outrage: this.createOutrageLF(),
        sentimentAmplification: this.createSentimentAmplificationLF()
      },
      rhetoricalDevices: {
        adHominem: this.createAdHominemLF(),
        strawman: this.createStrawmanLF(),
        falseDilemma: this.createFalseDilemmaLF(),
        cherryPicking: this.createCherryPickingLF(),
        loadedLanguage: this.createLoadedLanguageLF(),
        euphemism: this.createEuphemismLF()
      },
      biasTypes: {
        selectionBias: this.createSelectionBiasLF(),
        confirmationBias: this.createConfirmationBiasLF(),
        falseBalance: this.createFalseBalanceLF(),
        sourceImbalance: this.createSourceImbalanceLF()
      },
      misinformationRisk: {
        unverifiableClaims: this.createUnverifiableClaimsLF(),
        missingCitations: this.createMissingCitationsLF(),
        rumorScore: this.createRumorScoreLF(),
        novelty: this.createNoveltyLF()
      }
    };
  }

  // EMOTIONAL FRAMING LABELING FUNCTIONS

  private createFearFramingLF(): LabelingFunction {
    const fearWords = [
      'dangerous', 'threat', 'crisis', 'disaster', 'catastrophe', 'alarming',
      'terrifying', 'horrifying', 'devastating', 'shocking', 'panic', 'fear',
      'scared', 'afraid', 'worried', 'concerned', 'anxious', 'nervous'
    ];

    const fearPhrases = [
      'you should be worried',
      'this could be the end',
      'we\'re in danger',
      'time is running out',
      'before it\'s too late',
      'unprecedented threat',
      'looming crisis',
      'grave consequences'
    ];

    return {
      name: 'fear_framing',
      description: 'Detects fear-based emotional framing',
      pattern: new RegExp(fearWords.join('|'), 'gi'),
      labels: ['fear_framing'],
      confidence: 0.7,
      apply: (document: CleanDocument): LabelResult[] => {
        const results: LabelResult[] = [];
        const text = document.text.toLowerCase();

        // Check for fear words
        let fearScore = 0;
        const foundSpans: Array<{ start: number; end: number; text: string }> = [];

        for (const word of fearWords) {
          const regex = new RegExp(`\\b${word}\\b`, 'gi');
          let match;
          while ((match = regex.exec(document.text)) !== null) {
            fearScore += 1;
            foundSpans.push({
              start: match.index,
              end: match.index + match[0].length,
              text: match[0]
            });
          }
        }

        // Check for fear phrases (higher weight)
        for (const phrase of fearPhrases) {
          if (text.includes(phrase.toLowerCase())) {
            fearScore += 3;
            const index = document.text.toLowerCase().indexOf(phrase.toLowerCase());
            if (index !== -1) {
              foundSpans.push({
                start: index,
                end: index + phrase.length,
                text: document.text.substr(index, phrase.length)
              });
            }
          }
        }

        // Calculate confidence based on frequency
        const wordCount = document.wordCount;
        const fearRatio = fearScore / Math.max(wordCount, 1);

        if (fearRatio > 0.01) { // At least 1% fear words
          results.push({
            label: 'fear_framing',
            confidence: Math.min(0.95, 0.3 + (fearRatio * 10)),
            spans: foundSpans.slice(0, 10), // Limit to top 10 spans
            rationale: `Document contains ${fearScore} fear-related words/phrases (${(fearRatio * 100).toFixed(1)}% of content)`
          });
        }

        return results;
      }
    };
  }

  private createOutrageLF(): LabelingFunction {
    const outrageWords = [
      'outrageous', 'disgusting', 'appalling', 'shocking', 'unbelievable',
      'ridiculous', 'insane', 'crazy', 'absurd', 'outrage', 'furious',
      'angry', 'enraged', 'livid', 'infuriating', 'maddening'
    ];

    return {
      name: 'outrage_framing',
      description: 'Detects outrage-inducing language',
      pattern: new RegExp(outrageWords.join('|'), 'gi'),
      labels: ['outrage_framing'],
      confidence: 0.75,
      apply: (document: CleanDocument): LabelResult[] => {
        const results: LabelResult[] = [];
        let outrageScore = 0;
        const foundSpans: Array<{ start: number; end: number; text: string }> = [];

        for (const word of outrageWords) {
          const regex = new RegExp(`\\b${word}\\b`, 'gi');
          let match;
          while ((match = regex.exec(document.text)) !== null) {
            outrageScore += 1;
            foundSpans.push({
              start: match.index,
              end: match.index + match[0].length,
              text: match[0]
            });
          }
        }

        const outrageRatio = outrageScore / Math.max(document.wordCount, 1);

        if (outrageRatio > 0.005) {
          results.push({
            label: 'outrage_framing',
            confidence: Math.min(0.9, 0.4 + (outrageRatio * 15)),
            spans: foundSpans,
            rationale: `Document contains ${outrageScore} outrage-inducing words`
          });
        }

        return results;
      }
    };
  }

  private createSentimentAmplificationLF(): LabelingFunction {
    const amplifiers = [
      'extremely', 'incredibly', 'absolutely', 'completely', 'totally',
      'utterly', 'perfectly', 'entirely', 'thoroughly', 'exceptionally'
    ];

    return {
      name: 'sentiment_amplification',
      description: 'Detects excessive use of sentiment amplifiers',
      pattern: new RegExp(amplifiers.join('|'), 'gi'),
      labels: ['sentiment_amplification'],
      confidence: 0.6,
      apply: (document: CleanDocument): LabelResult[] => {
        const results: LabelResult[] = [];
        let amplifierCount = 0;
        const foundSpans: Array<{ start: number; end: number; text: string }> = [];

        for (const amplifier of amplifiers) {
          const regex = new RegExp(`\\b${amplifier}\\b`, 'gi');
          let match;
          while ((match = regex.exec(document.text)) !== null) {
            amplifierCount += 1;
            foundSpans.push({
              start: match.index,
              end: match.index + match[0].length,
              text: match[0]
            });
          }
        }

        const amplifierRatio = amplifierCount / Math.max(document.wordCount, 1);

        if (amplifierRatio > 0.02) { // More than 2% amplifiers
          results.push({
            label: 'sentiment_amplification',
            confidence: Math.min(0.85, 0.3 + (amplifierRatio * 8)),
            spans: foundSpans,
            rationale: `Excessive use of sentiment amplifiers (${amplifierCount} instances)`
          });
        }

        return results;
      }
    };
  }

  // RHETORICAL DEVICES LABELING FUNCTIONS

  private createAdHominemLF(): LabelingFunction {
    const adHominemPatterns = [
      /\b(he|she|they) (is|are) (just|clearly|obviously) (a|an) (\w+)/gi,
      /\b(typical|classic) (\w+) (behavior|response|thinking)/gi,
      /\b(no wonder|not surprising) (coming from|given)/gi,
      /\b(what do you expect from|typical of) (\w+)/gi
    ];

    return {
      name: 'ad_hominem',
      description: 'Detects ad hominem attacks',
      pattern: /personal attack/gi,
      labels: ['ad_hominem'],
      confidence: 0.8,
      apply: (document: CleanDocument): LabelResult[] => {
        const results: LabelResult[] = [];
        const foundSpans: Array<{ start: number; end: number; text: string }> = [];
        let attackCount = 0;

        for (const pattern of adHominemPatterns) {
          let match;
          pattern.lastIndex = 0; // Reset regex
          while ((match = pattern.exec(document.text)) !== null) {
            attackCount += 1;
            foundSpans.push({
              start: match.index,
              end: match.index + match[0].length,
              text: match[0]
            });
          }
        }

        if (attackCount > 0) {
          results.push({
            label: 'ad_hominem',
            confidence: Math.min(0.9, 0.5 + (attackCount * 0.2)),
            spans: foundSpans,
            rationale: `Detected ${attackCount} potential ad hominem attack patterns`
          });
        }

        return results;
      }
    };
  }

  private createStrawmanLF(): LabelingFunction {
    const strawmanPhrases = [
      'what they really want',
      'what they\'re actually saying',
      'in other words',
      'so you\'re saying',
      'if we follow their logic',
      'the logical conclusion',
      'taken to its extreme'
    ];

    return {
      name: 'strawman',
      description: 'Detects strawman arguments',
      pattern: /strawman/gi,
      labels: ['strawman'],
      confidence: 0.7,
      apply: (document: CleanDocument): LabelResult[] => {
        const results: LabelResult[] = [];
        const text = document.text.toLowerCase();
        const foundSpans: Array<{ start: number; end: number; text: string }> = [];
        let strawmanScore = 0;

        for (const phrase of strawmanPhrases) {
          if (text.includes(phrase.toLowerCase())) {
            strawmanScore += 1;
            const index = document.text.toLowerCase().indexOf(phrase.toLowerCase());
            if (index !== -1) {
              foundSpans.push({
                start: index,
                end: index + phrase.length,
                text: document.text.substr(index, phrase.length)
              });
            }
          }
        }

        if (strawmanScore > 0) {
          results.push({
            label: 'strawman',
            confidence: Math.min(0.85, 0.4 + (strawmanScore * 0.15)),
            spans: foundSpans,
            rationale: `Found ${strawmanScore} potential strawman argument indicators`
          });
        }

        return results;
      }
    };
  }

  private createFalseDilemmaLF(): LabelingFunction {
    const falseDilemmaPatterns = [
      /\b(either|only two|just two) (choices|options|ways|possibilities)/gi,
      /\b(you must choose|have to pick|forced to decide)/gi,
      /\b(there is no|there's no) (middle ground|other option|alternative)/gi,
      /\b(if not (\w+), then (\w+))/gi
    ];

    return {
      name: 'false_dilemma',
      description: 'Detects false dilemma fallacies',
      pattern: /false.{0,10}dilemma/gi,
      labels: ['false_dilemma'],
      confidence: 0.75,
      apply: (document: CleanDocument): LabelResult[] => {
        const results: LabelResult[] = [];
        const foundSpans: Array<{ start: number; end: number; text: string }> = [];
        let dilemmaCount = 0;

        for (const pattern of falseDilemmaPatterns) {
          let match;
          pattern.lastIndex = 0;
          while ((match = pattern.exec(document.text)) !== null) {
            dilemmaCount += 1;
            foundSpans.push({
              start: match.index,
              end: match.index + match[0].length,
              text: match[0]
            });
          }
        }

        if (dilemmaCount > 0) {
          results.push({
            label: 'false_dilemma',
            confidence: Math.min(0.8, 0.4 + (dilemmaCount * 0.2)),
            spans: foundSpans,
            rationale: `Detected ${dilemmaCount} false dilemma patterns`
          });
        }

        return results;
      }
    };
  }

  private createCherryPickingLF(): LabelingFunction {
    const cherryPickingIndicators = [
      /\b(one study shows|a single study|according to one)/gi,
      /\b(handpicked|carefully selected|chosen examples)/gi,
      /\b(ignore|overlooking|dismissing) (other|most|majority)/gi,
      /\b(convenient|selective) (evidence|data|facts)/gi
    ];

    return {
      name: 'cherry_picking',
      description: 'Detects cherry-picking of evidence',
      pattern: /cherry.{0,10}pick/gi,
      labels: ['cherry_picking'],
      confidence: 0.7,
      apply: (document: CleanDocument): LabelResult[] => {
        const results: LabelResult[] = [];
        const foundSpans: Array<{ start: number; end: number; text: string }> = [];
        let cherryCount = 0;

        for (const pattern of cherryPickingIndicators) {
          let match;
          pattern.lastIndex = 0;
          while ((match = pattern.exec(document.text)) !== null) {
            cherryCount += 1;
            foundSpans.push({
              start: match.index,
              end: match.index + match[0].length,
              text: match[0]
            });
          }
        }

        // Also check for single source citations without balance
        const citationPattern = /according to (\w+)/gi;
        const citations = [...document.text.matchAll(citationPattern)];
        if (citations.length === 1 && document.wordCount > 500) {
          cherryCount += 1;
        }

        if (cherryCount > 0) {
          results.push({
            label: 'cherry_picking',
            confidence: Math.min(0.8, 0.3 + (cherryCount * 0.2)),
            spans: foundSpans,
            rationale: `Potential cherry-picking detected: ${cherryCount} indicators`
          });
        }

        return results;
      }
    };
  }

  private createLoadedLanguageLF(): LabelingFunction {
    const loadedWords = [
      'regime', 'thugs', 'extremist', 'radical', 'fanatic', 'zealot',
      'propaganda', 'brainwashed', 'cult', 'indoctrinated', 'puppet',
      'corrupt', 'crooked', 'sleazy', 'shady', 'sketchy'
    ];

    return {
      name: 'loaded_language',
      description: 'Detects emotionally loaded language',
      pattern: new RegExp(loadedWords.join('|'), 'gi'),
      labels: ['loaded_language'],
      confidence: 0.8,
      apply: (document: CleanDocument): LabelResult[] => {
        const results: LabelResult[] = [];
        let loadedScore = 0;
        const foundSpans: Array<{ start: number; end: number; text: string }> = [];

        for (const word of loadedWords) {
          const regex = new RegExp(`\\b${word}\\b`, 'gi');
          let match;
          while ((match = regex.exec(document.text)) !== null) {
            loadedScore += 1;
            foundSpans.push({
              start: match.index,
              end: match.index + match[0].length,
              text: match[0]
            });
          }
        }

        const loadedRatio = loadedScore / Math.max(document.wordCount, 1);

        if (loadedRatio > 0.003) { // More than 0.3% loaded words
          results.push({
            label: 'loaded_language',
            confidence: Math.min(0.9, 0.4 + (loadedRatio * 20)),
            spans: foundSpans,
            rationale: `Document contains ${loadedScore} emotionally loaded words`
          });
        }

        return results;
      }
    };
  }

  private createEuphemismLF(): LabelingFunction {
    const euphemisms = [
      'enhanced interrogation', 'collateral damage', 'friendly fire',
      'ethnic cleansing', 'downsizing', 'rightsizing', 'revenue enhancement',
      'alternative facts', 'misremembering', 'economical with the truth'
    ];

    return {
      name: 'euphemism',
      description: 'Detects euphemistic language',
      pattern: new RegExp(euphemisms.join('|'), 'gi'),
      labels: ['euphemism'],
      confidence: 0.85,
      apply: (document: CleanDocument): LabelResult[] => {
        const results: LabelResult[] = [];
        const text = document.text.toLowerCase();
        const foundSpans: Array<{ start: number; end: number; text: string }> = [];
        let euphemismCount = 0;

        for (const euphemism of euphemisms) {
          if (text.includes(euphemism.toLowerCase())) {
            euphemismCount += 1;
            const index = document.text.toLowerCase().indexOf(euphemism.toLowerCase());
            if (index !== -1) {
              foundSpans.push({
                start: index,
                end: index + euphemism.length,
                text: document.text.substr(index, euphemism.length)
              });
            }
          }
        }

        if (euphemismCount > 0) {
          results.push({
            label: 'euphemism',
            confidence: Math.min(0.95, 0.6 + (euphemismCount * 0.2)),
            spans: foundSpans,
            rationale: `Found ${euphemismCount} euphemistic expressions`
          });
        }

        return results;
      }
    };
  }

  // BIAS TYPES LABELING FUNCTIONS

  private createSelectionBiasLF(): LabelingFunction {
    return {
      name: 'selection_bias',
      description: 'Detects potential selection bias in presented information',
      pattern: /bias/gi,
      labels: ['selection_bias'],
      confidence: 0.6,
      apply: (document: CleanDocument): LabelResult[] => {
        const results: LabelResult[] = [];

        // Look for indicators of cherry-picked examples or non-representative samples
        const biasIndicators = [
          /\b(some|several|many) (people|experts|studies) (say|claim|believe)/gi,
          /\b(hand-picked|carefully chosen|selected) (examples|cases|instances)/gi,
          /\b(only|just) (showing|presenting|mentioning)/gi
        ];

        const foundSpans: Array<{ start: number; end: number; text: string }> = [];
        let biasScore = 0;

        for (const pattern of biasIndicators) {
          let match;
          pattern.lastIndex = 0;
          while ((match = pattern.exec(document.text)) !== null) {
            biasScore += 1;
            foundSpans.push({
              start: match.index,
              end: match.index + match[0].length,
              text: match[0]
            });
          }
        }

        if (biasScore > 0) {
          results.push({
            label: 'selection_bias',
            confidence: Math.min(0.7, 0.3 + (biasScore * 0.15)),
            spans: foundSpans,
            rationale: `Potential selection bias indicators: ${biasScore} instances`
          });
        }

        return results;
      }
    };
  }

  private createConfirmationBiasLF(): LabelingFunction {
    const confirmationIndicators = [
      /\b(proves|confirms|validates) (what we|our) (always|already) (knew|believed|suspected)/gi,
      /\b(as expected|predictably|unsurprisingly)/gi,
      /\b(ignoring|dismissing|overlooking) (evidence|facts|data) (that|which)/gi
    ];

    return {
      name: 'confirmation_bias',
      description: 'Detects confirmation bias patterns',
      pattern: /confirmation/gi,
      labels: ['confirmation_bias'],
      confidence: 0.65,
      apply: (document: CleanDocument): LabelResult[] => {
        const results: LabelResult[] = [];
        const foundSpans: Array<{ start: number; end: number; text: string }> = [];
        let confirmationScore = 0;

        for (const pattern of confirmationIndicators) {
          let match;
          pattern.lastIndex = 0;
          while ((match = pattern.exec(document.text)) !== null) {
            confirmationScore += 1;
            foundSpans.push({
              start: match.index,
              end: match.index + match[0].length,
              text: match[0]
            });
          }
        }

        if (confirmationScore > 0) {
          results.push({
            label: 'confirmation_bias',
            confidence: Math.min(0.8, 0.4 + (confirmationScore * 0.2)),
            spans: foundSpans,
            rationale: `Confirmation bias patterns detected: ${confirmationScore} instances`
          });
        }

        return results;
      }
    };
  }

  private createFalseBalanceLF(): LabelingFunction {
    const falseBalancePatterns = [
      /\b(both sides|equal time|balanced view) (are|have|deserve)/gi,
      /\b(on the other hand|however|but) (some|others|critics) (say|claim|argue)/gi,
      /\b(fair and balanced|equal representation)/gi
    ];

    return {
      name: 'false_balance',
      description: 'Detects false balance in reporting',
      pattern: /false.{0,10}balance/gi,
      labels: ['false_balance'],
      confidence: 0.7,
      apply: (document: CleanDocument): LabelResult[] => {
        const results: LabelResult[] = [];
        const foundSpans: Array<{ start: number; end: number; text: string }> = [];
        let balanceScore = 0;

        for (const pattern of falseBalancePatterns) {
          let match;
          pattern.lastIndex = 0;
          while ((match = pattern.exec(document.text)) !== null) {
            balanceScore += 1;
            foundSpans.push({
              start: match.index,
              end: match.index + match[0].length,
              text: match[0]
            });
          }
        }

        if (balanceScore > 0) {
          results.push({
            label: 'false_balance',
            confidence: Math.min(0.75, 0.3 + (balanceScore * 0.2)),
            spans: foundSpans,
            rationale: `Potential false balance detected: ${balanceScore} indicators`
          });
        }

        return results;
      }
    };
  }

  private createSourceImbalanceLF(): LabelingFunction {
    return {
      name: 'source_imbalance',
      description: 'Detects imbalanced source representation',
      pattern: /source/gi,
      labels: ['source_imbalance'],
      confidence: 0.6,
      apply: (document: CleanDocument): LabelResult[] => {
        const results: LabelResult[] = [];

        // Count different types of source attributions
        const sourcePatterns = [
          /according to (\w+)/gi,
          /(\w+) (said|says|claims|argues|believes)/gi,
          /(source|sources): (\w+)/gi
        ];

        const sources = new Set<string>();
        const foundSpans: Array<{ start: number; end: number; text: string }> = [];

        for (const pattern of sourcePatterns) {
          let match;
          pattern.lastIndex = 0;
          while ((match = pattern.exec(document.text)) !== null) {
            const sourceName = match[1] || match[2];
            if (sourceName) {
              sources.add(sourceName.toLowerCase());
              foundSpans.push({
                start: match.index,
                end: match.index + match[0].length,
                text: match[0]
              });
            }
          }
        }

        // Check for imbalance (very few sources for long content)
        if (document.wordCount > 800 && sources.size < 2) {
          results.push({
            label: 'source_imbalance',
            confidence: 0.6,
            spans: foundSpans.slice(0, 5),
            rationale: `Only ${sources.size} unique sources found in ${document.wordCount} word article`
          });
        }

        return results;
      }
    };
  }

  // MISINFORMATION RISK LABELING FUNCTIONS

  private createUnverifiableClaimsLF(): LabelingFunction {
    const unverifiableIndicators = [
      /\b(some say|many believe|it is said|rumor has it)/gi,
      /\b(anonymous source|unnamed official|insider)/gi,
      /\b(impossible to verify|cannot be confirmed)/gi,
      /\b(allegedly|reportedly|supposedly)/gi
    ];

    return {
      name: 'unverifiable_claims',
      description: 'Detects unverifiable claims',
      pattern: /unverifiable/gi,
      labels: ['unverifiable_claims'],
      confidence: 0.7,
      apply: (document: CleanDocument): LabelResult[] => {
        const results: LabelResult[] = [];
        const foundSpans: Array<{ start: number; end: number; text: string }> = [];
        let unverifiableScore = 0;

        for (const pattern of unverifiableIndicators) {
          let match;
          pattern.lastIndex = 0;
          while ((match = pattern.exec(document.text)) !== null) {
            unverifiableScore += 1;
            foundSpans.push({
              start: match.index,
              end: match.index + match[0].length,
              text: match[0]
            });
          }
        }

        if (unverifiableScore > 0) {
          results.push({
            label: 'unverifiable_claims',
            confidence: Math.min(0.85, 0.4 + (unverifiableScore * 0.15)),
            spans: foundSpans,
            rationale: `Found ${unverifiableScore} unverifiable claim indicators`
          });
        }

        return results;
      }
    };
  }

  private createMissingCitationsLF(): LabelingFunction {
    return {
      name: 'missing_citations',
      description: 'Detects lack of proper citations',
      pattern: /citation/gi,
      labels: ['missing_citations'],
      confidence: 0.6,
      apply: (document: CleanDocument): LabelResult[] => {
        const results: LabelResult[] = [];

        // Count claims that should have citations
        const claimIndicators = [
          /\b(study shows|research indicates|data suggests)/gi,
          /\b(statistics show|numbers indicate|research proves)/gi,
          /\b(according to|based on|findings)/gi
        ];

        let claimCount = 0;
        for (const pattern of claimIndicators) {
          const matches = document.text.match(pattern);
          if (matches) claimCount += matches.length;
        }

        // Count actual citations
        const citationPatterns = [
          /\[[0-9]+\]/g, // [1], [2], etc.
          /\([0-9]+\)/g, // (1), (2), etc.
          /\bhttps?:\/\/[^\s]+/g, // URLs
          /\b(doi:|DOI:)/gi // DOI references
        ];

        let citationCount = 0;
        for (const pattern of citationPatterns) {
          const matches = document.text.match(pattern);
          if (matches) citationCount += matches.length;
        }

        // Check if there's a significant imbalance
        if (claimCount > 3 && citationCount === 0) {
          results.push({
            label: 'missing_citations',
            confidence: 0.7,
            spans: [],
            rationale: `${claimCount} claims found but no citations provided`
          });
        } else if (claimCount > citationCount * 3) {
          results.push({
            label: 'missing_citations',
            confidence: 0.5,
            spans: [],
            rationale: `Citation imbalance: ${claimCount} claims vs ${citationCount} citations`
          });
        }

        return results;
      }
    };
  }

  private createRumorScoreLF(): LabelingFunction {
    const rumorIndicators = [
      /\b(rumor|rumours?|gossip|hearsay)/gi,
      /\b(word on the street|buzz|chatter)/gi,
      /\b(unconfirmed|speculation|alleged)/gi,
      /\b(may have|might have|could have) (happened|occurred)/gi
    ];

    return {
      name: 'rumor_score',
      description: 'Detects rumor-based content',
      pattern: /rumor/gi,
      labels: ['rumor_score'],
      confidence: 0.75,
      apply: (document: CleanDocument): LabelResult[] => {
        const results: LabelResult[] = [];
        const foundSpans: Array<{ start: number; end: number; text: string }> = [];
        let rumorScore = 0;

        for (const pattern of rumorIndicators) {
          let match;
          pattern.lastIndex = 0;
          while ((match = pattern.exec(document.text)) !== null) {
            rumorScore += 1;
            foundSpans.push({
              start: match.index,
              end: match.index + match[0].length,
              text: match[0]
            });
          }
        }

        const rumorRatio = rumorScore / Math.max(document.wordCount, 1);

        if (rumorRatio > 0.002) { // More than 0.2% rumor indicators
          results.push({
            label: 'rumor_score',
            confidence: Math.min(0.9, 0.4 + (rumorRatio * 25)),
            spans: foundSpans,
            rationale: `High rumor content: ${rumorScore} indicators (${(rumorRatio * 100).toFixed(1)}%)`
          });
        }

        return results;
      }
    };
  }

  private createNoveltyLF(): LabelingFunction {
    const noveltyIndicators = [
      /\b(breaking|exclusive|unprecedented|never before)/gi,
      /\b(first time|historic|groundbreaking)/gi,
      /\b(shocking revelation|bombshell|explosive)/gi,
      /\b(you won't believe|incredible|unbelievable)/gi
    ];

    return {
      name: 'novelty',
      description: 'Detects excessive novelty claims',
      pattern: /novel/gi,
      labels: ['novelty'],
      confidence: 0.65,
      apply: (document: CleanDocument): LabelResult[] => {
        const results: LabelResult[] = [];
        const foundSpans: Array<{ start: number; end: number; text: string }> = [];
        let noveltyScore = 0;

        for (const pattern of noveltyIndicators) {
          let match;
          pattern.lastIndex = 0;
          while ((match = pattern.exec(document.text)) !== null) {
            noveltyScore += 1;
            foundSpans.push({
              start: match.index,
              end: match.index + match[0].length,
              text: match[0]
            });
          }
        }

        if (noveltyScore > 2) { // Multiple novelty claims
          results.push({
            label: 'novelty',
            confidence: Math.min(0.8, 0.3 + (noveltyScore * 0.1)),
            spans: foundSpans,
            rationale: `Excessive novelty claims: ${noveltyScore} instances`
          });
        }

        return results;
      }
    };
  }
}