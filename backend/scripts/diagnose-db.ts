import { db } from '../config/db.js';
import { user, leave_request, branch } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const diagnose = async () => {
    try {
        console.log('--- DIAGNOSTIC START ---');

        // 1. Check Branches
        const branches = await db.select().from(branch);
        console.log(`Branches found: ${branches.length}`);
        branches.forEach(b => console.log(` - ID: ${b.id}, Name: ${b.name}`));

        // 2. Check Users
        const users = await db.select().from(user);
        console.log(`Users found: ${users.length}`);
        users.forEach(u => console.log(` - Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, BranchId: ${u.branchId}`));

        // 3. Check Leave Requests
        const leaves = await db.select().from(leave_request);
        console.log(`Leave Requests found: ${leaves.length}`);
        leaves.forEach(l => console.log(` - UserID: ${l.userId}, Type: ${l.type}, Status: ${l.status}, Start: ${l.startDate.toISOString()}`));

        console.log('--- DIAGNOSTIC END ---');
    } catch (e) {
        console.error(e);
    }
    process.exit();
};

diagnose();
