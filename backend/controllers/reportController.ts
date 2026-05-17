
import { Request, Response } from 'express';
import { db } from '../config/db.js';
import { attendance, transaction, user } from '../db/schema.js';
import { eq, and, sql, between, desc } from 'drizzle-orm';

interface AuthRequest extends Request {
    user?: any;
}

export const getReportStats = async (req: AuthRequest, res: Response) => {
    try {
        const branchId = req.user?.branchId || (req.user?.role === 'branch' ? req.user.id : null);
        const { startDate, endDate } = req.query;

        // Default to last 30 days if not provided
        const end = endDate ? new Date(endDate as string) : new Date();
        const start = startDate ? new Date(startDate as string) : new Date();
        if (!startDate) start.setDate(end.getDate() - 30);

        // 1. Attendance Stats (Daily count for chart)
        const attendanceConditions = [between(attendance.recordDate, start, end)];
        if (branchId) {
             // Need to join with user to filter by branchId
        }

        const attendanceStatsRaw = await db.select({
            date: sql<string>`DATE(${attendance.recordDate})`,
            count: sql<number>`COUNT(DISTINCT ${attendance.userId})`,
        })
        .from(attendance)
        .innerJoin(user, eq(attendance.userId, user.id))
        .where(branchId ? and(eq(user.branchId, branchId), between(attendance.recordDate, start, end)) : between(attendance.recordDate, start, end))
        .groupBy(sql`DATE(${attendance.recordDate})`)
        .orderBy(sql`DATE(${attendance.recordDate})`);

        // 2. Overtime Stats (Weekly sum)
        const overtimeStatsRaw = await db.select({
            week: sql<string>`DATE_TRUNC('week', ${attendance.recordDate})`,
            hours: sql<string>`COALESCE(SUM(CAST(${attendance.attendenceOvertimeMinutes} AS NUMERIC)), 0) / 60`,
        })
        .from(attendance)
        .innerJoin(user, eq(attendance.userId, user.id))
        .where(and(
            branchId ? eq(user.branchId, branchId) : sql`true`,
            between(attendance.recordDate, start, end),
            eq(attendance.overtimeStatus, 'Approved')
        ))
        .groupBy(sql`DATE_TRUNC('week', ${attendance.recordDate})`)
        .orderBy(sql`DATE_TRUNC('week', ${attendance.recordDate})`);

        // 3. Transaction Stats (Monthly volume)
        const transactionStatsRaw = await db.select({
            month: sql<string>`DATE_TRUNC('month', ${transaction.date})`,
            volume: sql<string>`COALESCE(SUM(${transaction.totalAmount}), 0)`,
        })
        .from(transaction)
        .where(and(
            branchId ? eq(transaction.branchId, branchId) : sql`true`,
            between(transaction.date, start, end)
        ))
        .groupBy(sql`DATE_TRUNC('month', ${transaction.date})`)
        .orderBy(sql`DATE_TRUNC('month', ${transaction.date})`);

        // 4. Summary Stats
        const totalEmployees = await db.select({ count: sql`COUNT(*)` })
            .from(user)
            .where(branchId ? eq(user.branchId, branchId) : undefined);

        const totalTransactions = await db.select({ count: sql`COUNT(*)` })
            .from(transaction)
            .where(branchId ? eq(transaction.branchId, branchId) : undefined);

        res.json({
            attendance: attendanceStatsRaw.map(d => ({ name: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }), count: Number(d.count) })),
            overtime: overtimeStatsRaw.map(d => ({ name: `Week ${new Date(d.week).getDate()}`, hours: Number(d.hours) })),
            transactions: transactionStatsRaw.map(d => ({ name: new Date(d.month).toLocaleDateString('en-US', { month: 'short' }), volume: Number(d.volume) })),
            summary: {
                totalReports: Number(totalTransactions[0]?.count || 0),
                activeEmployees: Number(totalEmployees[0]?.count || 0),
                systemHealth: "99.9%"
            }

        });

    } catch (error) {
        console.error('Error fetching report stats:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
