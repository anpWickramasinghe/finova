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
    getAllAttendance: async () => {
        const response = await axios.get<AttendanceRecord[]>(`${API_URL}/attendance`, {
            headers: getAuthHeader(),
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
};
