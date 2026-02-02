# Changelog

## [Unreleased] - 2026-02-03

### Added
- **Holiday Sync Feature**:
    - Integrated Calendarific API to fetch public holidays.
    - Added `POST /api/admin/holidays/sync` endpoint in the backend.
    - Added "Sync with Calendarific" button and modal in the Admin Portal (Holidays page).
    - Database now stores `holiday` records with date, name, and description.
- **Overtime Management System**:
    - **Database Schema**:
        - `overtime_settings`: Stores configuration for thresholds (e.g., 30 mins) and rate multipliers (Weekday, Weekend, Holiday).
        - `holiday`: Table for managing public holidays.
    - **Backend Logic (Deep Dive)**:
        - **Automatic Calculation**: Triggered immediately when an employee performs a `Check-Out`.
        - **Fixed Schedule Enforcement**: The system currently hardcodes working hours to **09:00 - 17:00** (8 hours).
        - **Overtime Formula**: 
            - `Early Start = Standard Start (09:00) - Check-In Time`
            - `Late End = Check-Out Time - Standard End (17:00)`
            - `Total Raw Overtime = Early Start + Late End`
        - **Special Day Detection**:
            - **Weekends**: Detected automatically via code (`Date.getDay() === 0 (Sun) || 6 (Sat)`).
            - **Holidays**: Detected by checking the `holiday` table in the database for the specific date.
            - *Impact*: If detected, the **entire duration** of work is often treated as overtime (subject to configuration), typically applying the **2.0x Multiplier**.
        - **Threshold Logic**:
            - Before saving, the system compares `Total Raw Overtime` vs `minOvertimeMinutes` (default 30m).
            - If `Total < Threshold` -> Overtime is discarded (0 min).
            - If `Total >= Threshold` -> Overtime is recorded.
    - **Manager Portal**:
        - Added Overtime Status badge (Pending, Approved, Rejected) to Attendance table.
        - Added "Review" action for Managers to approve/reject overtime claims.
    - **Admin Portal**:
        - New "Overtime Settings" page to configure multipliers and thresholds.
        - "Holidays" management tab (Create, Delete, Sync).

### Changed
- **Attendance Table (`attendance`)**:
    - Added columns: `overtimeStatus`, `approvedBy`, `calculatedOvertimeMinutes`, `attendenceOvertimeMinutes`, `isHoliday`, `isWeekend`.
