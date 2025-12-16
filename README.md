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
