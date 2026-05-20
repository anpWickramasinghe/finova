/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import type { Branch } from '../pages/branch-management/types';


const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeader = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        if (user?.token) return { Authorization: `Bearer ${user.token}` };
    }
    return {};
};

export const branchService = {
    getAllBranches: async (): Promise<Branch[]> => {
        const response = await axios.get(`${API_URL}/branches`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    createBranch: async (branchData: Partial<Branch>): Promise<Branch> => {
        const response = await axios.post(`${API_URL}/branches`, branchData, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    updateBranch: async (id: string | number, branchData: Partial<Branch>): Promise<Branch> => {
        const response = await axios.put(`${API_URL}/branches/${id}`, branchData, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    deleteBranch: async (id: string | number): Promise<void> => {
        await axios.delete(`${API_URL}/branches/${id}`, {
            headers: getAuthHeader()
        });
    },

    getBranchEmployees: async (id: string | number): Promise<any[]> => {
        const response = await axios.get(`${API_URL}/branches/${id}/employees`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    transferToBranchStripe: async (id: string | number, amount: number, currency: string = 'usd'): Promise<any> => {
        const response = await axios.post(`${API_URL}/branches/${id}/stripe-transfer`, { amount, currency }, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    connectBranchStripe: async (id: string | number): Promise<any> => {
        const response = await axios.post(`${API_URL}/branches/${id}/stripe-connect`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    }
};
