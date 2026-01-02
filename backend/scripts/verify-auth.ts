const BASE_URL = 'http://localhost:5000/api';

async function run() {
    try {
        console.log('--- Starting Verification ---');

        // 1. Login as Admin
        console.log('\n1. Logging in as Admin...');
        const adminLoginRes = await fetch(`${BASE_URL}/auth/sign-in/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@finova.com',
                password: 'AdminPassword123!'
            })
        });

        if (!adminLoginRes.ok) throw new Error(`Admin login failed: ${adminLoginRes.statusText}`);
        const adminData = await adminLoginRes.json();
        // better-auth returns user and session? Or sets cookie?
        // It sets cookie usually. But we need to capture it for subsequent requests.
        // Node fetch doesn't handle cookies automatically.
        const cookie = adminLoginRes.headers.get('set-cookie');
        console.log('Admin logged in. Cookie:', cookie ? 'Received' : 'Missing');

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Cookie': cookie || ''
        };

        // 2. Create Manager User
        console.log('\n2. Creating Manager User...');
        const createRes = await fetch(`${BASE_URL}/admin/users`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                email: 'manager@finova.com',
                firstName: 'John',
                lastName: 'Manager',
                role: 'manager',
                companyId: 'company_1'
            })
        });

        if (!createRes.ok) {
            const err = await createRes.text();
            throw new Error(`Create user failed: ${err}`);
        }

        const createData = await createRes.json();
        console.log('Manager created.');
        const tempPassword = createData.tempPassword;
        console.log('Temp Password:', tempPassword);

        // 3. Login as Manager (Should require password change)
        console.log('\n3. Logging in as Manager...');
        const managerLoginRes = await fetch(`${BASE_URL}/auth/sign-in/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'manager@finova.com',
                password: tempPassword
            })
        });

        if (!managerLoginRes.ok) throw new Error(`Manager login failed: ${managerLoginRes.statusText}`);
        const managerCookie = managerLoginRes.headers.get('set-cookie');
        console.log('Manager logged in.');

        // 4. Verify Access Blocked (Try to access protected route)
        // We need a protected route. Let's try /api/auth/me (legacy) or create a dummy one.
        // Or try to create another user (should fail due to role AND password change).
        // Let's try to access /api/admin/users (should fail 403).
        console.log('\n4. Verifying Access Blocked...');
        const blockedRes = await fetch(`${BASE_URL}/admin/users`, { // This requires admin, so it fails anyway.
            // We need a route that Manager COULD access if not for password change.
            // But we don't have manager routes yet.
            // Let's rely on the fact that we added middleware.
            // If I call a route that uses `requireAuth`, it should return 403 PASSWORD_CHANGE_REQUIRED.
            // Let's try to call `createUser` again (even if role is wrong, middleware might run first?).
            // `requireAuth` runs first.
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': managerCookie || '' },
            body: JSON.stringify({})
        });

        const blockedData = await blockedRes.json();
        console.log('Response code:', blockedRes.status);
        console.log('Response body:', blockedData);

        if (blockedRes.status === 403 && blockedData.code === 'PASSWORD_CHANGE_REQUIRED') {
            console.log('SUCCESS: Access blocked as expected.');
        } else {
            console.log('WARNING: Access might not be blocked correctly or different error.');
        }

        // 5. Change Password
        console.log('\n5. Changing Password...');
        const newPassword = 'NewStrongPassword123!';
        const changeRes = await fetch(`${BASE_URL}/auth/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': managerCookie || '' },
            body: JSON.stringify({
                currentPassword: tempPassword,
                newPassword: newPassword,
                revokeOtherSessions: true
            })
        });

        if (!changeRes.ok) {
            const err = await changeRes.text();
            throw new Error(`Change password failed: ${err}`);
        }
        console.log('Password changed successfully.');

        // 6. Verify Access Restored (Flag should be cleared)
        // We need to re-login? better-auth might revoke session.
        // Let's re-login with new password.
        console.log('\n6. Re-logging in with new password...');
        const newLoginRes = await fetch(`${BASE_URL}/auth/sign-in/email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'manager@finova.com',
                password: newPassword
            })
        });

        if (!newLoginRes.ok) throw new Error(`Re-login failed: ${newLoginRes.statusText}`);
        const newManagerCookie = newLoginRes.headers.get('set-cookie');

        // Check flag in DB? Or just check if we get 403 PASSWORD_CHANGE_REQUIRED.
        // If we call a protected route.
        // Since we don't have a generic "manager" route, we can't easily verify "success" vs "forbidden by role".
        // But if we get "Forbidden: Insufficient role" instead of "Password change required", it means the password check passed!

        console.log('\n7. Verifying Flag Cleared...');
        const checkRes = await fetch(`${BASE_URL}/admin/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': newManagerCookie || '' },
            body: JSON.stringify({})
        });

        const checkData = await checkRes.json();
        console.log('Response code:', checkRes.status);
        console.log('Response body:', checkData);

        if (checkData.message === 'Forbidden: Insufficient role') {
            console.log('SUCCESS: Password change check passed (now blocked by role, as expected).');
        } else if (checkData.code === 'PASSWORD_CHANGE_REQUIRED') {
            console.log('FAILURE: Still blocked by password change.');
        } else {
            console.log('Unknown state.');
        }

    } catch (e) {
        console.error('Verification Failed:', e);
    }
}

run();
