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

export interface Employee {
    id: string;
    name: string;
    email: string;
    role: string | null;
    phone: string | null;
    nic: string | null;
    address: string | null;
    designation: string | null;
    avatar: string | null;
    branchId: string | null;
    status: string;
}

export const branchService = {
    getBranchEmployees: async (branchId: string) => {
        const response = await axios.get<Employee[]>(`${API_URL}/branches/${branchId}/employees`, {
            headers: getAuthHeader(),
        });
        return response.data;
    },
};
