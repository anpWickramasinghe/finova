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

export const createLeaveRequest = async (payload: {
    startDate: Date;
    endDate: Date;
    type: string;
    reason: string;
}) => {
    const headers = await getHeaders();
    const response = await axios.post(`${API_URL}/leaves`, payload, headers);
    return response.data;
};

export const getMyLeaveRequests = async () => {
    const headers = await getHeaders();
    const response = await axios.get(`${API_URL}/leaves`, headers);
    return response.data;
};
