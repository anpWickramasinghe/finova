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







┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                        │
│                                                             │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   │
│   │   Admin App   │   │ Manager App  │   │ Employee App │   │
│   │  (React)      │   │  (React)     │   │  (React)     │   │
│   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘   │
│          │                  │                  │           │
│          │   HTTPS + JWT (Authorization Header) │           │
│          └──────────────┬──────────────────────┘           │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     API GATEWAY / BACKEND                    │
│               ( Node.js )               │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │               SECURITY & COMMON LAYER                  │ │
│  │                                                       │ │
│  │  • JWT Authentication                                 │ │
│  │  • Role-Based Authorization (ADMIN / MANAGER / EMP)   │ │
│  │  • Request Validation                                 │ │
│  │  • Rate Limiting & Logging                             │ │
│  └──────────────┬────────────────────────────────────────┘ │
│                 │                                          │
│                 ▼                                          │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                   APPLICATION LAYER                   │ │
│  │                                                       │ │
│  │  • User Management                                    │ │
│  │  • Attendance Management                              │ │
│  │  • Salary & Finance                                   │ │
│  │  • Leave & Approval Workflows                          │ │
│  │                                                       │ │
│  │  (Business Rules, Use Cases, Services)                 │ │
│  └──────────────┬────────────────────────────────────────┘ │
│                 │                                          │
│                 ▼                                          │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                 DOMAIN / CORE LAYER                   │ │
│  │                                                       │ │
│  │  • Entities (User, Employee, Salary, Attendance)      │ │
│  │  • Domain Rules                                       │ │
│  │  • Interfaces (Repositories, Services)                │ │
│  └──────────────┬────────────────────────────────────────┘ │
│                 │                                          │
│                 ▼                                          │
│  ┌───────────────────────────────────────────────────────┐ │
│  │               INFRASTRUCTURE LAYER                     │ │
│  │                                                       │ │
│  │  • Database (PostgreSQL / MySQL / MongoDB)             │ │
│  │  • Cache (Redis)                                      │ │
│  │  • File Storage (S3 / Local)                           │ │
│  │  • External Services (Email, SMS, Payments)           │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
