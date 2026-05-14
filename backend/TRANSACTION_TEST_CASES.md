# Transaction Controller — Test Cases

**File:** `controllers/transactionController.ts`  
**Total Identified Test Cases:** 47  
**Testing Strategy:** Express + Supertest integration pattern with mocked Drizzle ORM database layer

---

## Overview of Transaction Lifecycle

The controller implements a full double-entry bookkeeping workflow with the following state machine:

```
draft → pending_approval → approved → posted → reconciled
                       ↘ rejected → (re-submit) → pending_approval
```

---

## 1. `getTransactions` — List Transactions (Role-Scoped)

Fetches all transactions with optional filters. Admins see all branches; other roles see only their own branch.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **GT-01** | Admin role — no filters | `200 OK`, all transactions | 200 | `isAdmin=true` skips the branch filter |
| **GT-02** | Branch/Manager role — scoped to own branch | `200 OK`, only own branch records | 200 | `branchId` condition is appended to the query |
| **GT-03** | Filter by `status=pending_approval` | `200 OK`, only pending records | 200 | Status condition correctly narrows results |
| **GT-04** | Filter by `type=journal` | `200 OK`, only journal-type records | 200 | Type condition correctly narrows results |
| **GT-05** | Filter by `startDate` and `endDate` | `200 OK`, only records within range | 200 | Date range SQL conditions applied correctly |
| **GT-06** | Filter by `search` keyword | `200 OK`, matching description/number/reference | 200 | `ILIKE` search applied across three columns |
| **GT-07** | DB query throws an error | `500 Internal Server Error` | 500 | Exception caught and returned as server error |

---

## 2. `getTransactionById` — Fetch Single Transaction with Full Details

Returns a transaction with journal lines, ledger entries (if posted/reconciled), and reconciliation info.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **GI-01** | Transaction ID does not exist | `404 Not Found` | 404 | Empty DB result triggers early 404 return |
| **GI-02** | Draft transaction — no ledger entries returned | `200 OK`, `ledgerEntries: []` | 200 | Ledger fetch is skipped for non-posted statuses |
| **GI-03** | Posted transaction — ledger entries included | `200 OK`, `ledgerEntries` populated | 200 | Status `posted` triggers the ledger sub-query |
| **GI-04** | Reconciled transaction — includes reconciliation info | `200 OK`, `reconciliation` object present | 200 | Status `reconciled` triggers the reconciliation sub-query |
| **GI-05** | Transaction with `createdBy` set — `creatorName` resolved | `200 OK`, `creatorName` not null | 200 | User name is fetched via additional query |
| **GI-06** | Transaction without `approvedBy` — `approverName` is null | `200 OK`, `approverName: null` | 200 | Null guard prevents unnecessary DB call |

---

## 3. `createTransaction` — Create Draft Transaction

Validates required fields, calculates totals, flags high-value transactions for admin approval, and inserts the header + journal lines.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **CT-01** | Missing `date` field | `400 Bad Request` | 400 | Required field guard fires before any DB call |
| **CT-02** | Missing `description` field | `400 Bad Request` | 400 | Description is mandatory for all transactions |
| **CT-03** | Missing `type` field | `400 Bad Request` | 400 | Transaction type is required |
| **CT-04** | Fewer than 2 journal lines provided | `400 Bad Request` | 400 | Double-entry requires at least one debit + one credit |
| **CT-05** | Valid payload with 2 journal lines | `201 Created`, `status: draft` | 201 | Clean insert with correct status and generated `txnNumber` |
| **CT-06** | Total amount < 10,000 | `201 Created`, `requiresAdminApproval: false` | 201 | Below threshold — no admin flag set |
| **CT-07** | Total amount >= 10,000 | `201 Created`, `requiresAdminApproval: true` | 201 | At or above threshold — admin approval flag set |
| **CT-08** | Branch role login — `branchId = userId`, `createdBy = null` | `201 Created` | 201 | Branch accounts are not users; `createdBy` is set to null |
| **CT-09** | DB insert throws an error | `500 Internal Server Error` | 500 | Exception caught and returned safely |

---

## 4. `updateTransaction` — Edit a Draft Transaction

Allows editing only of draft transactions. Replaces journal lines entirely when provided.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **UT-01** | Transaction ID does not exist | `404 Not Found` | 404 | Empty DB result triggers early 404 |
| **UT-02** | Transaction is not in `draft` status | `400 Bad Request` | 400 | Non-draft transactions are locked from editing |
| **UT-03** | Valid update with new journal lines | `200 OK` | 200 | Existing lines deleted and replaced; header updated |
| **UT-04** | Update raises total above 10,000 threshold | `200 OK`, `requiresAdminApproval: true` | 200 | Admin flag is recalculated on update |

---

## 5. `submitTransaction` — Submit Draft for Approval

Validates that total debits equal total credits (double-entry rule) before moving to `pending_approval`.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **ST-01** | Transaction does not exist | `404 Not Found` | 404 | Not found guard fires before validation |
| **ST-02** | Transaction is not in `draft` status | `400 Bad Request` | 400 | Only drafts can be submitted |
| **ST-03** | Debits do not equal credits | `400 Bad Request` with debit/credit amounts | 400 | Double-entry violation — difference > 0.01 |
| **ST-04** | Fewer than 2 journal lines | `400 Bad Request` | 400 | Minimum line count enforced before status update |
| **ST-05** | Valid balanced transaction | `200 OK`, status → `pending_approval` | 200 | Balanced lines trigger status update |

---

## 6. `bulkSubmitTransactions` — Bulk Submit Multiple Drafts

