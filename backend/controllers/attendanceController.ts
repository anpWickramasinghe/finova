import { Request, Response } from 'express';
import { db } from '../config/db.js';
import { attendance, user } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const syncAttendance = async (req: Request, res: Response) => {
    try {
        const { biometricId, timestamp, type } = req.body;

        if (!biometricId || !timestamp || !type) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // 1. Find user by biometricId
        const users = await db.select().from(user).where(eq(user.biometricId, biometricId)).limit(1);
        if (users.length === 0) {
            return res.status(404).json({ message: `User with biometric ID ${biometricId} not found` });
        }
        const currentUser = users[0];

        const logTime = new Date(timestamp);
        // Normalize date to start of day (YYYY-MM-DD 00:00:00) for querying the daily record
        const logDate = new Date(logTime);
        logDate.setHours(0, 0, 0, 0);

        // 2. Find existing attendance record for this user and date
        const existingRecords = await db.select()
            .from(attendance)
            .where(
                and(
                    eq(attendance.userId, currentUser.id),
                    eq(attendance.recordDate, logDate)
                )
            )
            .limit(1);

        let attendanceRecord = existingRecords[0];

        if (type === 'CheckIn') {
            if (!attendanceRecord) {
                // Determine status based on time (Example: Late if after 9:00 AM)
                const startOfWork = new Date(logDate);
                startOfWork.setHours(9, 0, 0, 0);
                let status = 'Present';

                if (logTime > startOfWork) {
                    status = 'Late';
                }

                await db.insert(attendance).values({
                    id: uuidv4(),
                    userId: currentUser.id,
                    recordDate: logDate,
                    checkInTime: logTime,
                    status: status,
                    biometricId: biometricId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            } else {
                // If record exists but no checkInTime (unlikely for "CheckIn" first, but possible if manual entry created it)
                // Or if we want to update earliest check in.
                // For now, let's assume first check-in counts.
            }
        } else if (type === 'CheckOut') {
            if (attendanceRecord) {
                // Calculate work hours
                let workHoursText = "";
                if (attendanceRecord.checkInTime) {
                    const diffMs = logTime.getTime() - new Date(attendanceRecord.checkInTime).getTime();
                    const hours = diffMs / (1000 * 60 * 60);
                    workHoursText = hours.toFixed(2);
                }

                await db.update(attendance)
                    .set({
                        checkOutTime: logTime,
                        workHours: workHoursText,
                        updatedAt: new Date()
                    })
                    .where(eq(attendance.id, attendanceRecord.id));
            } else {
                // Check-out without Check-in? Maybe create record?
                // For simplicity, we create a record with missing Check-In
                await db.insert(attendance).values({
                    id: uuidv4(),
                    userId: currentUser.id,
                    recordDate: logDate,
                    checkOutTime: logTime,
                    status: 'Incomplete', // or 'Absent' or specific status
                    biometricId: biometricId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }

        res.status(200).json({ message: 'Attendance synced successfully' });

    } catch (error) {
        console.error('Error syncing attendance:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAttendance = async (req: Request, res: Response) => {
    // try {
    //     const userRole = (req as any).user?.role;
    //     const userId = (req as any).user?.id;

    //     if (userRole === 'branch') {
    //         // If the requester is a branch manager, only show attendance for their branch employees
    //         const records = await db.select({
    //             id: attendance.id,
    //             userId: attendance.userId,
    //             recordDate: attendance.recordDate,
    //             checkInTime: attendance.checkInTime,
    //             checkOutTime: attendance.checkOutTime,
    //             status: attendance.status,
    //             workHours: attendance.workHours,
    //             biometricId: attendance.biometricId,
    //             createdAt: attendance.createdAt,
    //             updatedAt: attendance.updatedAt,
    //         })
    //             .from(attendance)
    //             .innerJoin(user, eq(attendance.userId, user.id))
    //             .where(eq(user.branchId, userId))
    //             .orderBy(desc(attendance.recordDate));

    //         res.status(200).json(records);
    //     } else {
    //         // Admin or other roles see all (or implement other logic)
    //         const records = await db.select().from(attendance).orderBy(desc(attendance.recordDate));
    //         res.status(200).json(records);
    //     }
    // } catch (error) {
    //     console.error('Error fetching attendance:', error);
    //     res.status(500).json({ message: 'Internal server error' });
    // }
    try{
      const userId = (req as any).user?.id;

       const records = await db.select({
                id: attendance.id,
                userId: attendance.userId,
                recordDate: attendance.recordDate,
                checkInTime: attendance.checkInTime,
                checkOutTime: attendance.checkOutTime,
                status: attendance.status,
                workHours: attendance.workHours,
                biometricId: attendance.biometricId,
                createdAt: attendance.createdAt,
                updatedAt: attendance.updatedAt,
            })
                .from(attendance)
                .innerJoin(user, eq(attendance.userId, user.id))
                .where(eq(user.branchId, userId))
                .orderBy(desc(attendance.recordDate));

            res.status(200).json(records);

    }catch(error){
        console.error('Error fetching attendance:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Employee Portal Handlers

// Employee Portal Handlers

export const checkIn = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id || res.locals.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        const existingRecord = await db.select().from(attendance)
            .where(and(eq(attendance.userId, userId), eq(attendance.recordDate, today)))
            .limit(1);

        if (existingRecord.length > 0 && existingRecord[0].checkInTime) {
            return res.status(400).json({ message: 'Already checked in for today' });
        }

        const startOfWork = new Date(today);
        startOfWork.setHours(9, 0, 0, 0);
        let status = 'Present';
        if (now > startOfWork) {
            status = 'Late';
        }

        if (existingRecord.length > 0) {
            // Update existing record (e.g. if they only had a checkout? unlikely for normal flow, but good for robustness)
            await db.update(attendance)
                .set({ checkInTime: now, status: status, updatedAt: new Date() })
                .where(eq(attendance.id, existingRecord[0].id));
        } else {
            await db.insert(attendance).values({
                id: uuidv4(),
                userId: userId,
                recordDate: today,
                checkInTime: now,
                status: status,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        res.status(200).json({ message: 'Checked in successfully' });
    } catch (error) {
        console.error('Error checking in:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const checkOut = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id || res.locals.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        const existingRecord = await db.select().from(attendance)
            .where(and(eq(attendance.userId, userId), eq(attendance.recordDate, today)))
            .limit(1);

        if (existingRecord.length === 0 || !existingRecord[0].checkInTime) {
            return res.status(400).json({ message: 'You have not checked in today' });
        }

        const record = existingRecord[0];
        // We checked !existingRecord[0].checkInTime above, so it's safe to use `!` or cast, but let's be safe.
        const checkInTime = record.checkInTime ? new Date(record.checkInTime) : new Date();
        const diffMs = now.getTime() - checkInTime.getTime();
        const hours = diffMs / (1000 * 60 * 60);
        const workHoursText = hours.toFixed(2);

        await db.update(attendance)
            .set({
                checkOutTime: now,
                workHours: workHoursText,
                updatedAt: new Date()
            })
            .where(eq(attendance.id, record.id));

        res.status(200).json({ message: 'Checked out successfully' });
    } catch (error) {
        console.error('Error checking out:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getMyAttendance = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id || res.locals.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const records = await db.select().from(attendance)
            .where(eq(attendance.userId, userId))
            .orderBy(desc(attendance.recordDate));

        res.status(200).json(records);
    } catch (error) {
        console.error('Error fetching my attendance:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAttendanceStatus = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id || res.locals.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existingRecord = await db.select().from(attendance)
            .where(and(eq(attendance.userId, userId), eq(attendance.recordDate, today)))
            .limit(1);

        let status = 'Not Checked In';
        let lastActionTime = null;

        if (existingRecord.length > 0) {
            const record = existingRecord[0];
            if (record.checkOutTime) {
                status = 'Checked Out';
                lastActionTime = record.checkOutTime;
            } else if (record.checkInTime) {
                status = 'Checked In';
                lastActionTime = record.checkInTime;
            }
        }

        res.status(200).json({ status, lastActionTime });
    } catch (error) {
        console.error('Error fetching attendance status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
