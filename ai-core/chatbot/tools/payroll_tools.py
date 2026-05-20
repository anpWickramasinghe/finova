"""
payroll_tools.py — Agno tool functions for payroll data retrieval.

Schema reference (backend/db/schema.ts):
  - payroll       (id, userId, month, year, salaryType, workedDays,
                   totalWorkHours, totalOvertimeHours, baseSalary,
                   totalEarnings, totalDeductions, netSalary,
                   status, paymentMethod, paymentReference, generatedAt)
  - payroll_item  (id, payrollId, componentName, type, amount)
  - user          (id, name, email, role, branchId, baseSalary, salaryType, status)
  - branch        (id, name)
"""

from __future__ import annotations

import asyncio
import json
from typing import Optional

from db import get_conn, run_in_loop


def _run(coro):
    """Run an async coroutine thread-safely on the main event loop."""
    return run_in_loop(coro)


# ─── Payroll Summary ──────────────────────────────────────────────────────────

async def _async_get_payroll_summary(month: str, year: str, branch_name: Optional[str] = None) -> dict:
    """
    Payroll totals for a month/year, grouped by status.
    Optionally scoped to a branch.
    """
    conditions = ["p.month = $1", "p.year = $2"]
    params: list = [month, year]
    param_idx = 3

    if branch_name:
        conditions.append(f"LOWER(b.name) LIKE LOWER(${param_idx})")
        params.append(f"%{branch_name}%")
        param_idx += 1

    where = " AND ".join(conditions)
    branch_join = 'LEFT JOIN branch b ON b.id = u."branchId"' if branch_name else ""

    query = f"""
        SELECT
            p.status,
            COUNT(*)                              AS employee_count,
            COALESCE(SUM(p."baseSalary"),       0) AS total_base_salary,
            COALESCE(SUM(p."totalEarnings"),    0) AS total_earnings,
            COALESCE(SUM(p."totalDeductions"),  0) AS total_deductions,
            COALESCE(SUM(p."netSalary"),        0) AS total_net_salary
        FROM payroll p
        JOIN "user" u ON u.id = p."userId"
        {branch_join}
        WHERE {where}
        GROUP BY p.status
        ORDER BY p.status
    """
    async with get_conn() as conn:
        rows = await conn.fetch(query, *params)

    breakdown = [dict(row) for row in rows]
    overall = {
        "employee_count":   sum(int(r["employee_count"])  for r in breakdown),
        "total_base_salary":  sum(float(r["total_base_salary"])  for r in breakdown),
        "total_earnings":     sum(float(r["total_earnings"])     for r in breakdown),
        "total_deductions":   sum(float(r["total_deductions"])   for r in breakdown),
        "total_net_salary":   sum(float(r["total_net_salary"])   for r in breakdown),
    }
    return {
        "month":              month,
        "year":               year,
        "branch_filter":      branch_name,
        "breakdown_by_status": breakdown,
        "overall":            overall,
    }


def get_payroll_summary(month: str, year: str, branch_name: Optional[str] = None) -> str:
    """
    Payroll summary for a given month (e.g. '5') and year (e.g. '2025').
    Optionally filter by branch_name (partial match).
    Returns totals grouped by payroll status and overall aggregates.
    """
    try:
        data = _run(_async_get_payroll_summary(month, year, branch_name))
        return json.dumps(data, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})


# ─── Individual Employee Payroll ──────────────────────────────────────────────

