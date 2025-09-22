# TrustLens

End-to-end AI platform for manipulation, bias & deception detection in online content.

## Overview

TrustLens provides multimodal analysis (text + images) to score content across manipulation dimensions like fear framing, cherry-picking, euphemism, ad hominem, and false balance. The platform delivers rich explanations through highlighted spans, counterfactual edits, and evidence links.

## Features

- 🔍 **Multimodal Analysis**: Text and image manipulation detection
- 📊 **TrustLens Scores**: Calibrated confidence scores across taxonomy
- 💡 **Rich Explanations**: Span highlights, rationale extraction, counterfactuals
- 🌐 **Multiple Surfaces**: Web app, REST API, browser extension
- 💰 **Freemium SaaS**: Free tier + Pro/Team/Enterprise plans
- 🎓 **Research-Ready**: Reproducible artifacts for academic publication

## Architecture

### Monorepo Structure

```
trustlens/
├── packages/
│   ├── dataops/         # Ingestion, scraping, cleaning, labeling
│   ├── model/           # Training, eval, export, ONNX converters
│   ├── explain/         # SHAP, LIME, attention, counterfactuals
│   ├── api/             # FastAPI backend, auth, rate limiting
│   ├── webapp/          # Next.js React app, dashboards
│   ├── extension/       # Chrome/Firefox extension (MV3)
│   ├── sdk-js/          # JavaScript/TypeScript client SDK
│   ├── sdk-py/          # Python client SDK
│   ├── infra/           # Terraform IaC, Docker, Kubernetes
│   ├── billing/         # Stripe integration, usage metering
│   ├── evaluation/      # Benchmarks, OOD suites, fairness
│   └── docs/            # Documentation and research notes
├── datasets/
│   ├── raw/             # Raw data dumps (URLs, hashed content)
│   ├── interim/         # Cleaned and normalized data
│   ├── labeled/         # Annotations and weak labels
│   └── benchmarks/      # Public evaluation splits
└── scripts/             # CLI wrappers for automation
```

### Tech Stack

- **Frontend**: Next.js, React, Tailwind, shadcn/ui, Zustand
- **Backend**: FastAPI (Python), PostgreSQL + pgvector, Redis
- **ML**: PyTorch, HuggingFace, spaCy, OpenCLIP
- **Explainability**: SHAP, attention rollout, integrated gradients
- **Infrastructure**: Docker, Terraform, Kubernetes (GKE), Stripe

### Manipulation Taxonomy

- **Emotional Framing**: Fear, outrage, sentiment amplification
- **Rhetorical Devices**: Ad hominem, strawman, false dilemma, cherry-picking, loaded language
- **Bias Types**: Selection bias, confirmation bias cues, false balance
- **Misinformation Risk**: Unverifiable claims, missing citations, rumor scoring
- **Visual Persuasion**: Color priming, symbol emphasis, facial exaggeration

## Quick Start

### Prerequisites

- Node.js ≥18.0.0
- pnpm ≥8.0.0
- Python ≥3.10
- Docker
- PostgreSQL

### Installation

```bash
# Clone repository
git clone https://github.com/trustlens/trustlens.git
cd trustlens

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development servers
pnpm dev
```

### API Usage

```bash
# Analyze text content
curl -X POST "http://localhost:8080/v1/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "input": {
      "type": "text",
      "content": "Your text content here...",
      "return_explanations": true
    }
  }'
```

### SDK Usage

```typescript
import { TrustLens } from '@trustlens/sdk-js';

const client = new TrustLens({ apiKey: 'your-api-key' });

const result = await client.analyze({
  text: 'Your content here...',
  includeExplanations: true
});

console.log(result.scores); // { fear_framing: 0.83, strawman: 0.41, ... }
console.log(result.rationales); // Highlighted spans with explanations
```

## Development

### Commands

```bash
# Build all packages
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint

# Type checking
pnpm typecheck

# Clean build artifacts
pnpm clean
```

### Package Development

Each package has its own README with specific setup instructions:

- [dataops](./packages/dataops/README.md) - Data ingestion and processing
- [model](./packages/model/README.md) - ML model training and evaluation
- [api](./packages/api/README.md) - FastAPI backend service
- [webapp](./packages/webapp/README.md) - Next.js web application
- [extension](./packages/extension/README.md) - Browser extension

## Roadmap

### Phase A - Foundation (Months 1-2)
- [x] Repository scaffolding and CI/CD
- [ ] Basic data ingestion pipeline
- [ ] Baseline text classifier
- [ ] Webapp and extension MVPs

