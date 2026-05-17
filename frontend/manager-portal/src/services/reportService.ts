
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeader = () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.token) {
            return { Authorization: `Bearer ${user.token}` };
        }
    }
    return {};
};

export interface ReportStats {
    attendance: { name: string; count: number }[];
    overtime: { name: string; hours: number }[];
    transactions: { name: string; volume: number }[];
    summary: {
        totalReports: number;
        activeEmployees: number;
        systemHealth: string;
    };
}

export const reportService = {
    getStats: async (startDate?: string, endDate?: string): Promise<ReportStats> => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await axios.get(`${API_URL}/reports/stats?${params.toString()}`, {
            headers: getAuthHeader(),
        });
        return response.data;
    }
};
