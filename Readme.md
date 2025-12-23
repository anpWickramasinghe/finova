   ## High-Level System Architecture
    
    
                ┌─────────────────────┐
                │   Admin Web App      │
                │   (React / Next.js)  │
                └─────────▲───────────┘
                          │
                ┌─────────────────────┐
                │  Manager Web App     │
                │  (React / Next.js)  │
                └─────────▲───────────┘
                          │
                ┌─────────────────────┐
                │ Employee Mobile App  │
                │ (React Native / Expo)│
                └─────────▲───────────┘
                          │
                   HTTPS / REST / JWT
                          │
        ┌────────────────────────────────────┐
        │      Backend API (Single App)       │
        │     Modular Monolithic System       │
        │                                    │
        │  • Auth & Roles                    │
        │  • Branch Management               │
        │  • Employee & HR                   │
        │  • Attendance                      │
        │  • Payroll & Finance               │
        │  • Reports                         │
        │  • Notifications                  │
        └──────────────────▲─────────────────┘
                           │
                 ┌─────────────────────┐
                 │   Central Database   │
                 │ (PostgreSQL / MySQL) │
                 └─────────────────────┘
