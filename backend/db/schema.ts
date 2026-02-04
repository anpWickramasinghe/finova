import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

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

export const payroll = pgTable("payroll", {
    id: text("id").primaryKey(),
    userId: text("userId").notNull().references(() => user.id),
    month: text("month").notNull(),
    year: text("year").notNull(),
    salaryType: text("salaryType"),
    workedDays: text("workedDays"),
    totalWorkHours: text("totalWorkHours"),
    totalOvertimeHours: text("totalOvertimeHours"),
    baseSalary: text("baseSalary"),
    grossSalary: text("grossSalary"),
    netSalary: text("netSalary"),
    overtimePay: text("overtimePay"),
    epfDeduction: text("epfDeduction"), // Employee 8%
    employerEpf: text("employerEpf"),   // Employer 12%
    employerEtf: text("employerEtf"),   // Employer 3%
    totalSalary: text("totalSalary"),   // Check if this is redundant with netSalary, but kept for now as per old schema
    status: text("status").default('Pending'),
    generatedAt: timestamp("generatedAt").defaultNow(),
});
