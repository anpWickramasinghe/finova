# Finova System Architecture & Entity Relationship Diagram

This document contains the Entity Relationship (ER) Diagram for the Finova platform, detailing how different modules (Users, HR, Payroll, Accounting, and Chat) interconnect.

## Entity Relationship Diagram

```mermaid
erDiagram
    %% Core Entities
    BRANCH ||--o{ USER : "employs"
    BRANCH ||--o{ TRANSACTION : "records"
    BRANCH ||--o{ CHAT_ROOM : "hosts"
    
    USER ||--o{ ATTENDANCE : "logs"
    USER ||--o{ LEAVE_REQUEST : "submits"
    USER ||--o{ PAYROLL : "receives"
    USER ||--o{ EMPLOYEE_SALARY_COMPONENT : "has"
    USER ||--o{ SUPPORT_CHAT : "initiates"
    USER ||--o{ CHAT_ROOM_MEMBER : "joins"
    USER ||--o{ SESSION : "has"
    USER ||--o{ ACCOUNT : "links"
    
    %% HR & Attendance
    ATTENDANCE }|--|| OVERTIME_SETTINGS : "calculated against"
    
    %% Payroll System
    PAYROLL ||--|{ PAYROLL_ITEM : "contains"
    SALARY_COMPONENT ||--o{ EMPLOYEE_SALARY_COMPONENT : "defines"
    
    %% Accounting & Transactions
    CHART_OF_ACCOUNTS ||--o{ JOURNAL_LINE : "credits/debits"
    CHART_OF_ACCOUNTS ||--o{ LEDGER_ENTRY : "updates"
    
    TRANSACTION ||--|{ JOURNAL_LINE : "contains"
    TRANSACTION ||--|{ LEDGER_ENTRY : "posts to"
    TRANSACTION ||--o{ RECONCILIATION : "matches"
    
    %% Communication
    CHAT_ROOM ||--o{ CHAT_ROOM_MEMBER : "has"
    CHAT_ROOM ||--o{ CHAT_ROOM_MESSAGE : "contains"
    
    SUPPORT_CHAT ||--o{ SUPPORT_MESSAGE : "contains"

    %% Entity Definitions (Key Fields)
    BRANCH {
        string id PK
        string name
        string manager
        string employeeCount
        string revenue
    }

    USER {
        string id PK
        string name
        string email
        string role
        string branchId FK
        string baseSalary
        string otHourlyRate
        string status
    }

    ATTENDANCE {
        string id PK
        string userId FK
        timestamp checkInTime
        timestamp checkOutTime
        string workHours
        string overtimeHours
        string overtimeStatus
        boolean isWeekend
        boolean isHoliday
    }

    LEAVE_REQUEST {
        string id PK
        string userId FK
        timestamp startDate
        timestamp endDate
        string type
        string status
    }

    PAYROLL {
        string id PK
        string userId FK
        string month
        string year
        numeric netSalary
        string status
    }

    PAYROLL_ITEM {
        string id PK
        string payrollId FK
        string componentName
        string type "Earning/Deduction"
        numeric amount
    }

    SALARY_COMPONENT {
        string id PK
        string name
        string type
        string calculationType
        numeric defaultAmount
    }

    TRANSACTION {
        string id PK
        string transactionNumber
        string type "journal/payment/receipt"
        string status "draft/approved/posted"
        numeric totalAmount
        string branchId FK
    }

    CHART_OF_ACCOUNTS {
        string id PK
        string code
        string name
        string type "asset/liability/equity/etc"
        string normalBalance
    }

    JOURNAL_LINE {
        string id PK
        string transactionId FK
        string accountId FK
        numeric debit
        numeric credit
    }

    CHAT_ROOM {
        string id PK
        string name
        string type "direct/branch"
        string branchId FK
    }
```

## Module Clusters

1. **HR & Personnel:** `USER`, `BRANCH`, `ATTENDANCE`, `LEAVE_REQUEST`, `OVERTIME_SETTINGS`, `HOLIDAY`
2. **Payroll:** `PAYROLL`, `PAYROLL_ITEM`, `SALARY_COMPONENT`, `EMPLOYEE_SALARY_COMPONENT`
3. **Accounting:** `TRANSACTION`, `CHART_OF_ACCOUNTS`, `JOURNAL_LINE`, `LEDGER_ENTRY`, `RECONCILIATION`
4. **Communication:** `CHAT_ROOM`, `CHAT_ROOM_MESSAGE`, `SUPPORT_CHAT`, `SUPPORT_MESSAGE`
5. **Auth & Security:** `SESSION`, `ACCOUNT`, `VERIFICATION`
