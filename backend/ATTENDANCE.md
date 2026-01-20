# Attendance Management Feature

This document outlines the architecture, data structure, and API usage for the Attendance Management System.

## Overview
The Attendance Management System is designed to integrate with biometric devices to track employee attendance. It supports:
- **Biometric Integration**: Devices can push attendance logs directly to the API.
- **Automated status tracking**: Automatically marks "Late" or "Present" based on check-in time.
- **Work Hours Calculation**: Automatically calculates work hours upon check-out.

## Data Structure

### `attendance` Table
Stores daily attendance records.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key |
| `userId` | `String` | Foreign Key to `user` table |
| `recordDate` | `Timestamp` | Normalized date (YYYY-MM-DD 00:00:00) of the record |
| `checkInTime` | `Timestamp` | Time of first check-in |
| `checkOutTime` | `Timestamp` | Time of last check-out |
| `status` | `String` | Status: `Present`, `Late`, `Absent`, etc. |
| `workHours` | `String` | Total hours worked |
| `biometricId` | `String` | Device User ID associated with the record |

### `user` Table Updates
Added `biometricId` column to map physical device users to system users.

## API Endpoints

### Sync Attendance
**Endpoint:** `POST /api/attendance/sync`

Used by biometric devices (or bridge software) to push attendance logs.

**Headers:**
- `Content-Type: application/json`

**Body:**
```json
{
  "biometricId": "1001",
  "timestamp": "2023-10-27T08:30:00.000Z",
  "type": "CheckIn"
}
```
- `type`: Can be `"CheckIn"` or `"CheckOut"`.

**Response:**
- `200 OK`: Sync successful.
- `404 Not Found`: User with `biometricId` not found.

### Get Attendance
**Endpoint:** `GET /api/attendance`

Retrieves attendance records.

**Headers:**
- `Authorization: Bearer <session_token>` (Cookie-based in browser)

**Response:**
```json
[
  {
    "id": "...",
    "userId": "...",
    "recordDate": "2023-10-27T00:00:00.000Z",
    "checkInTime": "2023-10-27T08:30:00.000Z",
    "status": "Late",
    ...
  }
]
```

## Integration Guide
1.  **Assign Biometric IDs**: Update each user in the database with their matching ID from the biometric device.
2.  **Configure Device/Middleware**: Set up your device to send a HTTP POST request to `https://your-api-domain.com/api/attendance/sync` whenever a user scans their fingerprint.
    - If the device does not support custom HTTP requests, middleware software will be needed to read device logs (via SDK) and push them to this API.
