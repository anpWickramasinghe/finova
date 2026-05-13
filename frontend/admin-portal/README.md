# Finova Admin Portal - Implemented Features

This document provides a comprehensive overview of the features implemented in the Finova Admin Portal and its corresponding backend architecture. The system is designed to handle enterprise-level human resources, payroll, and accounting management for multi-branch organizations.

## Core Modules & Features

### 1. Dashboard & Analytics
The Admin Portal features a role-based dashboard offering real-time financial and operational metrics.
- **Key Performance Indicators (KPIs):** Role-specific widgets displaying Cash Flow, Outstanding Invoices, Monthly Revenue, and Compliance Status.
- **Financial Trends:** Interactive Line and Area charts (powered by Recharts) showing Revenue vs Expenses, Profit margins, and Cash Inflow/Outflow trends.
- **Expense Breakdown:** Pie charts detailing monthly expense categories.
- **Activity & Tasks:** Modules for tracking recent organizational activities and pending approval tasks.

### 2. Branch Management
Comprehensive CRUD operations for managing organizational branches.
- **Branch Configuration:** Manage branch details, contact information, and assigned managers.
- **Metrics Tracking:** Monitor branch-specific employee counts and revenue.

### 3. User & Employee Management
Complete oversight of personnel across the organization.
- **Employee Profiles:** Manage employee details including NIC, EPF Number, Base Salary, Overtime Rates, and Role assignments.
- **Access Control:** System supports diverse roles (e.g., admin, manager, staff, partner, freelancer) to restrict data visibility and actions.

### 4. Attendance & Leaves
Tracking and managing employee time and time-off.
- **Attendance Logging:** Daily Check-in / Check-out tracking with calculated work hours.
- **Leave Management:** Employees can request leaves; admins/managers can approve or reject them based on leave types and dates.
- **Holidays:** System-wide holiday calendar integration.

### 5. Overtime Management
Advanced overtime logic tied to standard industry practices.
- **Overtime Settings:** Configurable Multipliers for Weekday (e.g., 1.25x), Weekend (e.g., 2.0x), and Holidays (e.g., 2.0x).
- **Approval Workflows:** Track and manage `Pending`, `Approved`, and `Rejected` overtime requests.
- **Calculations:** Automated overtime minute calculation derived from attendance check-in/out vs standard hours.

### 6. Payroll System
End-to-end payroll generation and management.
- **Salary Components:** Define Earnings, Deductions, and Statutory components (Fixed or Percentage-based).
- **Payroll Generation:** Draft, process, and approve monthly payrolls dynamically calculated from Base Salary, Overtime, and applied Components.
- **Approval Flow:** Multi-step approval process (Draft -> Pending -> Approved -> Paid).

### 7. Transactions & Accounting
Robust double-entry accounting system.
- **Chart of Accounts (CoA):** Hierarchical ledger accounts categorization (Asset, Liability, Equity, Revenue, Expense).
- **Journal Entries & Transactions:** Record payments, receipts, and transfers with debits and credits balancing.
- **Maker-Checker Approval Workflow:** High-value or sensitive transactions require multiple layers of approval (Created -> Submitted -> Approved -> Posted).
- **Ledger & Reconciliation:** Track running balances and reconcile against external bank statements.

### 8. Real-time Communication
Integrated chat functionality for organizational alignment.
- **Branch Chat Rooms:** Dedicated group chats for specific branches.
- **Support Chat:** Direct support messaging between users and administrators with read receipts and attachment support.

---

## Backend Infrastructure Overview
The backend is built utilizing **Drizzle ORM** with a robust PostgreSQL schema. 

### Key Controllers Implemented:
- `adminController.ts`
- `attendanceController.ts`
- `branchController.ts`
- `chatController.ts`
- `forecastingController.ts`
- `leaveController.ts`
- `overtimeController.ts`
- `payrollController.ts`
- `salaryComponentController.ts`
- `transactionController.ts`
- `stripeController.ts` (For billing & payment integration)
- `uploadController.ts` (For attachment & document handling)
