# Overtime Module

This module handles the display and management of employee overtime.

## Components

- **OvertimeScreen**: The main screen displaying the overtime dashboard.
- **MonthlyOvertimeChart**: A doughnut chart showing the utilized vs. remaining overtime allowance for the current month.
- **TabsDisabled (Overtime History)**: A tabbed view listing overtime records categorized by status (Pending, Approved, Rejected).

## Features

- **Monthly Summary**: Visual representation of overtime usage.
- **History Tracking**: Detailed list of past overtime requests with status.
- **Categorization**: Easy filtering of requests by status.

## Data Requirements

### 1. MonthlyOvertimeChart
- **Total Monthly Limit**: The maximum allowed overtime minutes per month.
- **Worked Minutes**: Total approved (and potentially pending) overtime minutes for the current month.
- **Remaining Minutes**: Calculated as `Total Limit - Worked Minutes`.

### 2. Overtime History (Tabs)
- **List of overtime records** with the following fields:
    - `id`: Unique identifier.
    - `date`: Date of the overtime.
    - `duration`: Duration in minutes.
    - `status`: Current status ('Waiting', 'Approved', 'Rejected').

## API Endpoints

### 1. Get Overtime Summary
Fetches the summary data for the doughnut chart.

- **Method:** `GET`
- **Path:** `/api/v1/employee/overtime/summary`
- **Query Parameters:**
    - `month` (optional): `YYYY-MM` (defaults to current month)
- **Response:**
```json
{
  "limitMinutes": 1200,
  "workedMinutes": 900,
  "remainingMinutes": 300,
  "percentageUsed": 75
}
```

### 2. Get Overtime History
Fetches the list of overtime records for the tabs.

- **Method:** `GET`
- **Path:** `/api/v1/employee/overtime/history`
- **Query Parameters:**
    - `month` (optional): `YYYY-MM`
    - `status` (optional): Filter by status
    - `page` (optional): For pagination
    - `limit` (optional): Items per page
- **Response:**
```json
{
  "data": [
    {
      "id": "ot_123",
      "date": "2025-12-27",
      "durationMinutes": 120,
      "status": "Waiting",
      "reason": "Project deadline"
    },
    {
      "id": "ot_124",
      "date": "2025-12-24",
      "durationMinutes": 60,
      "status": "Approved",
      "reason": "Server maintenance"
    }
  ],
  "pagination": {
    "total": 15,
    "page": 1,
    "pages": 2
  }
}
```

### 3. Request Overtime (Future Implementation)
Endpoint to submit a new overtime request.

- **Method:** `POST`
- **Path:** `/api/v1/employee/overtime/request`
- **Body:**
```json
{
  "date": "2025-12-28",
  "durationMinutes": 60,
  "reason": "Urgent bug fix"
}
```