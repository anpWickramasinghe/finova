Backend Endpoints for HomeScreen
This document outlines the backend API endpoints required to populate the 
HomeScreen
 and its child components in the Employee Portal.

1. User Profile
Component: 
Header
, 
HomeScreen
 (Greeting Section) Purpose: Fetch logged-in user's basic information.

GET /api/v1/employee/profile
Response:

{
  "id": "emp_123",
  "firstName": "John",
  "lastName": "Doe",
  "avatarUrl": "https://example.com/avatar.jpg",
  "jobTitle": "Software Engineer",
  "department": "Engineering"
}
2. Dashboard Quick Stats
Component: 
HomeScreen
 (Quick Stats Cards) Purpose: Fetch summary statistics for the dashboard cards.

GET /api/v1/employee/dashboard-stats
Response:

{
  "pendingRequests": 5,
  "daysOffTaken": 12,
  "nextHoliday": {
    "name": "Christmas Day",
    "date": "2025-12-25"
  },
  "unreadNotifications": true
}
3. Leave Summary
Component: 
LeavesChart
 Purpose: Fetch available and used leave balances for the donut chart.

GET /api/v1/employee/leaves/summary
Response:

{
  "totalAllocated": 20,
  "used": 8,
  "available": 12,
  "leaveTypeBreakdown": [
    { "type": "Annual", "used": 5, "available": 9 },
    { "type": "Sick", "used": 3, "available": 3 }
  ]
}
4. Weekly Work Hours
Component: 
WorkHoursChart
 Purpose: Fetch work hours data for the current week.

GET /api/v1/employee/attendance/weekly
Query Parameters:

startDate (optional): Start date of the week (YYYY-MM-DD). Defaults to current week.
Response:

{
  "totalHours": 45.0,
  "dailyBreakdown": [
    { "day": "Mon", "date": "2025-12-22", "hours": 8.0 },
    { "day": "Tue", "date": "2025-12-23", "hours": 7.5 },
    { "day": "Wed", "date": "2025-12-24", "hours": 8.0 },
    { "day": "Thu", "date": "2025-12-25", "hours": 9.0 },
    { "day": "Fri", "date": "2025-12-26", "hours": 8.5 },
    { "day": "Sat", "date": "2025-12-27", "hours": 4.0 },
    { "day": "Sun", "date": "2025-12-28", "hours": 0.0 }
  ]
}
