import { pgTable, text, timestamp, boolean, numeric, integer } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("emailVerified").notNull(),
    image: text("image"),
    createdAt: timestamp("createdAt").notNull(),
    updatedAt: timestamp("updatedAt").notNull(),
    role: text("role"),
    companyId: text("companyId"),
    requiresPasswordChange: boolean("requiresPasswordChange").default(false),
    phone: text("phone"),
    branchId: text("branchId"),
    nic: text("nic"),
    address: text("address"),
    epfNo: text("epfNo"),
    status: text("status").default('Active'),
    permissions: text("permissions"),
    biometricId: text("biometricId"),
    baseSalary: text("baseSalary"),
    otHourlyRate: text("otHourlyRate"),
    otMultiplier: text("otMultiplier").default('1.5'),
    salaryType: text("salaryType").default('FixedWithOvertime'), // 'FixedWithOvertime', 'FixedNoOvertime', 'Daily'
});

export const attendance = pgTable("attendance", {
    id: text("id").primaryKey(),
    userId: text("userId").notNull().references(() => user.id),
    recordDate: timestamp("recordDate").notNull(),
    checkInTime: timestamp("checkInTime"),
    checkOutTime: timestamp("checkOutTime"),
    status: text("status"),
    workHours: text("workHours"),
    overtimeHours: text("overtimeHours"),
    overtimeStatus: text("overtimeStatus").default('Pending'),
    approvedBy: text("approvedBy"),
    isHoliday: boolean("isHoliday").default(false),
    isWeekend: boolean("isWeekend").default(false),
    calculatedOvertimeMinutes: text("calculatedOvertimeMinutes"),
    attendenceOvertimeMinutes: text("attendenceOvertimeMinutes"),
    biometricId: text("biometricId"),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
});

export const overtime_settings = pgTable("overtime_settings", {
    id: text("id").primaryKey(),
    companyId: text("companyId"),
    minOvertimeMinutes: text("minOvertimeMinutes").default('30'),
    weekdayMultiplier: text("weekdayMultiplier").default('1.25'),
    weekendMultiplier: text("weekendMultiplier").default('2.0'),
    holidayMultiplier: text("holidayMultiplier").default('2.0'),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
});

export const holiday = pgTable("holiday", {
    id: text("id").primaryKey(),
    date: timestamp("date").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
});



export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expiresAt").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("createdAt").notNull(),
    updatedAt: timestamp("updatedAt").notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId").notNull().references(() => user.id),
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId").notNull().references(() => user.id),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt").notNull(),
    updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt"),
    updatedAt: timestamp("updatedAt"),
});

export const branch = pgTable("branch", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email"),
    password: text("password"),
    manager: text("manager"),
    contactNumber: text("contactNumber"),
    employeeCount: text("employeeCount").default('0'),
    revenue: text("revenue").default('0'),
    lastAudit: timestamp("lastAudit"),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
});

export const leave_request = pgTable("leave_request", {
    id: text("id").primaryKey(),
    userId: text("userId").notNull().references(() => user.id),
    startDate: timestamp("startDate").notNull(),
    endDate: timestamp("endDate").notNull(),
    type: text("type").notNull(),
    reason: text("reason"),
    status: text("status").default('Pending'),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
});

export const salary_component = pgTable("salary_component", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type").notNull(), // "Earning", "Deduction", "Statutory"
    calculationType: text("calculationType").notNull(), // "Fixed", "PercentageOfBase"
    defaultAmount: numeric("defaultAmount", { precision: 15, scale: 2 }), // default amount or percentage
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
});

export const employee_salary_component = pgTable("employee_salary_component", {
    id: text("id").primaryKey(),
    userId: text("userId").notNull().references(() => user.id),
    componentId: text("componentId").notNull().references(() => salary_component.id),
    amount: numeric("amount", { precision: 15, scale: 2 }), // overrides defaultAmount if set
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
});

