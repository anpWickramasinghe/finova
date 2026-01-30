import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Get token from localStorage 
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get all payroll records
export const getPayrollRecords = async (month?: string, year?: string) => {
    try {
        const response = await axios.get(`${API_URL}/admin/payroll`, {
            headers: getAuthHeader(),
            params: { month, year }
        });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

// Generate payroll
export const generatePayroll = async (userId: string, month: string, year: string) => {
    try {
        const response = await axios.post(`${API_URL}/admin/payroll/generate`,
            { userId, month, year },
            { headers: getAuthHeader() }
        );
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};
