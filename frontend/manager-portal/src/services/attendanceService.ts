
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/attendance';

// Helper to get token
const getAuthHeader = () => {
    const user = localStorage.getItem('user');
    if (user) {
        const { token } = JSON.parse(user);
        return { headers: { Authorization: `Bearer ${token}` } };
    }
    return {};
};

// Types
export interface AttendanceRecord {
    id: string;
    userId: string;
    recordDate: string;
    checkInTime?: string;
    checkOutTime?: string;
    status?: string;
    workHours?: string;
    overtimeStatus?: string;
    calculatedOvertimeMinutes?: string;
}

export const getAttendance = async (startDate?: string, endDate?: string): Promise<AttendanceRecord[]> => {
    let url = `${API_URL}`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    if (params.toString()) {
        url += `?${params.toString()}`;
    }

    const response = await axios.get<AttendanceRecord[]>(url, getAuthHeader());
    return response.data;
};

export const approveOvertime = async (attendanceId: string, approved: boolean, approvedMinutes?: number) => {
    const response = await axios.post(`${API_URL}/approve-ot`, {
        attendanceId,
        approved,
        approvedMinutes
    }, getAuthHeader());
    return response.data;
};
