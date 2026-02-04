## Finance Application – High-Level Architecture

```
                 ┌───────────────────────────┐
                 │        Frontend Layer      │
                 │───────────────────────────│
                 │  Employee Portal (Web/App) │
                 │  Manager Portal (Web)      │
                 │  Admin Portal (Web)        │
                 └─────────────┬─────────────┘
                               │ HTTPS (JWT)
                               ▼

## Conceptual Overview

```mermaid
graph TD
    %% Actors
    Admin((Admin))
    Manager((Manager))
    Employee((Employee))

    %% External Systems
    Biometric[Biometric Devices]
    SMS[SMS Gateway]

    %% Main System
    subgraph Finova_System [Finova Intelligent Platform]
        direction TB
        
        %% Modules
        subgraph HR_Payroll [HR & Payroll Module]
            Attendance[Attendance Tracking]
            Leave[Leave Management]
            Payroll[Payroll Processing]
            EPF_ETF[EPF/ETF Calculation]
            Click here for [Payroll System Logic](./PAYROLL_SYSTEM.md)
        end

        subgraph Finance_Module [Finance & Accounts Module]
            CashFlow[Cash Flow Management]
            PettyCash[Petty Cash Control]
            Reports[Financial Reporting]
            Journal[Journal Entries]
        end

        subgraph AI_Layer [AI & Intelligence Layer]
            Predict[Predictive Analytics]
            Anomaly[Anomaly Detection]
            Chatbot[AI Chatbot Assistant]
        end
    end

    %% Relationships
    Employee -->|Marks Attendance| Biometric
    Biometric -->|Syncs Data| Attendance
    
    Employee -->|Requests Leave/View Payslip| HR_Payroll
    Employee -->|Queries| Chatbot

    Manager -->|Approves Leave/Funds| HR_Payroll
    Manager -->|Manages Petty Cash| Finance_Module
    Manager -->|View Reports| Reports

    Admin -->|System Config & Oversight| Finova_System
    Admin -->|View Analytics| AI_Layer

    %% Internal Flows
    Attendance --> Payroll
    Leave --> Payroll
    Payroll -->|Payment Records| Finance_Module
    Payroll -->|Notifications| SMS
    
    Finance_Module -->|Data Feed| AI_Layer
    AI_Layer -->|Insights| Reports
```

┌──────────────────────────────────────────────────────┐
│                   API Gateway / Backend               │
│──────────────────────────────────────────────────────│
│  Auth & Security Layer                                │
│  ├─ Authentication (JWT, Refresh Tokens)              │
│  ├─ Role-Based Access Control (RBAC)                   │
│  ├─ Permission Validation                              │
│                                                       │
│  Application Services                                  │
│  ├─ Employee Service                                   │
│  │    • View salary                                    │
│  │    • Submit requests                                │
│  │    • View payslips                                  │
│  ├─ Manager Service                                    │
│  │    • Approve payments                               │
│  │    • Team reports                                   │
│  │    • Budget review                                  │
│  ├─ Admin Service                                      │
│  │    • User & role management                         │
│  │    • System configuration                           │
│  │    • Financial rules                                │
│  ├─ Finance Core Service                               │
│  │    • Payroll calculations                           │
│  │    • Transactions                                   │
│  │    • Accounting logic                                │
│  ├─ Reporting Service                                  │
│  │    • Financial reports                               │
│  │    • Audit exports                                   │
│  └─ Audit & Logging Service                            │
│       • Activity logs                                  │
│       • Compliance tracking                            │
└─────────────┬───────────────────────┬────────────────┘
              │                       │
              ▼                       ▼
┌──────────────────────┐   ┌──────────────────────────┐
│   Primary Database   │   │   Audit / Log Database    │
│──────────────────────│   │──────────────────────────│
│ PostgreSQL / MSSQL   │   │ MongoDB / Elasticsearch  │
│ • Users              │   │ • Access logs             │
│ • Roles              │   │ • Change history          │
│ • Permissions        │   │ • Financial events        │
│ • Payroll            │   └──────────────────────────┘
│ • Transactions       │
└──────────────────────┘
```

---

### Key Design Notes

- **Single backend** serves all portals
- **Frontend separation** based on user role
- **RBAC enforced at API level**
- **Finance logic isolated** from UI logic
- **Audit logging mandatory** for compliance

This architecture scales easily into microservices by splitting each service behind the API Gateway if needed.

---

## Setup and Execution

To run the entire application (Backend, Admin Portal, and Manager Portal) concurrently, follow these steps:

1.  **Install Dependencies**:
    Ensure you have installed dependencies in the root, backend, and frontend directories.
    ```bash
    npm setup
    ```

2.  **Run the Application**:
    From the root directory, run:
    ```bash
    npm start
    ```

    This command will start all services in parallel.

### Service Ports

| Service | Port | URL |
| :--- | :--- | :--- |
| **Backend** | `5000` | `http://localhost:5000` |
| **Admin Portal** | `5175` | `http://localhost:5175` |
| **Manager Portal** | `5176` | `http://localhost:5176` |