### Phase B - Multimodal & SaaS (Months 3-5)
- [ ] Image persuasion detection
- [ ] Model fusion capabilities
- [ ] Stripe billing integration
- [ ] Pro plan launch

### Phase C - Scale & Research (Months 6-9)
- [ ] Counterfactual explanations
- [ ] Dataset v1 release
- [ ] Performance optimization
- [ ] Academic partnerships

### Phase D - Growth & Publications (Months 10-12)
- [ ] Enterprise features
- [ ] Conference submissions
- [ ] Market expansion
- [ ] €5K MRR target

## Success Metrics

### Product KPIs
- Time-to-first-insight < 5s for 1,000-word articles
- Weekly Active Users (WAU) > 5,000 by Month 6
- Extension install-to-signup conversion > 10%
- Organization trial → paid conversion > 20%

### ML KPIs
- Macro-F1 ≥ 0.72 on in-distribution labels; ≥ 0.60 OOD
- Explanation faithfulness improvement ≥ 15% vs baseline
- Calibration ECE ≤ 0.08
- Uncertainty-aware triage reduces false positives by 20%

### Business KPIs
- Monthly Recurring Revenue (MRR) ≥ €5k by Month 12
- Customer Acquisition Cost (CAC) < €25
- Payback period < 2 months

## Ethics & Compliance

- **No individual profiling**: Content-level analysis only
- **Political neutrality**: Neutral taxonomy with transparency
- **Privacy protection**: PII scrubbing, configurable retention
- **GDPR/CCPA compliance**: Data residency options, user rights
- **Bias monitoring**: Fairness evaluation across topics/spectra

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Research

TrustLens is designed as a research platform. For academic use:

- Dataset and benchmark releases
- Reproducible evaluation protocols
- Model cards and bias audits
- Open research artifacts

## Support

- 📧 Email: support@trustlens.ai
- 💬 Discord: [TrustLens Community](https://discord.gg/trustlens)
- 📖 Docs: [docs.trustlens.ai](https://docs.trustlens.ai)
- 🐛 Issues: [GitHub Issues](https://github.com/trustlens/trustlens/issues)

---

Built with ❤️ for media literacy and democratic discourse.


⏺ Here's how to run the TrustLens application:

  🚀 Running TrustLens

  Option 1: Run Everything Together (Recommended)

  # From the root directory
  cd /Users/adityaravi/trustlens

  # Install all dependencies (if not done already)
  pnpm install

  # Start both backend and frontend
  pnpm dev

  Option 2: Run Components Separately

  Terminal 1 - Start the API Backend:
  cd /Users/adityaravi/trustlens

  # Using our agent command system
  node scripts/agent-commands.js COMMAND_API_BOOT '{"port": 8000}'

  # OR manually
  cd packages/api
  npm run dev

  Terminal 2 - Start the Web App:
  cd /Users/adityaravi/trustlens/packages/webapp
  npm run dev

  📱 Access the Application

  - Web App: http://localhost:3000
  - API Backend: http://localhost:8000
  - API Health: http://localhost:8000/health
  - API Docs: http://localhost:8000/api/v1/info

  🎯 Quick Start Guide

  1. Open http://localhost:3000
  2. Click "Get Started" or "Sign In"
  3. Register a new account (try the Free plan)
  4. Login and explore the dashboard
  5. Go to Analyze and try analyzing some text:
  Example text: "You won't believe this shocking revelation that will change
   everything!"

  🧪 Demo Features

  Try these sample texts for different risk scores:

  - High Risk: "You won't believe this shocking crisis that threatens
  everything!"
  - Medium Risk: "This important study reveals concerning trends in data."
  - Low Risk: "Scientists published research findings in the journal."

  🔧 Development Scripts

  # Build everything
  pnpm build

  # Run tests
  pnpm test

  # Type check
  pnpm typecheck

  # Lint code
  pnpm lint

  🎮 Demo Account

  Use the "Try Demo Account" button on the login page, or manually enter:
  - Email: demo@trustlens.ai
  - Password: demo1234

  🐛 Troubleshooting

  If you get dependency errors:
  pnpm install --force

  If API connection fails:
  # Check if API is running
  curl http://localhost:8000/health

  If webapp won't start:
  cd packages/webapp
  rm -rf .next
  npm run build
  npm run dev

  The application is fully functional with mock data, so you can test all
  features immediately! 🎉

