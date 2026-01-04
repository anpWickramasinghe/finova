import { auth } from '../auth.js';
import { db } from '../config/db.js';

const seedAdmin = async () => {
    try {
        const adminEmail = 'admin@finova.com';
        const adminPassword = 'AdminPassword123!';

        console.log('Creating Admin user...');
        const res = await auth.api.signUpEmail({
            body: {
                email: adminEmail,
                password: adminPassword,
                name: 'Super Admin',
                role: 'admin',
                companyId: 'company_1',
                requiresPasswordChange: false,
                phone: '+1234567890', 
                branch: 'Head Office',
                nic: '123456789V',
                address: '123 Main St, City',
                epfNo: 'EPF123456',
                 status: 'Active',
                permissions:'default'   
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
