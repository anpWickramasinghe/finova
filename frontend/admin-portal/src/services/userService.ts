import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Get token from localStorage (assuming it's stored there after login)
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const createUser = async (userData: any) => {
    try {
        const response = await axios.post(`${API_URL}/admin/users`, userData, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};
