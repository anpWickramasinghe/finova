# Finova — Predictive Cash Flow Forecasting

A standalone Python microservice that uses machine learning to predict future cash flows based on historical ledger data in Supabase.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Language | Python 3.11+ |
| Framework | FastAPI |
| Server | Uvicorn |
| ML Model | RandomForestRegressor (scikit-learn) |
| Data Processing | Pandas, NumPy |
| Database | PostgreSQL (Supabase) via asyncpg |
| Env Management | python-dotenv |
| Package Manager | uv |

---

## 📁 File Structure

```
ai-core/forecasting/
├── .env              # Environment variables (DATABASE_URL)
├── pyproject.toml    # Project dependencies
├── db.py             # Database access — fetches ledger data
├── agent.py          # ML model — trains and predicts cash flow
└── server.py         # FastAPI server exposing /predict endpoint
```

---

## ⚙️ How It Works

```
┌─────────────────┐     HTTP GET      ┌─────────────────────┐
│  Node.js Backend│ ──────────────▶  │  Forecasting Service │
│  /api/forecasting│ ◀──────────────  │  :8001/predict      │
└─────────────────┘   JSON Response   └──────────┬──────────┘
                                                  │
                       ┌──────────────────────────▼──────────────────────────┐
                       │                   agent.py                          │
                       │  1. Fetch historical ledger_entry rows from DB      │
                       │  2. Fill missing dates (continuous daily series)     │
                       │  3. Engineer features (day, month, weekday, etc.)    │
                       │  4. Train RandomForestRegressor                     │
                       │  5. Predict net cash flow for next N days            │
                       └─────────────────────────────────────────────────────┘
```

### Data Source
The service queries the `ledger_entry` table joined with `chart_of_accounts`, summing `(debit - credit)` per day for all **asset** type accounts. This produces a daily net cash flow time series.

### Machine Learning
- **Model:** `RandomForestRegressor` — robust to seasonality and outliers.
- **Features:** Day of week, day of month, month, is_weekend, is_month_start, is_month_end.
- **Fallback:** If fewer than 7 days of history exist, the service returns zero-flow predictions.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- [`uv`](https://github.com/astral-sh/uv) package manager

### 1. Set up environment

Copy the backend `.env` file or create one with:

```bash
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/postgres
```

### 2. Install dependencies

```bash
uv sync
```

### 3. Start the service

```bash
uv run python server.py
# or
./.venv/bin/python server.py
```

The service starts on **http://localhost:8001**.

---

## 📡 API Endpoints

### `GET /health`
Returns service health status.

```json
{ "status": "ok" }
```

### `GET /predict?days=30`
Returns predicted cash flow for the next N days (default: 30).

**Query Params:**
| Parameter | Type | Default | Description |
|---|---|---|---|
| `days` | integer | `30` | Number of days to forecast |

**Response:**
```json
[
  {
    "date": "2026-04-24",
    "predicted_flow": 15230.50,
    "type": "inflow"
  },
  {
    "date": "2026-04-25",
    "predicted_flow": -4200.00,
    "type": "outflow"
  }
]
```

---

## 🔗 Backend Integration

The Node.js backend proxies requests to this service:

```
GET /api/forecasting/predict?days=30
```

The env variable `AI_CORE_FORECASTING_URL` controls the service URL (default: `http://localhost:8001`).

Add this to your `backend/.env`:

```env
AI_CORE_FORECASTING_URL=http://localhost:8001
```
