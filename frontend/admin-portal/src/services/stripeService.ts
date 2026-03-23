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

export const stripeService = {
    createBranchTransfer: async (data: {
        amount: number;
        currency: string;
        destinationAccountId: string;
        toBranchId: string;
    }) => {
        const response = await axios.post(`${API_URL}/stripe/branch-transfer`, data, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    payPayroll: async (payrollId: string, data: { employeeAccountId: string; currency: string }) => {
        const response = await axios.post(`${API_URL}/stripe/payroll/${payrollId}/pay`, data, {
            headers: getAuthHeader(),
        });
        return response.data;
    }
};
