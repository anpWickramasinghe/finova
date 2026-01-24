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

export interface AttendanceRecord {
    id: string;
    userId: string;
    recordDate: string;
    checkInTime: string | null;
    checkOutTime: string | null;
    status: string;
    workHours: string | null;
    biometricId: string | null;
    createdAt: string;
    updatedAt: string;
}

export const attendanceService = {
    getAllAttendance: async (params?: { startDate?: string; endDate?: string }) => {
        const response = await axios.get<AttendanceRecord[]>(`${API_URL}/attendance`, {
            headers: getAuthHeader(),
            params
        });
        return response.data;
    },

    // Method to sync attendance if needed manually (though mostly for biometric)
    syncAttendance: async (data: any) => {
        const response = await axios.post(`${API_URL}/attendance/sync`, data, {
            headers: getAuthHeader(),
        });
        return response.data;
    }

    // // Employee Check-in
    // checkIn: async () => {
    //     const response = await axios.post(`${API_URL}/attendance/check-in`, {}, {
    //         headers: getAuthHeader(),
    //     });
    //     return response.data;
    // },

    // // Employee Check-out
    // checkOut: async () => {
    //     const response = await axios.post(`${API_URL}/attendance/check-out`, {}, {
    //         headers: getAuthHeader(),
    //     });
    //     return response.data;
    // },

    // // Get Logged-in User's History
    // getMyAttendance: async () => {
    //     const response = await axios.get<AttendanceRecord[]>(`${API_URL}/attendance/my-history`, {
    //         headers: getAuthHeader(),
    //     });
    //     return response.data;
    // },

    // // Get Current Status
    // getAttendanceStatus: async () => {
    //     const response = await axios.get<{ status: string, lastActionTime: string | null }>(`${API_URL}/attendance/status`, {
    //         headers: getAuthHeader(),
    //     });
    //     return response.data;
    // }
};
