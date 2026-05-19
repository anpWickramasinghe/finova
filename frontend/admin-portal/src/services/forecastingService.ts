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

export interface ForecastPrediction {
    date: string;
    predicted_flow: number;
    type: string;
}

export const forecastingService = {
    getPredictions: async (days: number = 30): Promise<ForecastPrediction[]> => {
        const response = await axios.get(`${API_URL}/forecasting/predict`, {
            params: { days },
            headers: getAuthHeader(),
        });
        
        // The backend wraps response as { success: true, data: [...] }
        if (response.data && response.data.success) {
            return response.data.data;
        }
        
        return [];
    }
};
