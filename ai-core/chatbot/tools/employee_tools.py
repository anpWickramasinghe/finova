"""
employee_tools.py — Agno tool functions for employee data retrieval.

Tables used:
  - user (id, name, email, role, companyId, branchId, status, baseSalary, salaryType,
           epfNo, nic, phone, address)
  - branch (id, name, manager, employeeCount, revenue)
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


# ─── Employee List ────────────────────────────────────────────────────────────

async def _async_get_employee_list(branch_name: Optional[str] = None) -> list:
    if branch_name:
        query = """
            SELECT
                u.id,
                u.name,
                u.email,
                u.role,
                u.status,
                u."salaryType",
                u."baseSalary",
                b.name AS branch_name
            FROM "user" u
            LEFT JOIN branch b ON b.id = u."branchId"
            WHERE LOWER(b.name) LIKE LOWER($1)
              AND u.role NOT IN ('admin')
            ORDER BY u.name
        """
        async with get_conn() as conn:
            rows = await conn.fetch(query, f"%{branch_name}%")
    else:
        query = """
            SELECT
                u.id,
                u.name,
                u.email,
                u.role,
                u.status,
                u."salaryType",
                u."baseSalary",
                b.name AS branch_name
            FROM "user" u
            LEFT JOIN branch b ON b.id = u."branchId"
            WHERE u.role NOT IN ('admin')
            ORDER BY b.name, u.name
        """
        async with get_conn() as conn:
            rows = await conn.fetch(query)

    return [dict(row) for row in rows]


def get_employee_list(branch_name: Optional[str] = None) -> str:
    """List of all employees, optionally filtered by branch (partial name)."""
    try:
        data = _run(_async_get_employee_list(branch_name))
        return json.dumps(data, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})


# ─── Employee Details ─────────────────────────────────────────────────────────

async def _async_get_employee_details(name_or_id: str) -> dict | None:
    query = """
        SELECT
            u.id,
            u.name,
            u.email,
            u.phone,
            u.role,
            u.status,
            u."salaryType",
            u."baseSalary",
            u."otHourlyRate",
            u."otMultiplier",
            u."epfNo",
            u.nic,
            u.address,
            b.name  AS branch_name
        FROM "user" u
        LEFT JOIN branch b ON b.id = u."branchId"
        WHERE LOWER(u.name) LIKE LOWER($1)
           OR u.id = $1
        LIMIT 1
    """
    async with get_conn() as conn:
        row = await conn.fetchrow(query, f"%{name_or_id}%")
    return dict(row) if row else None


def get_employee_details(name_or_id: str) -> str:
    """Detailed profile for a specific employee by name (partial) or exact ID."""
    try:
        data = _run(_async_get_employee_details(name_or_id))
        if data is None:
            return json.dumps({"error": f"No employee found matching '{name_or_id}'"})
        return json.dumps(data, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})


# ─── Employee Statistics ──────────────────────────────────────────────────────

async def _async_get_employee_stats() -> dict:
    query = """
        SELECT
            COUNT(*)                         AS total_employees,
            COUNT(*) FILTER (WHERE u.status = 'Active')   AS active_employees,
            COUNT(*) FILTER (WHERE u.status = 'Inactive') AS inactive_employees,
            COUNT(DISTINCT u."branchId")     AS branch_count
        FROM "user" u
        WHERE u.role NOT IN ('admin')
    """
    salary_type_query = """
        SELECT u."salaryType", COUNT(*) AS count
        FROM "user" u
        WHERE u.role NOT IN ('admin')
        GROUP BY u."salaryType"
    """
    async with get_conn() as conn:
        stats_row = await conn.fetchrow(query)
        salary_rows = await conn.fetch(salary_type_query)

    return {
        **dict(stats_row),
        "salary_type_breakdown": [dict(r) for r in salary_rows],
    }


def get_employee_stats() -> str:
    """High-level stats: total count, status split, branch count, and salary types."""
    try:
        data = _run(_async_get_employee_stats())
        return json.dumps(data, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})
