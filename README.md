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
