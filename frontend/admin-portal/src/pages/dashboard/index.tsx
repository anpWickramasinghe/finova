/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import {
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Calendar, Download, MoreHorizontal, TrendingUp, TrendingDown, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from '@/context/AuthContext';

// Components
import KPICard from '../../components/dashboard/KPICard';

// Service
import { dashboardService } from '../../services/dashboardService';
import type { DashboardData } from '../../services/dashboardService';

const formatLKR = (amount: number) => {
    if (amount >= 1_000_000) return `LKR ${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `LKR ${(amount / 1_000).toFixed(1)}K`;
    return `LKR ${amount.toFixed(2)}`;
};

const formatChange = (pct: number) => {
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(1)}%`;
};

const Dashboard = () => {
    const { user } = useAuth();
    // const [userRole] = useState('staff');

    const displayUser = {
        name: user?.name || user?.email?.split('@')[0] || "User",
        email: user?.email || "",
        role: user?.role || "Staff",
    };

    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cashFlowPeriod, setCashFlowPeriod] = useState('30days');

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await dashboardService.getDashboardData();
                setData(result);
            } catch (err: any) {
                console.error('Dashboard data error:', err);
                setError('Could not load dashboard data. Check backend connectivity.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Build live KPI cards from backend data
    const kpiData = data ? [
        {
            id: 1,
            title: "Cash Flow",
            value: formatLKR(data.kpis.cashFlow),
            change: formatChange(data.kpis.cashFlowChange),
            trend: data.kpis.cashFlowChange >= 0 ? "up" : "down",
            icon: "TrendingUp",
            color: data.kpis.cashFlow >= 0 ? "success" : "danger",
            description: "Current month net cash flow",
        },
        {
            id: 2,
            title: "Outstanding Invoices",
            value: formatLKR(data.kpis.outstandingInvoices),
            change: `${data.kpis.outstandingCount} pending`,
            trend: "down",
            icon: "FileText",
            color: "warning",
            description: "Awaiting approval / collection",
        },
        {
            id: 3,
            title: "Monthly Revenue",
            value: formatLKR(data.kpis.monthlyRevenue),
            change: formatChange(data.kpis.monthlyRevenueChange),
            trend: data.kpis.monthlyRevenueChange >= 0 ? "up" : "down",
            icon: "DollarSign",
            color: "secondary",
            description: "Total revenue this month",
        },
        {
            id: 4,
            title: "Monthly Expenses",
            value: formatLKR(data.kpis.totalExpenses),
            change: "Current period",
            trend: "up",
            icon: "Shield",
            color: "primary",
            description: "Total operating expenses",
        },
    ] : [];

    // Forecasting cash flow chart data based on selected period
    const forecastSlice = data?.forecastedFlow ?? [];
    const cashFlowChartData = (() => {
        if (!data) return [];
        if (cashFlowPeriod === '30days') return data.cashFlow;
        // Map forecasted flow to inflow/outflow display
        const days = cashFlowPeriod === '90days' ? 90 : 180;
        return forecastSlice.slice(0, days).map(f => ({
            date: new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            inflow: f.predicted_flow > 0 ? Math.round(f.predicted_flow) : 0,
            outflow: f.predicted_flow < 0 ? Math.round(Math.abs(f.predicted_flow)) : 0,
        }));
    })();

    return (
        <div className="p-6 mx-auto space-y-8 max-w-7xl">
            {/* Page Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome back, {displayUser.name}. Here's your financial overview for today.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center px-3 py-1 text-sm border rounded-md bg-background text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Last updated: {new Date().toLocaleDateString()}</span>
                    </div>
                    <Button>
                        <Download className="w-4 h-4 mr-2" />
                        Export Report
                    </Button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-yellow-800 border border-yellow-200 rounded-lg bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* KPI Cards */}
            {loading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-4 rounded bg-muted w-3/4 mb-3" />
                                <div className="h-8 rounded bg-muted w-1/2 mb-2" />
                                <div className="h-3 rounded bg-muted w-1/3" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {kpiData.map((kpi) => (
                        <KPICard key={kpi.id} data={kpi} />
                    ))}
                </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {/* Revenue Trends */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Revenue Trends</CardTitle>
                            <CardDescription>Monthly revenue, expenses, and profit (last 6 months)</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data?.revenueTrends ?? []}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                                        <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                                        <Tooltip formatter={(v: number | undefined) => [`LKR ${(v ?? 0).toLocaleString()}`, '']} />
                                        <Legend />
                                        <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} name="Revenue" dot={false} />
                                        <Line type="monotone" dataKey="expenses" stroke="#f59e0b" strokeWidth={2} name="Expenses" dot={false} />
                                        <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="Profit" dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Expense Breakdown */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Expense Breakdown</CardTitle>
                            <CardDescription>Current month expense categories</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : (data?.expenseBreakdown?.length ?? 0) > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data!.expenseBreakdown as any[]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="amount"
                                            nameKey="category"
                                        >
                                            {data!.expenseBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(v: number | undefined, _name: any, props: any) => [
                                                `LKR ${(v ?? 0).toLocaleString()}`,
                                                props?.payload?.category ?? 'Amount',
                                            ]}
                                        />
                                        <Legend
                                            formatter={(value: string, entry: any) =>
                                                entry?.payload?.category ?? value
                                            }
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <TrendingDown className="w-8 h-8 mb-2 opacity-40" />
                                    <p className="text-sm">No expense data available yet</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Cash Flow Chart */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Cash Flow Analysis</CardTitle>
                        <CardDescription>
                            {cashFlowPeriod === '30days'
                                ? 'Historical inflow vs outflow from ledger'
                                : 'ML-forecasted cash flow predictions'}
                        </CardDescription>
                    </div>
                    <Select value={cashFlowPeriod} onValueChange={setCashFlowPeriod}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="30days">Last 30 days (Actual)</SelectItem>
                            <SelectItem value="90days">Next 90 days (Forecast)</SelectItem>
                            <SelectItem value="6months">Next 6 months (Forecast)</SelectItem>
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : cashFlowChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={cashFlowChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                                    <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                                    <Tooltip formatter={(v: number | undefined) => [`LKR ${(v ?? 0).toLocaleString()}`, '']} />
                                    <Legend />
                                    <Area type="monotone" dataKey="inflow" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Cash Inflow" />
                                    <Area type="monotone" dataKey="outflow" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} name="Cash Outflow" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <TrendingUp className="w-8 h-8 mb-2 opacity-40" />
                                <p className="text-sm">No cash flow data available. Post transactions to see trends.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

{/*            
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              
                <div className="xl:col-span-2">
                    <RecentActivity userRole={userRole} />
                </div>

                
                <div className="space-y-4">
                    <PendingTasks userRole={userRole} />
                </div>
            </div> */}
        </div>
    );
};

export default Dashboard;