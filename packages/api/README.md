# TrustLens API - OpenRouter Integration

## AI-Powered Content Analysis

TrustLens now supports real AI analysis using OpenRouter's API with the DeepSeek model for sophisticated content analysis.

### Features

- **Smart Analysis**: Uses `tngtech/deepseek-r1t2-chimera:free` model for advanced content evaluation
- **Automatic Fallback**: Falls back to pattern matching if API is unavailable
- **Real-time History**: Analysis results are stored in browsable history
- **Comprehensive Results**: Provides trust scores, fact-checking, summarization, and recommendations

### Setup

1. **Environment Configuration**:
   - Your API key is already configured in `.env`
   - Model: `tngtech/deepseek-r1t2-chimera:free` (Free tier)

2. **API Endpoints**:
   - `POST /api/v1/analyze` - Main analysis endpoint
   - `POST /analyze` - Alternative endpoint
   - `GET /api/v1/analysis/history` - Get analysis history

### How It Works

**With OpenRouter API:**
```bash
🤖 Using OpenRouter AI for analysis...
✅ OpenRouter analysis completed
```

**Without API Key:**
```bash
📝 Using pattern matching analysis (no OpenRouter API key)
```

### Analysis Response

```json
{
  "success": true,
  "data": {
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
    "summary": {
      "keyPoints": ["Main point 1", "Main point 2"],
      "mainClaim": "Primary claim of content",
      "wordCount": 150,
      "readingTime": "2 minutes"
    },
    "factCheck": {
      "status": "verified",
      "confidence": 0.8,
      "verification": ["Fact 1 verified", "Claim 2 supported"]
    },
    "recommendations": [
      {
        "type": "approved",
        "priority": "low",
        "message": "Content appears trustworthy and credible"
      }
    ]
  }
}
```

### Testing

Test the integration by sending content to the analysis endpoint:

```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"content": "Your content to analyze here"}'
```

The system is now ready for production-level AI content analysis!