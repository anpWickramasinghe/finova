# Finova Intelligent Platform - Method of Approach

## 1. Executive Summary
The Finova Intelligent Platform is a comprehensive, centralized software solution designed to unify Finance, Human Resources, and Payroll operations. The approach taken for this project emphasizes a secure, role-based architecture that serves three primary user personas: Employees, Managers, and Administrators. By integrating an AI intelligence layer, the platform goes beyond traditional ERP systems to offer predictive analytics, anomaly detection, and automated conversational assistance.

## 2. Project Objectives
*   **Unification:** Consolidate HR, payroll, and financial accounting into a single source of truth.
*   **Role-Based Access Control (RBAC):** Provide tailored, secure portals for Employees, Managers, and Admins to ensure data privacy and operational efficiency.
*   **Automation:** Automate complex payroll calculations, statutory deductions (EPF/ETF), and overtime processing based on real-time biometric attendance data.
*   **Intelligence:** Embed AI features to assist users (Chatbot) and provide predictive insights and anomaly detection for financial oversight.
*   **Scalability & Modernization:** Utilize a containerized, cloud-ready architecture with modern frontend and backend technologies.

## 3. System Architecture
The platform employs a modular, microservices-oriented architecture orchestrated through a unified API Gateway.

*   **Frontend Layer:** Composed of three distinct applications:
    *   **Employee Portal:** A mobile-first application (React Native/Expo) for on-the-go access to attendance, leaves, payslips, and AI assistance.
    *   **Manager Portal:** A web interface for branch-level oversight, approvals, petty cash management, and reporting.
    *   **Admin Portal:** A centralized web dashboard for system-wide configuration, advanced financial analytics, and user management.
*   **Backend API Gateway (Node.js/Express):** A robust middleware layer handling authentication (JWT), RBAC, and routing requests to specific domain services (HR, Finance, AI, Audit).
*   **Data Persistence:**
    *   **Primary Relational Database:** Handles structured data (Users, Transactions, Payroll, Leaves) using Drizzle ORM for type-safe database interactions.
    *   **Audit/Log Database:** Dedicated storage for access logs, compliance tracking, and change history.

## 4. Technology Stack
The project leverages a modern TypeScript-based stack across the entire lifecycle to ensure type safety and developer productivity.

### Backend
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Language:** TypeScript
*   **ORM:** Drizzle ORM
*   **Database:** PostgreSQL (via Supabase)
*   **Authentication:** better-auth, JWT, bcryptjs
*   **Real-time Communication:** Socket.io (for chat modules)

### Frontend
*   **Employee Portal:** React Native with Expo (Cross-platform Mobile)
*   **Manager/Admin Portals:** React (Web)
*   **Real-time Client:** Socket.io-client

### Infrastructure & Deployment
*   **Containerization:** Docker & Docker Compose (for isolated service deployment)
*   **Package Management:** npm/concurrently for monorepo-style local development

## 5. Core Modules & Implementation Logic

### 5.1 HR & Attendance Module
*   **Approach:** Real-time synchronization with biometric devices.
*   **Logic:** Attendance records are flagged dynamically for weekends and holidays based on system calendars, directly feeding into the Overtime engine.

### 5.2 Smart Payroll & Overtime Engine
*   **Approach:** Automated, batch-processed payroll generation.
*   **Logic:** The `bulkGeneratePayroll` service aggregates attendance data, calculates overtime using dynamic multipliers (e.g., 1.25x for weekdays, 2.0x for weekends), computes statutory deductions (8% Employee EPF, 12% Employer EPF, 3% ETF), and drafts itemized payslips. It supports diverse salary structures (Fixed with OT, Fixed no OT, Daily wages).

### 5.3 Finance & Accounts Module
*   **Approach:** Standardized double-entry bookkeeping.
*   **Logic:** Tracks branch-level transactions, petty cash, and journal entries linked to a comprehensive Chart of Accounts. Generates real-time P&L, Balance Sheets, and Trial Balances.

### 5.4 AI & Communication Layer
*   **Approach:** Embedded intelligent assistance and real-time support.
*   **Logic:** Utilizes Socket.io for live Manager-Admin and Employee support chat. The AI layer analyzes financial data feeds to provide predictive analytics and flag anomalous transactions.

## 6. Development Methodology
The project follows an agile, component-driven development methodology:

