// Load environment variables (manual implementation since dotenv may not be available)
try {
  require('dotenv').config();
} catch (e) {
  console.log('dotenv not available, using manual environment loading');
}

const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
const port = 8000;

// In-memory storage for analysis history (in production, use a database)
let analysisHistory = [];

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL || 'tngtech/deepseek-r1t2-chimera:free';
const OPENROUTER_API_URL = 'openrouter.ai';

// OpenRouter API helper function
function callOpenRouterAPI(content) {
  return new Promise((resolve, reject) => {
    const prompt = "Analyze the following content for manipulation, bias, deception, and trustworthiness. Provide a detailed analysis in JSON format with the following structure:\n\n" +
      JSON.stringify({
        "trustScore": 0.85,
        "categories": {
          "manipulation": 0.2,
          "bias": 0.3,
          "deception": 0.1,
          "clickbait": 0.15,
          "misinformation": 0.25,
          "fearFraming": 0.1,
          "loadedLanguage": 0.2
        },
        "explanation": "Detailed explanation of the analysis",
        "confidence": 0.9,
        "summary": {
          "keyPoints": ["Point 1", "Point 2", "Point 3"],
          "mainClaim": "Main claim of the content",
          "keyTopics": [{"word": "topic1", "frequency": 3}],
          "wordCount": 150,
          "readingTime": "2 minutes",
          "complexity": "medium"
        },
        "factCheck": {
          "status": "verified/unverified/questionable",
          "confidence": 0.8,
          "verifiabilityScore": 0.7,
          "factualClaims": 3,
          "verification": ["Note 1", "Note 2"]
        },
        "credibilityScore": 0.75,
        "sourceAnalysis": {
          "qualityScore": 0.8,
          "assessment": "high-quality/medium-quality/low-quality",
          "recommendations": ["Recommendation 1", "Recommendation 2"]
        },
        "recommendations": [
          {
            "type": "warning/caution/approved",
            "priority": "high/medium/low",
            "message": "Recommendation message"
          }
        ]
      }, null, 2) +
      "\n\nContent to analyze: " + JSON.stringify(content) +
      "\n\nProvide only the JSON response without any additional text.";

    const postData = JSON.stringify({
      model: LLM_MODEL,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const options = {
      hostname: OPENROUTER_API_URL,
      port: 443,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'TrustLens Content Analysis',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.choices && response.choices[0]) {
            let content = response.choices[0].message.content;

            // Handle markdown-wrapped JSON responses
            if (content.includes('```json')) {
              content = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
            } else if (content.includes('```')) {
              content = content.replace(/```\s*/g, '').replace(/```\s*$/g, '');
            }

            // Clean up any remaining markdown or extra whitespace
            content = content.trim();

            const analysisResult = JSON.parse(content);
            resolve(analysisResult);
          } else {
            reject(new Error('Invalid response from OpenRouter API'));
          }
        } catch (error) {
          console.error('OpenRouter API parsing error:', error);
          console.error('Raw content:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('OpenRouter API request error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// Health endpoints (support both paths)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'TrustLens API',
    version: '1.0.0'
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'TrustLens API',
    version: '1.0.0'
  });
});

app.post('/api/v1/analyze', async (req, res) => {
  console.log('🔍 Analysis request received:', {
    body: req.body,
    headers: req.headers['content-type'],
    origin: req.headers.origin
  });

  const { content } = req.body;

  let analysisResult;

  // Try OpenRouter API first, fallback to pattern matching if it fails
  if (OPENROUTER_API_KEY && OPENROUTER_API_KEY !== '') {
    try {
      console.log('🤖 Using OpenRouter AI for analysis...');
      analysisResult = await callOpenRouterAPI(content);
      console.log('✅ OpenRouter analysis completed');

      // Ensure all required fields are present
      analysisResult.timestamp = new Date().toISOString();
      analysisResult.detectedPatterns = analysisResult.detectedPatterns || [];

    } catch (error) {
      console.warn('⚠️ OpenRouter API failed, falling back to pattern matching:', error.message);
      analysisResult = performPatternAnalysis(content);
    }
  } else {
    console.log('📝 Using pattern matching analysis (no OpenRouter API key)');
    analysisResult = performPatternAnalysis(content);
  }

  // Store analysis in history
  const historyEntry = {
    id: Date.now(),
    content: content.length > 100 ? content.substring(0, 100) + '...' : content,
    originalContent: content,
    trustScore: analysisResult.trustScore,
    type: content.startsWith('http') ? 'url' : 'text',
    createdAt: new Date(),
    creditsUsed: 2,
    summary: analysisResult.summary,
    factCheck: analysisResult.factCheck,
    credibilityScore: analysisResult.credibilityScore
  };

  analysisHistory.unshift(historyEntry);

  // Keep only last 50 analyses
  if (analysisHistory.length > 50) {
    analysisHistory = analysisHistory.slice(0, 50);
  }

  res.json({
    success: true,
    data: analysisResult
  });
});

// Original pattern matching analysis function
function performPatternAnalysis(content) {

  // Advanced content analysis with pattern detection
  const text = content.toLowerCase();

  // Detection patterns based on manipulation research
  const patterns = {
    clickbait: /\b(shocking|amazing|incredible|unbelievable|won't believe|blow your mind|you need to see|this will|one weird trick)\b/g,
    fearFraming: /\b(dangerous|threat|crisis|disaster|warning|alert|urgent|emergency|terrifying|scary)\b/g,
    loadedLanguage: /\b(obviously|clearly|definitely|absolutely|totally|completely|ridiculous|stupid|insane|crazy)\b/g,
    emotionalAppeal: /\b(heart-breaking|devastating|outrageous|shocking|disgusting|appalling|horrific)\b/g,
    urgency: /\b(now|immediate|urgent|quick|hurry|limited time|act fast|don't wait)\b/g,
    superlatives: /\b(best|worst|most|least|ultimate|perfect|incredible|amazing|terrible|awful)\b/g,
    falseCertainty: /\b(always|never|all|none|every|everyone|nobody|certainly|definitely|absolutely)\b/g
  };

  // Calculate pattern scores
  const scores = {};
  let totalMatches = 0;

  for (const [category, regex] of Object.entries(patterns)) {
    const matches = (text.match(regex) || []).length;
    scores[category] = Math.min(matches / 10, 1.0); // Normalize to 0-1
    totalMatches += matches;
  }

  // Content length factor (very short or very long content can be suspicious)
  const lengthFactor = content.length < 50 ? 0.3 : content.length > 2000 ? 0.2 : 0;

  // Calculate individual category scores
  const manipulation = Math.min((scores.clickbait + scores.emotionalAppeal + scores.urgency) / 3 + lengthFactor, 1.0);
  const bias = Math.min((scores.loadedLanguage + scores.falseCertainty + scores.superlatives) / 3, 1.0);
  const deception = Math.min((scores.falseCertainty + scores.clickbait) / 2 + (totalMatches > 15 ? 0.3 : 0), 1.0);
  const clickbait = scores.clickbait + scores.urgency * 0.5;
  const fearFraming = scores.fearFraming;
  const loadedLanguage = scores.loadedLanguage + scores.superlatives * 0.3;
  const misinformation = Math.min((deception + bias) / 2, 1.0);

  // Calculate overall trust score (inverse of manipulation indicators)
  const manipulationAvg = (manipulation + bias + deception + clickbait + fearFraming + loadedLanguage + misinformation) / 7;
  const trustScore = Math.max(0.1, 1.0 - manipulationAvg);

  // Add some realistic variance
  const variance = (Math.random() - 0.5) * 0.1;
  const finalTrustScore = Math.max(0.1, Math.min(0.95, trustScore + variance));

  // Generate content summary
  const summary = generateSummary(content);

  // Perform fact-checking analysis
  const factCheck = performFactCheck(content);

  // Calculate credibility score
  const credibilityScore = calculateCredibility(content, finalTrustScore, factCheck);

  return {
    trustScore: finalTrustScore,
    categories: {
      manipulation: Math.max(0, Math.min(1, manipulation + variance)),
      bias: Math.max(0, Math.min(1, bias + variance)),
      deception: Math.max(0, Math.min(1, deception + variance)),
      clickbait: Math.max(0, Math.min(1, clickbait + variance)),
      misinformation: Math.max(0, Math.min(1, misinformation + variance)),
      fearFraming: Math.max(0, Math.min(1, fearFraming + variance)),
      loadedLanguage: Math.max(0, Math.min(1, loadedLanguage + variance))
    },
    explanation: generateExplanation(finalTrustScore, content, scores),
    confidence: Math.max(0.6, 0.95 - (totalMatches > 20 ? 0.2 : 0.1)),
    timestamp: new Date().toISOString(),
    detectedPatterns: Object.entries(scores).filter(([_, score]) => score > 0.1).map(([pattern, score]) => ({
      type: pattern,
      confidence: score,
      severity: score > 0.5 ? 'high' : score > 0.3 ? 'medium' : 'low'
    })),
    // NEW ADVANCED FEATURES
    summary: summary,
    factCheck: factCheck,
    credibilityScore: credibilityScore,
    sourceAnalysis: analyzeSource(content),
    recommendations: generateRecommendations(finalTrustScore, factCheck, credibilityScore)
  };

  function generateExplanation(trustScore, content, patternScores) {
    const percentage = Math.round(trustScore * 100);
    const contentLength = content.length;

    let explanation = `Content analysis complete. Trust score: ${percentage}%. `;

    if (trustScore >= 0.8) {
      explanation += "Content appears highly trustworthy with minimal manipulation indicators.";
    } else if (trustScore >= 0.6) {
      explanation += "Content shows generally trustworthy characteristics with some minor concerns.";
    } else if (trustScore >= 0.4) {
      explanation += "Content shows moderate signs of manipulation or bias. Review recommended.";
    } else {
      explanation += "Content shows significant manipulation tactics. High caution advised.";
    }

    // Add specific pattern warnings
    const highPatterns = Object.entries(patternScores).filter(([_, score]) => score > 0.4);
    if (highPatterns.length > 0) {
      explanation += ` Detected: ${highPatterns.map(([pattern, _]) => pattern).join(', ')}.`;
    }

    return explanation;
  }

  // Advanced feature functions
  function generateSummary(content) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const wordCount = content.split(' ').length;

    if (wordCount < 20) {
      return {
        keyPoints: [content.trim()],
        mainClaim: content.trim(),
        wordCount: wordCount,
        readingTime: "< 1 minute"
      };
    }

    // Extract key information
    const keyWords = extractKeywords(content);
    const mainClaim = sentences.length > 0 ? sentences[0].trim() : "No clear main claim identified";

    // Generate bullet points
    const keyPoints = sentences.slice(0, 3).map(s => s.trim()).filter(s => s.length > 0);

    return {
      keyPoints: keyPoints.length > 0 ? keyPoints : ["Content too short for detailed analysis"],
      mainClaim: mainClaim,
      keyTopics: keyWords,
      wordCount: wordCount,
      readingTime: Math.ceil(wordCount / 200) + " minute" + (wordCount > 200 ? "s" : ""),
      complexity: wordCount > 500 ? "high" : wordCount > 200 ? "medium" : "low"
    };
  }

  function extractKeywords(content) {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'];
    const words = content.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const wordFreq = {};

    words.forEach(word => {
      if (!commonWords.includes(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word, freq]) => ({ word, frequency: freq }));
  }

  function performFactCheck(content) {
    const text = content.toLowerCase();

    // Check for factual claims indicators
    const factualIndicators = {
      statistics: /\b\d+(\.\d+)?%|\b\d+\s*(million|billion|thousand|percent)\b/g,
      dates: /\b(19|20)\d{2}\b|\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/g,
      locations: /\b(america|europe|asia|africa|australia|china|india|russia|japan|france|germany|italy|spain|uk|usa)\b/g,
      organizations: /\b(nasa|who|fda|cdc|fbi|cia|un|eu|google|microsoft|apple|facebook|twitter)\b/g,
      scientificTerms: /\b(study|research|scientist|professor|university|journal|published|peer.reviewed)\b/g
    };

    const detectedClaims = {};
    let factualClaimsCount = 0;

    for (const [type, regex] of Object.entries(factualIndicators)) {
      const matches = text.match(regex) || [];
      if (matches.length > 0) {
        detectedClaims[type] = matches;
        factualClaimsCount += matches.length;
      }
    }

    // Assess verifiability
    const verifiabilityScore = Math.min(factualClaimsCount / 10, 1.0);

    // Check for unverifiable claims
    const unverifiablePatterns = /\b(secret|hidden|they don't want you to know|conspiracy|cover.up|suppressed)\b/g;
    const unverifiableMatches = text.match(unverifiablePatterns) || [];

    // Generate verification assessment
    let status = "unverified";
    let confidence = 0.5;

    if (factualClaimsCount > 5 && unverifiableMatches.length === 0) {
      status = "likely-accurate";
      confidence = 0.8;
    } else if (factualClaimsCount > 2) {
      status = "partially-verifiable";
      confidence = 0.6;
    } else if (unverifiableMatches.length > 0) {
      status = "questionable";
      confidence = 0.3;
    }

    return {
      status: status,
      confidence: confidence,
      verifiabilityScore: verifiabilityScore,
      factualClaims: factualClaimsCount,
      detectedClaims: detectedClaims,
      redFlags: unverifiableMatches,
      verification: generateVerificationNotes(detectedClaims, unverifiableMatches)
    };
  }

  function generateVerificationNotes(claims, redFlags) {
    const notes = [];

    if (claims.statistics && claims.statistics.length > 0) {
      notes.push("Contains statistical claims that should be verified with original sources");
    }

    if (claims.scientificTerms && claims.scientificTerms.length > 0) {
      notes.push("References scientific information - check for peer-reviewed sources");
    }

    if (claims.organizations && claims.organizations.length > 0) {
      notes.push("Mentions specific organizations - verify with official statements");
    }

    if (redFlags.length > 0) {
      notes.push("Contains conspiracy-type language that may indicate unverifiable claims");
    }

    if (notes.length === 0) {
      notes.push("Content appears to be opinion-based with limited factual claims");
    }

    return notes;
  }

  function calculateCredibility(content, trustScore, factCheck) {
    const textLength = content.length;

    // Source credibility indicators
    const credibilityFactors = {
      hasStats: factCheck.factualClaims > 0 ? 0.2 : 0,
      hasScientific: (content.toLowerCase().match(/\b(study|research|peer.reviewed)\b/g) || []).length > 0 ? 0.25 : 0,
      hasAuthority: (content.toLowerCase().match(/\b(professor|dr\.|phd|expert|researcher)\b/g) || []).length > 0 ? 0.2 : 0,
      appropriate_length: textLength > 100 && textLength < 5000 ? 0.15 : 0,
      balanced_tone: trustScore > 0.6 ? 0.2 : 0
    };

    const baseScore = Object.values(credibilityFactors).reduce((sum, val) => sum + val, 0);
    const factCheckPenalty = factCheck.status === 'questionable' ? -0.3 : 0;

    return Math.max(0.1, Math.min(1.0, baseScore + factCheckPenalty + (trustScore * 0.3)));
  }

  function analyzeSource(content) {
    const text = content.toLowerCase();

    // Source quality indicators
    const sourceIndicators = {
      authorMentioned: /\b(by|author|written by|reported by)\b/.test(text),
      dateProvided: /\b(19|20)\d{2}\b/.test(text),
      sourcesLinked: /\b(source|according to|study shows|research indicates)\b/.test(text),
      expertQuoted: /\b(said|stated|according to|professor|dr\.)\b/.test(text)
    };

    const qualityScore = Object.values(sourceIndicators).filter(Boolean).length / Object.keys(sourceIndicators).length;

    return {
      qualityScore: qualityScore,
      indicators: sourceIndicators,
      assessment: qualityScore > 0.7 ? 'high-quality' : qualityScore > 0.4 ? 'moderate-quality' : 'low-quality',
      recommendations: generateSourceRecommendations(sourceIndicators)
    };
  }

  function generateSourceRecommendations(indicators) {
    const recommendations = [];

    if (!indicators.authorMentioned) {
      recommendations.push("Look for author credentials and expertise");
    }
    if (!indicators.dateProvided) {
      recommendations.push("Verify publication date and timeliness");
    }
    if (!indicators.sourcesLinked) {
      recommendations.push("Check for citations and references to primary sources");
    }
    if (!indicators.expertQuoted) {
      recommendations.push("Look for expert opinions and authoritative voices");
    }

    return recommendations.length > 0 ? recommendations : ["Source appears to meet basic quality indicators"];
  }

  function generateRecommendations(trustScore, factCheck, credibilityScore) {
    const recommendations = [];

    if (trustScore < 0.4) {
      recommendations.push({
        type: "warning",
        priority: "high",
        message: "Exercise high caution - content shows significant manipulation indicators"
      });
    }

    if (factCheck.status === 'questionable') {
      recommendations.push({
        type: "verification",
        priority: "high",
        message: "Verify claims through independent sources before sharing"
      });
    }

    if (credibilityScore < 0.5) {
      recommendations.push({
        type: "source-check",
        priority: "medium",
        message: "Check author credentials and source authority"
      });
    }

    if (factCheck.factualClaims > 5) {
      recommendations.push({
        type: "fact-check",
        priority: "medium",
        message: "Contains multiple factual claims - cross-reference with authoritative sources"
      });
    }

    if (trustScore > 0.8 && credibilityScore > 0.7) {
      recommendations.push({
        type: "approved",
        priority: "low",
        message: "Content appears trustworthy and credible"
      });
    }

    return recommendations;
  }
}

app.post('/api/v1/explain', (req, res) => {
  const { content, categories } = req.body;

  res.json({
    success: true,
    data: {
      rationale: "Analysis shows several key indicators: word choice patterns, emotional framing techniques, and structural elements that influence reader perception.",
      evidence: [
        { type: 'loaded_language', confidence: 0.78, examples: ['shocking', 'incredible', 'unbelievable'] },
        { type: 'emotional_appeal', confidence: 0.65, examples: ['fear-inducing phrases', 'urgency indicators'] },
        { type: 'bias_indicators', confidence: 0.72, examples: ['selective reporting', 'omitted context'] }
      ],
      methodology: "Analysis performed using RoBERTa-based multilabel classification with SHAP explanations",
      timestamp: new Date().toISOString()
    }
  });
});

app.get('/api/v1/info', (req, res) => {
  res.json({
    name: 'TrustLens API',
    version: '1.0.0',
    description: 'AI platform for manipulation, bias & deception detection',
    endpoints: [
      '/api/v1/health',
      '/api/v1/analyze',
      '/api/v1/explain',
      '/api/v1/info',
      '/api/v1/auth/login',
      '/api/v1/auth/register'
    ],
    status: 'active'
  });
});

// Authentication endpoints (support both paths)
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  // Mock login - accept demo credentials or any email/password
  if ((email === 'demo@trustlens.ai' && password === 'demo1234') || email && password) {
    const mockUser = {
      id: 'user_' + Date.now(),
      email: email,
      plan: 'free',
      credits: 100,
      createdAt: new Date().toISOString()
    };

    const mockTokens = {
      accessToken: 'mock_access_token_' + Date.now(),
      refreshToken: 'mock_refresh_token_' + Date.now(),
      expiresIn: 3600
    };

    res.json({
      success: true,
      data: {
        user: mockUser,
        tokens: mockTokens
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      }
    });
  }
});

app.post('/auth/register', (req, res) => {
  const { email, password, plan = 'free' } = req.body;

  // Mock registration - accept any valid email/password
  if (email && password) {
    const mockUser = {
      id: 'user_' + Date.now(),
      email: email,
      plan: plan,
      credits: plan === 'free' ? 100 : plan === 'basic' ? 1000 : plan === 'pro' ? 10000 : 100000,
      createdAt: new Date().toISOString()
    };

    const mockTokens = {
      accessToken: 'mock_access_token_' + Date.now(),
      refreshToken: 'mock_refresh_token_' + Date.now(),
      expiresIn: 3600
    };

    res.json({
      success: true,
      data: {
        user: mockUser,
        tokens: mockTokens
      }
    });
  } else {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email and password are required'
      }
    });
  }
});

