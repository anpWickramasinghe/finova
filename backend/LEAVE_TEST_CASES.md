# Leave Controller — Test Cases

**File:** `controllers/leaveController.ts`  
**Total Identified Test Cases:** 22  
**Testing Strategy:** Express + Supertest integration pattern with mocked Drizzle ORM database layer

---

## 1. `createLeaveRequest` — Submit a New Leave Request

Authenticated employee submits a leave request. Validates required fields and inserts a new record with `status: Pending`.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **LR-01** | No authenticated user (missing JWT) | `401 Unauthorized` | 401 | Auth guard fires before any processing; `userId` is undefined |
| **LR-02** | Missing `startDate` in request body | `400 Bad Request` | 400 | Required field validation blocks the DB insert |
| **LR-03** | Missing `endDate` in request body | `400 Bad Request` | 400 | All three fields must be present for a valid leave record |
| **LR-04** | Missing `type` in request body | `400 Bad Request` | 400 | Leave type is mandatory for classification and stats |
| **LR-05** | All required fields provided, no `reason` | `201 Created`, `reason: ''` inserted | 201 | Optional reason defaults to empty string; record inserted with `status: Pending` |
| **LR-06** | All required fields provided including `reason` | `201 Created` | 201 | Full payload produces a clean DB insert |
| **LR-07** | DB insert throws an error | `500 Internal Server Error` | 500 | Exception caught by try-catch; generic error returned |

---

## 2. `getLeaveRequests` — Fetch Leave Requests (Role-Scoped)

Returns leave requests scoped by the caller's role. Branch sees only their branch, Manager sees their branch, Admin can optionally filter by `branchId` query param.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **GL-01** | No authenticated user | `401 Unauthorized` | 401 | Without `userId`, the controller cannot determine scope |
| **GL-02** | Authenticated as `branch` role | `200 OK`, filtered by `user.branchId = userId` | 200 | Branch login ID doubles as `branchId` for filtering |
| **GL-03** | Authenticated as `manager` role | `200 OK`, filtered by the manager's resolved `branchId` | 200 | Manager's `branchId` is fetched from DB and used as the filter |
| **GL-04** | Authenticated as `manager` with no `branchId` | `200 OK`, returns all records (no branch filter) | 200 | Null `branchId` means the where clause receives `undefined` — no filter applied |
| **GL-05** | Authenticated as `admin` with `?branchId=xxx` param | `200 OK`, filtered by the provided `branchId` | 200 | Admin can scope the query using an optional query parameter |
| **GL-06** | Authenticated as `admin` with no `branchId` param | `200 OK`, returns all records | 200 | Admin without a query param sees everything |
| **GL-07** | DB query throws an error | `500 Internal Server Error` | 500 | Error caught and returned as server error |

---

## 3. `updateLeaveStatus` — Approve / Reject a Leave Request

Manager or admin updates the status of an existing leave request. Validates the status enum before writing to DB.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **US-01** | Missing `status` in request body | `400 Invalid status` | 400 | Null status fails the enum check |
| **US-02** | Invalid status value (e.g. `"Cancelled"`) | `400 Invalid status` | 400 | Only `Approved`, `Rejected`, `Pending` are accepted |
| **US-03** | Status `"Approved"` — valid | `200 OK`, `"Leave request approved"` | 200 | Valid status triggers DB update and returns confirmation |
| **US-04** | Status `"Rejected"` — valid | `200 OK`, `"Leave request rejected"` | 200 | Rejection path writes status and returns message |
| **US-05** | Status `"Pending"` — valid | `200 OK`, `"Leave request pending"` | 200 | Re-setting to Pending is permitted by the current logic |
| **US-06** | DB update throws an error | `500 Internal Server Error` | 500 | Exception caught and returned as generic server error |

---

## 4. `getLeaveStats` — Dashboard Statistics

Returns aggregated leave data: total on leave today, leave type distribution, weekly overview, and upcoming leaves. Requires authentication and optionally scopes by branch.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **LS-01** | No authenticated user | `401 Unauthorized` | 401 | `userId` is required to resolve branch scope |
| **LS-02** | Authenticated user with active leaves today | `200 OK`, `totalOnLeave > 0`, `distribution` populated | 200 | In-memory date filter correctly counts today's active approved leaves |
| **LS-03** | No leaves active today | `200 OK`, `totalOnLeave: 0`, empty `distribution` | 200 | Empty filter results produce zero-count stats without error |
| **LS-04** | Approved leaves span a range covering this week | `200 OK`, `weekStats` has non-zero values for covered days | 200 | Mon–Fri weekly loop correctly counts each day's coverage |
| **LS-05** | Approved future leaves exist | `200 OK`, `upcomingLeaves` contains entries sorted by `startDate` | 200 | Post-today filter and sort produce correct upcoming list |
| **LS-06** | More than 5 upcoming leaves | `200 OK`, `upcomingLeaves.length === 5` | 200 | `.slice(0, 5)` correctly caps the list at 5 items |
| **LS-07** | DB query throws an error | `500 Internal Server Error` | 500 | Exception caught and generic error returned |

---

## 5. `getTypeColor` — Internal Helper (Unit Testable)

Private function mapping leave type strings to hex colour codes. Pure function — no DB interaction.

| Test ID | Test Case | Expected Result | Reasoning |
| :--- | :--- | :--- | :--- |
| **TC-01** | Input `"Annual Leave"` | Returns `"#0f172a"` | Matches the hardcoded switch case |
| **TC-02** | Input `"Sick Leave"` | Returns `"#10b981"` | Matches the hardcoded switch case |
| **TC-03** | Input `"Other Leave"` | Returns `"#f59e0b"` | Matches the hardcoded switch case |
| **TC-04** | Input unknown type (e.g. `"Maternity Leave"`) | Returns `"#64748b"` (default) | Falls through to the default case |

> **Note:** `getTypeColor` is not exported. It can be tested indirectly via `getLeaveStats` distribution output, or extracted and exported for direct unit testing.

---

## Summary

| Function | Test IDs | Count |
| :--- | :--- | :--- |
| `createLeaveRequest` | LR-01 → LR-07 | 7 |
| `getLeaveRequests` | GL-01 → GL-07 | 7 |
| `updateLeaveStatus` | US-01 → US-06 | 6 |
| `getLeaveStats` | LS-01 → LS-07 | 7 |
| `getTypeColor` (helper) | TC-01 → TC-04 | 4 |
| **Total** | | **31** |

---

> **Implementation Note:** Tests should use the `express` + `supertest` `createTestApp()` pattern, mounting controller functions directly. Mock `db.insert`, `db.select`, and `db.update` via `jest.mock('../../config/db.js')`. The `getLeaveStats` in-memory filtering logic can be tested by controlling what the mocked DB returns for `activeLeaves` and `upcoming` queries.