Submits multiple draft/rejected transactions at once, either by explicit IDs, by period, or all eligible for the branch.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **BS-01** | Invalid `period` format (e.g. `"2025"`) | `400 Invalid period format` | 400 | Year/month parsing fails and is caught before DB query |
| **BS-02** | No eligible transactions found | `200 OK`, `submitted: 0` | 200 | Empty result is returned gracefully without error |
| **BS-03** | Explicit `transactionIds` array provided | `200 OK`, processes only those IDs | 200 | Explicit ID list bypasses period lookup |
| **BS-04** | Transaction in list has unbalanced lines | `200 OK`, that ID added to `failed` array | 200 | Per-item failures collected; others still processed |
| **BS-05** | All transactions successfully submitted | `200 OK`, `submitted = N`, `failed: []` | 200 | Clean batch with no errors |

---

## 7. `approveTransaction` — Approve a Pending Transaction

Implements maker-checker policy: the approver cannot be the same person who created the transaction.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **AT-01** | Transaction does not exist | `404 Not Found` | 404 | Not found guard fires first |
| **AT-02** | Transaction is not `pending_approval` | `400 Bad Request` | 400 | Only pending transactions can be approved |
| **AT-03** | Approver is the same as creator (`createdBy === userId`) | `403 Forbidden` | 403 | Maker-checker policy: self-approval is blocked |
| **AT-04** | Valid approval by a different user | `200 OK`, status → `approved` | 200 | Different user sets `approvedBy`, `approvedAt` |

---

## 8. `rejectTransaction` — Reject a Pending Transaction

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **RT-01** | Transaction does not exist | `404 Not Found` | 404 | Standard not-found guard |
| **RT-02** | Transaction is not `pending_approval` | `400 Bad Request` | 400 | Only pending transactions can be rejected |
| **RT-03** | Reject with a reason | `200 OK`, `rejectionReason` saved | 200 | Reason stored in DB; status → `rejected` |
| **RT-04** | Reject without a reason | `200 OK`, `rejectionReason: "No reason provided"` | 200 | Default fallback message used when reason is absent |

---

## 9. `postTransaction` — Post to Ledger

Creates immutable ledger entries from approved journal lines. Only `approved` transactions can be posted.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **PT-01** | Transaction does not exist | `404 Not Found` | 404 | Standard not-found guard |
| **PT-02** | Transaction is not `approved` | `400 Bad Request` | 400 | Only approved transactions can be posted |
| **PT-03** | Valid post — creates ledger entries for each journal line | `200 OK`, status → `posted` | 200 | One ledger entry per journal line inserted |

---

## 10. `reconcileTransaction` — Reconcile a Posted Transaction

Compares the transaction amount with a bank statement reference. Sets reconciliation status to `matched`, `partial`, or `unmatched`.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **RC-01** | Transaction does not exist | `404 Not Found` | 404 | Standard not-found guard |
| **RC-02** | Transaction is not `posted` | `400 Bad Request` | 400 | Only posted transactions can be reconciled |
| **RC-03** | `matchedAmount` equals transaction total (within 0.01) | `200 OK`, `reconStatus: "matched"` | 200 | Difference < 0.01 → `matched` |
| **RC-04** | `matchedAmount` is partial (> 0 but not equal) | `200 OK`, `reconStatus: "partial"` | 200 | Positive but mismatched amount → `partial` |
| **RC-05** | `matchedAmount` is 0 | `200 OK`, `reconStatus: "unmatched"` | 200 | Zero amount → `unmatched` |

---

## 11. `getLedgerEntries` — Fetch Ledger Entries

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **LE-01** | No filters — returns all entries for branch | `200 OK`, array of ledger entries | 200 | Branch-scoped query returns all ledger data |
| **LE-02** | Filter by `accountId` | `200 OK`, only entries for that account | 200 | Account condition correctly narrows results |
| **LE-03** | Filter by `startDate` and `endDate` | `200 OK`, date-filtered entries | 200 | Date range SQL conditions applied |

---

## 12. `getReportsSummary` — Summary Statistics

Aggregates status counts, type totals, ledger debit/credit totals, and trial balance.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **RS-01** | No transactions in DB | `200 OK`, zero counts and totals | 200 | Empty results produce zeroed-out summary without error |
| **RS-02** | Transactions of multiple types and statuses | `200 OK`, `statusCounts` and `typeTotals` populated | 200 | In-memory aggregation correctly groups and counts |
| **RS-03** | DB error | `500 Internal Server Error` | 500 | Exception caught and returned safely |

---

## Summary

| Function | Test IDs | Count |
| :--- | :--- | :--- |
| `getTransactions` | GT-01 → GT-07 | 7 |
| `getTransactionById` | GI-01 → GI-06 | 6 |
| `createTransaction` | CT-01 → CT-09 | 9 |
| `updateTransaction` | UT-01 → UT-04 | 4 |
| `submitTransaction` | ST-01 → ST-05 | 5 |
| `bulkSubmitTransactions` | BS-01 → BS-05 | 5 |
| `approveTransaction` | AT-01 → AT-04 | 4 |
| `rejectTransaction` | RT-01 → RT-04 | 4 |
| `postTransaction` | PT-01 → PT-03 | 3 |
| `reconcileTransaction` | RC-01 → RC-05 | 5 |
| `getLedgerEntries` | LE-01 → LE-03 | 3 |
| `getReportsSummary` | RS-01 → RS-03 | 3 |
| **Total** | | **58** |

---

> **Implementation Note:** Use the `express` + `supertest` `createTestApp()` pattern. The maker-checker test (AT-03) is critical — set `createdBy` on the mock transaction to the same `userId` in the request. For `reconcileTransaction`, control `matchedAmount` and `totalAmount` values to hit each of the three status branches.