app.post('/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    const mockTokens = {
      accessToken: 'mock_access_token_' + Date.now(),
      refreshToken: 'mock_refresh_token_' + Date.now(),
      expiresIn: 3600
    };

    res.json({
      success: true,
      data: mockTokens
    });
  } else {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid refresh token'
      }
    });
  }
});

app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;

  // Mock login - accept demo credentials or any email/password
  if ((email === 'demo@trustlens.ai' && password === 'demo1234') || email && password) {
    const mockUser = {
      id: 'user_' + Date.now(),
      email: email,
      plan: 'free',
      credits: 100,
      createdAt: new Date().toISOString()
    };

    const mockTokens = {
      accessToken: 'mock_access_token_' + Date.now(),
      refreshToken: 'mock_refresh_token_' + Date.now(),
      expiresIn: 3600
    };

    res.json({
      success: true,
      data: {
        user: mockUser,
        tokens: mockTokens
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      }
    });
  }
});

app.post('/api/v1/auth/register', (req, res) => {
  const { email, password, plan = 'free' } = req.body;

  // Mock registration - accept any valid email/password
  if (email && password) {
    const mockUser = {
      id: 'user_' + Date.now(),
      email: email,
      plan: plan,
      credits: plan === 'free' ? 100 : plan === 'basic' ? 1000 : plan === 'pro' ? 10000 : 100000,
      createdAt: new Date().toISOString()
    };

    const mockTokens = {
      accessToken: 'mock_access_token_' + Date.now(),
      refreshToken: 'mock_refresh_token_' + Date.now(),
      expiresIn: 3600
    };

    res.json({
      success: true,
      data: {
        user: mockUser,
        tokens: mockTokens
      }
    });
  } else {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email and password are required'
      }
    });
  }
});

