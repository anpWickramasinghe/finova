
import { Request, Response } from 'express';
import { db } from '../config/db.js';
import axios from 'axios';
import { overtime_settings, holiday, attendance } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// --- Overtime Settings ---

export const getOvertimeSettings = async (req: Request, res: Response) => {
    try {
        const settings = await db.select().from(overtime_settings).limit(1);
        res.json(settings[0] || {});
    } catch (error) {
        console.error('Error fetching overtime settings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateOvertimeSettings = async (req: Request, res: Response) => {
    try {
        const { minOvertimeMinutes, weekdayMultiplier, weekendMultiplier, holidayMultiplier } = req.body;

        const existing = await db.select().from(overtime_settings).limit(1);

        if (existing.length > 0) {
            await db.update(overtime_settings)
                .set({
                    minOvertimeMinutes: String(minOvertimeMinutes),
                    weekdayMultiplier: String(weekdayMultiplier),
                    weekendMultiplier: String(weekendMultiplier),
                    holidayMultiplier: String(holidayMultiplier),
                    updatedAt: new Date()
                })
                .where(eq(overtime_settings.id, existing[0].id));
        } else {
            await db.insert(overtime_settings).values({
                id: uuidv4(),
                minOvertimeMinutes: String(minOvertimeMinutes),
                weekdayMultiplier: String(weekdayMultiplier),
                weekendMultiplier: String(weekendMultiplier),
                holidayMultiplier: String(holidayMultiplier),
                updatedAt: new Date()
            });
        }
        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error updating overtime settings:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// --- Holidays ---

export const getHolidays = async (req: Request, res: Response) => {
    try {
        const holidays = await db.select().from(holiday).orderBy(desc(holiday.date));
        res.json(holidays);
    } catch (error) {
        console.error('Error fetching holidays:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const createHoliday = async (req: Request, res: Response) => {
    try {
        const { date, name, description } = req.body;
        await db.insert(holiday).values({
            id: uuidv4(),
            date: new Date(date),
            name,
            description,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        res.json({ message: 'Holiday created successfully' });
    } catch (error) {
        console.error('Error creating holiday:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteHoliday = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await db.delete(holiday).where(eq(holiday.id, id));
        res.json({ message: 'Holiday deleted successfully' });
    } catch (error) {
        console.error('Error deleting holiday:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


// --- Holiday Sync ---

export const syncHolidays = async (req: Request, res: Response) => {
    try {
        const { year, country, apiKey } = req.body;
        const key = apiKey || process.env.CALENDARIFIC_API_KEY;

        if (!key) {
            return res.status(400).json({ message: 'API Key is required' });
        }

        const url = `https://calendarific.com/api/v2/holidays?api_key=${key}&country=${country}&year=${year}&type=national`;

        const response = await axios.get(url);
        const holidays = response.data.response.holidays;

        if (!holidays || !Array.isArray(holidays)) {
            return res.status(500).json({ message: 'Invalid response from Calendarific' });
        }

        let addedCount = 0;

        for (const h of holidays) {
            const holidayDate = new Date(h.date.iso);
            const name = h.name;
            const description = h.description;

            // Check duplicate (by date)
            const existing = await db.select().from(holiday).where(eq(holiday.date, holidayDate)).limit(1);

            if (existing.length === 0) {
                await db.insert(holiday).values({
                    id: uuidv4(),
                    date: holidayDate,
                    name: name,
                    description: description || 'Imported from Calendarific',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                addedCount++;
            }
        }

        res.json({ message: `Sync complete. Added ${addedCount} holidays.` });
    } catch (error: any) {
        console.error('Error syncing holidays:', error);

        let message = 'Internal server error';
        if (axios.isAxiosError(error)) {
            const apiError = error.response?.data?.meta?.error_detail || error.response?.data?.message || error.message;
            message = `Calendarific API Error: ${apiError}`;
        }

        res.status(500).json({ message });
    }
};


// --- Overtime Approval ---

export const approveOvertime = async (req: Request, res: Response) => {
    try {
        const { attendanceId, approved, approvedMinutes } = req.body;
        const approverId = (req as any).user?.id; // Assuming auth middleware adds user

        const status = approved ? 'Approved' : 'Rejected';
        // If approved, use provided minutes or default to 0 if not provided (though safely should probably error)
        // If rejected, 0 minutes.
        const finalMinutes = approved ? (approvedMinutes ? String(approvedMinutes) : '0') : '0';

        await db.update(attendance)
            .set({
                overtimeStatus: status,
                attendenceOvertimeMinutes: finalMinutes,
                approvedBy: approverId,
                updatedAt: new Date()
            })
            .where(eq(attendance.id, attendanceId));

        res.json({ message: `Overtime ${status}` });
    } catch (error) {
        console.error('Error approving overtime:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
