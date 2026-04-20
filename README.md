# spend-mind-analyzer

> AI-powered mood + spending pattern analyzer — correlate your emotions with your expenses and surface actionable insights.

[![CI](https://github.com/0205prakriti/spend-mind-analyzer/actions/workflows/ci.yml/badge.svg)](https://github.com/0205prakriti/spend-mind-analyzer/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Table of Contents

1. [Features](#features)
2. [Architecture Overview](#architecture-overview)
3. [Quick Start](#quick-start)
   - [Backend](#backend)
   - [Frontend](#frontend)
4. [Environment Variables](#environment-variables)
5. [Running Tests & CI](#running-tests--ci)
6. [Contributing](#contributing)
7. [License](#license)

---

## Features

- **Mood detection** — Analyzes text entries with a transformer model (DistilBERT by default) to classify emotional tone.
- **Spending correlation** — Pairs mood scores with transaction records to reveal patterns (e.g. stress → impulse purchases).
- **Interactive dashboard** — React frontend with Chart.js visualizations of mood vs. spend trends.
- **REST API** — FastAPI backend with SQLAlchemy ORM; fully documented via `/docs` (Swagger UI).

---

## Architecture Overview

```
spend-mind-analyzer/
├── backend/          # FastAPI application
│   ├── main.py           # API entrypoint & route definitions
│   ├── database.py       # SQLAlchemy models & session factory
│   ├── mood_detector.py  # HuggingFace Transformers inference
│   ├── correlation_engine.py  # Pandas-based correlation logic
│   └── requirements.txt  # Python dependencies
├── frontend/         # React application
│   ├── src/              # Components, pages, hooks
│   ├── public/           # Static assets
│   └── package.json      # Node dependencies & scripts
├── .env.example      # Documented environment variables
├── requirements.txt  # (root) pinned Python deps mirror
└── LICENSE
```

---

## Quick Start

### Prerequisites

| Tool | Minimum version |
|------|----------------|
| Python | 3.10 |
| Node.js | 18 |
| npm | 8 |

### Backend

```bash
# 1. Clone the repository
git clone https://github.com/0205prakriti/spend-mind-analyzer.git
cd spend-mind-analyzer

# 2. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# 3. Install Python dependencies
pip install -r backend/requirements.txt

# 4. Copy environment variables and edit as needed
cp .env.example .env

# 5. Start the API server
uvicorn backend.main:app --reload --port 8000
```

The API will be available at <http://localhost:8000> and interactive docs at <http://localhost:8000/docs>.

### Frontend

```bash
# From the repo root (in a separate terminal)
cd frontend
npm install
npm start
```

The React app will open at <http://localhost:3000> and proxy API requests to the backend automatically.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values appropriate for your environment.

| Variable | Default / Example | Description |
|----------|-------------------|-------------|
| `DATABASE_URL` | `sqlite:///./dev.db` | SQLAlchemy connection string |
| `SECRET_KEY` | `changeme` | Secret used for session signing / JWT — **change in production** |
| `TRANSFORMER_MODEL` | `distilbert-base-uncased` | HuggingFace model ID used for mood detection |
| `DEBUG` | `true` | Enable verbose logging & auto-reload |

See [`.env.example`](.env.example) for the full template.

---

## Running Tests & CI

### Run backend tests locally

```bash
# With virtual environment activated
pip install pytest
pytest -q
```

> **Note:** No automated tests exist yet. The CI job currently runs a smoke import check (`python -c "import fastapi, uvicorn, pandas"`) until a `tests/` directory is added.

### Run frontend tests locally

```bash
cd frontend
npm test
```

### Continuous Integration

Every push to `main` and every pull request triggers the [CI workflow](.github/workflows/ci.yml), which:

- **Frontend job** — installs Node 18 dependencies (`npm ci`), builds the app (`npm run build`), and runs tests if present.
- **Backend job** — installs Python 3.10 dependencies, lints with `flake8`, and runs `pytest` (or a smoke-import check if no tests exist yet).

---

## Contributing

1. Fork the repo and create a feature branch (`git checkout -b feat/my-feature`).
2. Make your changes and add/update tests where applicable.
3. Ensure `flake8` and `npm run build` pass locally.
4. Open a pull request against `main` with a clear description of the change.

**Planned follow-ups:**
- [ ] Add pytest unit tests for API endpoints and the correlation engine.
- [ ] Pin frontend dependencies with a `package-lock.json` lockfile.
- [ ] Add Black / isort formatter checks to CI.
- [ ] Add Dockerfile(s) for containerised deployment.

---

## License

This project is licensed under the [MIT License](LICENSE).
