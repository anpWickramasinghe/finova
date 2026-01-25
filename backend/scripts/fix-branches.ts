import { db } from '../config/db.js';
import { user, branch } from '../db/schema.js';
import { eq, like, inArray } from 'drizzle-orm';

const fix = async () => {
    try {
        console.log('Fixing Branch Mismatch...');

        // 1. Find the Manager 'kasun'
        const managers = await db.select().from(user).where(like(user.email, 'kasun%'));

        if (managers.length === 0) {
            console.log('No manager named Kasun found. Trying to find ANY manager...');
            // Fallback
        }

        const targetManager = managers[0];
        if (!targetManager || !targetManager.branchId) {
            console.log('Target Manager has no branch or not found.');
            return;
        }

        const targetBranchId = targetManager.branchId;
        console.log(`Target Manager: ${targetManager.name}, Branch: ${targetBranchId}`);

        // 2. Find the seeded users
        const seededEmails = [
            'lina@finova.com',
            'jacob@finova.com',
            'anya@finova.com',
            'sarah@finova.com',
            'john@finova.com'
        ];

        console.log('Updating seeded users to this branch...');

        await db.update(user)
            .set({ branchId: targetBranchId })
            .where(inArray(user.email, seededEmails));

        console.log('Success! Seeded users moved to Manager\'s branch.');

    } catch (e) {
        console.error(e);
    }
    process.exit();
};

fix();
