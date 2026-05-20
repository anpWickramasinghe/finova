"""
agent.py — Agno Agent definition for the Finova financial chatbot.

The agent is configured with:
  - OpenAI gpt-4o-mini as the LLM
  - Custom tool functions for financial, payroll, and employee data
  - Persistent conversation history per session (managed in server.py)
  - A detailed system prompt tuned to the Finova domain
"""

from __future__ import annotations

import os
from dotenv import load_dotenv

from agno.agent import Agent
from agno.models.google import Gemini

from tools.financial_tools import (
    get_financial_summary,
    get_trial_balance,
    get_recent_transactions,
    get_transaction_detail,
)
from tools.payroll_tools import (
    get_payroll_summary,
    get_employee_payroll,
    get_payroll_status_overview,
    get_payroll_by_branch,
)
from tools.employee_tools import (
    get_employee_list,
    get_employee_details,
    get_employee_stats,
    get_employee_attendance,
    get_leave_requests,
)

load_dotenv()

# ─── System Prompt ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """
You are **Nova**, a financial assistant for Finova. Help admins with finances, payroll, and employees using the provided tools.

## Guidelines:
- **Always use tools** to get real data; never guess numbers.
- **Resolve relative dates** (e.g., "last month", "this year") to exact YYYY-MM-DD using today's date injected at the start of each message.
- **Format currency** as "LKR #,###.00".
- **Format output** using markdown tables and bullet lists. Be concise.
- **No raw IDs** in responses; use names instead.
- **No fabrications** — if data is missing, say so clearly.

## Available Tools:
| Tool | Use when |
|------|----------|
| get_financial_summary | P&L for a date range — revenue, expenses, net income |
| get_trial_balance | Current or period trial balance by account |
| get_recent_transactions | Latest transactions, optionally by status |
| get_transaction_detail | Full detail for a specific transaction number |
| get_payroll_summary | Payroll totals for a month/year, optionally by branch |
| get_employee_payroll | Individual payslip with all items |
| get_payroll_status_overview | Year-wide monthly payroll status |
| get_payroll_by_branch | Branch payroll cost comparison for a month |
| get_employee_list | All employees, filter by branch or role |
| get_employee_details | Full profile for one employee |
| get_employee_stats | Company-wide headcount and breakdown stats |
| get_employee_attendance | Daily attendance and OT for an employee in a date range |
| get_leave_requests | Leave requests, filter by employee or status |
""".strip()



# ─── Agent Factory ────────────────────────────────────────────────────────────

def build_agent(session_id: str) -> Agent:
    """
    Create and return a new Agno Agent instance bound to a specific session.
    Each session gets its own conversation history (managed internally by Agno).
    """
    return Agent(
        name="Nova",
        model=Gemini(
            id="gemini-2.5-flash",
            api_key=os.getenv("GOOGLE_API_KEY"),
        ),
        description=SYSTEM_PROMPT,
        session_id=session_id,
        num_history_messages=8,
        tools=[
            # Financial
            get_financial_summary,
            get_trial_balance,
            get_recent_transactions,
            get_transaction_detail,
            # Payroll
            get_payroll_summary,
            get_employee_payroll,
            get_payroll_status_overview,
            get_payroll_by_branch,
            # Employee
            get_employee_list,
            get_employee_details,
            get_employee_stats,
            get_employee_attendance,
            get_leave_requests,
        ],
        markdown=True,
    )
