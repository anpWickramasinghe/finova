# Finova AI Chatbot — `ai-core/chatbot`

AI-powered financial assistant microservice for Finova admins. Built with **Agno** (agent framework) + **FastAPI**, managed by **uv**.

The Node.js backend at `backend/controllers/chatController.ts` proxies admin chat requests to this service via `POST /chat` and `DELETE /chat/{session_id}`.

## Prerequisites

- Python 3.11+
- [uv](https://docs.astral.sh/uv/) — `curl -LsSf https://astral.sh/uv/install.sh | sh`
- A running PostgreSQL database (same as `backend/.env`)
- An OpenAI API key

## Setup

```bash
# 1. Navigate to this directory
cd ai-core/chatbot

# 2. Copy env template and fill in your values
cp .env.example .env

# 3. Install dependencies using uv
uv sync
```

### `.env` Variables

| Variable | Description | Required |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI API key (sk-...) | ✅ |
| `DATABASE_URL` | PostgreSQL connection string (same as backend) | ✅ |
| `BETTER_AUTH_SECRET` | Shared JWT secret with Node.js backend | ✅ |
| `OPENAI_MODEL` | Model ID to use (default: `gpt-4o-mini`) | optional |
| `CHATBOT_PORT` | Port to listen on (default: `8000`) | optional |

## Running

```bash
# Development (auto-reload)
uv run python server.py

# Production
uv run uvicorn server:app --host 0.0.0.0 --port 8000
```

The service starts at **http://localhost:8000**.

## API Endpoints

### `POST /chat`
Send a message to the Nova assistant.

**Request:**
```json
{
  "message": "What is our revenue for April 2025?",
  "session_id": "user-id-xyz"
}
```

**Response:**
```json
{
  "response": "For April 2025, total revenue was **LKR 524,000.00** ...",
  "session_id": "user-id-xyz",
  "timestamp": "2025-04-21T17:45:00+00:00"
}
```

### `DELETE /chat/{session_id}`
Clear conversation history for a session.

### `GET /health`
Returns `{"status": "ok"}`.

## Architecture

```
ai-core/chatbot/
├── pyproject.toml       # uv dependency config
├── .env.example         # environment variable template
├── server.py            # FastAPI app + endpoints
├── agent.py             # Agno Agent with system prompt & tools
├── db.py                # asyncpg connection pool
└── tools/
    ├── financial_tools.py   # P&L, trial balance, transactions
    ├── payroll_tools.py     # payroll summaries & individual payslips
    └── employee_tools.py    # employee list, details, stats
```

## Example Queries

| Question | Tools Called |
|---|---|
| "What is total revenue this month?" | `get_financial_summary` |
| "Show trial balance" | `get_trial_balance` |
| "Payroll summary for March 2025" | `get_payroll_summary` |
| "What is John's salary for April?" | `get_employee_payroll` |
| "List all employees in Colombo branch" | `get_employee_list` |
| "How many active employees do we have?" | `get_employee_stats` |