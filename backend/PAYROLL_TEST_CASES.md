# Payroll Controller — Test Cases

**File:** `controllers/payrollController.ts`  
**Total Identified Test Cases:** 42  
**Testing Strategy:** Express + Supertest integration pattern with mocked Drizzle ORM and Stripe service

---

## Overview of Payroll Lifecycle

```
[Generate Draft] → Draft → Pending Approval → Approved → Paid
                                           ↘ Rejected → (re-generate)
```

The controller also manages a full **double-entry journal** when payroll is approved, and supports **Stripe payouts** when marking as Paid.

---

## 1. `generatePayroll` — Generate a Single Employee's Payroll

Fetches attendance, applies overtime multipliers, calculates EPF/ETF, and creates or updates a draft payroll record.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **GP-01** | Missing `userId` in body | `400 Bad Request` | 400 | Required field guard fires before DB calls |
| **GP-02** | Missing `month` in body | `400 Bad Request` | 400 | Month is required for the payroll period |
| **GP-03** | Missing `year` in body | `400 Bad Request` | 400 | Year is required for the payroll period |
| **GP-04** | `userId` does not match any user in DB | `500` (thrown error bubbles up) | 500 | `calculateEmployeePayroll` throws `User not found` |
| **GP-05** | Valid request — user with `FixedWithOvertime` salary type | `200 OK`, draft payroll with OT calculated | 200 | Standard employee: base salary + overtime applied |
| **GP-06** | Valid request — user with `FixedNoOvertime` salary type | `200 OK`, `totalOvertimePay: 0` | 200 | OT zeroed out when salary type is `FixedNoOvertime` |
| **GP-07** | Valid request — user with `Daily` salary type | `200 OK`, grossBase = `workedDays × baseSalary` | 200 | Daily rate applied per worked day count |
| **GP-08** | Existing payroll with `Draft` status — regenerates it | `200 OK`, existing record updated | 200 | Draft records can be overwritten with fresh calculations |
| **GP-09** | Existing payroll with `Approved` status — blocked | `500` with message `Cannot regenerate payroll` | 500 | Non-draft records are protected from regeneration |

---

## 2. `bulkGeneratePayroll` — Generate Payroll for All Active Employees

Loops over all active users and runs `calculateEmployeePayroll` for each.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **BG-01** | Missing `month` in body | `400 Bad Request` | 400 | Required field guard fires |
| **BG-02** | Missing `year` in body | `400 Bad Request` | 400 | Required field guard fires |
| **BG-03** | No active employees in DB | `404 No active employees found` | 404 | Empty user query returns early with 404 |
| **BG-04** | All employees process successfully | `200 OK`, `results` array all `success: true` | 200 | Each employee processed; success count matches total |
| **BG-05** | One employee fails (e.g. bad salary data) | `200 OK`, that employee in `results` with `success: false` | 200 | Per-employee errors collected; others still processed |

---

## 3. `bulkSubmitApproval` — Submit Multiple Drafts for Approval

Batch updates payroll records from `Draft` → `Pending Approval`.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **BA-01** | Missing `payrollIds` field | `400 Missing required payroll IDs` | 400 | Null check fires before DB call |
| **BA-02** | `payrollIds` is not an array | `400 Missing required payroll IDs` | 400 | Type check rejects non-array input |
| **BA-03** | `payrollIds` is an empty array | `400 Missing required payroll IDs` | 400 | Empty array triggers the length check |
| **BA-04** | Valid array of draft payroll IDs | `200 OK`, `count` equals submitted IDs length | 200 | Batch update sets status and returns count |
| **BA-05** | Some IDs are not in `Draft` status | `200 OK`, `count` less than total IDs | 200 | Non-draft records filtered by the `where` clause |

---

## 4. `bulkApprovePayroll` — Approve Multiple Pending Payrolls

Batch updates payroll records from `Pending Approval` → `Approved`.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **AP-01** | Missing `payrollIds` field | `400 Missing required payroll IDs` | 400 | Required field guard fires |
| **AP-02** | `payrollIds` is an empty array | `400 Missing required payroll IDs` | 400 | Empty array triggers the length check |
| **AP-03** | Valid IDs in `Pending Approval` status | `200 OK`, `count` equals number approved | 200 | Batch sets `Approved` and `approvedBy` |
| **AP-04** | IDs that are not in `Pending Approval` | `200 OK`, those records skipped, `count` is lower | 200 | Non-pending records filtered by `where` clause |

---

