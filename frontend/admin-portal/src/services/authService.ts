import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

export const authService = {
    async login(email: string, password: string) {
        const response = await axios.post(`${API_URL}/sign-in/email`, {
            email,
            password,
        });
        return response.data;
    },
};
