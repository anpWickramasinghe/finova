# Overtime Service — Test Cases

**File:** `services/overtimeService.ts`  
**Exported Function:** `calculateOvertime(userId, checkInTime, checkOutTime, recordDate)`  
**Total Identified Test Cases:** 20  
**Testing Strategy:** Direct unit tests — call `calculateOvertime` with mocked `db` (no HTTP layer needed)

---

## Overview of Logic

The `calculateOvertime` service performs 6 sequential steps:

1. Fetch global `overtime_settings` from DB → get `minOvertimeMinutes` (default: 30)
2. Hardcode work schedule: **09:00 – 17:00**
3. Query `holiday` table to check if `recordDate` is a public holiday
4. Check if `recordDate` falls on a **weekend** (Saturday/Sunday)
5. Compute raw overtime minutes:
   - **Weekday**: `earlyStartMinutes + lateEndMinutes` (outside the 09:00–17:00 window)
   - **Weekend/Holiday**: entire `checkOut – checkIn` duration
6. Apply threshold: if `totalRawMinutes < minOvertimeMinutes` → 0; else → full amount

---

## Test Cases

### Group A — Standard Weekday Scenarios

| Test ID | Test Case | Input | Expected `calculatedMinutes` | Expected `status` | Reasoning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **OT-01** | Exact standard schedule (09:00–17:00) | checkIn=09:00, checkOut=17:00, weekday | `0` | `None` | No early start, no late end — zero raw minutes |
| **OT-02** | Late checkout by 1 hour (17:00–18:00) | checkIn=09:00, checkOut=18:00, weekday | `60` | `Pending` | `lateEndMinutes=60`, meets 30-min threshold |
| **OT-03** | Early start by 45 minutes (08:15–17:00) | checkIn=08:15, checkOut=17:00, weekday | `45` | `Pending` | `earlyStartMinutes=45`, meets threshold |
| **OT-04** | Early start + late end combined (08:30–17:30) | checkIn=08:30, checkOut=17:30, weekday | `60` | `Pending` | `30 + 30 = 60`, both sides contribute |
| **OT-05** | Late checkout below threshold (17:10) | checkIn=09:00, checkOut=17:10, weekday | `0` | `None` | 10 raw minutes < 30-min threshold → not counted |
| **OT-06** | Early start below threshold (08:50–17:00) | checkIn=08:50, checkOut=17:00, weekday | `0` | `None` | 10 early minutes < threshold → not counted |
| **OT-07** | Exactly at threshold boundary (17:30 checkout) | checkIn=09:00, checkOut=17:30, weekday | `30` | `Pending` | Exactly 30 minutes — threshold is `>=`, so it counts |
| **OT-08** | Leave early (checkout before 17:00, standard checkin) | checkIn=09:00, checkOut=15:00, weekday | `0` | `None` | No early start, no late end — checking out early is not overtime |

---

### Group B — Weekend Scenarios

| Test ID | Test Case | Input | Expected `calculatedMinutes` | Expected `status` | Reasoning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **OT-09** | Work a full 4-hour shift on Saturday | checkIn=09:00, checkOut=13:00, Saturday | `240` | `Pending` | Entire duration is OT on weekend regardless of schedule |
| **OT-10** | Work a full 8-hour shift on Sunday | checkIn=09:00, checkOut=17:00, Sunday | `480` | `Pending` | Full duration treated as OT — no "normal schedule" on weekends |
| **OT-11** | Short 20-minute session on Saturday | checkIn=09:00, checkOut=09:20, Saturday | `0` | `None` | 20 raw minutes < 30-min threshold → not counted even on weekend |
| **OT-12** | `isWeekend` flag returned correctly for Saturday | recordDate = Saturday | `isWeekend: true` | — | `dayOfWeek === 6` branch fires correctly |
| **OT-13** | `isWeekend` flag returned correctly for Sunday | recordDate = Sunday | `isWeekend: true` | — | `dayOfWeek === 0` branch fires correctly |
| **OT-14** | `isWeekend` flag is false for a weekday | recordDate = Monday | `isWeekend: false` | — | Weekday should not activate the weekend path |

---

### Group C — Holiday Scenarios

| Test ID | Test Case | Input | Expected `calculatedMinutes` | Expected `isHoliday` | Reasoning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **OT-15** | Work 4 hours on a public holiday (weekday) | checkIn=09:00, checkOut=13:00, holiday DB returns a record | `240` | `true` | Holiday detected → entire duration counted as OT |
| **OT-16** | Work below threshold on a holiday | checkIn=09:00, checkOut=09:20, holiday | `0` | `true` | Even on holidays, the 30-min threshold still applies |
| **OT-17** | Non-holiday weekday — `isHoliday` is false | holiday DB returns empty | `isHoliday: false` | — | Empty holiday query result means normal weekday logic applies |

---

### Group D — Settings & Edge Cases

| Test ID | Test Case | Input | Expected Behaviour | Reasoning |
| :--- | :--- | :--- | :--- | :--- |
| **OT-18** | No `overtime_settings` row in DB (empty table) | DB returns `[]` for settings | Falls back to default `minOvertimeMinutes = 30` | Null-safe fallback prevents crash on empty settings |
| **OT-19** | Settings row with `minOvertimeMinutes = 60` | DB returns `[{ minOvertimeMinutes: '60' }]`, checkOut=17:45 | `0` — 45 mins below 60-min threshold | Custom threshold read from DB overrides the 30-min default |
| **OT-20** | `checkInTime === checkOutTime` (zero-duration session) | checkIn=09:00, checkOut=09:00 | `calculatedMinutes: 0`, `status: None` | Zero difference produces 0 raw minutes — safe, no crash |

---

## Return Value Structure

Each call to `calculateOvertime` returns an object of the shape:

```ts
{
  calculatedMinutes: number;   // Final approved OT minutes after threshold
  isHoliday: boolean;          // Whether recordDate was a public holiday
  isWeekend: boolean;          // Whether recordDate was Saturday or Sunday
  status: 'Pending' | 'None'; // 'Pending' if OT > 0, 'None' otherwise
}
```

---

## Summary

| Group | Test IDs | Count | Focus |
| :--- | :--- | :--- | :--- |
| A — Standard Weekday | OT-01 → OT-08 | 8 | Normal work hours, threshold boundary |
| B — Weekend | OT-09 → OT-14 | 6 | Full-duration OT, `isWeekend` flag |
| C — Holiday | OT-15 → OT-17 | 3 | Holiday detection, `isHoliday` flag |
| D — Settings & Edge Cases | OT-18 → OT-20 | 3 | Default settings, custom threshold, zero duration |
| **Total** | | **20** | |

---

> **Implementation Note:** Since `calculateOvertime` is a pure async function (no HTTP), tests do **not** need Supertest. Use `jest.mock('../../config/db.js')` to control what `overtime_settings` and `holiday` queries return. Call the function directly and `await` the result. Use `expect(result.calculatedMinutes).toBe(...)` for assertions.
