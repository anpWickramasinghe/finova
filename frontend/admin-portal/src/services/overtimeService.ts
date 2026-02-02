
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/admin'; // Update if base URL is different
const ATTENDANCE_API_URL = 'http://localhost:5000/api/attendance';

// Helper to get token
const getAuthHeader = () => {
    const user = localStorage.getItem('user');
    if (user) {
        const { token } = JSON.parse(user);
        return { headers: { Authorization: `Bearer ${token}` } };
    }
    return {};
};

// Settings
export const getOvertimeSettings = async () => {
    const response = await axios.get(`${API_URL}/overtime-settings`, getAuthHeader());
    return response.data;
};

export const updateOvertimeSettings = async (data: any) => {
    const response = await axios.put(`${API_URL}/overtime-settings`, data, getAuthHeader());
    return response.data;
};

// Holidays
export const getHolidays = async () => {
    const response = await axios.get(`${API_URL}/holidays`, getAuthHeader());
    return response.data;
};

export const createHoliday = async (data: any) => {
    const response = await axios.post(`${API_URL}/holidays`, data, getAuthHeader());
    return response.data;
};

export const deleteHoliday = async (id: string) => {
    const response = await axios.delete(`${API_URL}/holidays/${id}`, getAuthHeader());
    return response.data;
};

export const syncHolidays = async (data: { year: number | string, country: string, apiKey?: string }) => {
    const response = await axios.post(`${API_URL}/holidays/sync`, data, getAuthHeader());
    return response.data;
};



// Manager Approval
export const approveOvertime = async (data: any) => {
    // Note: This endpoint is under /api/attendance, likely accessible by Manager/Admin
    const response = await axios.post(`${ATTENDANCE_API_URL}/approve-ot`, data, getAuthHeader());
    return response.data;
};
