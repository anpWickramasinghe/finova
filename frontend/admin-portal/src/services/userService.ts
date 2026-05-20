/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Get token from localStorage 
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

export const getUsers = async (role?: string) => {
    try {
        const response = await axios.get(`${API_URL}/admin/users`, {
            headers: getAuthHeader(),
            params: role ? { role } : {}
        });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

export const updateUser = async (user: any) => {
    try {
        const response = await axios.put(`${API_URL}/admin/users/${user.id}`, user, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

export const deleteUser = async (userId: string | number) => {
    try {
        const response = await axios.delete(`${API_URL}/admin/users/${userId}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};