1.  **Monorepo Strategy:** Codebase organized logically into `backend`, `frontend/admin-portal`, `frontend/manager-portal`, and `frontend/employee-portal` for streamlined dependency management and parallel execution (`concurrently`).
2.  **Database-First Design:** Defined clear Entity Relationship (ER) diagrams mapping core entities (BRANCH, USER, TRANSACTION, PAYROLL) before implementing the ORM schemas.
3.  **Containerized Environments:** Use of `docker-compose` ensures development environments match production, eliminating "works on my machine" discrepancies.
4.  **Iterative Integration:** Recent phases focused on connecting independent UI components (like the Manager Portal's Financial Reports and Chat) directly to the unified backend API.

## 7. Future Considerations
*   **Continuous CI/CD:** Implementation of GitHub Actions for automated testing and deployment.
*   **Advanced AI Models:** Upgrading the anomaly detection algorithms with more sophisticated machine learning models.
*   **Mobile Expansion:** Publishing the Expo-based Employee Portal to iOS App Store and Google Play Store.

---

## 8. Frontend Implementation

The Finova platform comprises three independent frontend applications, each tailored to a distinct user persona and deployment context. All portals are written in **TypeScript** and share a common design philosophy: role-aware routing, JWT-based session management via an `AuthContext`, and Axios-driven API communication.

### 8.1 Architecture Overview

```mermaid
graph TB
    subgraph FRONTEND["Frontend Layer"]

        subgraph EP["Employee Portal (React Native / Expo SDK 54)"]
            EP_AUTH["auth/ — Login Screen"]
            EP_TABS["tabs — Bottom Navigation"]
            EP_HOME["home/ — Dashboard"]
            EP_ATT["attendance.tsx"]
            EP_OT["overtime.tsx"]
            EP_CHAT_E["chat.tsx"]
            EP_LEAVES["leaves.tsx"]
            EP_AUTH --> EP_TABS
            EP_TABS --> EP_HOME
            EP_TABS --> EP_ATT
            EP_TABS --> EP_OT
            EP_TABS --> EP_CHAT_E
            EP_AUTH --> EP_LEAVES
        end

        subgraph MP["Manager Portal (React 19 / Vite)"]
            MP_AUTH["AuthContext + PrivateRoute"]
            MP_DASH["/dashboard"]
            MP_TXN["/transactions-management"]
            MP_TXN_R["../reports"]
            MP_ATT["/attendance"]
            MP_LV["/leaves"]
            MP_USR["/user-management"]
            MP_CHAT["/support-chat"]
            MP_RPT["/reports"]
            MP_AUTH --> MP_DASH
            MP_AUTH --> MP_TXN --> MP_TXN_R
            MP_AUTH --> MP_ATT
            MP_AUTH --> MP_LV
            MP_AUTH --> MP_USR
            MP_AUTH --> MP_CHAT
            MP_AUTH --> MP_RPT
        end

        subgraph AP["Admin Portal (React 19 / Vite)"]
            AP_AUTH["AuthContext + PrivateRoute"]
            AP_DASH["/dashboard"]
            AP_TXN["/transactions-management"]
            AP_TXN_R["../reporting"]
            AP_USR["/user-management"]
            AP_BR["/branch-management"]
            AP_PAY["/payroll"]
            AP_CHAT["/support-chat"]
            AP_CFG["/configuration"]
            AP_FR["/financial-reports"]
            AP_PR["/payroll-reports"]
            AP_HR["/hr-reports"]
            AP_AUTH --> AP_DASH
            AP_AUTH --> AP_TXN --> AP_TXN_R
            AP_AUTH --> AP_USR
            AP_AUTH --> AP_BR
            AP_AUTH --> AP_PAY
            AP_AUTH --> AP_CHAT
            AP_AUTH --> AP_CFG
            AP_AUTH --> AP_FR
            AP_AUTH --> AP_PR
            AP_AUTH --> AP_HR
        end
    end

    subgraph BACKEND["Backend API Gateway (Node.js / Express)"]
        BE_AUTH["JWT Auth / RBAC"]
        BE_HR["HR & Attendance Service"]
        BE_FIN["Finance & Transactions Service"]
        BE_PAY["Payroll Engine"]
        BE_CHAT["Socket.io Chat Namespace"]
        BE_AI["AI Analytics Layer"]
    end

    subgraph INFRA["Infrastructure (Docker Compose)"]
        DB["PostgreSQL via Supabase"]
        AUDIT_DB["Audit / Log DB"]
    end

    EP_AUTH -- "JWT via expo-secure-store" --> BE_AUTH
    MP_AUTH -- "JWT via AuthContext" --> BE_AUTH
    AP_AUTH -- "JWT via AuthContext" --> BE_AUTH

    EP_TABS -- "Axios REST" --> BE_HR
    MP_AUTH -- "Axios - branchId scoped" --> BE_HR
    MP_AUTH -- "Axios - branchId scoped" --> BE_FIN
    AP_AUTH -- "Axios - global scope" --> BE_HR
    AP_AUTH -- "Axios - global scope" --> BE_FIN
    AP_AUTH -- "Axios" --> BE_PAY
    AP_DASH -- "Axios" --> BE_AI
    AP_FR  -- "Axios" --> BE_AI

    EP_CHAT_E -- "Socket.io" --> BE_CHAT
    MP_CHAT  -- "Socket.io room=branchId" --> BE_CHAT
    AP_CHAT  -- "Socket.io global" --> BE_CHAT

    BE_HR   --> DB
    BE_FIN  --> DB
    BE_PAY  --> DB
    BE_AUTH --> AUDIT_DB
```

### 8.2 Shared Design System & Component Strategy

Both web portals (Manager and Admin) share an identical technology foundation:

| Concern | Library / Tool |
|---|---|
| Build tooling | Vite 7 |
| UI framework | React 19 |
| Styling | Tailwind CSS v3 |
| Headless primitives | Radix UI (Tabs, Dialog, Select, Popover, Dropdown, Avatar, Checkbox, Separator) |
| Icon set | Lucide React |
| Charts & analytics | Recharts |
| Animation | Framer Motion |
| Date utilities | date-fns + react-day-picker |
| Routing | React Router DOM v7 |
| HTTP client | Axios |
| Real-time | Socket.io-client v4 |
| Component variants | class-variance-authority + clsx + tailwind-merge |

A shared `components/` directory inside each portal houses reusable atoms (Buttons, Badges, Cards, Inputs, Modals) built on top of Radix UI primitives with Tailwind variants, ensuring visual consistency across all pages.

### 8.3 Manager Portal (Web — React / Vite)

**Purpose:** Branch-scoped operational oversight for day-to-day HR and finance operations.

| Route | Page Component | Responsibility |
|---|---|---|
| `/login` | `Login.tsx` | JWT authentication & session initialisation |
| `/dashboard` | `dashboard/` | Branch KPIs, summaries, quick-action cards |
| `/transactions-management` | `transactions/` | Petty cash & transaction submission / approval |
| `/transactions-management/reports` | `transactions/reporting/` | Branch-scoped transaction reporting |
| `/attendance` | `attendance/` | Daily attendance records for branch employees |
| `/leaves` | `leaves/` | Leave request viewing and approval workflow |
| `/user-management` | `user-management/` | Branch employee profile management |
| `/support-chat` | `chat/` | Real-time Socket.io branch & admin chat |
| `/reports` | `reports/` | Consolidated attendance, overtime & financial reports |

All protected routes are wrapped in a `PrivateRoute` guard backed by `AuthContext`; unauthenticated users are redirected to `/login`.

**Key implementation details:**
*   **Authentication Flow:** On successful login the backend returns a JWT stored in `AuthContext`; all subsequent Axios requests attach a `Bearer` token via a service-layer interceptor.
*   **Branch Scoping:** The manager's `branchId` (decoded from the JWT payload) is forwarded on every API call, ensuring backend controllers return only branch-relevant records.
*   **Reports Centre:** The `/reports` page uses a Radix UI `Tabs` component to aggregate Attendance, Overtime, and Transaction datasets, rendered as Recharts line/bar charts with exportable tables.
*   **Real-time Chat:** Socket.io rooms are scoped to `branchId`, isolating messages per branch.

### 8.4 Admin Portal (Web — React / Vite)

**Purpose:** Global system administration with cross-branch visibility, payroll processing, and advanced financial reporting.

| Route | Page Component | Responsibility |
|---|---|---|
| `/login` | `Login.tsx` | Admin JWT authentication |
| `/dashboard` | `dashboard/` | Platform-wide KPIs and anomaly alerts |
| `/transactions-management` | `transactions/` | Global transaction management & maker-checker approval |
| `/transactions-management/reporting` | `transactions/reporting/` | System-wide transaction analytics |
| `/user-management` | `user-management/` | Full CRUD for all user accounts and roles |
| `/branch-management` | `branch-management/` | Branch creation, editing, and deactivation |
| `/payroll` | `payroll/` | Bulk payroll generation & approval workflow |
| `/support-chat` | `chat/` | Admin-side multi-branch support chat |
| `/configuration` | `configuration/` | System-wide settings (holidays, pay rates, policies) |
| `/financial-reports` | `reports/FinancialReports` | P&L, Balance Sheet, Trial Balance dashboards |
| `/payroll-reports` | `reports/PayrollReports` | Payroll summary, EPF/ETF statutory reports |
| `/hr-reports` | `reports/HrReports` | Headcount, leave utilisation, attendance analytics |

**Key implementation details:**
*   **Three-Report Architecture:** Financial, Payroll, and HR reports are separate routed pages (not tabs), each with independent data-fetching lifecycles, keeping bundles lean and enabling deep-linking.
*   **Payroll Module:** Triggers `bulkGeneratePayroll` on the backend, displaying draft payslips in an editable grid before final approval. EPF/ETF deductions are surfaced inline for review.
*   **Configuration Module:** System-wide parameters (public holidays, overtime multipliers, EPF/ETF rates) are managed via a dedicated settings page.
*   **Branch Management:** Branch creation cascades `branchId` to all scoped entities (users, transactions, chat rooms).

### 8.5 Employee Portal (Mobile — React Native / Expo)

**Purpose:** Mobile-first self-service interface for employees to track personal HR data, submit leave requests, and interact with the AI assistant.

**Navigation architecture (Expo Router v6 — file-based routing):**

```
app/
├── auth/               ← Login & authentication screens
├── (tabs)/
│   ├── (home)/         ← Home dashboard with quick metrics
│   ├── attendance.tsx  ← Personal attendance log
│   ├── overtime.tsx    ← Overtime records (Regular / Weekend / Holiday)
│   └── chat.tsx        ← AI assistant & support chat
├── leaves.tsx          ← Leave request submission & status tracking
└── modal.tsx           ← Global modal host
```

**Key implementation details:**
*   **Mobile-First Stack:** React Native `0.81.5` + Expo SDK `~54` — single TypeScript codebase deployable to iOS, Android, and Web.
*   **Expo Router:** File-based routing with automatic tab-bar generation and typed deep-links. The `(tabs)` group renders a bottom-navigation bar with Home, Attendance, Overtime, and Chat tabs.
*   **Secure Storage:** `expo-secure-store` persists the JWT on-device, replacing the less-secure AsyncStorage for credentials.
*   **UI & Animation:** `expo-linear-gradient`, `expo-blur`, and `react-native-reanimated (~4.1.1)` deliver premium native animations; `lucide-react-native` supplies icons.
*   **Overtime Screen:** Server-categorised overtime entries (Regular ×1.25, Weekend ×2.0, Holiday ×2.0) rendered as filterable cards with per-category totals.
*   **Leave Requests:** Native date-range picker submission; requests enter a `Pending` state that surfaces in the Manager Portal's approval queue.
*   **Real-time Chat:** `socket.io-client v4` connects to the backend chat namespace for live branch-manager and AI assistant messaging.

### 8.6 Cross-Portal Design Decisions

*   **Shared Auth Pattern:** All three portals use an identical `AuthContext` + `PrivateRoute` pattern, ensuring consistent login-state management and logout propagation.
*   **Axios Service Layer:** Each portal's `src/services/` directory contains domain-specific modules (`attendanceService.ts`, `leaveService.ts`, etc.) with a single base-URL/interceptor configuration, making API migrations low-risk.
*   **Real-time Architecture:** Socket.io room-based isolation delivers messages only to the intended audience — `branchId`-scoped rooms for managers/employees, a global namespace for admins.
*   **Containerised Delivery:** Each portal ships its own `Dockerfile` and is orchestrated via `docker-compose`, allowing the full three-portal frontend stack to start with a single command.

---

## 9. Backend Implementation

The Finova backend is a single **Node.js / Express** application written in **TypeScript**, serving as the unified API Gateway for all three frontend portals. It exposes a RESTful HTTP API alongside a persistent **Socket.io** server for real-time communication, all protected by a layered authentication and RBAC middleware chain.

### 9.1 Architecture Overview

```mermaid
graph TB
    subgraph CLIENTS["Client Layer"]
        EP["Employee Portal (Expo)"]
        MP["Manager Portal (React)"]
        AP["Admin Portal (React)"]
    end

    subgraph SERVER["Backend API Gateway (Express 5 / Node.js)"]
        direction TB

        subgraph AUTH_LAYER["Authentication & RBAC Middleware"]
            BA["better-auth handler\n/api/auth/*"]
            MW_AUTH["requireAuth\n(Better Auth + JWT fallback)"]
            MW_ROLE["requireRole\n(admin | manager | employee)"]
            MW_PWD["checkPasswordChangeRequired"]
        end

        subgraph ROUTES["Route Modules"]
            R_ADMIN["/api/admin"]
            R_BRANCH["/api/branches"]
            R_ATT["/api/attendance"]
            R_LEAVE["/api/leaves"]
            R_PAY["/api/payroll"]
            R_TXN["/api/transactions"]
            R_CHAT["/api/chat"]
            R_STRIPE["/api/stripe"]
            R_FORECAST["/api/forecasting"]
        end

        subgraph CONTROLLERS["Domain Controllers"]
            C_ADMIN["adminController.ts"]
            C_BRANCH["branchController.ts"]
            C_ATT["attendanceController.ts"]
            C_LEAVE["leaveController.ts"]
            C_OT["overtimeController.ts"]
            C_PAY["payrollController.ts"]
            C_SALARY["salaryComponentController.ts"]
            C_TXN["transactionController.ts"]
            C_CHAT["chatController.ts"]
            C_STRIPE["stripeController.ts"]
            C_FORECAST["forecastingController.ts"]
            C_UPLOAD["uploadController.ts"]
        end

        subgraph SERVICES["Service Layer"]
            SVC_OT["overtimeService.ts"]
            SVC_STRIPE["stripeService.ts"]
        end

        subgraph SOCKETS["Real-time Layer"]
            SOCK["chatSockets.ts\n(Socket.io Server)"]
        end
    end

    subgraph DATA["Data Layer"]
        SCHEMA["Drizzle ORM Schema\n(schema.ts)"]
        PG["PostgreSQL\n(Supabase)"]
        UPLOADS["uploads/\n(Static Files via Multer)"]
    end

    EP -- "Bearer JWT" --> AUTH_LAYER
    MP -- "Bearer JWT" --> AUTH_LAYER
    AP -- "Better Auth Session" --> AUTH_LAYER

    AUTH_LAYER --> ROUTES
    ROUTES --> CONTROLLERS
    CONTROLLERS --> SERVICES
    CONTROLLERS --> SCHEMA
    SERVICES --> SCHEMA
    SCHEMA --> PG

    EP -- "Socket.io" --> SOCK
    MP -- "Socket.io room=branchId" --> SOCK
    AP -- "Socket.io global" --> SOCK
    SOCK --> PG

    C_UPLOAD --> UPLOADS
```

### 9.2 Technology Stack

| Concern | Library / Tool |
|---|---|
| Runtime | Node.js (ESM modules) |
| Framework | Express 5 |
| Language | TypeScript 5.9 |
| ORM | Drizzle ORM v0.45 |
| Database driver | pg (node-postgres) |
| Database | PostgreSQL via Supabase |
| Authentication | better-auth v1.4 |
| JWT (branch auth) | jsonwebtoken v9 |
| Password hashing | bcryptjs |
| Real-time | Socket.io v4 |
| File uploads | Multer v2 |
| Payments | Stripe v18 |
| Dev server | nodemon + tsx |
| Build | tsc (TypeScript compiler) |

### 9.3 API Route Map

| Mount Path | Route File | Domain Controllers |
|---|---|---|
| `/api/auth/*` | better-auth handler | Session management, login, logout |
| `/api/admin` | `adminRoutes.ts` | `adminController.ts` — user CRUD, onboarding |
| `/api/branches` | `branchRoutes.ts` | `branchController.ts` — branch CRUD & stats |
| `/api/attendance` | `attendanceRoutes.ts` | `attendanceController.ts`, `overtimeController.ts` |
| `/api/leaves` | `leaveRoutes.ts` | `leaveController.ts` — request & approval workflow |
| `/api/payroll` | `payrollRoutes.ts` | `payrollController.ts`, `salaryComponentController.ts` |
| `/api/transactions` | `transactionRoutes.ts` | `transactionController.ts` — double-entry accounting |
| `/api/chat` | `chatRoutes.ts` | `chatController.ts`, `uploadController.ts` |
| `/api/stripe` | `stripeRoutes.ts` | `stripeController.ts` — Stripe Connect payouts |
| `/api/forecasting` | `forecastingRoutes.ts` | `forecastingController.ts` — AI analytics |
| `/uploads/*` | Static middleware | Multer-managed file assets |

### 9.4 Database Schema (Drizzle ORM)

All tables are defined in `db/schema.ts` using Drizzle ORM's `pgTable` builder with full TypeScript type inference.

| Table | Purpose | Key Fields |
|---|---|---|
| `user` | All platform users (admin / manager / employee) | `role`, `branchId`, `salaryType`, `biometricId`, `stripeAccountId` |
| `session` | better-auth session tokens | `token`, `expiresAt`, `userId` |
| `branch` | Branch offices | `name`, `manager`, `employeeCount`, `revenue`, `stripeAccountId` |
| `attendance` | Daily biometric records | `checkIn/Out`, `workHours`, `overtimeHours`, `isHoliday`, `isWeekend` |
| `overtime_settings` | Per-company OT multipliers | `weekdayMultiplier (1.25)`, `weekendMultiplier (2.0)`, `holidayMultiplier (2.0)` |
| `holiday` | Public holiday calendar | `date`, `name` |
| `leave_request` | Employee leave submissions | `type`, `status (Pending→Approved/Rejected)` |
| `salary_component` | Reusable pay items | `type (Earning/Deduction/Statutory)`, `calculationType` |
| `payroll` | Monthly payslip records | `status (Draft→Pending→Approved→Processed→Paid)`, `netSalary`, EPF/ETF fields |
| `payroll_item` | Line items per payslip | `componentName`, `type`, `amount` |
| `chart_of_accounts` | Double-entry CoA | `code`, `type (asset/liability/equity/revenue/expense)`, `normalBalance` |
| `transaction` | Financial transactions | `status (draft→pending_approval→approved→posted→reconciled)`, `requiresAdminApproval` |
| `journal_line` | Debit/credit legs per transaction | `debit`, `credit`, `accountId` |
| `ledger_entry` | Posted running-balance entries | `runningBalance`, `branchId` |
| `reconciliation` | Bank reconciliation records | `bankStatementRef`, `difference`, `status` |
| `chat_room` | Branch or direct chat rooms | `type (branch/direct)`, `branchId` |
| `chat_room_message` | Messages within rooms | `content`, `attachmentUrl` |
| `support_chat` | Admin support threads | `adminViewedAt`, `archivedAt` |
| `support_message` | Support thread messages | `senderType (user/admin)`, `readAt` |

### 9.5 Middleware Chain

Every protected API request passes through a three-layer middleware chain before reaching a controller:

```
Request → requireAuth → requireRole([...]) → checkPasswordChangeRequired → Controller
```

*   **`requireAuth`:** First attempts a `better-auth` session lookup via request headers. If no session is found, falls back to verifying a `Bearer` JWT (used by the Employee Portal and branch-login flows). Returns `401` if both checks fail.
*   **`requireRole`:** Compares the authenticated user's `role` field against a whitelist of allowed roles per route (e.g., `['admin']` for payroll approval, `['admin', 'manager']` for attendance). Returns `403` on mismatch.
*   **`checkPasswordChangeRequired`:** Intercepts requests from users flagged with `requiresPasswordChange: true`, returning a `403` with code `PASSWORD_CHANGE_REQUIRED` to force a credential update before further access.

### 9.6 Domain Controller Details

**Attendance & Overtime (`attendanceController.ts`, `overtimeController.ts`)**
*   Parses biometric check-in/check-out records; computes `workHours` and `overtimeHours` dynamically.
*   Flags records as `isWeekend` or `isHoliday` by cross-referencing the `holiday` table and the system calendar.
*   Overtime minutes are stored separately (`calculatedOvertimeMinutes`) and approved via a discrete `overtimeStatus` workflow.

**Payroll Engine (`payrollController.ts`)**
*   `bulkGeneratePayroll`: Aggregates the month's attendance per employee, applies salary-type logic (`FixedWithOvertime`, `FixedNoOvertime`, `Daily`), and computes:
    *   Gross earnings from base salary + overtime (`overtimeService.ts`)
    *   Statutory deductions: 8% Employee EPF, 12% Employer EPF, 3% ETF
    *   Custom `salary_component` items (bonuses, allowances, loan deductions)
*   Payroll lifecycle: `Draft → Pending Approval → Approved → Processed → Paid`
*   Stripe payouts (`stripeController.ts`, `stripeService.ts`): Processed payroll records trigger Stripe Connect transfers to employee `stripeAccountId` fields.

**Finance & Accounting (`transactionController.ts`)**
*   Implements double-entry bookkeeping: every `transaction` record spawns balanced `journal_line` debit/credit legs.
*   On approval, journal lines are posted as immutable `ledger_entry` records with a running balance per account.
*   Maker-Checker workflow: transactions above a threshold set `requiresAdminApproval = true` and enter a two-step approval queue (Manager submits → Admin approves).
*   Reports (P&L, Balance Sheet, Trial Balance) are computed at query time by aggregating `ledger_entry` records grouped by `chart_of_accounts.type`.

**Real-time Chat (`chatSockets.ts`, `chatController.ts`)**
*   `chatSockets.ts` registers Socket.io event handlers on the shared `io` server instance at startup (`setupChatSocket(io)`).
*   Branch chat rooms (`type: 'branch'`) are keyed by `branchId`; employees and managers join the same room automatically.
*   Support chat (`type: 'direct'`) persists messages to `support_chat` / `support_message` tables for admin audit history.
*   Uploaded attachments are handled by `uploadController.ts` via Multer and served statically from `/uploads`.

### 9.7 Key Design Decisions

*   **ESM-first:** The backend is configured as `"type": "module"` in `package.json`, requiring `.js` extensions on all internal imports at runtime — enforced via `tsconfig.json`'s `moduleResolution: "bundler"`.
*   **better-auth + JWT Dual-Auth:** `better-auth` manages session-cookie auth for web portals; a separate `jsonwebtoken` fallback supports stateless Bearer-token auth for the mobile Employee Portal and branch-level service accounts.
*   **Schema-as-Source-of-Truth:** Drizzle ORM's `schema.ts` is the single definition for all database entities. Migrations are generated via `drizzle-kit` and applied to Supabase PostgreSQL, eliminating schema drift.
*   **Maker-Checker Financial Controls:** High-value transactions programmatically set `requiresAdminApproval`, enforcing a two-person rule for financial posting without any manual override.
*   **Stateless Overtime Logic:** OT calculations are re-derived from raw attendance records by `overtimeService.ts` at payroll generation time, making retroactive multiplier changes safe and auditable.

---

## 10. AI / ML Integration (ai-core)

The `ai-core` directory contains two independent Python microservices that extend the Finova platform with generative AI and predictive machine learning capabilities. Both services are built with **FastAPI** and **uvicorn**, communicate directly with the same **PostgreSQL** database as the main backend, and are proxied through the Node.js API Gateway.

### 10.1 Architecture Overview

```mermaid
graph TB
    subgraph CLIENTS["Client Portals"]
        AP["Admin Portal"]
        EP["Employee Portal"]
    end

    subgraph BACKEND["Node.js API Gateway"]
        CHAT_RT["/api/chat — chatController.ts"]
        FORECAST_RT["/api/forecasting — forecastingController.ts"]
    end

    subgraph AICORE["ai-core (Python Microservices)"]

        subgraph CHATBOT["chatbot/ — Nova Financial Assistant"]
            CB_SERVER["server.py (FastAPI)\nPOST /chat\nDELETE /chat/{session_id}\nGET /health"]
            CB_AGENT["agent.py\nbuild_agent(session_id)\nAgno Agent + Gemini 2.5 Flash"]
            CB_SESSION["In-memory Session Store\nsession_id → Agent instance"]

            subgraph CB_TOOLS["tools/"]
                T_FIN["financial_tools.py\nget_financial_summary\nget_trial_balance\nget_recent_transactions"]
                T_PAY["payroll_tools.py\nget_payroll_summary\nget_employee_payroll\nget_payroll_status_overview"]
                T_EMP["employee_tools.py\nget_employee_list\nget_employee_details\nget_employee_stats"]
            end

            CB_DB["db.py\nasyncpg Pool\nmin=2 max=10"]
            CB_SERVER --> CB_AGENT --> CB_SESSION
            CB_AGENT --> CB_TOOLS
            CB_TOOLS --> CB_DB
        end

        subgraph FORECASTING["forecasting/ — Cash Flow Predictor"]
            FC_SERVER["server.py (FastAPI)\nGET /predict?days=N\nGET /health"]
            FC_AGENT["agent.py\nCashFlowForecaster\nRandomForestRegressor"]
            FC_DB["db.py\nfetch_historical_cash_flow\nasyncpg (direct connect)"]
            FC_SERVER --> FC_AGENT
            FC_AGENT --> FC_DB
        end

        subgraph PLANNED["Planned Modules"]
            ANOMALY["anomaly-detection/\n(reserved)"]
            JOURNAL["journal-ai/\n(reserved)"]
        end
    end

    subgraph DB["Data Layer"]
        PG["PostgreSQL (Supabase)\nledger_entry\nchart_of_accounts\ntransaction\npayroll\nuser\nbranch"]
    end

    AP -- "Chat message" --> BACKEND
    EP -- "Chat message" --> BACKEND
    BACKEND --> CB_SERVER
    BACKEND --> FC_SERVER

    CB_DB --> PG
    FC_DB --> PG
```

### 10.2 Technology Stack

| Concern | Library / Tool |
|---|---|
| Language | Python 3.11+ |
| Web framework | FastAPI ≥ 0.111 |
| ASGI server | uvicorn (standard) |
| AI agent framework | Agno ≥ 1.4.5 |
| LLM | Google Gemini 2.5 Flash (via `google-genai`) |
| LLM fallback | OpenAI SDK ≥ 1.30 (wired, switchable) |
| Async DB driver | asyncpg ≥ 0.29 |
| ML library | scikit-learn ≥ 1.4 |
| Data manipulation | pandas ≥ 2.2, numpy ≥ 1.26 |
| Data validation | Pydantic v2 |
| Config | python-dotenv |
| Package manager | uv (via `pyproject.toml` + `uv.lock`) |

### 10.3 Module 1 — Nova Financial Chatbot (`chatbot/`)

**Purpose:** A conversational financial assistant named **Nova** that allows platform admins to query live financial, payroll, and HR data using natural language.

#### Request Lifecycle

```
Admin sends message
    → Node.js chatController.ts
        → POST /chat (FastAPI chatbot microservice)
            → get_or_create_agent(session_id)
                → Agent.run(enriched_message)
                    → Gemini 2.5 Flash selects tool(s)
                        → Tool queries PostgreSQL via asyncpg
                        → Returns JSON to agent
                    → Agent generates markdown response
            → ChatResponse { response, session_id, timestamp }
        → chatController forwards response to client
```

#### Agent Configuration (`agent.py`)

| Parameter | Value |
|---|---|
| Agent name | `Nova` |
| LLM model | `gemini-2.5-flash` (Google Gemini) |
| Session memory | Last 8 messages (`num_history_messages=8`) |
| Output format | Markdown (`markdown=True`) |
| Session scope | Per authenticated user ID (forwarded from Node.js proxy) |
| Session store | In-memory Python dict (production: Redis recommended) |

**System Prompt (SYSTEM_PROMPT):** Nova is instructed to use tools exclusively for all numeric data (never guessing), resolve relative dates to `YYYY-MM-DD`, format currency as `LKR #,###.00`, and respond in professional markdown tables and lists.

#### Tool Functions (`tools/`)

All tools follow the same pattern: a **public sync wrapper** calls an **async inner function** via `asyncio.run()` (safe because `agent.run()` is dispatched in a thread via `asyncio.to_thread()`). Each tool queries PostgreSQL directly via the `asyncpg` pool initialized at server startup.

| Tool Function | Module | Data Source | Description |
|---|---|---|---|
| `get_financial_summary(start_date, end_date)` | `financial_tools.py` | `ledger_entry` + `chart_of_accounts` | P&L summary grouped by account type (revenue vs expense), net income |
| `get_trial_balance()` | `financial_tools.py` | `ledger_entry` + `chart_of_accounts` | Current debit/credit/balance for all active accounts |
| `get_recent_transactions(limit)` | `financial_tools.py` | `transaction` + `branch` | Latest posted/approved transactions (capped at 50) |
| `get_payroll_summary(month, year)` | `payroll_tools.py` | `payroll` | Totals (base, earnings, deductions, net) grouped by payroll status |
| `get_employee_payroll(name_or_id, month, year)` | `payroll_tools.py` | `payroll` + `payroll_item` + `user` | Full payslip breakdown for an individual employee |
| `get_payroll_status_overview(year)` | `payroll_tools.py` | `payroll` | Month-by-month payroll lifecycle status for a full year |
| `get_employee_list(branch_name)` | `employee_tools.py` | `user` + `branch` | Employee roster, optionally filtered by branch (partial name match) |
| `get_employee_details(name_or_id)` | `employee_tools.py` | `user` + `branch` | Full profile: salary, OT rate, EPF, NIC, address |
| `get_employee_stats()` | `employee_tools.py` | `user` | Totals: active/inactive count, branch count, salary-type breakdown |

#### FastAPI Endpoints (`server.py`)

| Method | Path | Description |
|---|---|---|
| `POST` | `/chat` | Send a message; returns Nova's markdown response + session metadata |
| `DELETE` | `/chat/{session_id}` | Clears conversation history for a session (called on chat reset) |
| `GET` | `/health` | Liveness probe used by the Node.js backend before forwarding requests |

**Date enrichment:** Every incoming message is automatically prefixed with `[Today's date: YYYY-MM-DD]` so the agent can correctly resolve relative date references (e.g., "last month", "this quarter").

### 10.4 Module 2 — Cash Flow Forecasting (`forecasting/`)

**Purpose:** A machine learning microservice that predicts future daily net cash flow using historical ledger data, serving forecast charts on the Admin Portal dashboard.

#### ML Pipeline (`agent.py — CashFlowForecaster`)

```
fetch_historical_cash_flow()
    → Queries ledger_entry JOIN chart_of_accounts WHERE type = 'asset'
    → Returns daily SUM(debit − credit) per day → pandas DataFrame

CashFlowForecaster.__init__()
    → _prepare_data(): reindex to fill missing days with 0 (continuous date range)

CashFlowForecaster._create_features()
    → Generates temporal features per date:
       day_of_week | day_of_month | month | is_weekend | is_month_start | is_month_end

CashFlowForecaster.train()
    → Fits RandomForestRegressor(n_estimators=100, random_state=42) on features
    → Returns False if fewer than 7 data points (insufficient history)

CashFlowForecaster.predict(days=30)
    → Generates future date range from last historical date
    → Applies trained model to future feature matrix
    → Returns: [{ date, predicted_flow, type: "inflow"|"outflow" }]
    → Fallback (_mock_prediction): all zeros if no historical data
```

#### Feature Engineering

| Feature | Description |
|---|---|
| `day_of_week` | 0 (Monday) – 6 (Sunday) |
| `day_of_month` | 1 – 31 |
| `month` | 1 – 12 |
| `is_weekend` | 1 if Saturday or Sunday |
| `is_month_start` | 1 if day ≤ 3 (captures payroll/rent payment patterns) |
| `is_month_end` | 1 if day ≥ 28 (captures end-of-month settlement patterns) |

#### FastAPI Endpoints (`server.py`)

| Method | Path | Query Params | Description |
|---|---|---|---|
| `GET` | `/predict` | `days` (default 30) | Returns predicted daily cash flow for the next N days |
| `GET` | `/health` | — | Liveness probe |

### 10.5 Planned Modules

| Module | Directory | Status | Intent |
|---|---|---|---|
| Anomaly Detection | `anomaly-detection/` | Reserved (empty) | Flag statistically abnormal transactions in real time |
| Journal AI | `journal-ai/` | Reserved (empty) | Auto-suggest double-entry journal lines from natural-language descriptions |

### 10.6 Key Design Decisions

*   **Microservice Isolation:** Each AI module is a fully independent Python process with its own `pyproject.toml`, `.venv`, and `docker-compose.yml`. This allows independent scaling, model swaps, and failure isolation without impacting the main Node.js backend.
*   **Proxy Pattern:** The Node.js backend acts as the sole entry point for all client requests. It forwards to the AI microservices internally, meaning clients never directly address the Python services — preserving a single auth boundary and a unified API surface.
*   **LLM-agnostic Agent Layer:** The Agno agent framework decouples the tool logic from the specific LLM. The model is currently `gemini-2.5-flash` but can be swapped to any Agno-compatible provider (OpenAI, Anthropic, etc.) by changing a single `model=` argument in `agent.py`.
*   **Tool-Calling over RAG:** Rather than a retrieval-augmented generation approach, Nova uses structured tool functions backed by live SQL queries. This guarantees data accuracy and prevents hallucinated financial figures — a critical requirement for a financial platform.
*   **Session Memory:** The chatbot maintains the last 8 conversation turns per user (keyed by authenticated user ID), providing contextual multi-turn dialogue without unbounded memory growth.
*   **Graceful ML Fallback:** The `CashFlowForecaster` includes a `_mock_prediction()` fallback that returns zeroed forecasts if insufficient historical data exists, preventing the forecasting endpoint from erroring on new installations.
*   **asyncpg Connection Pool:** The chatbot module uses a shared `asyncpg` pool (min 2, max 10 connections, 30s timeout) initialized at FastAPI startup and torn down on shutdown, ensuring efficient async database access without connection exhaustion.

---

## 11. Development Environment and Project Structure

### 11.1 Repository Organisation

The Finova codebase follows a **monorepo** layout managed at the root with a single `package.json` and `concurrently` for parallel process startup. Each sub-application is independently deployable via its own `Dockerfile`.

```
finova/                               ← Monorepo root
├── package.json                      ← Root scripts (concurrently, husky)
├── docker-compose.yml                ← Production container orchestration
│
├── backend/                          ← Node.js / Express API Gateway
│   ├── server.ts                     ← Entry point (Express + Socket.io)
│   ├── auth.ts                       ← better-auth configuration
│   ├── drizzle.config.ts             ← Drizzle ORM / migration config
│   ├── db/
│   │   ├── schema.ts                 ← All table definitions (single source of truth)
│   │   └── index.ts                  ← DB connection export
│   ├── middleware/
│   │   └── authMiddleware.ts         ← requireAuth | requireRole | checkPasswordChange
│   ├── routes/                       ← Express route modules (9 domain routes)
│   ├── controllers/                  ← Domain controllers (14 files)
│   ├── services/                     ← overtimeService, stripeService
│   ├── sockets/
│   │   └── chatSockets.ts            ← Socket.io event handlers
│   ├── drizzle/                      ← Generated migration SQL files
│   └── uploads/                      ← Multer file upload storage
│
├── frontend/
│   ├── admin-portal/                 ← React 19 / Vite (Admin web app)
│   │   └── src/
│   │       ├── pages/                ← 12 routed page modules
│   │       ├── components/           ← Shared UI atoms
│   │       ├── services/             ← Axios API service modules
│   │       └── context/              ← AuthContext
│   ├── manager-portal/               ← React 19 / Vite (Manager web app)
│   │   └── src/
│   │       ├── pages/                ← 9 routed page modules
│   │       ├── components/
│   │       ├── services/
│   │       └── context/
│   └── employee-portal/              ← React Native / Expo SDK 54 (Mobile)
│       ├── app/                      ← Expo Router file-based routes
│       │   ├── (tabs)/               ← Bottom-tab navigation group
│       │   └── auth/                 ← Login screens
│       ├── screens/                  ← Screen components
│       ├── services/                 ← Axios API service modules
│       ├── providers/                ← Context providers
│       └── theme/                    ← Design tokens
│
└── ai-core/                          ← Python AI microservices
    ├── chatbot/                      ← Nova financial assistant (FastAPI)
    │   ├── server.py                 ← FastAPI app + session store
    │   ├── agent.py                  ← Agno agent + Gemini 2.5 Flash
    │   ├── db.py                     ← asyncpg connection pool
    │   └── tools/                    ← financial, payroll, employee tools
    ├── forecasting/                  ← Cash flow predictor (FastAPI + scikit-learn)
    │   ├── server.py                 ← FastAPI app
    │   ├── agent.py                  ← CashFlowForecaster (RandomForest)
    │   └── db.py                     ← Historical data queries
    ├── anomaly-detection/            ← (Reserved — future module)
    └── journal-ai/                   ← (Reserved — future module)
```

### 11.2 Prerequisites

| Requirement | Version | Used By |
|---|---|---|
| Node.js | ≥ 20 LTS | Backend, Admin Portal, Manager Portal |
| npm | ≥ 10 | All Node.js modules |
| Python | ≥ 3.11 | ai-core microservices |
| uv | latest | Python dependency management (ai-core) |
| Docker & Docker Compose | latest | Production container deployment |
| PostgreSQL | 15+ (via Supabase) | Shared database for all services |
| Expo CLI | via `npx expo` | Employee Portal mobile development |

### 11.3 Environment Variables

Each service has its own `.env` file. A `.env.example` is provided as a template.

**`backend/.env`**

```env
PORT=5000
NODE_ENV=development

# Authentication
JWT_SECRET=<strong-random-secret>
BETTER_AUTH_SECRET=<strong-random-secret>
BETTER_AUTH_URL=http://localhost:5001
FRONTEND_URL=http://localhost:8081

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# AI microservice
AI_CHATBOT_URL=http://localhost:8000

# External APIs
CALENDARIFIC_API_KEY=<key>
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<key>
SUPABASE_STORAGE_BUCKET=uploads
STRIPE_SECRET_KEY=sk_test_<key>
STRIPE_WEBHOOK_SECRET=whsec_<key>
```

**`ai-core/chatbot/.env`**

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname   # same as backend
BETTER_AUTH_SECRET=<same-secret-as-backend>
GOOGLE_API_KEY=<gemini-api-key>
CHATBOT_PORT=8000
```

**`ai-core/forecasting/.env`**

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

**`frontend/admin-portal/.env` & `frontend/manager-portal/.env`**

```env
VITE_API_URL=http://localhost:5000
```

### 11.4 Local Development Setup

#### Step 1 — Install all Node.js dependencies

```bash
# From the monorepo root
npm run setup
# Equivalent to: cd backend && npm install &&
#   cd ../frontend/admin-portal && npm install &&
#   cd ../manager-portal && npm install
```

#### Step 2 — Install Employee Portal dependencies

```bash
cd frontend/employee-portal && npm install
```

#### Step 3 — Set up Python environments (ai-core)

```bash
# Chatbot
cd ai-core/chatbot
uv sync           # reads pyproject.toml + uv.lock

# Forecasting
cd ../forecasting
uv sync
```

#### Step 4 — Apply database migrations

```bash
cd backend
npx drizzle-kit push          # pushes schema.ts to Supabase PostgreSQL
```

#### Step 5 — Start all services

```bash
# From the monorepo root — starts Backend + Admin Portal + Manager Portal concurrently
npm start

# In separate terminals:
cd frontend/employee-portal && npx expo start --android   # or --ios / --web
cd ai-core/chatbot            && uv run python server.py
cd ai-core/forecasting        && uv run python server.py
```

#### Running portals individually

```bash
npm run admin      # Admin Portal   → http://localhost:5175
npm run manager    # Manager Portal → http://localhost:5176
```

### 11.5 Service Port Map

| Service | Local Port | Docker Port | Description |
|---|---|---|---|
| Backend API | `:5000` | `5001:5000` | Express API Gateway + Socket.io |
| Admin Portal | `:5175` | `8081:80` | React web app (Admin) |
| Manager Portal | `:5176` | `8082:80` | React web app (Manager) |
| Employee Portal | `:8081` (Expo) | `8083:80` | Expo mobile/web app |
| Nova Chatbot | `:8000` | — | FastAPI AI chatbot microservice |
| Forecasting API | `:8001` | — | FastAPI ML forecasting microservice |
| PostgreSQL | `:5432` | via Supabase | Shared relational database |

### 11.6 Inter-Module Communication

```mermaid
graph LR
    subgraph BROWSERS["Browser / Mobile Clients"]
        AP["Admin Portal :5175"]
        MP["Manager Portal :5176"]
        EP["Employee Portal (Expo)"]
    end

    subgraph BACKEND["Backend :5000"]
        REST["REST API\n/api/*"]
        WS["Socket.io\nws://"]
    end

    subgraph AI["AI Core (Python)"]
        CB["Chatbot :8000\nPOST /chat"]
        FC["Forecasting :8001\nGET /predict"]
    end

    DB[("PostgreSQL\nSupabase")]

    AP -- "HTTPS + Bearer JWT" --> REST
    MP -- "HTTPS + Bearer JWT" --> REST
    EP -- "HTTPS + Bearer JWT" --> REST
    AP -- "WebSocket" --> WS
    MP -- "WebSocket (room=branchId)" --> WS
    EP -- "WebSocket" --> WS

    REST -- "HTTP proxy\nAI_CHATBOT_URL" --> CB
    REST -- "HTTP proxy\nforecastingRoutes" --> FC

    REST --> DB
    WS  --> DB
    CB  --> DB
    FC  --> DB
```

**Communication rules:**
- All client-to-backend traffic is **HTTPS REST** or **WebSocket (Socket.io)**, authenticated with `Bearer JWT` or a `better-auth` session cookie.
- The backend **proxies** all AI requests internally — clients never speak directly to the Python services.
- All four services (Backend, Chatbot, Forecasting) share the **same PostgreSQL database** via their respective `DATABASE_URL` environment variable.
- Socket.io rooms are scoped by `branchId` (managers/employees) or global (admins) — messages are never cross-contaminated between branches.

### 11.7 Docker Production Deployment

The `docker-compose.yml` orchestrates **four containers** for production:

```bash
# Build and start all containers
docker compose up --build -d

# View running containers
docker compose ps

# View logs for a specific service
docker compose logs -f backend
```

| Container | Image built from | Host Port | Notes |
|---|---|---|---|
| `finova-backend` | `backend/Dockerfile` | `5001` | Express + Socket.io; restarts on failure |
| `finova-admin-portal` | `frontend/admin-portal/Dockerfile` | `8081` | Vite build served by Nginx |
| `finova-manager-portal` | `frontend/manager-portal/Dockerfile` | `8082` | Vite build served by Nginx |
| `finova-employee-portal` | `frontend/employee-portal/Dockerfile` | `8083` | Expo web build |

The AI microservices (`chatbot`, `forecasting`) are run separately (as Python processes or their own containers) and connected via the `AI_CHATBOT_URL` environment variable on the backend.

### 11.8 Developer Workflow Summary

```
1. Clone repository
2. Copy .env.example → .env for backend, frontend portals, and ai-core modules
3. Fill in DATABASE_URL, JWT_SECRET, GOOGLE_API_KEY, Stripe keys
4. npm run setup         (install Node deps)
5. cd frontend/employee-portal && npm install
6. cd ai-core/chatbot && uv sync
7. cd ai-core/forecasting && uv sync
8. cd backend && npx drizzle-kit push    (sync schema to DB)
9. npm start             (launches backend + admin + manager portals)
10. npx expo start       (employee portal — separate terminal)
11. uv run python server.py  (chatbot — separate terminal)
12. uv run python server.py  (forecasting — separate terminal)
```

---

## 12. Backend Testing Strategy

The Finova backend ensures reliability and correctness through a comprehensive testing strategy using **Jest** and **Supertest**. The tests are divided into Unit Tests and Integration Tests, focusing on validating the business logic and API endpoints without relying on the live database.

### 12.1 Testing Stack

*   **Test Runner:** Jest (configured via `jest.config.cjs`)
*   **Language Support:** `ts-jest` for running TypeScript tests natively
*   **HTTP Assertions:** Supertest (for integration API testing)
*   **Mocking:** Jest's built-in mocking capabilities (for mocking Drizzle ORM and internal services)

### 12.2 Test Structure (`backend/__tests__/`)

The tests are organized into discrete directories based on their scope:

```
backend/__tests__/
├── setup.ts                      # Global Jest setup
├── unit/                         # Unit Tests
│   ├── authMiddleware.test.ts    # Middleware logic
│   ├── attendanceController.test.ts # Controller-level testing
│   ├── payrollController.test.ts # Payroll logic testing
│   └── overtimeService.test.ts   # Core business logic
└── integration/                  # Integration Tests
    ├── testApp.ts                # Lightweight Express app for testing
    └── attendance.integration.test.ts # End-to-end API route testing
```

### 12.3 Unit Testing Approach

Unit tests focus on isolating individual components (controllers, services, middleware) from external dependencies like the PostgreSQL database.

*   **Mocking the ORM:** Drizzle ORM calls are heavily mocked using `jest.mock`. This ensures tests execute quickly and are not affected by database state. For example, in `attendanceController.test.ts`, database functions like `db.select()` and `db.insert()` are intercepted and replaced with predictable mock data.
*   **Service Isolation:** Core services like `overtimeService.ts` are tested independently to verify that statutory rules (e.g., weekend multipliers, holiday detection) are calculated correctly given varying inputs.
*   **Middleware Verification:** `authMiddleware.test.ts` validates that the system correctly parses JWTs, enforces role-based access control (RBAC), and correctly handles unauthorized scenarios.

### 12.4 Integration Testing Approach

Integration tests verify that the Express routes, middleware chain, and controllers work together correctly.

*   **`testApp.ts`:** To optimize integration testing, a lightweight version of the Express application (`testApp.ts`) is used. This test app mounts the real routers (`attendanceRoutes`, `payrollRoutes`) but intentionally omits Socket.io and `better-auth` initializations, preventing unwanted database connections at import time.
*   **Supertest Execution:** Integration tests use `supertest` to dispatch actual HTTP requests (e.g., `POST /api/attendance/check-in`) against the `testApp`.
*   **Mocking at the Integration Level:** Even though full HTTP requests are made, the underlying controllers and database operations are still mocked to ensure reproducible scenarios (like testing 200 OK vs 500 Internal Server Error paths).

### 12.5 Running Tests

Tests are executed using the standard npm script configured in `backend/package.json`:

```bash
cd backend
npm test
```

This command invokes Jest, which automatically discovers all `*.test.ts` files within the `__tests__` directory, applies the CommonJS/ESM module resolution mappings defined in `jest.config.cjs`, and runs the test suites.