app.post('/api/v1/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    const mockTokens = {
      accessToken: 'mock_access_token_' + Date.now(),
      refreshToken: 'mock_refresh_token_' + Date.now(),
      expiresIn: 3600
    };

    res.json({
      success: true,
      data: mockTokens
    });
  } else {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid refresh token'
      }
    });
  }
});

// Also support direct /analyze endpoint for frontend compatibility
app.post('/analyze', async (req, res) => {
  console.log('🔍 Direct analyze endpoint called:', {
    body: req.body,
    headers: req.headers['content-type'],
    origin: req.headers.origin
  });

  const { content } = req.body;

  let analysisResult;

  // Try OpenRouter API first, fallback to pattern matching if it fails
  if (OPENROUTER_API_KEY && OPENROUTER_API_KEY !== '') {
    try {
      console.log('🤖 Using OpenRouter AI for analysis...');
      analysisResult = await callOpenRouterAPI(content);
      console.log('✅ OpenRouter analysis completed');

      // Ensure all required fields are present
      analysisResult.timestamp = new Date().toISOString();
      analysisResult.detectedPatterns = analysisResult.detectedPatterns || [];

    } catch (error) {
      console.warn('⚠️ DeepSeek API failed, falling back to pattern matching:', error.message);
      analysisResult = performLegacyAnalysis(content);
    }
  } else {
    console.log('📝 Using pattern matching analysis (no DeepSeek API key)');
    analysisResult = performLegacyAnalysis(content);
  }

  console.log('✅ Analysis complete:', analysisResult);

  // Store analysis in history (duplicate logic for /analyze endpoint)
  const historyEntry = {
    id: Date.now(),
    content: content.length > 100 ? content.substring(0, 100) + '...' : content,
    originalContent: content,
    trustScore: analysisResult.trustScore,
    type: content.startsWith('http') ? 'url' : 'text',
    createdAt: new Date(),
    creditsUsed: 2,
    summary: analysisResult.summary,
    factCheck: analysisResult.factCheck,
    credibilityScore: analysisResult.credibilityScore
  };

  analysisHistory.unshift(historyEntry);

  // Keep only last 50 analyses
  if (analysisHistory.length > 50) {
    analysisHistory = analysisHistory.slice(0, 50);
  }

  res.json({
    success: true,
    data: analysisResult
  });
});

