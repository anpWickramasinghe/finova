# Finova – High-Level Architecture

This document describes the complete high-level architecture of the Finova platform using Mermaid diagrams.

---

## 1. System Overview

```mermaid
graph TB
    subgraph Clients["👥 Client Layer"]
        direction TB
        AP["🖥️ Admin Portal\nReact + Vite\n:8081"]
        MP["🖥️ Manager Portal\nReact + Vite\n:8082"]
        EP["📱 Employee Portal\nExpo React Native\n:8083"]
    end

    subgraph Gateway["🔀 API Gateway / Backend"]
        direction TB
        BE["⚙️ Node.js + Express\nBetter-Auth · Socket.io\n:5000 / :5001"]
    end

    subgraph AILayer["🤖 AI Core Services (Python)"]
        direction LR
        CB["💬 Chatbot Agent\nFastAPI · LangChain\n:8000"]
        FC["📈 Forecasting Agent\nFastAPI · ML\n:8001"]
        JA["📒 Journal AI\nFastAPI"]
    end

    subgraph DataLayer["🗄️ Data Layer"]
        direction LR
        PG[("🐘 PostgreSQL\nDrizzle ORM")]
        SB["☁️ Supabase Storage\nFile Uploads"]
    end

    subgraph ExtServices["🌐 External Services"]
        direction LR
        STRIPE["💳 Stripe\nPayments"]
        CAL["📅 Calendarific\nHoliday API"]
    end

    %% Client → Backend
    AP -->|REST + WebSocket| BE
    MP -->|REST + WebSocket| BE
    EP -->|REST + WebSocket| BE

    %% Backend → AI
    BE -->|HTTP| CB
    BE -->|HTTP| FC
    BE -->|HTTP| JA

    %% AI → DB
    CB -->|SQL| PG
    FC -->|SQL| PG

    %% Backend → Data
    BE -->|Drizzle ORM| PG
    BE -->|SDK| SB

    %% Backend → External
    BE -->|Stripe SDK| STRIPE
    BE -->|REST| CAL
```

---

## 2. Frontend Portals – Feature Map

```mermaid
graph LR
    subgraph AdminPortal["🖥️ Admin Portal  (Super-Admin)"]
        direction TB
        A1["📊 Dashboard"]
        A2["🏢 Branch Management"]
        A3["👤 User Management"]
        A4["💰 Payroll"]
        A5["🧾 Transactions"]
        A6["📄 Reports"]
        A7["⚙️ Configuration"]
        A8["💬 Chat"]
    end

    subgraph ManagerPortal["🖥️ Manager Portal  (Branch Manager)"]
        direction TB
        M1["📊 Dashboard"]
        M2["👥 User Management"]
        M3["🕐 Attendance"]
        M4["🌴 Leaves"]
        M5["🧾 Transactions"]
        M6["📒 Accounting"]
        M7["📄 Reports"]
        M8["💬 Chat"]
    end

    subgraph EmployeePortal["📱 Employee Portal  (Mobile / Expo)"]
        direction TB
        E1["🏠 Home"]
        E2["⏰ Attendance\n& Check-in"]
        E3["⌛ Overtime"]
        E4["💬 Chat"]
    end
```

---

## 3. Backend – API Route & Controller Map

```mermaid
graph LR
    subgraph Routes["📡 API Routes  /api/..."]
        R1["/auth/*"]
        R2["/admin"]
        R3["/branches"]
        R4["/attendance"]
        R5["/leaves"]
        R6["/payroll"]
        R7["/transactions"]
        R8["/chat"]
        R9["/stripe"]
        R10["/forecasting"]
    end

    subgraph Controllers["🎮 Controllers"]
        C1["adminController"]
        C2["branchController"]
        C3["attendanceController"]
        C4["leaveController\novertimeController"]
        C5["payrollController\nsalaryComponentController"]
        C6["transactionController"]
        C7["chatController"]
        C8["stripeController"]
        C9["forecastingController"]
        C10["uploadController"]
    end

    subgraph Services["⚙️ Services"]
        S1["overtimeService"]
        S2["stripeService"]
    end

    subgraph Auth["🔐 Auth & Middleware"]
        MW["authMiddleware\n(JWT · Better-Auth)"]
        BA["Better-Auth\nSession · OAuth"]
    end

    R1 --> BA
    R2 --> MW --> C1
    R3 --> MW --> C2
    R4 --> MW --> C3
    R5 --> MW --> C4
    R6 --> MW --> C5
    R7 --> MW --> C6
    R8 --> MW --> C7
    R9 --> C8
    R10 --> MW --> C9

    C4 --> S1
    C8 --> S2
```

---

## 4. Real-Time Communication – Socket.io Flow

```mermaid
sequenceDiagram
    participant EP as Employee / Manager Portal
    participant IO as Socket.io Server
    participant DB as PostgreSQL

    EP->>IO: connect (JWT auth)
    EP->>IO: join_room (roomId)
    IO-->>EP: room_joined

    EP->>IO: send_message (roomId, content)
    IO->>DB: persist message
    IO-->>EP: receive_message (broadcast to room)

    EP->>IO: typing (roomId)
    IO-->>EP: user_typing (broadcast)

    EP->>IO: disconnect
```

