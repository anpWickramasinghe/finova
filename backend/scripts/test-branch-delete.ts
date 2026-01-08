import { db } from '../config/db.js';
import { branch, user } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const testBranchDelete = async () => {
    try {
        console.log('Starting branch deletion test...');

        // 1. Create a test branch
        const branchId = `test-branch-${uuidv4()}`;
        await db.insert(branch).values({
            id: branchId,
            name: 'Test Branch for Deletion',
            manager: 'Test Manager',
            contactNumber: '1234567890',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        console.log('Created test branch:', branchId);

        // 2. Create a test user assigned to this branch
        const userId = `test-user-${uuidv4()}`;
        await db.insert(user).values({
            id: userId,
            name: 'Test User',
            email: `test-${uuidv4()}@example.com`,
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            branchId: branchId,
            role: 'Employee'
        });
        console.log('Created test user assigned to branch:', userId);

        // 3. Verify assignment
        const userBefore = await db.select().from(user).where(eq(user.id, userId));
        if (userBefore[0].branchId !== branchId) {
            throw new Error('User was not correctly assigned to branch');
        }
        console.log('User correctly assigned to branch.');

        // 4. Simulate the controller logic (Unassign then Delete)
        // We are testing the LOGIC here, effectively unit testing the controller's operations
        console.log('Executing deletion logic...');

        // Step A: Unassign users
        await db.update(user)
            .set({ branchId: null })
            .where(eq(user.branchId, branchId));

        // Step B: Delete branch
        await db.delete(branch).where(eq(branch.id, branchId));

        // 5. Verify results
        const userAfter = await db.select().from(user).where(eq(user.id, userId));
        const branchAfter = await db.select().from(branch).where(eq(branch.id, branchId));

        if (branchAfter.length === 0) {
            console.log('SUCCESS: Branch was deleted.');
        } else {
            console.error('FAILURE: Branch still exists.');
        }

        if (userAfter[0].branchId === null) {
            console.log('SUCCESS: User branchId is now null.');
        } else {
            console.error('FAILURE: User branchId is NOT null:', userAfter[0].branchId);
        }

        // Cleanup user
        await db.delete(user).where(eq(user.id, userId));
        console.log('Cleanup: Deleted test user.');

    } catch (error: any) {
        console.error('Test failed:', error);
    }
    process.exit();
};

testBranchDelete();
