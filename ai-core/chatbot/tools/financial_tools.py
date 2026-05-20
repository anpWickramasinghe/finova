"""
financial_tools.py — Agno tool functions for financial data retrieval.

Schema reference (backend/db/schema.ts):
  - chart_of_accounts  (id, code, name, type, subType, normalBalance, isActive, branchId)
  - ledger_entry       (id, transactionId, journalLineId, accountId, date,
                        debit, credit, runningBalance, branchId, postedAt)
  - journal_line       (id, transactionId, accountId, description, debit, credit, lineOrder)
  - transaction        (id, transactionNumber, date, description, type, status,
                        totalAmount, branchId, createdBy, approvedBy, postedAt)
  - branch             (id, name)
  - user               (id, name)
"""

from __future__ import annotations

import asyncio
import json
from typing import Optional

from db import get_conn, run_in_loop


def _run(coro):
    """Run an async coroutine thread-safely on the main event loop."""
    return run_in_loop(coro)


# ─── Profit & Loss / Financial Summary ───────────────────────────────────────

async def _async_get_financial_summary(start_date: str, end_date: str) -> dict:
    """
    P&L summary for a date range.
    Priority: ledger_entry (posted transactions) → journal_line fallback (all non-rejected).
    Uses correct normal-balance equations per account type.
    """
    # 1. Try posted ledger entries first (authoritative source)
    ledger_query = """
        SELECT
            coa.type                              AS account_type,
            coa."subType"                         AS account_subtype,
            coa.name                              AS account_name,
            COALESCE(SUM(le.debit), 0)            AS total_debit,
            COALESCE(SUM(le.credit), 0)           AS total_credit
        FROM ledger_entry le
        JOIN chart_of_accounts coa ON coa.id = le."accountId"
        WHERE le.date >= $1::timestamptz
          AND le.date <= $2::timestamptz
          AND coa.type IN ('revenue', 'expense')
        GROUP BY coa.type, coa."subType", coa.name
        ORDER BY coa.type, coa.name
    """
    async with get_conn() as conn:
        rows = await conn.fetch(ledger_query, start_date, end_date)

    source = "ledger (posted transactions)"

    # 2. Fallback: journal_line for all non-rejected transactions
    if not rows:
        jl_query = """
            SELECT
                coa.type                                      AS account_type,
                coa."subType"                                 AS account_subtype,
                coa.name                                      AS account_name,
                COALESCE(SUM(CAST(jl.debit AS NUMERIC)), 0)  AS total_debit,
                COALESCE(SUM(CAST(jl.credit AS NUMERIC)), 0) AS total_credit
            FROM journal_line jl
            JOIN transaction t  ON t.id  = jl."transactionId"
            JOIN chart_of_accounts coa ON coa.id = jl."accountId"
            WHERE t.status != 'rejected'
              AND t.date >= $1::timestamptz
              AND t.date <= $2::timestamptz
              AND coa.type IN ('revenue', 'expense')
            GROUP BY coa.type, coa."subType", coa.name
            ORDER BY coa.type, coa.name
        """
        async with get_conn() as conn:
            rows = await conn.fetch(jl_query, start_date, end_date)
        source = "journal lines (pre-posting)"

    result: dict = {
        "period": {"start": start_date, "end": end_date},
        "source": source,
        "revenue": [],
        "expense": [],
        "total_revenue": 0.0,
        "total_expenses": 0.0,
        "net_income": 0.0,
    }

    for row in rows:
        debit  = float(row["total_debit"])
        credit = float(row["total_credit"])
        atype  = row["account_type"]

        if atype == "revenue":
            net = credit - debit          # revenue normal balance: credit
            result["revenue"].append({
                "account": row["account_name"],
                "subtype": row["account_subtype"],
                "amount": round(net, 2),
            })
            result["total_revenue"] += net
        elif atype == "expense":
            net = debit - credit          # expense normal balance: debit
            result["expense"].append({
                "account": row["account_name"],
                "subtype": row["account_subtype"],
                "amount": round(net, 2),
            })
            result["total_expenses"] += net

    result["total_revenue"]  = round(result["total_revenue"],  2)
    result["total_expenses"] = round(result["total_expenses"], 2)
    result["net_income"]     = round(result["total_revenue"] - result["total_expenses"], 2)
    return result


