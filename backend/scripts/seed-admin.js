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
                requiresPasswordChange: false
            }
        });

        if (res) {
            console.log('Admin created successfully');
            console.log('Email:', adminEmail);
            console.log('Password:', adminPassword);
        }
    } catch (error) {
        console.log('Admin might already exist or error:', error.message);
    }

    process.exit();
};

seedAdmin();