---

## 5. Authentication & Session Flow

```mermaid
sequenceDiagram
    participant Client as Browser / App
    participant API as Express Backend
    participant BA as Better-Auth
    participant DB as PostgreSQL

    Client->>API: POST /api/auth/sign-in
    API->>BA: toNodeHandler(auth)
    BA->>DB: validate credentials
    DB-->>BA: user + session
    BA-->>API: session token (cookie / JWT)
    API-->>Client: 200 OK + token

    Client->>API: GET /api/protected (Bearer token)
    API->>API: authMiddleware – verify JWT
    API-->>Client: protected data
```

---

## 6. Payroll Processing Flow

```mermaid
flowchart TD
    A["Admin triggers payroll run"] --> B["payrollController.generatePayroll()"]
    B --> C["Fetch user & salary components"]
    C --> D["Calculate base salary"]
    D --> E["Fetch attendance for period"]
    E --> F{"Overtime hours?"}
    F -- Yes --> G["overtimeService\ncalculate OT pay"]
    F -- No --> H["Skip OT"]
    G --> I["Aggregate earnings & deductions"]
    H --> I
    I --> J["Create PAYROLL record"]
    J --> K["Create PAYROLL_ITEM rows"]
    K --> L["Post journal entries\n(Accounting module)"]
    L --> M["Payroll status → 'processed'"]
    M --> N["Employee views payslip\nin Employee Portal"]
```

---

## 7. AI Services – Internal Architecture

```mermaid
graph TB
    subgraph Chatbot["💬 AI Chatbot (Python FastAPI :8000)"]
        CB_S["server.py\nFastAPI endpoints"]
        CB_A["agent.py\nLangChain ReAct Agent"]
        CB_T["tools/\nDB query tools"]
        CB_D["db.py\nPostgreSQL connection"]

        CB_S --> CB_A --> CB_T --> CB_D
    end

    subgraph Forecasting["📈 Forecasting Agent (Python FastAPI :8001)"]
        FC_S["server.py\nFastAPI endpoints"]
        FC_A["agent.py\nML / LLM Agent"]
        FC_D["db.py\nPostgreSQL connection"]

        FC_S --> FC_A --> FC_D
    end

    subgraph JournalAI["📒 Journal AI"]
        JA_M["LLM-assisted\nJournal Entry Suggester"]
    end

    BE["⚙️ Express Backend"] -->|POST /chat| CB_S
    BE -->|POST /forecast| FC_S
    BE -->|POST /suggest| JA_M
```

---

## 8. Data Flow – Attendance to Payroll

```mermaid
flowchart LR
    CHK["Employee\nCheck-in / Check-out\n(Employee Portal)"]
    ATT["ATTENDANCE\ntable"]
    OT["overtimeService\ncalculate hours"]
    OTS["OVERTIME_SETTINGS\n(rules & multipliers)"]
    PAY["PAYROLL\ntable"]
    PAY_I["PAYROLL_ITEM\ntable"]
    JL["JOURNAL_LINE\n(Accounting)"]
    COA["CHART_OF_ACCOUNTS"]

    CHK -->|API POST /attendance| ATT
    ATT --> OT
    OTS --> OT
    OT --> PAY
    PAY --> PAY_I
    PAY_I --> JL
    COA --> JL
```

---

## 9. Deployment Topology (Docker)

```mermaid
graph TB
    subgraph DockerHost["🐳 Docker Host"]
        direction TB
        BE_C["finova-backend\nNode.js :5000 → :5001"]
        AP_C["finova-admin-portal\nNginx :80 → :8081"]
        MP_C["finova-manager-portal\nNginx :80 → :8082"]
        EP_C["finova-employee-portal\nNginx :80 → :8083"]
        CB_C["ai-chatbot\nFastAPI :8000"]
        FC_C["ai-forecasting\nFastAPI :8001"]
    end

    subgraph Cloud["☁️ Cloud / Managed"]
        PG_C[("PostgreSQL\nManaged DB")]
        SB_C["Supabase Storage\nFile Uploads"]
        ST_C["Stripe API"]
        CAL_C["Calendarific API"]
    end

    AP_C --> BE_C
    MP_C --> BE_C
    EP_C --> BE_C
    BE_C --> CB_C
    BE_C --> FC_C
    BE_C --> PG_C
    BE_C --> SB_C
    BE_C --> ST_C
    BE_C --> CAL_C
    CB_C --> PG_C
    FC_C --> PG_C
```

---

## 10. Role-Based Access Control

```mermaid
graph LR
    subgraph Roles["🔑 User Roles"]
        ADMIN["super-admin"]
        MANAGER["manager"]
        PARTNER["partner"]
        STAFF["staff"]
        FREELANCER["freelancer"]
        EMPLOYEE["employee"]
    end

    subgraph Portals["🖥️ Portal Access"]
        AP["Admin Portal"]
        MP["Manager Portal"]
        EP["Employee Portal"]
    end

    ADMIN --> AP
    MANAGER --> MP
    PARTNER --> MP
    STAFF --> MP
    FREELANCER --> EP
    EMPLOYEE --> EP
```
