# Finova Manager Portal - Implemented Features

This document outlines the features and functionalities implemented within the Finova Manager Portal and how they map to the backend architecture. Unlike the Admin Portal which provides company-wide oversight and configuration, the Manager Portal focuses on branch-level operations, empowering branch managers to oversee their team's daily activities, accounting, and HR processes.

## Core Modules & Features

### 1. Dashboard & Analytics
A centralized hub for branch managers to monitor their specific branch's performance and pending operational tasks.
- **Branch KPIs:** Metrics related to branch revenue, active employees, and daily operations.
- **Activity Feed & Task List:** Quick access to pending approvals (leaves, overtime, transactions) specific to the manager's branch.

### 2. User & Team Management
Tools for branch managers to handle their direct reports.
- **Employee Directory:** View profiles, contact details, and roles of employees assigned to their branch.
- **Performance & Status:** Monitor active/inactive status and basic employment details.

### 3. Attendance Management
Day-to-day tracking of branch staff attendance.
- **Daily Logs:** Review check-in and check-out times for branch employees.
- **Work Hours Tracking:** Monitor total hours worked and discrepancies against scheduled shifts.

### 4. Leaves Approvals
Workflow management for employee time-off.
- **Request Management:** Review, approve, or reject leave requests submitted by branch employees.
- **Leave History:** Track historical leave data to ensure adequate branch staffing.

### 5. Accounting & Transactions
Localized financial management for the branch.
- **Transactions:** Record and track branch-specific income, expenses, and daily transactions.
- **Maker-Checker Workflow:** Managers often act as the "Maker" (submitting branch expenses) or the "Checker" (approving minor staff expenses before they go to Admin).
- **Branch Ledger:** View localized ledger entries tied to the Chart of Accounts for their specific branch.

### 6. Reports Center
Branch-level operational and financial reporting.
- **Attendance & Overtime Reports:** Generate reports on team punctuality and overtime costs.
- **Financial Reports:** Branch-specific transaction summaries and localized cash flow.

### 7. Real-time Communication (Chat)
Integrated messaging to facilitate quick resolution of issues.
- **Branch Room:** A dedicated group chat for all members of the branch to communicate seamlessly.
- **Support Chat:** Direct line to IT or upper management (Admin Portal) for localized support.

---

## Backend Infrastructure Integration
The Manager Portal relies on the same **Drizzle ORM / PostgreSQL** backend as the Admin Portal, but requests are strictly scoped using `branchId` filters to ensure managers only access data relevant to their assigned branch.

### Key Controllers Utilized:
- `attendanceController.ts` (Scoped to branch employees)
- `leaveController.ts` (Approval workflows)
- `transactionController.ts` (Branch-level double-entry accounting)
- `chatController.ts` (Branch chat rooms)
- `branchController.ts` (Fetching branch specific metrics)
