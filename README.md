# Finova Intelligent Platform

Finova is a comprehensive Finance & HR application designed to streamline company operations with role-based access for Employees, Managers, and Admins. It seamlessly integrates HR, Payroll, Financial Accounting, and an AI Intelligence layer into a single unified system.

## Key Features & Modules

- **Employee Portal**: Mark attendance, submit leave requests, view payslips, and interact with an AI Chatbot assistant.
- **Manager Portal**: Approve leave/funds, manage petty cash, view team and financial reports, and communicate via support chat.
- **Admin Portal**: System configuration, user and role management, financial rules oversight, and AI-driven predictive analytics.
- **Backend Architecture**: A single unified API gateway with role-based access control (RBAC), isolated finance logic, and mandatory audit logging.

## Recent Updates

- **Manager Portal Chat**: Implemented comprehensive chat support mirroring the admin functionality.
- **Employee Portal Connectivity**: Resolved authentication and network configuration issues to restore backend communication.
- **Leave Management Fixes**: Corrected data fetching to ensure all pending leave requests are properly displayed in the Leave Activity table.
- **Financial Reports Integration**: Added a full-featured Financial Reports page to the Manager Portal including Profit & Loss Statements, Balance Sheets, Trial Balances, and Transaction Status summaries.

## Getting Started

### Option 1: Local Setup

1. **Install Dependencies**: Ensure you have installed dependencies in the root, backend, and frontend directories.
   ```bash
   npm setup
   ```
2. **Run the Application**: Start all services in parallel from the root directory.
   ```bash
   npm start
   ```

**Local Ports**:
- **Backend API**: `http://localhost:5000`
- **Admin Portal**: `http://localhost:5175`
- **Manager Portal**: `http://localhost:5176`

### Option 2: Docker Setup

The project is fully dockerized for the Backend, Admin, Manager, and Employee portals.

1. **Configure Environment**:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. **Build and Run**:
   ```bash
   docker compose up --build -d
   ```

**Docker Ports**:
- **Backend API**: `http://localhost:5001`
- **Admin Portal**: `http://localhost:8081`
- **Manager Portal**: `http://localhost:8082`
- **Employee Portal**: `http://localhost:8083`

*(Note: Stop services with `docker compose down` and view logs with `docker compose logs -f`)*

## System Architecture

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
    subgraph Finova_System ["Finova Intelligent Platform"]
        direction TB

        %% Modules
        subgraph HR_Payroll ["HR & Payroll Module"]
            Attendance[Attendance Tracking]
            Leave[Leave Management]
            Payroll[Payroll Processing]
            EPF_ETF[EPF/ETF Calculation]
        end

        subgraph Finance_Module ["Finance & Accounts Module"]
            CashFlow[Cash Flow Management]
            PettyCash[Petty Cash Control]
            Reports[Financial Reporting]
            Journal[Journal Entries]
        end

        subgraph AI_Layer ["AI & Intelligence Layer"]
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
