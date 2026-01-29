import { useState } from 'react';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, Download, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Components
import KPICard from '../../components/dashboard/KPICard';
import RecentActivity from '../../components/dashboard/RecentActivity';
import PendingTasks from '../../components/dashboard/PendingTasks';

const Dashboard = () => {
  const [userRole] = useState('staff');

  const mockUser = {
    name: "Sarah Johnson",
    email: "sarah.johnson@accountingpro.com",
    role: "Senior Accountant",
    avatar: "https://randomuser.me/api/portraits/women/32.jpg"
  };

  const kpiData = [
    {
      id: 1,
      title: "Cash Flow",
      value: "$124,580",
      change: "+12.5%",
      trend: "up",
      icon: "TrendingUp",
      color: "success",
      description: "Current month vs previous"
    },
    {
      id: 2,
      title: "Outstanding Invoices",
      value: "$45,230",
      change: "-8.2%",
      trend: "down",
      icon: "FileText",
      color: "warning",
      description: "Pending client payments"
    },
    {
      id: 3,
      title: "Monthly Revenue",
      value: "$89,450",
      change: "+15.8%",
      trend: "up",
      icon: "DollarSign",
      color: "secondary",
      description: "Total revenue this month"
    },
    {
      id: 4,
      title: "Compliance Status",
      value: "98.5%",
      change: "+2.1%",
      trend: "up",
      icon: "Shield",
      color: "primary",
      description: "Tax compliance score"
    }
  ];

  // Mock chart data
  const revenueData = [
    { month: 'Jan', revenue: 65000, expenses: 45000, profit: 20000 },
    { month: 'Feb', revenue: 72000, expenses: 48000, profit: 24000 },
    { month: 'Mar', revenue: 68000, expenses: 52000, profit: 16000 },
    { month: 'Apr', revenue: 78000, expenses: 55000, profit: 23000 },
    { month: 'May', revenue: 85000, expenses: 58000, profit: 27000 },
    { month: 'Jun', revenue: 89450, expenses: 62000, profit: 27450 }
  ];

  const expenseData = [
    { category: 'Office Rent', amount: 15000, color: '#283593' },
    { category: 'Salaries', amount: 35000, color: '#2196F3' },
    { category: 'Software', amount: 8000, color: '#FF9800' },
    { category: 'Utilities', amount: 4000, color: '#4CAF50' },
    { category: 'Marketing', amount: 6000, color: '#FFC107' }
  ];

  const cashFlowData = [
    { date: '2024-01-01', inflow: 45000, outflow: 32000 },
    { date: '2024-01-08', inflow: 52000, outflow: 38000 },
    { date: '2024-01-15', inflow: 48000, outflow: 35000 },
    { date: '2024-01-22', inflow: 55000, outflow: 42000 },
    { date: '2024-01-29', inflow: 58000, outflow: 45000 }
  ];

  // Role-based content filtering
  const getRoleBasedKPIs = () => {
    switch (userRole) {
      case 'partner':
        return kpiData;
      case 'staff':
        return kpiData.slice(0, 3);
      case 'freelancer':
        return kpiData.filter(kpi => kpi.id !== 4);
      case 'client':
        return kpiData.slice(0, 2);
      default:
        return kpiData;
    }
  };

  return (
    <div className="p-6 mx-auto space-y-8 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {mockUser.name}. Here's your financial overview for today.
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {getRoleBasedKPIs().map((kpi) => (
          <KPICard key={kpi.id} data={kpi} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Revenue Trends */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly revenue, expenses, and profit overview</CardDescription>
            </div>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                  <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value: number) => `$${value}`} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="expenses" stroke="#f59e0b" strokeWidth={2} name="Expenses" />
                  <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="Profit" />
                </LineChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="amount"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number | undefined) => [`$${(value || 0).toLocaleString()}`, 'Amount']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Cash Flow Analysis</CardTitle>
            <CardDescription>Weekly cash inflow vs outflow trends</CardDescription>
          </div>
          <Select defaultValue="30days">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value: number) => `$${value}`} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="inflow" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Cash Inflow" />
                <Area type="monotone" dataKey="outflow" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} name="Cash Outflow" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Recent Activity */}
        <div className="xl:col-span-2">
          <RecentActivity userRole={userRole} />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">

          <PendingTasks userRole={userRole} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;