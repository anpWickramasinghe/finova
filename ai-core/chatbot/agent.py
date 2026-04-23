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
)
from tools.payroll_tools import (
    get_payroll_summary,
    get_employee_payroll,
    get_payroll_status_overview,
)
from tools.employee_tools import (
    get_employee_list,
    get_employee_details,
    get_employee_stats,
)

load_dotenv()

# ─── System Prompt ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """
You are **Nova**, a financial assistant for Finova. Help admins with finances, payroll, and employees using the provided tools.

## Guidelines:
- Use tools to get real data; never guess numbers.
- Resolve relative dates (e.g., "last month") to YYYY-MM-DD.
- Format currency as "LKR #,###.00".
- Be professional, concise, and use markdown tables/lists.
- No raw IDs; No fabrications.
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
            get_financial_summary,
            get_trial_balance,
            get_recent_transactions,
            get_payroll_summary,
            get_employee_payroll,
            get_payroll_status_overview,
            get_employee_list,
            get_employee_details,
            get_employee_stats,
        ],
        markdown=True,
    )
