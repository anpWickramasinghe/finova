"""
employee_tools.py — Agno tool functions for employee data retrieval.

Schema reference (backend/db/schema.ts):
  - user        (id, name, email, role, branchId, status, baseSalary, salaryType,
                 otHourlyRate, otMultiplier, epfNo, nic, phone, address, biometricId)
  - branch      (id, name, manager, employeeCount, revenue)
  - attendance  (id, userId, recordDate, checkInTime, checkOutTime, status,
                 workHours, overtimeHours, overtimeStatus, isHoliday, isWeekend)
  - leave_request (id, userId, startDate, endDate, type, status)
"""

from __future__ import annotations

import asyncio
import json
from typing import Optional

from db import get_conn, run_in_loop


def _run(coro):
    """Run an async coroutine thread-safely on the main event loop."""
    return run_in_loop(coro)


# ─── Employee List ────────────────────────────────────────────────────────────

async def _async_get_employee_list(branch_name: Optional[str] = None, role: Optional[str] = None) -> list:
    conditions = ['u.role NOT IN (\'admin\')']
    params: list = []
    param_idx = 1

    if branch_name:
        conditions.append(f"LOWER(b.name) LIKE LOWER(${param_idx})")
        params.append(f"%{branch_name}%")
        param_idx += 1

    if role:
        conditions.append(f"LOWER(u.role) = LOWER(${param_idx})")
        params.append(role)
        param_idx += 1

    where = " AND ".join(conditions)
    query = f"""
        SELECT
            u.id,
            u.name,
            u.email,
            u.role,
            u.status,
            u."salaryType",
            u."baseSalary",
            u."epfNo",
            b.name AS branch_name
        FROM "user" u
        LEFT JOIN branch b ON b.id = u."branchId"
        WHERE {where}
        ORDER BY b.name NULLS LAST, u.name
    """
    async with get_conn() as conn:
        rows = await conn.fetch(query, *params)
    return [dict(row) for row in rows]


