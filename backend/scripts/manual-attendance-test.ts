import { db } from '../config/db.js';
import { user } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const API_URL = 'http://localhost:5000/api/attendance/sync';
const TARGET_USER_ID = 'Dovq7v2W7yzK0VsqekPGeov53Mr8eHmA';
const TARGET_BIO_ID = '111';

async function seedAttendance() {
    console.log(`Updating User ${TARGET_USER_ID} with Biometric ID ${TARGET_BIO_ID}...`);

    try {
        // 1. Update User
        await db.update(user)
            .set({ biometricId: TARGET_BIO_ID })
            .where(eq(user.id, TARGET_USER_ID));

        console.log('User updated. Sending Check-In...');

        // 2. Send Check-In
        const checkInPayload = {
            biometricId: TARGET_BIO_ID,
            timestamp: new Date().toISOString(),
            type: 'CheckOut'
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(checkInPayload)
        });

        const data = await response.json();
        console.log(`[${response.status}] Check-In Response:`, data);

    } catch (error) {
        console.error('Error:', error);
    }
    process.exit(0);
}

seedAttendance();