async def _async_get_employee_payroll(employee_identifier: str, month: str, year: str) -> dict | None:
    query = """
        SELECT
            u.name,
            u.email,
            b.name         AS branch_name,
            p.month,
            p.year,
            p."salaryType",
            p."workedDays",
            p."totalWorkHours",
            p."totalOvertimeHours",
            p."baseSalary",
            p."totalEarnings",
            p."totalDeductions",
            p."netSalary",
            p.status,
            p."paymentMethod",
            p."paymentReference",
            p."generatedAt"
        FROM payroll p
        JOIN "user" u ON u.id = p."userId"
        LEFT JOIN branch b ON b.id = u."branchId"
        WHERE (LOWER(u.name) LIKE LOWER($1) OR u.id = $1)
          AND p.month = $2
          AND p.year  = $3
        LIMIT 1
    """
    items_query = """
        SELECT
            pi."componentName",
            pi.type,
            pi.amount
        FROM payroll_item pi
        JOIN payroll p ON p.id = pi."payrollId"
        JOIN "user" u  ON u.id = p."userId"
        WHERE (LOWER(u.name) LIKE LOWER($1) OR u.id = $1)
          AND p.month = $2
          AND p.year  = $3
        ORDER BY pi.type, pi."componentName"
    """
    async with get_conn() as conn:
        row   = await conn.fetchrow(query, f"%{employee_identifier}%", month, year)
        if not row:
            return None
        items = await conn.fetch(items_query, f"%{employee_identifier}%", month, year)

    result = dict(row)
    result["items"] = [dict(i) for i in items]

    # Group items into earnings / deductions for easy reading
    result["earnings"]   = [i for i in result["items"] if i["type"] == "Earning"]
    result["deductions"] = [i for i in result["items"] if i["type"] == "Deduction"]
    return result


def get_employee_payroll(employee_name_or_id: str, month: str, year: str) -> str:
    """
    Payroll slip for an employee (name/ID) in a specific month and year.
    Returns base salary, earnings, deductions, net salary, OT hours, and all payroll items.
    """
    try:
        data = _run(_async_get_employee_payroll(employee_name_or_id, month, year))
        if data is None:
            return json.dumps({
                "error": f"No payroll record found for '{employee_name_or_id}' in {month}/{year}"
            })
        return json.dumps(data, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})


# ─── Payroll Status Overview ──────────────────────────────────────────────────

async def _async_get_payroll_status_overview(year: str) -> dict:
    query = """
        SELECT
            p.month,
            p.year,
            p.status,
            COUNT(*)                             AS record_count,
            COALESCE(SUM(p."netSalary"),    0)  AS total_net,
            COALESCE(SUM(p."totalEarnings"), 0) AS total_earnings,
            COALESCE(SUM(p."totalDeductions"), 0) AS total_deductions
        FROM payroll p
        WHERE p.year = $1
        GROUP BY p.month, p.year, p.status
        ORDER BY
            CAST(p.year AS INTEGER),
            CAST(p.month AS INTEGER),
            p.status
    """
    async with get_conn() as conn:
        rows = await conn.fetch(query, year)

    # Aggregate totals for the whole year
    records = [dict(r) for r in rows]
    return {
        "year":               year,
        "monthly_breakdown":  records,
        "year_total_net":     round(sum(float(r["total_net"]) for r in records), 2),
        "year_total_records": sum(int(r["record_count"]) for r in records),
    }


def get_payroll_status_overview(year: str) -> str:
    """
    Month-by-month payroll status overview for a year.
    Returns per-month, per-status record counts and net salary totals.
    """
    try:
        data = _run(_async_get_payroll_status_overview(year))
        return json.dumps(data, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})


# ─── Payroll Cost by Branch ───────────────────────────────────────────────────

async def _async_get_payroll_by_branch(month: str, year: str) -> list:
    query = """
        SELECT
            COALESCE(b.name, 'Unassigned') AS branch_name,
            COUNT(p.id)                     AS employee_count,
            COALESCE(SUM(p."netSalary"),    0) AS total_net_salary,
            COALESCE(SUM(p."totalEarnings"), 0) AS total_earnings,
            COALESCE(SUM(p."totalDeductions"), 0) AS total_deductions
        FROM payroll p
        JOIN "user" u ON u.id = p."userId"
        LEFT JOIN branch b ON b.id = u."branchId"
        WHERE p.month = $1
          AND p.year  = $2
        GROUP BY b.id, b.name
        ORDER BY total_net_salary DESC
    """
    async with get_conn() as conn:
        rows = await conn.fetch(query, month, year)
    return [dict(row) for row in rows]


def get_payroll_by_branch(month: str, year: str) -> str:
    """
    Payroll cost breakdown per branch for a given month/year.
    Returns headcount, total earnings, deductions, and net salary per branch.
    """
    try:
        data = _run(_async_get_payroll_by_branch(month, year))
        return json.dumps(data, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})
