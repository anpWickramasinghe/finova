"""
financial_tools.py — Agno tool functions for financial data retrieval.

These functions are registered as tools on the Agno agent. They query the
PostgreSQL database directly using the asyncpg pool from db.py.

Tables used:
  - ledger_entry (transactionId, accountId, date, debit, credit, runningBalance, branchId)
  - chart_of_accounts (id, code, name, type, subType)
  - transaction (id, transactionNumber, date, description, type, status, totalAmount, branchId)
"""

from __future__ import annotations

import asyncio
import json
from datetime import date, datetime, timezone
from typing import Optional

from db import get_conn


def _run(coro):
    """Run an async coroutine from a sync context.
    Safe to call because agent.run() is always dispatched via asyncio.to_thread().
    """
    return asyncio.run(coro)


# ─── Financial Summary / P&L ─────────────────────────────────────────────────

async def _async_get_financial_summary(start_date: str, end_date: str) -> dict:
    """
    Returns a Profit & Loss summary for the given date range.
    Groups ledger entries by account type (revenue vs expense).
    """
    query = """
        SELECT
            coa.type                             AS account_type,
            coa.subType                          AS account_subtype,
            coa.name                             AS account_name,
            COALESCE(SUM(le.credit - le.debit), 0) AS net_amount
        FROM ledger_entry le
        JOIN chart_of_accounts coa ON coa.id = le."accountId"
        WHERE le.date >= $1::timestamptz
          AND le.date <= $2::timestamptz
        GROUP BY coa.type, coa."subType", coa.name
        ORDER BY coa.type, net_amount DESC
    """
    async with get_conn() as conn:
        rows = await conn.fetch(query, start_date, end_date)

    result = {"revenue": [], "expense": [], "total_revenue": 0.0, "total_expenses": 0.0}
    for row in rows:
        entry = {"account": row["account_name"], "amount": float(row["net_amount"])}
        if row["account_type"] == "revenue":
            result["revenue"].append(entry)
            result["total_revenue"] += float(row["net_amount"])
        elif row["account_type"] == "expense":
            result["expense"].append(entry)
            result["total_expenses"] += float(row["net_amount"])

    result["net_income"] = result["total_revenue"] - result["total_expenses"]
    return result


def get_financial_summary(start_date: str, end_date: str) -> str:
    """P&L summary for a date range (YYYY-MM-DD). Returns revenue, expenses, and net income."""
    try:
        data = _run(_async_get_financial_summary(start_date, end_date))
        return json.dumps(data, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})


# ─── Trial Balance ────────────────────────────────────────────────────────────

async def _async_get_trial_balance() -> list:
    query = """
        SELECT
            coa.code,
            coa.name,
            coa.type,
            COALESCE(SUM(le.debit), 0)  AS total_debit,
            COALESCE(SUM(le.credit), 0) AS total_credit,
            COALESCE(SUM(le.credit - le.debit), 0) AS balance
        FROM chart_of_accounts coa
        LEFT JOIN ledger_entry le ON le."accountId" = coa.id
        WHERE coa."isActive" = true
        GROUP BY coa.id, coa.code, coa.name, coa.type
        HAVING COALESCE(SUM(le.debit), 0) != 0
            OR COALESCE(SUM(le.credit), 0) != 0
        ORDER BY coa.code
    """
    async with get_conn() as conn:
        rows = await conn.fetch(query)
    return [dict(row) for row in rows]


def get_trial_balance() -> str:
    """Current trial balance for all active accounts with debits, credits, and net balances."""
    try:
        data = _run(_async_get_trial_balance())
        return json.dumps(data, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})


# ─── Recent Transactions ──────────────────────────────────────────────────────

async def _async_get_recent_transactions(limit: int = 10) -> list:
    query = """
        SELECT
            t."transactionNumber",
            t.date,
            t.description,
            t.type,
            t.status,
            t."totalAmount",
            b.name AS branch_name
        FROM transaction t
        LEFT JOIN branch b ON b.id = t."branchId"
        WHERE t.status IN ('posted', 'approved')
        ORDER BY t.date DESC
        LIMIT $1
    """
    async with get_conn() as conn:
        rows = await conn.fetch(query, limit)
    return [dict(row) for row in rows]


def get_recent_transactions(limit: int = 10) -> str:
    """Latest posted/approved transactions (limit: 1-50, default 10)."""
    try:
        safe_limit = min(int(limit), 50)
        data = _run(_async_get_recent_transactions(safe_limit))
        return json.dumps(data, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})
