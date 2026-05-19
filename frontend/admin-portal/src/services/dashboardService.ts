import axios from 'axios';
import { forecastingService } from './forecastingService';
import type { ForecastPrediction } from './forecastingService';

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeader = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.token) {
            return { Authorization: `Bearer ${user.token}` };
        }
    }
    return {};
};

// ===== Types =====

export interface DashboardKPIs {
    cashFlow: number;
    cashFlowChange: number;
    outstandingInvoices: number;
    outstandingCount: number;
    monthlyRevenue: number;
    monthlyRevenueChange: number;
    totalExpenses: number;
}

export interface RevenueTrendPoint {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
}

export interface ExpenseBreakdownItem {
    category: string;
    amount: number;
    color: string;
}

export interface CashFlowPoint {
    date: string;
    inflow: number;
    outflow: number;
}

export interface DashboardData {
    kpis: DashboardKPIs;
    revenueTrends: RevenueTrendPoint[];
    expenseBreakdown: ExpenseBreakdownItem[];
    cashFlow: CashFlowPoint[];
    forecastedFlow: ForecastPrediction[];
}

// ===== Service =====

export const dashboardService = {
    getDashboardData: async (): Promise<DashboardData> => {
        // Single backend call — aggregates everything correctly with proper
        // account-type-based filtering (not text matching) and admin-aware scoping
        const [analyticsResponse, forecastResponse] = await Promise.allSettled([
            axios.get(`${API_URL}/transactions/dashboard/analytics`, {
                headers: getAuthHeader(),
            }),
            forecastingService.getPredictions(180),
        ]);

        // Fallback structure for when the backend is unavailable
        const emptyKpis: DashboardKPIs = {
            cashFlow: 0,
            cashFlowChange: 0,
            outstandingInvoices: 0,
            outstandingCount: 0,
            monthlyRevenue: 0,
            monthlyRevenueChange: 0,
            totalExpenses: 0,
        };

        const analytics = analyticsResponse.status === 'fulfilled'
            ? analyticsResponse.value.data
            : null;

        const forecastedFlow: ForecastPrediction[] =
            forecastResponse.status === 'fulfilled' ? forecastResponse.value : [];

        return {
            kpis: analytics?.kpis ?? emptyKpis,
            revenueTrends: analytics?.revenueTrends ?? [],
            expenseBreakdown: analytics?.expenseBreakdown ?? [],
            cashFlow: analytics?.cashFlow ?? [],
            forecastedFlow,
        };
    },
};
