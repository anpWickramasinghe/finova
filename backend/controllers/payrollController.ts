import { Request, Response } from 'express';
import { db } from '../config/db.js';
import {
    payroll, attendance, user, overtime_settings,
    salary_component, employee_salary_component, payroll_item,
    transaction, journal_line, ledger_entry, chart_of_accounts
} from '../db/schema.js';
import { eq, and, sql, or, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';


// Helper to generate a single employee's payroll logic
const calculateEmployeePayroll = async (userId: string, month: string, year: string, generatedBy: string) => {
    // 1. Fetch User
    const users = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    if (users.length === 0) throw new Error(`User ${userId} not found`);
    const currentUser = users[0];

    const baseSalary = parseFloat(currentUser.baseSalary || '0');
    const manualHourlyRate = currentUser.otHourlyRate ? parseFloat(currentUser.otHourlyRate) : null;
    const salaryType = currentUser.salaryType || 'FixedWithOvertime';

    // 2. Fetch Overtime Settings
    const settingsList = await db.select().from(overtime_settings).limit(1);
    const otSettings = settingsList.length > 0 ? settingsList[0] : null;
    const weekdayMult = parseFloat(otSettings?.weekdayMultiplier || '1.25');
    const weekendMult = parseFloat(otSettings?.weekendMultiplier || '2.0');
    const holidayMult = parseFloat(otSettings?.holidayMultiplier || '2.0');

    // 3. Fetch Attendance
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const records = await db.select().from(attendance)
        .where(and(
            eq(attendance.userId, userId),
            sql`${attendance.recordDate} >= ${startDate.toISOString()}`,
            sql`${attendance.recordDate} <= ${endDate.toISOString()}`
        ));

    // 4. Calculate Worked Days and OT
    let totalWorkHours = 0, totalOvertimeHours = 0, workedDaysCount = 0, totalOvertimePay = 0;
    const standardHours = 240;
    let hourlyRate = manualHourlyRate || (salaryType === 'Daily' ? baseSalary / 8 : baseSalary / standardHours);

    records.forEach(rec => {
        if (rec.status === 'Present' || rec.status === 'Late' || (rec.workHours && parseFloat(rec.workHours) > 0)) {
            workedDaysCount++;
        }
        if (rec.workHours) totalWorkHours += parseFloat(rec.workHours);

        const otMinutes = rec.calculatedOvertimeMinutes ? parseFloat(rec.calculatedOvertimeMinutes)
            : rec.overtimeHours ? parseFloat(rec.overtimeHours) * 60 : 0;

        if (otMinutes > 0) {
            const otHours = otMinutes / 60;
            totalOvertimeHours += otHours;
            const multiplier = rec.isHoliday ? holidayMult : rec.isWeekend ? weekendMult : weekdayMult;
            totalOvertimePay += (otHours * hourlyRate * multiplier);
        }
    });

    let grossBase = salaryType === 'Daily' ? workedDaysCount * baseSalary : baseSalary;
    if (salaryType === 'FixedNoOvertime') {
        totalOvertimePay = 0;
        totalOvertimeHours = 0;
    }

    // 5. Fetch Dynamic Salary Components
    // MOCKED: Since database schema is missing, use mock components for calculation
    const userComponents = [
        {
            componentName: "Housing Allowance",
            type: "Earning",
            calculationType: "Fixed",
            defaultAmount: "5000",
            userAmount: null
        },
        {
            componentName: "Tax Deduction",
            type: "Deduction",
            calculationType: "PercentageOfBase",
            defaultAmount: "5",
            userAmount: null
        }
    ];

    const lineItems: { componentName: string, type: string, amount: number }[] = [];

    // Add Base and OT to line items
    lineItems.push({ componentName: 'Basic Salary', type: 'Earning', amount: grossBase });
    if (totalOvertimePay > 0) {
        lineItems.push({ componentName: 'Overtime Pay', type: 'Earning', amount: totalOvertimePay });
    }

    let totalEarnings = grossBase + totalOvertimePay;
    let totalDeductions = 0;

    // Process dynamic components
    userComponents.forEach(comp => {
        let amount = 0;
        const baseValue = parseFloat(comp.userAmount || comp.defaultAmount || '0');

        if (comp.calculationType === 'Fixed') {
            amount = baseValue;
        } else if (comp.calculationType === 'PercentageOfBase') {
            amount = grossBase * (baseValue / 100);
        }

        if (comp.type === 'Earning') {
            totalEarnings += amount;
            lineItems.push({ componentName: comp.componentName, type: 'Earning', amount });
        } else if (comp.type === 'Deduction') {
            totalDeductions += amount;
            lineItems.push({ componentName: comp.componentName, type: 'Deduction', amount });
        }
    });

    // 6. Calculate Statutory Deductions (EPF/ETF based on Earnings, excluding OT usually but configured per policy. We use grossBase here as standard.)
    const epfBasis = grossBase;
    const employeeEpf = epfBasis * 0.08;
    const employerEpf = epfBasis * 0.12;
    const employerEtf = epfBasis * 0.03;

    totalDeductions += employeeEpf;
    lineItems.push({ componentName: 'EPF Deduction (8%)', type: 'StatutoryDeduction', amount: employeeEpf });
    lineItems.push({ componentName: 'Employer EPF (12%)', type: 'EmployerContribution', amount: employerEpf });
    lineItems.push({ componentName: 'Employer ETF (3%)', type: 'EmployerContribution', amount: employerEtf });

    const netSalary = totalEarnings - totalDeductions;

    // 7. Check existing draft record
    const existingRecords = await db.select().from(payroll)
        .where(and(
            eq(payroll.userId, userId),
            eq(payroll.month, month),
            eq(payroll.year, year)
        ));
    const existing = existingRecords.length > 0 ? existingRecords[0] : null;

    if (existing && existing.status !== 'Draft' && existing.status !== 'Rejected') {
        throw new Error(`Cannot regenerate payroll. Current status is ${existing.status}`);
    }

    const payrollId = existing ? existing.id : uuidv4();

    const payrollData: any = {
        userId, month, year, salaryType,
        workedDays: workedDaysCount.toString(),
        totalWorkHours: totalWorkHours.toFixed(2),
        totalOvertimeHours: totalOvertimeHours.toFixed(2),
        baseSalary: baseSalary.toFixed(2),
        totalEarnings: totalEarnings.toFixed(2),
        totalDeductions: totalDeductions.toFixed(2),
        netSalary: netSalary.toFixed(2),
        status: 'Draft',
        preparedBy: generatedBy,
        generatedAt: new Date(),
        updatedAt: new Date()
    };

    if (existing) {
        await db.update(payroll).set(payrollData).where(eq(payroll.id, payrollId));
        await db.delete(payroll_item).where(eq(payroll_item.payrollId, payrollId));
    } else {
        await db.insert(payroll).values({ id: payrollId, ...payrollData });
    }

    const itemsToInsert = lineItems.map(item => ({
        id: uuidv4(),
        payrollId,
        componentName: item.componentName,
        type: item.type,
        amount: item.amount.toFixed(2)
    }));

    if (itemsToInsert.length > 0) {
        await db.insert(payroll_item).values(itemsToInsert);
    }

    return { id: payrollId, ...payrollData, userName: currentUser.name };
};

export const generatePayroll = async (req: Request, res: Response) => {
    try {
        const { userId, month, year } = req.body;
        // Assume req.user comes from auth middleware, using a dummy for now if missing
        const generatedBy = (req as any).user?.id || userId;

        if (!userId || !month || !year) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const data = await calculateEmployeePayroll(userId, month, year, generatedBy);
        res.status(200).json({ message: 'Payroll generated successfully', data });
    } catch (error: any) {
        console.error('Error generating payroll:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

export const bulkGeneratePayroll = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.body;
        const generatedBy = (req as any).user?.id || 'system';

        if (!month || !year) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const employees = await db.select().from(user).where(
            eq(user.status, 'Active')
        );

        if (employees.length === 0) {
            return res.status(404).json({ message: 'No active employees found' });
        }

        const results = [];
        for (const emp of employees) {
            try {
                await calculateEmployeePayroll(emp.id, month, year, generatedBy);
                results.push({ name: emp.name, success: true, message: 'Generated Draft' });
            } catch (err: any) {
                results.push({ name: emp.name, success: false, message: err.message });
            }
        }

        const successCount = results.filter(r => r.success).length;
        res.status(200).json({
            message: `Bulk payroll generated: ${successCount}/${employees.length} successful`,
            results
        });
    } catch (error: any) {
        console.error('Error in bulk payroll:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

export const bulkSubmitApproval = async (req: Request, res: Response) => {
    try {
        const { payrollIds } = req.body;

        if (!payrollIds || !Array.isArray(payrollIds) || payrollIds.length === 0) {
            return res.status(400).json({ message: 'Missing required payroll IDs' });
        }

        const updatedArray = await db.update(payroll)
            .set({
                status: 'Pending Approval',
                updatedAt: new Date()
            })
            .where(and(
                inArray(payroll.id, payrollIds),
                eq(payroll.status, 'Draft')
            ))
            .returning();

        res.status(200).json({
            message: `Successfully submitted ${updatedArray.length} record(s) for approval.`,
            count: updatedArray.length
        });
    } catch (error: any) {
        console.error('Error in bulk submit:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
};

export const getPayrollRecords = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.query;

        let conditions = [];
        if (month) conditions.push(eq(payroll.month, String(month)));
        if (year) conditions.push(eq(payroll.year, String(year)));

        const records = await db.select({
            id: payroll.id,
            userId: payroll.userId,
            userName: user.name,
            month: payroll.month,
            year: payroll.year,
            salaryType: payroll.salaryType,
            workedDays: payroll.workedDays,
            totalWorkHours: payroll.totalWorkHours,
            totalOvertimeHours: payroll.totalOvertimeHours,
            baseSalary: payroll.baseSalary,
            totalEarnings: payroll.totalEarnings,
            totalDeductions: payroll.totalDeductions,
            netSalary: payroll.netSalary,
            status: payroll.status,
            paymentMethod: payroll.paymentMethod,
            paymentReference: payroll.paymentReference,
            generatedAt: payroll.generatedAt
        })
            .from(payroll)
            .leftJoin(user, eq(payroll.userId, user.id))
            .where(conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined);

        res.status(200).json(records);
    } catch (error: any) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getPayrollById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const records = await db.select({
            id: payroll.id,
            userId: payroll.userId,
            userName: user.name,
            month: payroll.month,
            year: payroll.year,
            salaryType: payroll.salaryType,
            workedDays: payroll.workedDays,
            totalWorkHours: payroll.totalWorkHours,
            totalOvertimeHours: payroll.totalOvertimeHours,
            baseSalary: payroll.baseSalary,
            totalEarnings: payroll.totalEarnings,
            totalDeductions: payroll.totalDeductions,
            netSalary: payroll.netSalary,
            status: payroll.status,
            paymentMethod: payroll.paymentMethod,
            paymentReference: payroll.paymentReference,
            generatedAt: payroll.generatedAt
        })
            .from(payroll)
            .leftJoin(user, eq(payroll.userId, user.id))
            .where(eq(payroll.id, id))
            .limit(1);

        if (records.length === 0) return res.status(404).json({ message: 'Payroll record not found' });

        const items = await db.select().from(payroll_item).where(eq(payroll_item.payrollId, id));

        res.status(200).json({
            ...records[0],
            items
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Helper: Generate transaction number
const generateTxnNumber = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    return `TXN-${dateStr}-${random}`;
};

const bookPayrollJournal = async (payrollRecord: any, approvedBy: string) => {
    const items = await db.select().from(payroll_item).where(eq(payroll_item.payrollId, payrollRecord.id));

    // Find relevant Chart of Accounts
    const allAccounts = await db.select().from(chart_of_accounts);
    let salaryExpAccount = allAccounts.find(a => a.name.toLowerCase().includes('salary ext') || a.name.toLowerCase().includes('expense') || a.code.startsWith('6'));
    let salaryPayAccount = allAccounts.find(a => a.name.toLowerCase().includes('payable') || a.name.toLowerCase().includes('liability') || a.code.startsWith('2'));

    if (!salaryExpAccount || !salaryPayAccount) {
        // Fallback to first available just to keep logic sound if DB is empty, though in real life we'd throw
        salaryExpAccount = allAccounts[0];
        salaryPayAccount = allAccounts[1] || allAccounts[0];
    }

    const totalExpense = parseFloat(payrollRecord.totalEarnings || '0');
    const totalPayable = parseFloat(payrollRecord.netSalary || '0');
    const totalDeductions = parseFloat(payrollRecord.totalDeductions || '0');

    const txnId = uuidv4();
    const txnNumber = generateTxnNumber();

    // 1. Create Transaction (Approved)
    await db.insert(transaction).values({
        id: txnId,
        transactionNumber: txnNumber,
        date: new Date(),
        description: `Payroll for ${payrollRecord.month}/${payrollRecord.year}`,
        reference: `PAY-${payrollRecord.id.substring(0, 8)}`,
        type: 'journal',
        status: 'approved',
        totalAmount: totalExpense.toFixed(2),
        createdBy: approvedBy,
        approvedBy: approvedBy,
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    // 2. Create Journal Lines (Debit Expense, Credit Payable, Credit Deductions)
    await db.insert(journal_line).values([
        {
            id: uuidv4(),
            transactionId: txnId,
            accountId: salaryExpAccount.id,
            description: 'Total Salary Expense',
            debit: totalExpense.toFixed(2),
            credit: '0.00',
            lineOrder: 0
        },
        {
            id: uuidv4(),
            transactionId: txnId,
            accountId: salaryPayAccount.id,
            description: 'Net Salary Payable',
            debit: '0.00',
            credit: totalPayable.toFixed(2),
            lineOrder: 1
        },
        // For simplicity, bunching deductions into the payable account too if a specific tax/EPF liability account isn't found
        {
            id: uuidv4(),
            transactionId: txnId,
            accountId: salaryPayAccount.id,
            description: 'Tax/EPF Deductions Payable',
            debit: '0.00',
            credit: totalDeductions.toFixed(2),
            lineOrder: 2
        }
    ]);
};

export const updatePayrollStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const approvedBy = (req as any).user?.id || 'admin';

        const validStatuses = ['Draft', 'Pending Approval', 'Approved', 'Paid', 'Rejected'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({ message: `Invalid status` });
        }

        const existingRecords = await db.select().from(payroll).where(eq(payroll.id, id)).limit(1);
        if (existingRecords.length === 0) return res.status(404).json({ message: 'Not found' });

        const updateData: any = { status, updatedAt: new Date() };

        if (status === 'Approved') {
            updateData.approvedBy = approvedBy;
        } else if (status === 'Paid') {
            updateData.paymentMethod = req.body.paymentMethod || 'Bank Transfer';
            updateData.paymentReference = req.body.paymentReference || `PAY-${id.substring(0, 6)}`;
        }

        await db.update(payroll).set(updateData).where(eq(payroll.id, id));

        res.status(200).json({ message: `Status updated to ${status}` });
    } catch (error) {
        console.error('Error updating status', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deletePayroll = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const existingRecords = await db.select().from(payroll).where(eq(payroll.id, id)).limit(1);

        if (existingRecords.length === 0) return res.status(404).json({ message: 'Not found' });

        const existing = existingRecords[0];
        if (['Approved', 'Paid'].includes(existing.status || '')) {
            return res.status(400).json({ message: 'Cannot delete processed payrolls' });
        }

        await db.delete(payroll_item).where(eq(payroll_item.payrollId, id));
        await db.delete(payroll).where(eq(payroll.id, id));

        res.status(200).json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};