def get_financial_summary(start_date: str, end_date: str) -> str:
    """
    Profit & Loss statement for a date range (YYYY-MM-DD to YYYY-MM-DD).
    Returns itemised revenue and expense accounts with subtotals and net income.
    Falls back to journal lines if no posted ledger entries exist yet.
    """
    try:
        data = _run(_async_get_financial_summary(start_date, end_date))
        return json.dumps(data, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})


# ─── Trial Balance ────────────────────────────────────────────────────────────

async def _async_get_trial_balance(start_date: Optional[str] = None, end_date: Optional[str] = None) -> dict:
    """
    Trial balance grouped by account type.
    Optionally filtered to a date range (ledger_entry.date).
    Falls back to journal_line if no ledger data exists.
    """
    date_filter = ""
    params: list = []
    if start_date and end_date:
        date_filter = "AND le.date >= $1::timestamptz AND le.date <= $2::timestamptz"
        params = [start_date, end_date]

    ledger_query = f"""
        SELECT
            coa.code,
            coa.name,
            coa.type,
            coa."subType"                       AS subtype,
            coa."normalBalance"                 AS normal_balance,
            COALESCE(SUM(le.debit), 0)          AS total_debit,
            COALESCE(SUM(le.credit), 0)         AS total_credit
        FROM chart_of_accounts coa
        LEFT JOIN ledger_entry le ON le."accountId" = coa.id {date_filter}
        WHERE coa."isActive" = true
        GROUP BY coa.id, coa.code, coa.name, coa.type, coa."subType", coa."normalBalance"
        HAVING COALESCE(SUM(le.debit), 0) != 0
            OR COALESCE(SUM(le.credit), 0) != 0
        ORDER BY coa.code
    """
    async with get_conn() as conn:
        rows = await conn.fetch(ledger_query, *params)

    source = "ledger"
    if not rows and start_date and end_date:
        # Fallback to journal_line
        jl_query = """
            SELECT
                coa.code,
                coa.name,
                coa.type,
                coa."subType"                               AS subtype,
                coa."normalBalance"                         AS normal_balance,
                COALESCE(SUM(CAST(jl.debit AS NUMERIC)), 0)  AS total_debit,
                COALESCE(SUM(CAST(jl.credit AS NUMERIC)), 0) AS total_credit
            FROM chart_of_accounts coa
            JOIN journal_line jl ON jl."accountId" = coa.id
            JOIN transaction t   ON t.id = jl."transactionId"
            WHERE coa."isActive" = true
              AND t.status != 'rejected'
              AND t.date >= $1::timestamptz
              AND t.date <= $2::timestamptz
            GROUP BY coa.id, coa.code, coa.name, coa.type, coa."subType", coa."normalBalance"
            ORDER BY coa.code
        """
        async with get_conn() as conn:
            rows = await conn.fetch(jl_query, start_date, end_date)
        source = "journal"

    accounts = []
    for row in rows:
        d = float(row["total_debit"])
        c = float(row["total_credit"])
        nb = row["normal_balance"]
        net = (c - d) if nb == "credit" else (d - c)
        accounts.append({
            "code":           row["code"],
            "name":           row["name"],
            "type":           row["type"],
            "subtype":        row["subtype"],
            "normal_balance": nb,
            "total_debit":    round(d, 2),
            "total_credit":   round(c, 2),
            "net_balance":    round(net, 2),
        })

    total_debit  = sum(a["total_debit"]  for a in accounts)
    total_credit = sum(a["total_credit"] for a in accounts)
    return {
        "source":       source,
        "accounts":     accounts,
        "total_debit":  round(total_debit,  2),
        "total_credit": round(total_credit, 2),
        "is_balanced":  abs(total_debit - total_credit) < 0.01,
    }


