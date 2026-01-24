import { Request, Response } from 'express';
import { db } from '../config/db.js';
import { leave_request, user } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const createLeaveRequest = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id || res.locals.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // Use strict types for dates
        const { startDate, endDate, type, reason } = req.body;

        if (!startDate || !endDate || !type) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        await db.insert(leave_request).values({
            id: uuidv4(),
            userId: userId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            type: type,
            reason: reason || '',
            status: 'Pending',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.status(201).json({ message: 'Leave request submitted successfully' });
    } catch (error) {
        console.error('Error creating leave request:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getLeaveRequests = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id || res.locals.user?.id;
        const userRole = (req as any).user?.role;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (userRole === 'manager') {
            // Manager: View requests for their branch/employees
            // Note: Assuming manager's branch logic or just view all for now based on strict strict permissions?
            // Usually we filter by branch. Let's get the manager's branch first or if they are admin.
            // For now, mirroring attendance logic, if branch manager, show their branch.

            // Get manager details to find branchId
            const manager = await db.select().from(user).where(eq(user.id, userId)).limit(1);
            if (manager.length === 0) return res.status(404).json({ message: "User not found" });
            const branchId = manager[0].branchId;

            if (branchId) {
                const requests = await db.select({
                    id: leave_request.id,
                    userId: leave_request.userId,
                    userName: user.name,
                    startDate: leave_request.startDate,
                    endDate: leave_request.endDate,
                    type: leave_request.type,
                    reason: leave_request.reason,
                    status: leave_request.status,
                    createdAt: leave_request.createdAt
                })
                    .from(leave_request)
                    .innerJoin(user, eq(leave_request.userId, user.id))
                    .where(eq(user.branchId, branchId))
                    .orderBy(desc(leave_request.createdAt));

                return res.status(200).json(requests);
            }
            // If no branch (maybe generic admin?), return all
            const requests = await db.select({
                id: leave_request.id,
                userId: leave_request.userId,
                userName: user.name,
                startDate: leave_request.startDate,
                endDate: leave_request.endDate,
                type: leave_request.type,
                reason: leave_request.reason,
                status: leave_request.status,
                createdAt: leave_request.createdAt
            })
                .from(leave_request)
                .innerJoin(user, eq(leave_request.userId, user.id))
                .orderBy(desc(leave_request.createdAt));
            return res.status(200).json(requests);

        } else {
            // Employee: View own requests
            const requests = await db.select().from(leave_request)
                .where(eq(leave_request.userId, userId))
                .orderBy(desc(leave_request.createdAt));
            res.status(200).json(requests);
        }

    } catch (error) {
        console.error('Error fetching leave requests:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateLeaveStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['Approved', 'Rejected', 'Pending'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        await db.update(leave_request)
            .set({
                status: status,
                updatedAt: new Date()
            })
            .where(eq(leave_request.id, id));

        res.status(200).json({ message: `Leave request ${status.toLowerCase()}` });
    } catch (error) {
        console.error('Error updating leave status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getLeaveStats = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id || res.locals.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Helper to get branchId (mirroring getLeaveRequests logic)
        const manager = await db.select().from(user).where(eq(user.id, userId)).limit(1);
        const branchId = manager[0]?.branchId;

        // Base query conditions
        // If manager has branch, filter by user.branchId. Else (admin?), no filter?
        // Ideally we join user table to filter by branch.

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Total On Leave (Today) & Distribution
        // We need leaves where status='Approved' AND today is between startDate and endDate
        // Drizzle doesn't have simple 'BETWEEN' for dates in all drivers, so using gte/lte
        // Actually, logic: startDate <= today AND endDate >= today

        // Fetch all approved active leaves for the branch
        // Note: Doing in-memory processing for stats might be easier if dataset is small, 
        // but let's try to be efficient. 
        // For simplicity with Drizzle/SQLite/PG complexity, let's fetch 'active' leaves and aggregate.

        const activeLeaves = await db.select({
            type: leave_request.type,
            startDate: leave_request.startDate,
            endDate: leave_request.endDate
        })
            .from(leave_request)
            .innerJoin(user, eq(leave_request.userId, user.id))
            .where(and(
                eq(leave_request.status, 'Approved'),
                branchId ? eq(user.branchId, branchId) : undefined
            ));

        // Filter for "Active Today" in code to avoid complex SQL date comparisons if simplified
        const leavesToday = activeLeaves.filter(l => {
            const start = new Date(l.startDate);
            const end = new Date(l.endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            return start <= today && end >= today;
        });

        const totalOnLeave = leavesToday.length;

        // Distribution
        const distribution: Record<string, number> = {};
        leavesToday.forEach(l => {
            distribution[l.type] = (distribution[l.type] || 0) + 1;
        });

        const distributionArray = Object.keys(distribution).map(type => ({
            name: type,
            value: distribution[type],
            color: getTypeColor(type) // Helper function
        }));

        // 2. Weekly Overview (Bar Chart)
        // Last 7 days or current week? "This Week" usually means Mon-Sun or similar.
        // Let's do next 5 days or last 5 days? The mock shows Mon-Fri. 
        // Let's show "Current Week" (Mon-Fri)
        const getMonday = (d: Date) => {
            const d2 = new Date(d);
            const day = d2.getDay();
            const diff = d2.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            return new Date(d2.setDate(diff));
        }

        const monday = getMonday(today);
        const weekStats = [];
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

        for (let i = 0; i < 5; i++) {
            const checkDate = new Date(monday);
            checkDate.setDate(monday.getDate() + i);
            checkDate.setHours(0, 0, 0, 0);

            // Count active leaves for this date
            const count = activeLeaves.filter(l => {
                const start = new Date(l.startDate);
                const end = new Date(l.endDate);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                return start <= checkDate && end >= checkDate;
            }).length;

            weekStats.push({ name: days[i], value: count });
        }


        // 3. Upcoming Leaves (for List)
        // Requests approved, startDate > today
        const upcoming = await db.select({
            userId: leave_request.userId,
            userName: user.name,
            type: leave_request.type,
            startDate: leave_request.startDate,
            endDate: leave_request.endDate
        })
            .from(leave_request)
            .innerJoin(user, eq(leave_request.userId, user.id))
            .where(and(
                eq(leave_request.status, 'Approved'),
                branchId ? eq(user.branchId, branchId) : undefined
            ))
            .orderBy(desc(leave_request.startDate)); // Actually want ascending from today

        // Filter in memory for future
        const upcomingList = upcoming.filter(l => new Date(l.startDate) > today)
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
            .slice(0, 5); // Limit 5

        res.status(200).json({
            totalOnLeave,
            distribution: distributionArray,
            weekStats,
            upcomingLeaves: upcomingList
        });

    } catch (error) {
        console.error('Error fetching leave stats:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getTypeColor = (type: string) => {
    switch (type) {
        case 'Annual Leave': return '#0f172a'; // primary / slate-900
        case 'Sick Leave': return '#10b981';   // emerald-500
        case 'Other Leave': return '#f59e0b'; // amber-500
        default: return '#64748b'; // slate-500
    }
};
