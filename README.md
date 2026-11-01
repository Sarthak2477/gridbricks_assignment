# AeroGrid Desk ⚡️
### UK Day-Ahead Wind Forecast & Thermal Procurement Decision Intelligence

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)
[![Tests](https://img.shields.io/badge/Pytest-Passing-brightgreen.svg)]()

> **Live Deployment:** [https://aerogrid-desk.vercel.app](https://aerogrid-desk.vercel.app) *(or Heroku/Render container)*  
> **Video Demo:** [Unlisted YouTube Link](https://www.youtube.com/watch?v=placeholder) *(5-min Client Pitch + 5-min Tech Review)*

---

## 1. Executive Summary & Problem Setting

The client is an energy utility in the UK responsible for purchasing electricity from the wholesale market to meet consumer demand.

Electricity cannot be stored cost-effectively at national scale, requiring supply and demand to be physically balanced across every 30-minute settlement period. To procure required power beyond intermittent wind generation (e.g. from thermal/gas power plants or wholesale day-ahead auctions), decisions must be executed **one day before the delivery day ($D-1$)** before market gate closure (standard: **12:00 noon UK local time**).

### Core Capabilities Delivered:
1. **Day-Ahead Forecast Desk (Requirement 1):** Delivers the latest wind generation forecasts available at gate closure on $D-1$ for every half-hour of the delivery day in January 2026, strictly eliminating Look-Ahead Bias ("The No-Peeking Rule").
2. **Quantitative Accuracy & Uncertainty Analytics (Requirement 2):** Benchmarks historical decision-time forecasts against Elexon `FUELHH` outturn actuals, calculating MAE, RMSE, Forecast Bias, and the $P90$ Value-at-Risk spinning reserve margin.
3. **Net Procurement & Imbalance Risk Simulator (Commercial Value Add):** Models consumer demand curves, offsets predicted wind, and calculates net thermal purchase volumes and recommended risk reserves to protect against system cash-out penalties.

---

## 2. System Architecture

```
 ┌─────────────────────────────────────────────────────────────┐
 │                      React Frontend                         │
 │        Vite + TypeScript + Tailwind CSS + Recharts          │
 └──────────────────────────────┬──────────────────────────────┘
                                │ HTTP REST / JSON
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                   FastAPI Transport Layer                   │
 │                     backend/app/main.py                     │
 └──────────────┬──────────────────────────────┬───────────────┘
                │                              │
                ▼                              ▼
 ┌─────────────────────────────┐ ┌─────────────────────────────┐
 │       Domain Logic Core     │ │   Data Ingestion & Caching  │
 │      backend/app/logic.py   │ │    backend/app/elexon.py    │
 │ (Pure functions, zero I/O)  │ │ (2-Tier RAM + Disk Cache)   │
 └─────────────────────────────┘ └─────────────┬───────────────┘
                                               │ HTTPX
                                               ▼
                                 ┌─────────────────────────────┐
                                 │   Elexon BMRS Live Stream   │
                                 │      (WINDFOR & FUELHH)     │
                                 └─────────────────────────────┘
```

### Key Engineering Features:
- **Zero Look-Ahead Bias:** Implemented via timezone-aware Python `Europe/London` datetime calculations converted to UTC. Only forecasts with `publishTime <= cutoff_utc` on $D-1$ are selected.
- **Two-Tier Caching:** In-memory dictionary cache for sub-millisecond warm queries, backed by disk pickle serialization to insulate against Elexon API latency and rate-limiting.
- **Batch Range Fetching:** Reduced 62 consecutive day-by-day HTTP calls into 2 temporal window requests, reducing query time from ~30s to <2s.

---

## 3. Directory Structure

```text
.
├── Dockerfile                   # Multi-stage production container (Node build + Python runtime)
├── docker-compose.yml           # Single-command local container orchestration
├── README.md                    # Project documentation, methodology & user guide
├── backend/
│   ├── requirements.txt         # FastAPI, Uvicorn, Pandas, HTTPX, Pytest
│   ├── test_logic.py            # Cutoff, no-peeking, error metrics, and join tests
│   ├── test_caching.py          # Cache hit/miss and disk persistence tests
│   └── app/
│       ├── __init__.py
│       ├── main.py              # FastAPI endpoints & static frontend serving
│       ├── logic.py             # Pure mathematical domain functions (zero I/O)
│       └── elexon.py            # Elexon BMRS API client with two-tier caching
└── frontend/
    ├── package.json             # React 18, Vite, TypeScript, Tailwind, Recharts
    ├── vite.config.ts           # Development proxy & build configuration
    ├── tailwind.config.js       # Utility energy desk theme & dark palette
    ├── vercel.json              # Vercel deployment & API rewrites configuration
    ├── index.html
    └── src/
        ├── App.tsx              # Root component & global state orchestration
        ├── types/               # TypeScript interfaces & domain schemas
        ├── services/api.ts      # REST API client with offline telemetry fallback
        └── components/
            ├── Header.tsx       # Brand header, BMRS status, and methodology trigger
            ├── ControlBar.tsx   # Date picker, cutoff slider, and temporal validation
            ├── DayAheadView.tsx # Requirement 1: 48 Settlement Period forecast desk
            ├── AccuracyView.tsx # Requirement 2: MAE, RMSE, Bias, and P90 analytics
            ├── ProcurementSimulator.tsx # Commercial net thermal procurement simulator
            └── MethodologyModal.tsx     # Domain walkthrough for pitch & tech review
```

---

## 4. How to Start the Application

### Option A: Using Docker (Recommended)

Run the entire full-stack application inside a single container:

```bash
docker compose up --build
```
Open your browser at **[http://localhost:8000](http://localhost:8000)**.

---

### Option B: Local Development Setup

#### 1. Backend (Python 3.12)
```bash
cd backend

# Create and activate virtual environment
python -m venv .env
# Windows (PowerShell):
.\.env\Scripts\Activate.ps1
# macOS / Linux:
source .env/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run automated tests
pytest

# Start the API server
uvicorn app.main:app --reload --port 8000
```
* Interactive Swagger Docs: **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**

#### 2. Frontend (React + Vite)
In a new terminal:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server with hot module reloading
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)**. All `/api` requests are automatically proxied to the backend.

---

## 5. Verification & Automated Testing

Run the test suite from the project root:
```bash
.\backend\.env\Scripts\python.exe -m pytest backend/ -v
```
**Test Coverage Includes:**
- `test_cutoff_winter_is_utc`: Validates daylight saving and UTC gate closure alignment.
- `test_no_peeking_and_latest_wins`: Guarantees post-cutoff forecasts are discarded and latest pre-cutoff prediction is chosen.
- `test_error_metrics`: Verifies analytic calculations against ground-truth values.
- `test_join_sign_convention`: Enforces industry standard error sign convention ($Forecast - Actual$).
- `test_cache_mechanism`: Validates memory and disk cache serialization.

---

## 6. AI Tools Disclosure

In accordance with the assignment guidelines, AI assistance tools (Google Antigravity / Gemini) were utilized during the development of this project for:
- Accelerated scaffolding of TypeScript interfaces and Tailwind component styling.
- Domain logic formulation and vectorization optimization using Pandas.
- Unit test structure generation for temporal gate closure verification.
- Technical architecture review and documentation formatting.

All algorithmic logic, statistical formulas, edge-case handling, and architectural designs were independently verified, tested, and reviewed.

