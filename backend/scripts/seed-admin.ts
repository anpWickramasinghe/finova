import { auth } from '../auth.js';
import { db } from '../config/db.js';
import { branch } from '../db/schema.js';

const seedAdmin = async () => {
    try {
        const adminEmail = 'admin@finova.com';
        const adminPassword = 'AdminPassword123!';

        // Fetch a branch ID
        const branches = await db.select().from(branch).limit(1);
        const branchId = branches.length > 0 ? branches[0].id : null;

        if (!branchId) {
            console.log('No branches found. Please run seed script first.');
            process.exit(1);
        }

        console.log('Creating Admin user...');
        const res = await auth.api.signUpEmail({
            body: {
                email: adminEmail,
                password: adminPassword,
                name: 'Super Admin',
                role: 'Admin',
                companyId: 'company_1',
                requiresPasswordChange: false,
                phone: '+1234567890',
                branchId: branchId,
                nic: '123456789V',
                address: '123 Main St, City',
                epfNo: 'EPF123456',
                status: 'Active',
                permissions: JSON.stringify(['Full Access'])
            }
        });

        if (res) {
            console.log('Admin created successfully');
            console.log('Email:', adminEmail);
            console.log('Password:', adminPassword);
        }
    } catch (error: any) {
        console.log('Admin might already exist or error:', error.message);
    }

    process.exit();
};

seedAdmin();