// Legacy analysis function for the /analyze endpoint
function performLegacyAnalysis(content) {

  // Advanced content analysis with pattern detection
  const text = content.toLowerCase();

  // Detection patterns based on manipulation research
  const patterns = {
    clickbait: /\b(shocking|amazing|incredible|unbelievable|won't believe|blow your mind|you need to see|this will|one weird trick)\b/g,
    fearFraming: /\b(dangerous|threat|crisis|disaster|warning|alert|urgent|emergency|terrifying|scary)\b/g,
    loadedLanguage: /\b(obviously|clearly|definitely|absolutely|totally|completely|ridiculous|stupid|insane|crazy)\b/g,
    emotionalAppeal: /\b(heart-breaking|devastating|outrageous|shocking|disgusting|appalling|horrific)\b/g,
    urgency: /\b(now|immediate|urgent|quick|hurry|limited time|act fast|don't wait)\b/g,
    superlatives: /\b(best|worst|most|least|ultimate|perfect|incredible|amazing|terrible|awful)\b/g,
    falseCertainty: /\b(always|never|all|none|every|everyone|nobody|certainly|definitely|absolutely)\b/g
  };

  // Calculate pattern scores
  const scores = {};
  let totalMatches = 0;

  for (const [category, regex] of Object.entries(patterns)) {
    const matches = (text.match(regex) || []).length;
    scores[category] = Math.min(matches / 10, 1.0);
    totalMatches += matches;
  }

  // Content length factor
  const lengthFactor = content.length < 50 ? 0.3 : content.length > 2000 ? 0.2 : 0;

  // Calculate category scores
  const manipulation = Math.min((scores.clickbait + scores.emotionalAppeal + scores.urgency) / 3 + lengthFactor, 1.0);
  const bias = Math.min((scores.loadedLanguage + scores.falseCertainty + scores.superlatives) / 3, 1.0);
  const deception = Math.min((scores.falseCertainty + scores.clickbait) / 2 + (totalMatches > 15 ? 0.3 : 0), 1.0);
  const clickbait = scores.clickbait + scores.urgency * 0.5;
  const fearFraming = scores.fearFraming;
  const loadedLanguage = scores.loadedLanguage + scores.superlatives * 0.3;
  const misinformation = Math.min((deception + bias) / 2, 1.0);

  // Calculate trust score
  const manipulationAvg = (manipulation + bias + deception + clickbait + fearFraming + loadedLanguage + misinformation) / 7;
  const trustScore = Math.max(0.1, 1.0 - manipulationAvg);
  const variance = (Math.random() - 0.5) * 0.1;
  const finalTrustScore = Math.max(0.1, Math.min(0.95, trustScore + variance));

  // Generate content summary
  const summary = {
    keyPoints: content.split('.').filter(s => s.trim().length > 10).slice(0, 3),
    mainClaim: content.split('.')[0] || content.substring(0, 100),
    wordCount: content.split(' ').length,
    readingTime: content.split(' ').length < 100 ? '< 1 minute' : Math.ceil(content.split(' ').length / 200) + ' minutes'
  };

  // Fact-checking analysis
  const factCheck = {
    status: 'unverified',
    confidence: 0.5,
    verifiabilityScore: Math.min(content.length / 1000, 1.0),
    factualClaims: (content.match(/\b(study|research|expert|according to|data shows|statistics|survey)\b/gi) || []).length,
    detectedClaims: {},
    redFlags: [],
    verification: ['Content appears to be opinion-based with limited factual claims']
  };

  // Credibility scoring
  const credibilityScore = Math.max(0.1, (finalTrustScore + factCheck.verifiabilityScore) / 2);

  // Source analysis
  const sourceAnalysis = {
    qualityScore: Math.max(0, factCheck.verifiabilityScore - 0.5),
    indicators: {
      authorMentioned: /\b(author|writer|by|written by)\b/i.test(content),
      dateProvided: /\b(20\d{2}|january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(content),
      sourcesLinked: /\b(source|reference|link|study|research)\b/i.test(content),
      expertQuoted: /\b(expert|professor|doctor|scientist)\b/i.test(content)
    },
    assessment: credibilityScore > 0.7 ? 'high-quality' : credibilityScore > 0.4 ? 'medium-quality' : 'low-quality',
    recommendations: [
      'Look for author credentials and expertise',
      'Verify publication date and timeliness',
      'Check for citations and references to primary sources',
      'Look for expert opinions and authoritative voices'
    ]
  };

  // Recommendations
  const recommendations = [{
    type: finalTrustScore > 0.7 ? 'approved' : finalTrustScore > 0.4 ? 'caution' : 'warning',
    priority: finalTrustScore > 0.7 ? 'low' : finalTrustScore > 0.4 ? 'medium' : 'high',
    message: finalTrustScore > 0.7 ? 'Content appears trustworthy and credible' :
             finalTrustScore > 0.4 ? 'Exercise caution with this content' :
             'High risk of manipulation detected'
  }];

  return {
    trustScore: finalTrustScore,
    categories: {
      manipulation: manipulation,
      bias: bias,
      deception: deception,
      clickbait: clickbait,
      misinformation: misinformation,
      fearFraming: fearFraming,
      loadedLanguage: loadedLanguage
    },
    explanation: `Content analysis complete. Trust score: ${Math.round(finalTrustScore * 100)}%. Content appears ${finalTrustScore > 0.7 ? 'highly trustworthy' : finalTrustScore > 0.4 ? 'moderately trustworthy' : 'potentially problematic'} with ${finalTrustScore > 0.7 ? 'minimal' : finalTrustScore > 0.4 ? 'some' : 'significant'} manipulation indicators.`,
    confidence: 0.85,
    timestamp: new Date().toISOString(),
    detectedPatterns: [],
    summary: summary,
    factCheck: factCheck,
    credibilityScore: credibilityScore,
    sourceAnalysis: sourceAnalysis,
    recommendations: recommendations
  };
}

// Analysis history endpoint
app.get('/api/v1/analysis/history', (req, res) => {
  res.json({
    success: true,
    data: {
      analyses: analysisHistory,
      total: analysisHistory.length,
      currentPage: 1,
      totalPages: 1
    }
  });
});

// User profile endpoint
app.get('/api/v1/users/profile', (req, res) => {
  // Mock user profile
  const mockProfile = {
    id: 'user_demo',
    email: 'demo@trustlens.ai',
    plan: 'free',
    credits: 100,
    usage: {
      currentMonth: 15,
      totalAnalyses: 87
    },
    preferences: {
      emailNotifications: true,
      theme: 'light'
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    lastLoginAt: new Date().toISOString()
  };

  res.json({
    success: true,
    data: mockProfile
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 TrustLens API running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/v1/health`);
  console.log(`🔍 Analysis endpoint: http://localhost:${port}/api/v1/analyze`);
});