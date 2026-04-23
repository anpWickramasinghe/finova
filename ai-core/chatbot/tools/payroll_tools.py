"""
payroll_tools.py — Agno tool functions for payroll data retrieval.

Tables used:
  - payroll (id, userId, month, year, baseSalary, totalEarnings, totalDeductions, netSalary, status)
  - payroll_item (id, payrollId, componentName, type, amount)
  - user (id, name, email, role, baseSalary, salaryType, status)
"""

from __future__ import annotations

import asyncio
import json
from typing import Optional

from db import get_conn


def _run(coro):
    """Run an async coroutine from a sync context.
    Safe because agent.run() is dispatched via asyncio.to_thread().
    """
    return asyncio.run(coro)


# ─── Payroll Summary ──────────────────────────────────────────────────────────

async def _async_get_payroll_summary(month: str, year: str) -> dict:
    query = """
        SELECT
            COUNT(*)                             AS employee_count,
            COALESCE(SUM(p."baseSalary"), 0)     AS total_base_salary,
            COALESCE(SUM(p."totalEarnings"), 0)  AS total_earnings,
            COALESCE(SUM(p."totalDeductions"), 0) AS total_deductions,
            COALESCE(SUM(p."netSalary"), 0)      AS total_net_salary,
            p.status
        FROM payroll p
        WHERE p.month = $1
          AND p.year  = $2
        GROUP BY p.status
        ORDER BY p.status
    """
    async with get_conn() as conn:
        rows = await conn.fetch(query, month, year)

    summary = {
        "month": month,
        "year": year,
        "breakdown_by_status": [dict(row) for row in rows],
        "overall": {
            "employee_count": sum(int(r["employee_count"]) for r in rows),
            "total_base_salary": sum(float(r["total_base_salary"]) for r in rows),
            "total_earnings": sum(float(r["total_earnings"]) for r in rows),
            "total_deductions": sum(float(r["total_deductions"]) for r in rows),
            "total_net_salary": sum(float(r["total_net_salary"]) for r in rows),
        },
    }
    return summary


def get_payroll_summary(month: str, year: str) -> str:
    """Payroll summary for a month and year. Returns totals grouped by status."""
    try:
        data = _run(_async_get_payroll_summary(month, year))
        return json.dumps(data, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})


# ─── Individual Employee Payroll ──────────────────────────────────────────────

async def _async_get_employee_payroll(employee_identifier: str, month: str, year: str) -> dict | None:
    # Try by name (case-insensitive) or user id
    query = """
        SELECT
            u.name,
            u.email,
            p.month,
            p.year,
            p."baseSalary",
            p."totalEarnings",
            p."totalDeductions",
            p."netSalary",
            p."salaryType",
            p."workedDays",
            p."totalWorkHours",
            p."totalOvertimeHours",
            p.status,
            p."paymentMethod"
        FROM payroll p
        JOIN "user" u ON u.id = p."userId"
        WHERE (LOWER(u.name) LIKE LOWER($1) OR u.id = $1)
          AND p.month = $2
          AND p.year  = $3
        LIMIT 1
    """
    async with get_conn() as conn:
        row = await conn.fetchrow(query, f"%{employee_identifier}%", month, year)

    if not row:
        return None

    # Fetch payroll items
    items_query = """
        SELECT pi."componentName", pi.type, pi.amount
        FROM payroll_item pi
        JOIN payroll p ON p.id = pi."payrollId"
        JOIN "user" u ON u.id = p."userId"
        WHERE (LOWER(u.name) LIKE LOWER($1) OR u.id = $1)
          AND p.month = $2
          AND p.year  = $3
    """
    async with get_conn() as conn:
        items = await conn.fetch(items_query, f"%{employee_identifier}%", month, year)

    result = dict(row)
    result["items"] = [dict(i) for i in items]
    return result


def get_employee_payroll(employee_name_or_id: str, month: str, year: str) -> str:
    """Individual payroll for an employee (name/ID) in a specific month/year."""
    try:
        data = _run(_async_get_employee_payroll(employee_name_or_id, month, year))
        if data is None:
            return json.dumps({"error": f"No payroll record found for '{employee_name_or_id}' in {month}/{year}"})
        return json.dumps(data, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})


# ─── Payroll Status Overview ──────────────────────────────────────────────────

async def _async_get_payroll_status_overview(year: str) -> list:
    query = """
        SELECT
            p.month,
            p.year,
            p.status,
            COUNT(*) AS count,
            COALESCE(SUM(p."netSalary"), 0) AS total_net
        FROM payroll p
        WHERE p.year = $1
        GROUP BY p.month, p.year, p.status
        ORDER BY p.year, p.month, p.status
    """
    async with get_conn() as conn:
        rows = await conn.fetch(query, year)
    return [dict(row) for row in rows]


def get_payroll_status_overview(year: str) -> str:
    """Month-by-month payroll status overview for a specific year."""
    try:
        data = _run(_async_get_payroll_status_overview(year))
        return json.dumps(data, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})