def get_employee_list(branch_name: Optional[str] = None, role: Optional[str] = None) -> str:
    """
    List employees, with optional filters.
    - branch_name: partial match on branch name (e.g. 'Colombo')
    - role: exact role filter (e.g. 'manager', 'employee')
    Returns name, email, role, status, salary type, branch.
    """
    try:
        data = _run(_async_get_employee_list(branch_name, role))
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
            u."biometricId",
            b.name  AS branch_name
        FROM "user" u
        LEFT JOIN branch b ON b.id = u."branchId"
        WHERE LOWER(u.name) LIKE LOWER($1)
           OR u.id = $2
        ORDER BY u.name
        LIMIT 1
    """
    async with get_conn() as conn:
        row = await conn.fetchrow(query, f"%{name_or_id}%", name_or_id)
    return dict(row) if row else None


def get_employee_details(name_or_id: str) -> str:
    """
    Full profile for a specific employee by name (partial match) or exact ID.
    Returns contact info, salary config, EPF number, biometric ID, and branch.
    """
    try:
        data = _run(_async_get_employee_details(name_or_id))
        if data is None:
            return json.dumps({"error": f"No employee found matching '{name_or_id}'"})
        return json.dumps(data, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})


# ─── Employee Statistics ──────────────────────────────────────────────────────

async def _async_get_employee_stats() -> dict:
    stats_query = """
        SELECT
            COUNT(*)                                                          AS total_employees,
            COUNT(*) FILTER (WHERE u.status = 'Active')                      AS active_employees,
            COUNT(*) FILTER (WHERE u.status = 'Inactive')                    AS inactive_employees,
            COUNT(DISTINCT u."branchId") FILTER (WHERE u."branchId" IS NOT NULL) AS branch_count
        FROM "user" u
        WHERE u.role NOT IN ('admin')
    """
    salary_type_query = """
        SELECT u."salaryType", COUNT(*) AS count
        FROM "user" u
        WHERE u.role NOT IN ('admin')
        GROUP BY u."salaryType"
        ORDER BY count DESC
    """
    branch_breakdown_query = """
        SELECT
            b.name     AS branch_name,
            COUNT(u.id) AS employee_count
        FROM "user" u
        JOIN branch b ON b.id = u."branchId"
        WHERE u.role NOT IN ('admin')
        GROUP BY b.id, b.name
        ORDER BY employee_count DESC
    """
    async with get_conn() as conn:
        stats_row     = await conn.fetchrow(stats_query)
        salary_rows   = await conn.fetch(salary_type_query)
        branch_rows   = await conn.fetch(branch_breakdown_query)

    return {
        **dict(stats_row),
        "salary_type_breakdown": [dict(r) for r in salary_rows],
        "branch_breakdown":      [dict(r) for r in branch_rows],
    }


def get_employee_stats() -> str:
    """
    Company-wide employee statistics: total count, active/inactive split,
    salary type breakdown, and per-branch headcount.
    """
    try:
        data = _run(_async_get_employee_stats())
        return json.dumps(data, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})


# ─── Attendance Summary ───────────────────────────────────────────────────────

async def _async_get_attendance_summary(name_or_id: str, start_date: str, end_date: str) -> dict | None:
    """Attendance records and summary stats for one employee over a date range."""
    emp_query = """
        SELECT u.id, u.name FROM "user" u
        WHERE LOWER(u.name) LIKE LOWER($1) OR u.id = $2
        LIMIT 1
    """
    async with get_conn() as conn:
        emp = await conn.fetchrow(emp_query, f"%{name_or_id}%", name_or_id)
        if not emp:
            return None

        records_query = """
            SELECT
                CAST(a."recordDate" AS DATE) AS date,
                a.status,
                a."workHours",
                a."overtimeHours",
                a."overtimeStatus",
                a."isHoliday",
                a."isWeekend"
            FROM attendance a
            WHERE a."userId" = $1
              AND a."recordDate" >= $2::timestamptz
              AND a."recordDate" <= $3::timestamptz
            ORDER BY a."recordDate"
        """
        records = await conn.fetch(records_query, emp["id"], start_date, end_date)

    rows = [dict(r) for r in records]
    present  = sum(1 for r in rows if r["status"] == "Present")
    absent   = sum(1 for r in rows if r["status"] == "Absent")
    half_day = sum(1 for r in rows if r["status"] in ("Half Day", "HalfDay"))
    total_ot = sum(float(r["overtimeHours"] or 0) for r in rows)

    return {
        "employee": emp["name"],
        "period":   {"start": start_date, "end": end_date},
        "summary":  {
            "total_days": len(rows),
            "present":    present,
            "absent":     absent,
            "half_day":   half_day,
            "total_overtime_hours": round(total_ot, 2),
        },
        "records":  rows,
    }


def get_employee_attendance(name_or_id: str, start_date: str, end_date: str) -> str:
    """
    Attendance records and summary for an employee over a date range (YYYY-MM-DD).
    Returns daily status, work hours, overtime hours, and aggregated totals.
    """
    try:
        data = _run(_async_get_attendance_summary(name_or_id, start_date, end_date))
        if data is None:
            return json.dumps({"error": f"No employee found matching '{name_or_id}'"})
        return json.dumps(data, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})


# ─── Leave Requests ───────────────────────────────────────────────────────────

async def _async_get_leave_requests(name_or_id: Optional[str] = None, status: Optional[str] = None) -> list:
    conditions: list[str] = []
    params: list = []
    param_idx = 1

    if name_or_id:
        conditions.append(f"(LOWER(u.name) LIKE LOWER(${param_idx}) OR u.id = ${param_idx + 1})")
        params.extend([f"%{name_or_id}%", name_or_id])
        param_idx += 2

    if status:
        conditions.append(f"LOWER(lr.status) = LOWER(${param_idx})")
        params.append(status)
        param_idx += 1

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    query = f"""
        SELECT
            u.name              AS employee_name,
            b.name              AS branch_name,
            lr.type,
            CAST(lr."startDate" AS DATE) AS start_date,
            CAST(lr."endDate"   AS DATE) AS end_date,
            lr.status,
            lr.reason
        FROM leave_request lr
        JOIN "user" u  ON u.id = lr."userId"
        LEFT JOIN branch b ON b.id = u."branchId"
        {where}
        ORDER BY lr."startDate" DESC
        LIMIT 50
    """
    async with get_conn() as conn:
        rows = await conn.fetch(query, *params)
    return [dict(row) for row in rows]


def get_leave_requests(name_or_id: Optional[str] = None, status: Optional[str] = None) -> str:
    """
    Leave requests, optionally filtered by employee (name/ID) and/or status.
    - status options: 'Pending', 'Approved', 'Rejected'
    Returns employee name, branch, leave type, dates, status, and reason.
    """
    try:
        data = _run(_async_get_leave_requests(name_or_id, status))
        return json.dumps(data, default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})
