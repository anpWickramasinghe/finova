import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

const getHeaders = async () => {
    try {
        const storedUser = await SecureStore.getItemAsync('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            return {
                headers: {
                    Authorization: `Bearer ${parsedUser.token}`,
                },
            };
        }
    } catch (e) {
        console.error('Error getting token', e);
    }
    return { headers: {} };
};


export const getMyAttendance = async () => {
    const headers = await getHeaders();
    const response = await axios.get(`${API_URL}/attendance/my-history`, headers);
    return response.data;
};

export const getAttendanceStatus = async () => {
    const headers = await getHeaders();
    const response = await axios.get(`${API_URL}/attendance/status`, headers);
    return response.data;
};
