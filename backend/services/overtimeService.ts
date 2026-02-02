
import { db } from '../config/db.js';
import { overtime_settings, holiday } from '../db/schema.js';
import { eq, and, lte, gte } from 'drizzle-orm';

/**
 * Calculates overtime based on check-in/out times and configuration.
 */
export const calculateOvertime = async (
    userId: string,
    checkInTime: Date,
    checkOutTime: Date,
    recordDate: Date
) => {
    // 1. Fetch Global Overtime Settings
    // Assumption: There is one global settings row, or we pick the first one.
    const settingsList = await db.select().from(overtime_settings).limit(1);
    const settings = settingsList.length > 0 ? settingsList[0] : null;

    // Default values if no settings found
    const minOvertimeMinutes = settings?.minOvertimeMinutes ? parseInt(settings.minOvertimeMinutes) : 30;
    // Multipliers are for payroll calculation, but we might store flags here.

    // 2. Work Schedule (Hardcoded: 09:00 - 17:00)
    // As per user request, dynamic schedules are removed.

    // Default fallback schedule: 9:00 AM - 5:00 PM (17:00)
    const startTimeStr = '09:00';
    const endTimeStr = '17:00';

    // Parse Schedule Times for the Record Date
    const scheduleStart = new Date(recordDate);
    const [startH, startM] = startTimeStr.split(':').map(Number);
    scheduleStart.setHours(startH, startM, 0, 0);

    const scheduleEnd = new Date(recordDate);
    const [endH, endM] = endTimeStr.split(':').map(Number);
    scheduleEnd.setHours(endH, endM, 0, 0);

    // 3. Check for Holiday
    // holidays might be stored with time 00:00:00. Match by date.
    const dateString = recordDate.toISOString().split('T')[0]; // YYYY-MM-DD
    // More robust: Start and End of day
    const startOfDay = new Date(recordDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(recordDate); endOfDay.setHours(23, 59, 59, 999);

    const holidays = await db.select().from(holiday)
        .where(
            and(
                gte(holiday.date, startOfDay),
                lte(holiday.date, endOfDay)
            )
        )
        .limit(1);

    const isHoliday = holidays.length > 0;

    // 4. Check for Weekend
    const dayOfWeek = recordDate.getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // 5. Calculate Overtime Minutes
    let earlyStartMinutes = 0;
    let lateEndMinutes = 0;

    // Early Start: If checkIn < scheduleStart
    if (checkInTime < scheduleStart) {
        const diffMs = scheduleStart.getTime() - checkInTime.getTime();
        earlyStartMinutes = Math.floor(diffMs / (1000 * 60));
    }

    // Late End: If checkOut > scheduleEnd
    if (checkOutTime > scheduleEnd) {
        const diffMs = checkOutTime.getTime() - scheduleEnd.getTime();
        lateEndMinutes = Math.floor(diffMs / (1000 * 60));
    }

    // Explicit Rule: "Working on weekends or public holidays"
    // If it is a holiday or weekend, is ALL work considered overtime? 
    // Usually yes. Or is it just the extra hours? 
    // Prompt says: "Working on weekends or public holidays... Paid overtime rates...".
    // Usually implies the entire duration is special rate, OR standard OT logic applies for "Extra hours". 
    // The prompt says: "for consider overtime like Extra hours beyond normal schedule... Working on weekends..."
    // Let's assume on Weekends/Holidays, since there is NO "normal schedule", effectively the schedule is 0 hours?
    // OR does the schedule still apply?
    // Many systems treat Weekend work as 100% overtime.
    // If I treat weekend/holiday as "0 work hours schedule", then (CheckOut - CheckIn) is all OT.
    // Let's go with: If weekend/holiday, ENTIRE duration is OT.

    let totalRawMinutes = 0;

    if (isHoliday || isWeekend) {
        // Entire duration is OT
        const diffMs = checkOutTime.getTime() - checkInTime.getTime();
        totalRawMinutes = Math.floor(diffMs / (1000 * 60));
    } else {
        totalRawMinutes = earlyStartMinutes + lateEndMinutes;
    }

    // 6. Apply Thresholds
    // "15 extra minutes -> not counted", "1 hour -> counted"
    // "Overtime counts only after 30 minutes or 1 hour"
    // We use minOvertimeMinutes from settings.

    let calculatedMinutes = 0;
    if (totalRawMinutes >= minOvertimeMinutes) {
        // Count ALL or just excess? "1 hour -> counted". Usually implies the full hour is counted once threshold met.
        calculatedMinutes = totalRawMinutes;
    } else {
        calculatedMinutes = 0;
    }

    return {
        calculatedMinutes,
        isHoliday,
        isWeekend,
        status: calculatedMinutes > 0 ? 'Pending' : 'None'
    };
};


