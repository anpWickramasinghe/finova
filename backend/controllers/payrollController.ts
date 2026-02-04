import { Request, Response } from 'express';
import { db } from '../config/db.js';
import { payroll, attendance, user, overtime_settings } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const generatePayroll = async (req: Request, res: Response) => {
    try {
        const { userId, month, year } = req.body;

        if (!userId || !month || !year) {
            return res.status(400).json({ message: 'Missing required fields (userId, month, year)' });
        }

        // 1. Fetch User Financial Details
        const users = await db.select().from(user).where(eq(user.id, userId)).limit(1);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });

        const currentUser = users[0];
        const baseSalary = parseFloat(currentUser.baseSalary || '0'); // Monthly Salary OR Daily Rate
        const manualHourlyRate = currentUser.otHourlyRate ? parseFloat(currentUser.otHourlyRate) : null;
        const salaryType = currentUser.salaryType || 'FixedWithOvertime';

        // 2. Fetch Overtime Settings
        const settingsList = await db.select().from(overtime_settings).limit(1);
        const otSettings = settingsList.length > 0 ? settingsList[0] : null;

        const weekdayMult = parseFloat(otSettings?.weekdayMultiplier || '1.25');
        const weekendMult = parseFloat(otSettings?.weekendMultiplier || '2.0');
        const holidayMult = parseFloat(otSettings?.holidayMultiplier || '2.0');

        // 3. Fetch Attendance for the given Month/Year
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

        const records = await db.select().from(attendance)
            .where(and(
                eq(attendance.userId, userId),
                sql`${attendance.recordDate} >= ${startDate}`,
                sql`${attendance.recordDate} <= ${endDate}`
            ));

        // 4. Aggregate Hours and Calculate Overtime Pay Per Record
        let totalWorkHours = 0;
        let totalOvertimeHours = 0;
        let workedDaysCount = 0;
        let totalOvertimePay = 0;

        // Base Hourly Rate Calculation
        const standardHours = 240;
        let hourlyRate = 0;

        if (manualHourlyRate) {
            hourlyRate = manualHourlyRate;
        } else {
            if (salaryType === 'Daily') {
                hourlyRate = baseSalary / 8;
            } else {
                hourlyRate = baseSalary / standardHours;
            }
        }

        records.forEach(rec => {
            // Count worked days
            if (rec.status === 'Present' || rec.status === 'Late' || (rec.workHours && parseFloat(rec.workHours) > 0)) {
                workedDaysCount++;
            }

            if (rec.workHours) totalWorkHours += parseFloat(rec.workHours);

            // Overtime Calculation logic
            let otMinutes = 0;

            // Prefer 'calculatedOvertimeMinutes' if available (System Logic)
            if (rec.calculatedOvertimeMinutes) {
                otMinutes = parseFloat(rec.calculatedOvertimeMinutes);
            } else if (rec.overtimeHours) {
                // Fallback to raw overtimeHours * 60 if calculated is missing
                otMinutes = parseFloat(rec.overtimeHours) * 60;
            }

            if (otMinutes > 0) {
                const otHours = otMinutes / 60;
                totalOvertimeHours += otHours;

                let multiplier = weekdayMult;
                if (rec.isHoliday) {
                    multiplier = holidayMult;
                } else if (rec.isWeekend) {
                    multiplier = weekendMult;
                }

                // If Daily worker, logic is same: OT Hours * Rate * Multiplier
                // Check if user has specific multiplier override? 
                // Previous logic used user.otMultiplier. 
                // New requirement: Use System Settings.
                // We ignore user.otMultiplier now as per "System Overtime" request.

                totalOvertimePay += (otHours * hourlyRate * multiplier);
            }
        });

        // 5. Calculate Pay based on Salary Type
        let grossEarnings = 0; // Base Earnings

        if (salaryType === 'Daily') {
            grossEarnings = workedDaysCount * baseSalary;
        } else {
            // Fixed Salary (With or Without OT) - Base is constant usually
            // Unless 'FixedNoOvertime' implies NO OT pay, but we handled that by checking salaryType?
            // Actually, if 'FixedNoOvertime', we should technically force OT pay to 0.
            grossEarnings = baseSalary;
        }

        if (salaryType === 'FixedNoOvertime') {
            totalOvertimePay = 0;
            totalOvertimeHours = 0;
        }

        const totalGrossSalary = grossEarnings + totalOvertimePay;

        // 6. Calculate Deductions (EPF/ETF)
        const epfBasis = grossEarnings;
        const epfDeduction = epfBasis * 0.08;
        const employerEpf = epfBasis * 0.12;
        const employerEtf = epfBasis * 0.03;

        const netSalary = totalGrossSalary - epfDeduction;

        // 7. Save/Update Payroll Record
        const existing = await db.select().from(payroll).where(and(
            eq(payroll.userId, userId),
            eq(payroll.month, month),
            eq(payroll.year, year)
        )).limit(1);

        const payrollData = {
            userId,
            month,
            year,
            salaryType,
            workedDays: workedDaysCount.toString(),
            totalWorkHours: totalWorkHours.toFixed(2),
            totalOvertimeHours: totalOvertimeHours.toFixed(2),
            baseSalary: baseSalary.toFixed(2),
            grossSalary: totalGrossSalary.toFixed(2),
            netSalary: netSalary.toFixed(2),
            overtimePay: totalOvertimePay.toFixed(2),
            epfDeduction: epfDeduction.toFixed(2),
            employerEpf: employerEpf.toFixed(2),
            employerEtf: employerEtf.toFixed(2),
            totalSalary: netSalary.toFixed(2),
            status: 'Pending',
            generatedAt: new Date()
        };

        if (existing.length > 0) {
            await db.update(payroll).set(payrollData).where(eq(payroll.id, existing[0].id));
            return res.status(200).json({ message: 'Payroll updated successfully', data: payrollData });
        } else {
            await db.insert(payroll).values({
                id: uuidv4(),
                ...payrollData
            });
            return res.status(201).json({ message: 'Payroll generated successfully', data: payrollData });
        }

    } catch (error) {
        console.error('Error generating payroll:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getPayrollRecords = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.query;
        // Optional filter by month/year logic...

        let query = db.select({
            id: payroll.id,
            userId: payroll.userId,
            userName: user.name,
            month: payroll.month,
            year: payroll.year,
            salaryType: payroll.salaryType,
            workedDays: payroll.workedDays,
            baseSalary: payroll.baseSalary,
            grossSalary: payroll.grossSalary,
            overtimePay: payroll.overtimePay,
            epfDeduction: payroll.epfDeduction,
            netSalary: payroll.netSalary,
            status: payroll.status
        })
            .from(payroll)
            .innerJoin(user, eq(payroll.userId, user.id));

        if (month && year) {
            // @ts-ignore - straightforward dynamic query construction if needed or check drizzle docs for cleaner way 
            // but simpler to use .where() with conditions.
            // Since 'query' is a builder, we can chain.
            // Wait, drizzle query builder is immutable-ish or chainable?
            // Best to construct conditions first.
        }

        // Re-construct query with filters effectively
        const conditions = [];
        if (month) conditions.push(eq(payroll.month, month as string));
        if (year) conditions.push(eq(payroll.year, year as string));

        const records = await db.select({
            id: payroll.id,
            userId: payroll.userId,
            userName: user.name,
            month: payroll.month,
            year: payroll.year,
            salaryType: payroll.salaryType,
            workedDays: payroll.workedDays,
            baseSalary: payroll.baseSalary,
            grossSalary: payroll.grossSalary, // Total earnings (Base + OT)
            overtimePay: payroll.overtimePay,
            epfDeduction: payroll.epfDeduction,
            netSalary: payroll.netSalary, // Final Payout
            status: payroll.status
        })
            .from(payroll)
            .innerJoin(user, eq(payroll.userId, user.id))
            .where(and(...conditions));

        res.status(200).json(records);
    } catch (error) {
        console.error('Error fetching payroll:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
