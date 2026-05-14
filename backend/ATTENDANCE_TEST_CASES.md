# Attendance Controller — Test Cases

**File:** `controllers/attendanceController.ts`  
**Total Identified Test Cases:** 23  
**Testing Strategy:** Express + Supertest integration pattern with mocked Drizzle ORM database layer

---

## 1. `syncAttendance` — Biometric Device Sync

Handles incoming biometric punch events from physical devices. Validates the payload, resolves the user by biometric ID, and creates or updates the daily attendance record.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **SY-01** | Missing `biometricId` in request body | `400 Bad Request` | 400 | Required field guard catches the empty payload early |
| **SY-02** | Missing `timestamp` in request body | `400 Bad Request` | 400 | Timestamp is mandatory to determine check-in time and status |
| **SY-03** | Missing `type` in request body | `400 Bad Request` | 400 | Without type, the system cannot distinguish CheckIn vs CheckOut |
| **SY-04** | Unknown `biometricId` — no user found in DB | `404 Not Found` | 404 | User lookup returns empty array; controller surfaces a clear 404 |
| **SY-05** | `CheckIn` event before 9:00 AM — first check-in today | `200 OK`, insert with `status: Present` | 200 | Early arrival correctly classified as Present |
| **SY-06** | `CheckIn` event after 9:00 AM — first check-in today | `200 OK`, insert with `status: Late` | 200 | Late arrival correctly classified based on 9:00 AM threshold |
| **SY-07** | `CheckIn` event when a record already exists for today | `200 OK`, no duplicate insert | 200 | Duplicate check-in is silently ignored; first check-in is preserved |
| **SY-08** | `CheckOut` event with a valid prior check-in record | `200 OK`, update called with `workHours` & overtime | 200 | Checkout triggers work-hours calculation and overtime service call |
| **SY-09** | `CheckOut` event with **no** prior check-in record for today | `200 OK`, inserts record with `status: Incomplete` | 200 | Orphan checkout creates an Incomplete record rather than failing |

---

## 2. `checkIn` — Employee Portal Check-In

Manual check-in initiated by the employee through the portal. Authenticates via JWT middleware and prevents duplicate daily check-ins.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **CI-01** | No authenticated user (missing JWT) | `401 Unauthorized` | 401 | Controller reads `req.user.id`; absence correctly blocks access |
| **CI-02** | User already has a `checkInTime` for today | `400 Already checked in for today` | 400 | Duplicate guard prevents recording a second check-in on the same day |
| **CI-03** | First check-in before 9:00 AM | `200 OK`, DB insert with `status: Present` | 200 | On-time arrival set to Present |
| **CI-04** | First check-in after 9:00 AM | `200 OK`, DB insert with `status: Late` | 200 | Late arrival detected by comparing `now` against 9:00 AM threshold |
| **CI-05** | Record exists for today but has no `checkInTime` (e.g. prior checkout-only) | `200 OK`, DB **update** (not insert) called | 200 | Controller patches the existing record instead of creating a duplicate |

---

## 3. `checkOut` — Employee Portal Check-Out

Manual check-out initiated by the employee. Requires a prior check-in, computes work hours, and invokes the overtime calculation service.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **CO-01** | No authenticated user (missing JWT) | `401 Unauthorized` | 401 | No user context means no way to resolve the attendance record |
| **CO-02** | No check-in record found for today | `400 You have not checked in today` | 400 | Checkout without prior check-in is rejected with descriptive message |
| **CO-03** | Valid checkout — total hours ≤ 8 | `200 OK`, update with correct `workHours`, `overtimeHours: null` | 200 | Standard day produces no overtime hours |
| **CO-04** | Valid checkout — total hours > 8 | `200 OK`, update with `overtimeHours` set to hours beyond 8 | 200 | Extra hours correctly computed as overtime |
| **CO-05** | DB error during update | `500 Internal Server Error` | 500 | Unhandled DB rejection caught by try-catch and surfaced as 500 |

---

## 4. `getAttendance` — Admin / Branch Manager Fetch

Fetches all attendance records, scoped by the caller's role. Admin sees everything; Branch managers see only their employees' records. Supports optional date range filtering.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **GA-01** | Authenticated as `Admin` role — no date filters | `200 OK`, returns all records | 200 | Admin has no branch-based restriction; full table returned |
| **GA-02** | Authenticated as `branch` role | `200 OK`, returns only branch-scoped records | 200 | `innerJoin` with user table filters by `branchId` matching the caller's ID |
| **GA-03** | Query includes `startDate` and `endDate` params | `200 OK`, only records within the range returned | 200 | Date range SQL conditions are correctly appended to the where clause |
| **GA-04** | DB failure during query | `500 Internal Server Error` | 500 | Exception caught and returned as generic server error |

---

## 5. `getMyAttendance` — Employee's Own Records

Returns the authenticated employee's full attendance history, ordered by date descending.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **MA-01** | No authenticated user | `401 Unauthorized` | 401 | Auth guard fires before any DB call |
| **MA-02** | Authenticated employee — records exist | `200 OK`, list of own attendance records | 200 | Query correctly filters by `userId` from the JWT |

---

## 6. `getAttendanceStatus` — Today's Status Check

Returns the current check-in state for today: `Not Checked In`, `Checked In`, or `Checked Out`.

| Test ID | Test Case | Expected Result | HTTP Status | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **AS-01** | No authenticated user | `401 Unauthorized` | 401 | No user ID means we cannot query daily record |
| **AS-02** | No attendance record for today | `200 OK`, `{ status: "Not Checked In", lastActionTime: null }` | 200 | Empty DB result defaults to the initial state |
| **AS-03** | Record exists with `checkInTime` only | `200 OK`, `{ status: "Checked In", lastActionTime: <time> }` | 200 | Employee has punched in but not yet out |
| **AS-04** | Record exists with both `checkInTime` and `checkOutTime` | `200 OK`, `{ status: "Checked Out", lastActionTime: <time> }` | 200 | `checkOutTime` takes precedence in status resolution |

---

## Summary

| Function | Test IDs | Count |
| :--- | :--- | :--- |
| `syncAttendance` | SY-01 → SY-09 | 9 |
| `checkIn` | CI-01 → CI-05 | 5 |
| `checkOut` | CO-01 → CO-05 | 5 |
| `getAttendance` | GA-01 → GA-04 | 4 |
| `getMyAttendance` | MA-01 → MA-02 | 2 |
| `getAttendanceStatus` | AS-01 → AS-04 | 4 |
| **Total** | | **29** |

---

> **Implementation Note:** Tests should use the `express` + `supertest` `createTestApp()` pattern, mounting controller functions directly onto a local Express instance with mocked Drizzle ORM calls (`jest.mock('../../config/db.js')`). The `calculateOvertime` service dependency in `checkOut` and `syncAttendance` should also be mocked via `jest.mock('../../services/overtimeService.js')`.
