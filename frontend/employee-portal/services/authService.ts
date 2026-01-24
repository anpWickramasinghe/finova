import axios from "axios";

// Access the API URL from environment variables, fallback is handled if undefined but best to ensure .env is set
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const authService = {
    async login(email: string, password: string) {
        const response = await axios.post(`${API_URL}/auth/sign-in/email`, {
            email,
            password,
        }, {
            headers: {
                origin: "http://172.20.10.2:8081"
            }
        });
        return response.data;
    },
};
