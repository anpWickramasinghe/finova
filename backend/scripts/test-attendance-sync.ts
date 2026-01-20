const API_URL = 'http://localhost:5000/api/attendance/sync';

async function testSync() {
    console.log('Testing Attendance Sync...');

    const userId = "TEST_BIO_" + Math.floor(Math.random() * 1000);
    console.log(`Using Biometric ID: ${userId}`);

    // Note: This test assumes there is a user in DB with this biometricId.
    // If not, it expects 404.
    // To properly test, we first need to insert a user or pick an existing one and update it.
    // Since this is an external script, accessing DB directly is hard without setup.
    // We will just try to hit the endpoint and expect a 'User not found' or success if we happen to have one.
    // Or we create a payload that might fail but proves connectivity.

    const payload = {
        biometricId: "123", // Assuming some user has this or we just test the flow
        timestamp: new Date().toISOString(),
        type: 'CheckIn'
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json(); // Need to await parsing
        console.log(`[${response.status}] Response:`, data);

    } catch (error) {
        console.error('Error:', error);
    }
}

testSync();