## 5. `getPayrollRecords` — Fetch Payroll Records with Optional Filters

Returns payroll records joined with user names and Stripe account IDs.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **GR-01** | No filters — returns all records | `200 OK`, full array | 200 | No `where` clause applied |
| **GR-02** | Filter by `month` query param | `200 OK`, only records for that month | 200 | Month condition appended |
| **GR-03** | Filter by `year` query param | `200 OK`, only records for that year | 200 | Year condition appended |
| **GR-04** | Filter by both `month` and `year` | `200 OK`, correctly filtered | 200 | Both conditions combined with `and()` |
| **GR-05** | DB query throws an error | `500 Internal Server Error` | 500 | Exception caught and returned safely |

---

## 6. `getPayrollById` — Fetch Single Payroll with Line Items

Returns a payroll record and its associated line items.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **PI-01** | Payroll ID does not exist | `404 Payroll record not found` | 404 | Empty query result triggers early 404 |
| **PI-02** | Valid payroll ID | `200 OK`, payroll + `items` array | 200 | Payroll header and line items returned together |
| **PI-03** | Payroll with no line items | `200 OK`, `items: []` | 200 | Empty items array returned safely |

---

## 7. `updatePayrollStatus` — Update Individual Payroll Status

Handles transitions to `Draft`, `Pending Approval`, `Approved`, `Paid`, or `Rejected`. Supports Stripe payout when setting `Paid`.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **US-01** | Missing `status` in body | `400 Invalid status` | 400 | Null status fails the enum check |
| **US-02** | Invalid status value (e.g. `"Cancelled"`) | `400 Invalid status` | 400 | Only the 5 valid statuses are accepted |
| **US-03** | Payroll record does not exist | `404 Not found` | 404 | Empty DB result triggers early 404 |
| **US-04** | Set status to `Approved` | `200 OK`, `approvedBy` set | 200 | Approval path saves `approvedBy` from `req.user.id` |
| **US-05** | Set status to `Paid` via Bank Transfer | `200 OK`, `paymentMethod` saved | 200 | Non-Stripe payment stores method and reference |
| **US-06** | Set status to `Paid` via Stripe — missing `employeeAccountId` | `400 employeeAccountId is required` | 400 | Stripe path requires destination account |
| **US-07** | Set status to `Paid` via Stripe — net salary is 0 or negative | `400 Invalid net salary amount` | 400 | Zero/negative salary cannot be transferred |
| **US-08** | Set status to `Paid` via Stripe — valid transfer | `200 OK`, `paymentReference` set to Stripe transfer ID | 200 | Stripe service called; transfer ID saved |

---

## 8. `deletePayroll` — Delete a Draft or Rejected Payroll

Prevents deletion of `Approved` or `Paid` records.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **DP-01** | Payroll ID does not exist | `404 Not found` | 404 | Standard not-found guard |
| **DP-02** | Payroll is `Approved` | `400 Cannot delete processed payrolls` | 400 | Protection against deleting finalized records |
| **DP-03** | Payroll is `Paid` | `400 Cannot delete processed payrolls` | 400 | Paid payrolls are immutable |
| **DP-04** | Payroll is `Draft` — deleted successfully | `200 OK`, deletes line items then header | 200 | Two delete calls in correct order |
| **DP-05** | Payroll is `Rejected` — deleted successfully | `200 OK` | 200 | Rejected payrolls can be cleaned up |

---

## Summary

| Function | Test IDs | Count |
| :--- | :--- | :--- |
| `generatePayroll` | GP-01 → GP-09 | 9 |
| `bulkGeneratePayroll` | BG-01 → BG-05 | 5 |
| `bulkSubmitApproval` | BA-01 → BA-05 | 5 |
| `bulkApprovePayroll` | AP-01 → AP-04 | 4 |
| `getPayrollRecords` | GR-01 → GR-05 | 5 |
| `getPayrollById` | PI-01 → PI-03 | 3 |
| `updatePayrollStatus` | US-01 → US-08 | 8 |
| `deletePayroll` | DP-01 → DP-05 | 5 |
| **Total** | | **44** |

---

> **Implementation Note:** Mock `../../services/stripeService.js` for all Stripe-path tests (US-06 to US-08). For `generatePayroll` tests, mock the full `db.select().from(user)` chain to return user records with controlled `baseSalary`, `salaryType`, and `otHourlyRate` values. The `calculateEmployeePayroll` helper is not exported — test it indirectly via `generatePayroll`.
