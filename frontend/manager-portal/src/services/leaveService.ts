import axios from "axios";

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

export interface LeaveRequest {
    id: string;
    userId: string;
    userName?: string;
    startDate: string;
    endDate: string;
    type: string;
    reason: string;
    status: string;
    createdAt: string;
}

export const leaveService = {
    getLeaveRequests: async () => {
        const response = await axios.get<LeaveRequest[]>(`${API_URL}/leaves`, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    updateLeaveStatus: async (id: string, status: 'Approved' | 'Rejected') => {
        const response = await axios.patch(`${API_URL}/leaves/${id}/status`, { status }, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    getLeaveStats: async () => {
        const response = await axios.get<{
            totalOnLeave: number;
            distribution: { name: string; value: number; color: string }[];
            weekStats: { name: string; value: number }[];
            upcomingLeaves: any[];
        }>(`${API_URL}/leaves/stats`, {
            headers: getAuthHeader(),
        });
        return response.data;
    }
};

