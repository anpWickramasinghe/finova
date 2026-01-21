import { auth } from '../auth.js';
import { db } from '../config/db.js';
import { branch } from '../db/schema.js';

const seedEmployee = async () => {
    try {
        const employeeEmail = 'employee@finova.com';
        const employeePassword = 'EmployeePassword123!';

        // Fetch a branch ID
        let branches = await db.select().from(branch).limit(1);
        let branchId = branches.length > 0 ? branches[0].id : null;

        if (!branchId) {
            console.log('No branches found. Creating default branch...');
            const newBranch = await db.insert(branch).values({
                id: 'branch_1',
                name: 'Head Office',
                contactNumber: '+94112345678',
                createdAt: new Date(),
                updatedAt: new Date()
            }).returning();
            branchId = newBranch[0].id;
            console.log('Default branch created:', branchId);
        }

        console.log('Creating Employee user...');
        const res = await auth.api.signUpEmail({
            body: {
                email: employeeEmail,
                password: employeePassword,
                name: 'John Doe',
                role: 'User', // Normal user role
                companyId: 'company_1',
                requiresPasswordChange: false,
                phone: '+1987654321',
                branchId: branchId,
                nic: '987654321V',
                address: '456 Side St, Town',
                epfNo: 'EPF654321',
                status: 'Active',
                permissions: JSON.stringify(['Limited Access'])
            }
        });

        if (res) {
            console.log('Employee created successfully');
            console.log('Email:', employeeEmail);
            console.log('Password:', employeePassword);
        }
    } catch (error: any) {
        console.log('Employee might already exist or error:', error.message);
    }

    process.exit();
};

seedEmployee();