export const payroll = pgTable("payroll", {
    id: text("id").primaryKey(),
    userId: text("userId").notNull().references(() => user.id),
    month: text("month").notNull(),
    year: text("year").notNull(),
    salaryType: text("salaryType"),
    workedDays: text("workedDays"),
    totalWorkHours: text("totalWorkHours"),
    totalOvertimeHours: text("totalOvertimeHours"),
    baseSalary: numeric("baseSalary", { precision: 15, scale: 2 }),
    totalEarnings: numeric("totalEarnings", { precision: 15, scale: 2 }),
    totalDeductions: numeric("totalDeductions", { precision: 15, scale: 2 }),
    netSalary: numeric("netSalary", { precision: 15, scale: 2 }),
    status: text("status").default('Draft'), // Draft -> Pending Approval -> Approved -> Processed -> Paid
    preparedBy: text("preparedBy").references(() => user.id),
    approvedBy: text("approvedBy").references(() => user.id),
    paymentMethod: text("paymentMethod"),
    paymentReference: text("paymentReference"),
    generatedAt: timestamp("generatedAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
});

export const payroll_item = pgTable("payroll_item", {
    id: text("id").primaryKey(),
    payrollId: text("payrollId").notNull().references(() => payroll.id),
    componentName: text("componentName").notNull(),
    type: text("type").notNull(), // "Earning", "Deduction"
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
});

// ===== ACCOUNTING / TRANSACTION MANAGEMENT =====

export const chart_of_accounts = pgTable("chart_of_accounts", {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),          // e.g. "1000", "2000", "4100"
    name: text("name").notNull(),                   // e.g. "Cash", "Accounts Receivable"
    type: text("type").notNull(),                   // "asset" | "liability" | "equity" | "revenue" | "expense"
    subType: text("subType"),                       // e.g. "current_asset", "fixed_asset"
    description: text("description"),
    parentAccountId: text("parentAccountId"),        // for hierarchical CoA
    branchId: text("branchId").references(() => branch.id),
    isSystem: boolean("isSystem").default(false),    // true = cannot be deleted
    isActive: boolean("isActive").default(true),
    normalBalance: text("normalBalance").notNull(),  // "debit" | "credit"
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
});

export const transaction = pgTable("transaction", {
    id: text("id").primaryKey(),
    transactionNumber: text("transactionNumber").notNull().unique(), // auto-generated TXN-YYYYMMDD-NNN
    date: timestamp("date").notNull(),
    description: text("description").notNull(),
    reference: text("reference"),                    // external ref (invoice #, receipt #)
    type: text("type").notNull(),                    // "journal" | "payment" | "receipt" | "transfer"
    status: text("status").notNull().default('draft'), // draft -> pending_approval -> approved -> posted -> reconciled | rejected
    branchId: text("branchId").references(() => branch.id),
    totalAmount: numeric("totalAmount", { precision: 15, scale: 2 }).default('0'),
    notes: text("notes"),
    // Maker-Checker fields
    createdBy: text("createdBy").references(() => user.id),
    submittedAt: timestamp("submittedAt"),
    approvedBy: text("approvedBy").references(() => user.id),
    approvedAt: timestamp("approvedAt"),
    rejectedBy: text("rejectedBy").references(() => user.id),
    rejectedAt: timestamp("rejectedAt"),
    rejectionReason: text("rejectionReason"),
    postedBy: text("postedBy").references(() => user.id),
    postedAt: timestamp("postedAt"),
    // Approval threshold
    requiresAdminApproval: boolean("requiresAdminApproval").default(false),
    adminApprovedBy: text("adminApprovedBy").references(() => user.id),
    adminApprovedAt: timestamp("adminApprovedAt"),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
});

export const journal_line = pgTable("journal_line", {
    id: text("id").primaryKey(),
    transactionId: text("transactionId").notNull().references(() => transaction.id),
    accountId: text("accountId").notNull().references(() => chart_of_accounts.id),
    description: text("description"),
    debit: numeric("debit", { precision: 15, scale: 2 }).default('0'),
    credit: numeric("credit", { precision: 15, scale: 2 }).default('0'),
    lineOrder: integer("lineOrder").default(0),
    createdAt: timestamp("createdAt").defaultNow(),
});

export const ledger_entry = pgTable("ledger_entry", {
    id: text("id").primaryKey(),
    transactionId: text("transactionId").notNull().references(() => transaction.id),
    journalLineId: text("journalLineId").notNull().references(() => journal_line.id),
    accountId: text("accountId").notNull().references(() => chart_of_accounts.id),
    date: timestamp("date").notNull(),
    debit: numeric("debit", { precision: 15, scale: 2 }).default('0'),
    credit: numeric("credit", { precision: 15, scale: 2 }).default('0'),
    runningBalance: numeric("runningBalance", { precision: 15, scale: 2 }),
    branchId: text("branchId").references(() => branch.id),
    postedAt: timestamp("postedAt").defaultNow(),
});

export const reconciliation = pgTable("reconciliation", {
    id: text("id").primaryKey(),
    transactionId: text("transactionId").notNull().references(() => transaction.id),
    bankStatementRef: text("bankStatementRef"),
    bankDate: timestamp("bankDate"),
    matchedAmount: numeric("matchedAmount", { precision: 15, scale: 2 }),
    difference: numeric("difference", { precision: 15, scale: 2 }).default('0'),
    status: text("status").notNull().default('matched'), // "matched" | "partial" | "unmatched"
    reconciledBy: text("reconciledBy").references(() => user.id),
    reconciledAt: timestamp("reconciledAt").defaultNow(),
    notes: text("notes"),
});
