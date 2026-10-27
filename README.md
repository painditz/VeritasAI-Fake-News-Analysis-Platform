# VeritasAI — Advanced Fake News Analysis Platform

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.14%20CPU%2FCUDA-ee4c2c.svg)](https://pytorch.org/)
[![Transformers](https://img.shields.io/badge/Hugging%20Face-Transformers-yellow.svg)](https://huggingface.co/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38b2ac.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-13%2F13%20Passed-brightgreen.svg)]()

> **VeritasAI** is a research-oriented, full-stack AI platform for fine-grained political claim truthfulness classification and evidence verification. Powered by a fine-tuned `bert-base-uncased` transformer on the **LIAR political fact-checking benchmark** (Wang, ACL 2017), VeritasAI analyzes news claims across a realistic **six-level truthfulness spectrum**, rather than reducing complex statements to naive binary labels.

---

## 1. Problem Formulation & Exact Label Ontology

Political discourse is nuanced: claims are rarely absolute truths or complete fabrications. The model is trained on the canonical **LIAR dataset** with the following 6 truthfulness classes (preserved strictly from `config.json`):

| Class ID | Label Name | PolitiFact Semantic Definition |
| :---: | :--- | :--- |
| **0** | `false` | Statement is factually inaccurate with no credible grounding. |
| **1** | `half-true` | Partially accurate statement that omits key facts or takes context out of proportion. |
| **2** | `mostly-true` | Accurate overall but requires clarification or minor additional context. |
| **3** | `true` | Factually verified and accurate; no significant distortions. |
| **4** | `barely-true` | Contains a grain of truth, but leaves out critical facts that would create a different impression. |
| **5** | `pants-fire` | Egregiously ridiculous, completely false, or conspiratorial claim. |

> **Methodological Disclaimer**: The model outputs represent statistical feature-correlation likelihoods learned over the training distribution. They indicate pattern similarity to historical fact-checks rather than philosophical or legal proof of objective reality.

---

## 2. System Architecture

```
VeritasAI/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application entrypoint with lifespan model loading
│   │   ├── api/
│   │   │   └── routes.py               # REST API endpoints (predict, batch, health, model-info, analytics, evaluation)
│   │   ├── core/
│   │   │   ├── config.py               # Environment configuration via Pydantic Settings
│   │   │   ├── model_service.py        # Singleton BERT loader, dynamic batching, and analytics
│   │   │   └── evidence_service.py     # Two-tier evidence retrieval & claim alignment classifier
│   │   └── models/
│   │       └── schemas.py              # Pydantic v2 validation contracts
│   ├── evaluation/
│   │   ├── evaluate.py                 # Reproducible evaluation script
│   │   ├── liar_test.tsv               # Held-out benchmark test split (1,299 samples)
│   │   ├── evaluation_results.json     # Saved evaluation metrics & confusion matrix
│   │   └── per_class_metrics.csv       # Precision, recall, and F1 export
│   ├── tests/
│   │   ├── test_model_service.py       # Unit tests for loading, mapping, and probabilities
│   │   └── test_api.py                 # Integration tests for all FastAPI endpoints
│   ├── requirements.txt                # Python backend dependencies
│   └── .env.example                    # Sample environment variables
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx                      # Header with real-time hardware RSS status
│   │   │   ├── ClaimAnalysisWorkspace.tsx      # Interactive claim workbench with presets
│   │   │   ├── SixClassProbabilityChart.tsx    # Recharts 6-class horizontal distribution
│   │   │   ├── TopPredictionsCard.tsx          # Top-3 candidate ranking & confidence score
│   │   │   ├── EvidenceVerificationCard.tsx    # Document retrieval with stance alignment badges
│   │   │   ├── ModelEvaluationDashboard.tsx    # Held-out test metrics, confusion matrix, baselines
│   │   │   ├── BatchAnalysisModal.tsx          # CSV / plaintext multi-claim batch inference
│   │   │   ├── AnalysisHistory.tsx             # Session history with reload capability
│   │   │   └── ModelInfoModal.tsx              # Deep BERT architecture & parameter specs
│   │   ├── services/
│   │   │   └── api.ts                  # Typed client for backend communication
│   │   ├── types/
│   │   │   └── index.ts                # TypeScript domain models matching backend schemas
│   │   ├── App.tsx                     # Top-level state and routing orchestrator
│   │   ├── index.css                   # Tailwind CSS utilities and theme
│   │   └── main.tsx                    # React DOM entrypoint
│   ├── package.json                    # Frontend dependencies
│   ├── tailwind.config.js              # Theme design system
│   ├── tsconfig.json                   # Strict TypeScript compiler options
│   └── vite.config.ts                  # Vite development server with proxy
├── saved_model/                        # Dedicated model weights directory
│   ├── config.json                     # Hugging Face model configuration
│   ├── model.safetensors               # Fine-tuned BERT weights (438 MB)
│   ├── tokenizer.json                  # WordPiece tokenizer vocabulary
│   ├── tokenizer_config.json           # Tokenizer special tokens and settings
│   └── training_args.bin               # Training hyperparameters binary
├── notebooks/
│   └── NLP_Project_1_improved.ipynb    # Original Google Colab training notebook
├── backups/                            # Intact original configuration & notebook backups
├── Dockerfile                          # Multi-stage production container build
├── docker-compose.yml                  # Container orchestration with volume mounts
├── .gitignore                          # Excludes large binaries, weights, and caches
└── README.md                           # Documentation
```

---

## 3. Evidence Verification Module (Core Innovation)

VeritasAI intentionally separates **BERT linguistic classification** from **evidence retrieval**:
1. **Tier 1: Live MediaWiki API Retrieval**: Queries public knowledge archives without requiring external paid credentials to fetch genuine page titles, actual extracts, and canonical URLs.
2. **Tier 2: Institutional Benchmark Corpus**: Houses verified factual statements from official entities (e.g., U.S. Bureau of Labor Statistics, Congressional Budget Office, NASA, CDC, PolitiFact Truth-O-Meter).
3. **Automated Alignment Classification**: Scans retrieved snippets for corroborative or conflicting evidence:
   - `Supporting`: Verifies statements with official data or confirmed sources.
   - `Conflicting`: Highlights refutations, contradictions, or documented debunkings.
   - `Background Context`: Delivers neutral contextual data for critical cross-referencing.

---

## 4. Reproducible Model Evaluation & Verified Metrics

The evaluation workflow uses the official **held-out test split (`liar_test.tsv`)**, which was completely withheld from training and validation, ensuring **zero data leakage**.

To reproduce the benchmark:
```bash
python backend/evaluation/evaluate.py 150
```

### Empirical Results (150 Held-Out Test Samples)

| Metric | Uniform Random Baseline | Majority Class Baseline (`half-true`) | Fine-Tuned BERT (VeritasAI) | Improvement vs Random |
| :--- | :---: | :---: | :---: | :---: |
| **Accuracy** | 16.67% | 20.00% | **28.00%** | **+68.0%** |
| **Macro F1** | 0.1667 | 0.0556 | **0.2605** | **+56.3%** |
| **Weighted F1** | — | — | **0.2658** | — |
| **Mean Latency (CPU)** | — | — | **26.47 ms** | — |

### Per-Class Detailed Breakdown

| Class Label | Precision | Recall | F1-Score | Support |
| :--- | :---: | :---: | :---: | :---: |
| `false` | 27.91% | **44.44%** | **0.3429** | 27 |
| `half-true` | 27.27% | 30.00% | 0.2857 | 30 |
| `mostly-true` | **30.77%** | 36.36% | 0.3333 | 22 |
| `true` | **37.50%** | 10.71% | 0.1667 | 28 |
| `barely-true` | 26.67% | 29.63% | 0.2807 | 27 |
| `pants-fire` | 20.00% | 12.50% | 0.1538 | 16 |

### 6x6 Confusion Matrix
```
                  [Predicted Class]
            false  half-true  mostly-true  true  barely-true  pants-fire
false        [ 12      5           5         2        2           1     ]
half-true    [  9      9           2         1        8           1     ]
mostly-true  [  3      3           8         1        5           2     ]
true         [  6      5           7         3        5           2     ]
barely-true  [  9      6           1         1        8           2     ]
pants-fire   [  4      5           3         0        2           2     ]
```

---

## 5. Quickstart Installation & Running Locally

### Prerequisites
- Python 3.10+ (tested on Python 3.12)
- Node.js 18+ and npm
- CPU or CUDA-compatible GPU

### Step 1: Backend Setup
```bash
# 1. Install backend requirements
pip install -r backend/requirements.txt

# 2. Run automated tests to verify model loading & endpoints
python -m pytest backend/tests/

# 3. Start the FastAPI server (runs on http://127.0.0.1:8000)
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

Interactive API documentation will be available at: `http://127.0.0.1:8000/docs`

### Step 2: Frontend Setup
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install frontend dependencies
npm install

# 3. Start Vite development server (runs on http://localhost:5173)
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 6. API Reference

### `POST /api/predict`
Analyzes a single news claim.

**Request:**
```json
{
  "statement": "Says the unemployment rate has been cut in half since he took office.",
  "include_evidence": true
}
```

**Response:**
```json
{
  "statement": "Says the unemployment rate has been cut in half since he took office.",
  "predicted_label": "barely-true",
  "confidence": 0.3022,
  "probabilities": {
    "false": 0.2701,
    "half-true": 0.2218,
    "mostly-true": 0.0777,
    "true": 0.0351,
    "barely-true": 0.3022,
    "pants-fire": 0.0931
  },
  "top_three": [
    { "label": "barely-true", "probability": 0.3022, "percentage": 30.22, "rank": 1 },
    { "label": "false", "probability": 0.2701, "percentage": 27.01, "rank": 2 },
    { "label": "half-true", "probability": 0.2218, "percentage": 22.18, "rank": 3 }
  ],
  "inference_latency_ms": 24.5,
  "device": "cpu",
  "disclaimer": "Statistical Note: Output probabilities are model-estimated likelihoods...",
  "evidence": {
    "retrieval_method": "Local Curated Benchmark Corpus",
    "items": [
      {
        "title": "Bureau of Labor Statistics: Historical Unemployment Rates",
        "url": "https://www.bls.gov/charts/employment-situation/civilian-unemployment-rate.htm",
        "source": "U.S. Bureau of Labor Statistics (BLS)",
        "snippet": "Official monthly civilian unemployment rates tracked across presidential administrations...",
        "relevance_score": 0.85,
        "alignment_category": "supporting"
      }
    ]
  }
}
```

### `POST /api/predict/batch`
Processes up to 200 statements in memory-efficient batches.

### `GET /api/health`
Returns process RSS memory, device status, and uptime.

### `GET /api/model-info`
Returns full parameter counts, token length constraints, and ontology definitions.

### `GET /api/evaluation`
Serves verified held-out test benchmarks, per-class metrics, and confusion matrix.

---

## 7. Docker Deployment

To build and run VeritasAI in a container:
```bash
# Build and run with Docker Compose
docker compose up --build
```
The container mounts `saved_model` as a read-only volume, preventing large weight duplication and conserving container disk space.

---

## 8. Automated Testing

VeritasAI includes a comprehensive test suite covering model loading, label mappings, output constraints, schema validation, and all API endpoints:
```bash
python -m pytest backend/tests/ -v
```
All **13 tests pass** with full assertion verification.
