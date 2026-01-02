import { auth } from '../auth.js';

async function testLogin() {
    try {
        console.log("Attempting to sign in as admin@finova.com...");

        // better-auth API call to sign in
        const response = await auth.api.signInEmail({
            body: {
                email: "admin@finova.com",
                password: "AdminPassword123!"
            }
        });

        if (response) {
            console.log("✅ Login successful!");
            console.log("Full Response:", JSON.stringify(response, null, 2));
        } else {
            console.log("❌ Login failed: No response returned.");
        }
    } catch (error) {
        console.error("❌ Login failed:", error.message || error);
        if (error.body) {
            console.error("Error details:", error.body);
        }
    }
    process.exit(0);
}

testLogin();