def get_trial_balance(start_date: Optional[str] = None, end_date: Optional[str] = None) -> str:
    """
    Trial balance for all active accounts.
    Optionally provide start_date and end_date (YYYY-MM-DD) to scope to a period.
    Returns debits, credits, net balance per account, and a balanced indicator.
    """
    try:
        data = _run(_async_get_trial_balance(start_date, end_date))
        return json.dumps(data, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})


# ─── Recent Transactions ──────────────────────────────────────────────────────

async def _async_get_recent_transactions(limit: int = 10, status_filter: Optional[str] = None) -> list:
    conditions = ["t.status != 'rejected'"]
    params: list = []
    param_idx = 1

    if status_filter:
        conditions.append(f"t.status = ${param_idx}")
        params.append(status_filter)
        param_idx += 1

    where = " AND ".join(conditions)
    params.append(limit)

    query = f"""
        SELECT
            t."transactionNumber",
            t.date,
            t.description,
            t.reference,
            t.type,
            t.status,
            t."totalAmount",
            b.name   AS branch_name,
            creator.name AS created_by
        FROM transaction t
        LEFT JOIN branch b        ON b.id = t."branchId"
        LEFT JOIN "user" creator  ON creator.id = t."createdBy"
        WHERE {where}
        ORDER BY t.date DESC
        LIMIT ${param_idx}
    """
    async with get_conn() as conn:
        rows = await conn.fetch(query, *params)
    return [dict(row) for row in rows]


def get_recent_transactions(limit: int = 10, status_filter: Optional[str] = None) -> str:
    """
    Recent transactions ordered by date descending.
    - limit: 1–50, default 10
    - status_filter: optional, one of 'draft', 'pending_approval', 'approved', 'posted', 'reconciled'
    """
    try:
        safe_limit = min(int(limit), 50)
        data = _run(_async_get_recent_transactions(safe_limit, status_filter))
        return json.dumps(data, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})


# ─── Single Transaction Detail ────────────────────────────────────────────────

async def _async_get_transaction_detail(transaction_number: str) -> dict | None:
    query = """
        SELECT
            t.id,
            t."transactionNumber",
            t.date,
            t.description,
            t.reference,
            t.type,
            t.status,
            t."totalAmount",
            t.notes,
            t."approvedAt",
            t."postedAt",
            b.name      AS branch_name,
            creator.name AS created_by,
            approver.name AS approved_by
        FROM transaction t
        LEFT JOIN branch b         ON b.id = t."branchId"
        LEFT JOIN "user" creator   ON creator.id = t."createdBy"
        LEFT JOIN "user" approver  ON approver.id = t."approvedBy"
        WHERE t."transactionNumber" = $1
        LIMIT 1
    """
    lines_query = """
        SELECT
            jl.description,
            jl.debit,
            jl.credit,
            jl."lineOrder",
            coa.code  AS account_code,
            coa.name  AS account_name,
            coa.type  AS account_type
        FROM journal_line jl
        JOIN chart_of_accounts coa ON coa.id = jl."accountId"
        WHERE jl."transactionId" = $1
        ORDER BY jl."lineOrder"
    """
    async with get_conn() as conn:
        row = await conn.fetchrow(query, transaction_number)
        if not row:
            return None
        lines = await conn.fetch(lines_query, row["id"])

    result = dict(row)
    result["journal_lines"] = [dict(l) for l in lines]
    return result


def get_transaction_detail(transaction_number: str) -> str:
    """
    Full detail for a single transaction by its number (e.g. TXN-20240101-001).
    Returns header info and all journal lines with account details.
    """
    try:
        data = _run(_async_get_transaction_detail(transaction_number))
        if data is None:
            return json.dumps({"error": f"Transaction '{transaction_number}' not found."})
        return json.dumps(data, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})
