import { generatePayroll } from './controllers/payrollController.js';
import { db } from './config/db.js';
import { user, attendance, payroll, overtime_settings } from './db/schema.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Mock Express Request and Response
const mockRequest = (body: any) => ({
    body
});

const mockResponse = () => {
    const res: any = {};
    res.status = (code: number) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data: any) => {
        res.data = data;
        return res;
    };
    return res;
};

async function verifyPayroll() {
    console.log('Starting Payroll Verification (System Overtime)...');

    try {
        // 1. Setup Overtime Settings
        console.log('Seeding Overtime Settings...');
        await db.delete(overtime_settings); // Clear existing
        await db.insert(overtime_settings).values({
            id: uuidv4(),
            companyId: 'test-company',
            minOvertimeMinutes: '30',
            weekdayMultiplier: '1.25',
            weekendMultiplier: '2.0',
            holidayMultiplier: '3.0'
        });

        // 2. Setup Data
        const testMonth = '12';
        const testYear = '2025';

        // User 1: Fixed With OT
        const user1Id = uuidv4();
        await db.insert(user).values({
            id: user1Id,
            name: 'Test Fixed OT (System)',
            email: `test1_sys_${Date.now()}@example.com`,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            salaryType: 'FixedWithOvertime',
            baseSalary: '48000', // 48k base -> 200/hr (at 240hrs)
            otMultiplier: '1.5' // Should be IGNORED in favor of system settings
        });

        // Add Attendance for User 1
        // Record 1: Weekday, 2 hours OT. Multiplier 1.25. Pay: 2 * 200 * 1.25 = 500
        await db.insert(attendance).values({
            id: uuidv4(),
            userId: user1Id,
            recordDate: new Date(2025, 11, 5, 12, 0, 0), // Friday (Dec 5 2025)
            workHours: '8',
            overtimeHours: '2',
            calculatedOvertimeMinutes: '120', // 2 hours
            isWeekend: false,
            isHoliday: false,
            status: 'Present'
        });

        // Record 2: Weekend, 5 hours OT. Multiplier 2.0. Pay: 5 * 200 * 2.0 = 2000
        await db.insert(attendance).values({
            id: uuidv4(),
            userId: user1Id,
            recordDate: new Date(2025, 11, 6, 12, 0, 0), // Saturday (Dec 6 2025)
            workHours: '8',
            overtimeHours: '5',
            calculatedOvertimeMinutes: '300', // 5 hours
            isWeekend: true,
            isHoliday: false,
            status: 'Present'
        });

        // Expected Total OT Pay: 500 + 2000 = 2500.
        // Gross: 48000 + 2500 = 50500.
        // EPF: 48000 * 0.08 = 3840.
        // Net: 50500 - 3840 = 46660.

        // 3. Generate Payroll
        console.log('Generating Payroll for User 1...');
        const req1 = mockRequest({ userId: user1Id, month: testMonth, year: testYear });
        const res1 = mockResponse();
        await generatePayroll(req1 as any, res1 as any);
        console.log('User 1 Result:', res1.data);

        // Validation Log
        const responseBody = res1.data;
        const data = responseBody.data;
        if (data.overtimePay === '2500.00' && data.netSalary === '46660.00') {
            console.log('✅ VERIFICATION PASSED: Overtime Pay matched expected system calculations.');
        } else {
            console.error('❌ VERIFICATION FAILED: Expected OT 2500.00, Got ' + data.overtimePay + ' and Expected Net 46660.00, Got ' + data.netSalary);
        }

        console.log('Verification Logic Completed.');

    } catch (e) {
        console.error('Verification Failed:', e);
    } finally {
        process.exit();
    }
}

verifyPayroll();
