import { Request, Response } from 'express';
import { db } from '../config/db.js';
import { payroll, attendance, user } from '../db/schema.js';
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
        const baseSalary = parseFloat(currentUser.baseSalary || '0');
        const otMultiplier = parseFloat(currentUser.otMultiplier || '1.5');
        const manualHourlyRate = currentUser.otHourlyRate ? parseFloat(currentUser.otHourlyRate) : null;

        // 2. Fetch Attendance for the given Month/Year
        // Note: Construct dates for the filter
        // Simple approach: Filter by string matching or date range?
        // Let's use date range for robustness. 
        // month is assumed 1-12 or 0-11? Let's assume input is "01".."12" or name?
        // Let's assume numeric string "1" to "12".

        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59); // Last day of month

        const records = await db.select().from(attendance)
            .where(and(
                eq(attendance.userId, userId),
                sql`${attendance.recordDate} >= ${startDate}`,
                sql`${attendance.recordDate} <= ${endDate}`
            ));

        // 3. Aggregate Hours
        let totalWorkHours = 0;
        let totalOvertimeHours = 0;

        records.forEach(rec => {
            if (rec.workHours) totalWorkHours += parseFloat(rec.workHours);
            if (rec.overtimeHours) totalOvertimeHours += parseFloat(rec.overtimeHours);
        });

        // 4. Calculate Pay
        // Standard Hours = 240 (or configurable later)
        const standardHours = 240;

        // Effective Hourly Rate logic
        let hourlyRate = 0;
        if (manualHourlyRate) {
            hourlyRate = manualHourlyRate;
        } else if (baseSalary > 0) {
            hourlyRate = baseSalary / standardHours;
        }

        const overtimePay = totalOvertimeHours * hourlyRate * otMultiplier;
        const totalSalary = baseSalary + overtimePay;

        // 5. Save/Update Payroll Record
        // Check if exists first to avoid duplicates or update?
        // Let's just insert for now, assuming UI handles duplicate checks or we update if exists.

        const existing = await db.select().from(payroll).where(and(
            eq(payroll.userId, userId),
            eq(payroll.month, month),
            eq(payroll.year, year)
        )).limit(1);

        if (existing.length > 0) {
            await db.update(payroll).set({
                totalWorkHours: totalWorkHours.toFixed(2),
                totalOvertimeHours: totalOvertimeHours.toFixed(2),
                baseSalary: baseSalary.toFixed(2),
                overtimePay: overtimePay.toFixed(2),
                totalSalary: totalSalary.toFixed(2),
                generatedAt: new Date()
            }).where(eq(payroll.id, existing[0].id));

            return res.status(200).json({ message: 'Payroll updated successfully', data: { totalSalary, overtimePay } });
        } else {
            await db.insert(payroll).values({
                id: uuidv4(),
                userId,
                month,
                year,
                totalWorkHours: totalWorkHours.toFixed(2),
                totalOvertimeHours: totalOvertimeHours.toFixed(2),
                baseSalary: baseSalary.toFixed(2),
                overtimePay: overtimePay.toFixed(2),
                totalSalary: totalSalary.toFixed(2),
                status: 'Pending',
                generatedAt: new Date()
            });

            return res.status(201).json({ message: 'Payroll generated successfully', data: { totalSalary, overtimePay } });
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

        const records = await db.select({
            id: payroll.id,
            userId: payroll.userId,
            userName: user.name,
            month: payroll.month,
            year: payroll.year,
            baseSalary: payroll.baseSalary,
            overtimePay: payroll.overtimePay,
            totalSalary: payroll.totalSalary,
            status: payroll.status
        })
            .from(payroll)
            .innerJoin(user, eq(payroll.userId, user.id)); // Should join user for names

        res.status(200).json(records);
    } catch (error) {
        console.error('Error fetching payroll:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
