/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, FileText, Users, TrendingUp, TrendingDown, Banknote } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL;
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const STATUS_PIE_COLORS: Record<string, string> = {
    'Approved': 'hsl(var(--primary))',
    'Paid': 'hsl(var(--chart-2))',
    'Pending Approval': 'hsl(var(--chart-4))',
    'Draft': 'hsl(var(--muted-foreground))',
    'Rejected': 'hsl(var(--destructive))'
};
const DEFAULT_COLOR = 'hsl(var(--muted-foreground))';

export default function PayrollReports() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [records, setRecords] = useState<any[]>([]);
    
    const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
    const [year, setYear] = useState<string>(String(new Date().getFullYear()));
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    const currentUser = {
        name: 'Admin',
        email: 'admin@finova.com',
        role: 'Admin',
        avatar: ''
    };

    const loadRecords = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_URL}/payroll?month=${month}&year=${year}`, { headers: getAuthHeader() });
            setRecords(res.data);
        } catch {
            toast.error("Failed to load records");
        } finally {
            setIsLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        loadRecords();
    }, [loadRecords]);

    const filteredRecords = useMemo(() => {
        let result = records;
        if (searchQuery) {
            result = result.filter(record => 
                String(record.userName || record.userId).toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        if (statusFilter !== 'All') {
            result = result.filter(record => record.status === statusFilter);
        }
        return result;
    }, [records, searchQuery, statusFilter]);

    // KPI Metrics
    const totalEarnings = filteredRecords.reduce((sum, record) => sum + parseFloat(record.totalEarnings || 0), 0);
    const totalDeductions = filteredRecords.reduce((sum, record) => sum + parseFloat(record.totalDeductions || 0), 0);
    const netPayable = filteredRecords.reduce((sum, record) => sum + parseFloat(record.netSalary || 0), 0);
    const totalEmployees = filteredRecords.length;

    // Chart Data Preparation
    const barChartData = [
        {
            name: 'Total Overview',
            Earnings: totalEarnings,
            Deductions: totalDeductions,
            Net: netPayable
        }
    ];

    const statusGroups = filteredRecords.reduce((acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const statusData = Object.entries(statusGroups).map(([name, value]) => ({ name, value }));

    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const years = [2024, 2025, 2026];

    const handleExportCSV = () => {
        if (!records.length) return;
        const headers = ["Employee ID / Name", "Period", "Total Earnings", "Total Deductions", "Net Salary", "Status"];
        const csvRows = [headers.join(",")];

        for (const record of filteredRecords) {
            const row = [
                `"${record.userName || record.userId}"`,
                `"${record.month}/${record.year}"`,
                record.totalEarnings,
                record.totalDeductions,
                record.netSalary,
                record.status
            ];
            csvRows.push(row.join(","));
        }

        const csvString = csvRows.join("\n");
        const blob = new Blob([csvString], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Payroll_Report_${month}_${year}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-background">
            <Header
                user={currentUser}
                onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                sidebarCollapsed={sidebarCollapsed}
            />
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                userRole="admin"
            />

            <main className={`pt-header-height nav-transition ${sidebarCollapsed ? 'lg:pl-sidebar-collapsed' : 'lg:pl-sidebar-width'}`}>
                <div className="p-6 mx-auto max-w-7xl animate-fade-in space-y-6">
                    <div className="flex flex-col justify-between mb-8 md:flex-row md:items-center">
                        <div>
                            <h1 className="mb-1 text-3xl font-bold font-heading text-foreground">Payroll Reports</h1>
                            <p className="text-muted-foreground">Generate and view payroll summaries and exports.</p>
                        </div>
                        <div className="flex gap-3 mt-4 md:mt-0">
                            <Button variant="outline" onClick={handleExportCSV} className="bg-white border-primary text-primary hover:bg-primary/5">
                                <Download className="w-4 h-4 mr-2" /> Export CSV
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between gap-4 p-4 border bg-surface rounded-xl border-border sm:flex-row sm:items-center">
                        <div className="flex items-center w-full gap-3 sm:w-auto">
                            <span className="text-sm font-medium whitespace-nowrap">Report Period:</span>
                            <Select value={month} onValueChange={setMonth}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map(m => (
                                        <SelectItem key={m} value={String(m)}>
                                            {new Date(0, m - 1).toLocaleString('default', { month: 'short' })}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={year} onValueChange={setYear}>
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map(y => (
                                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" onClick={() => loadRecords()}>
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[150px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Statuses</SelectItem>
                                    <SelectItem value="Draft">Draft</SelectItem>
                                    <SelectItem value="Pending Approval">Pending Approval</SelectItem>
                                    <SelectItem value="Approved">Approved</SelectItem>
                                    <SelectItem value="Paid">Paid</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                placeholder="Search Employee..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-[250px]"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                        <Card className="bg-white border-none shadow-sm ring-1 ring-primary/5">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                                    <Users className="w-5 h-5 text-primary" />
                                </div>
                                <p className="mt-2 text-2xl font-semibold text-primary">{totalEmployees}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-white border-none shadow-sm ring-1 ring-primary/5">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                                    <TrendingUp className="w-5 h-5 text-chart-2" />
                                </div>
                                <p className="mt-2 text-2xl font-semibold text-chart-2">LKR {totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-white border-none shadow-sm ring-1 ring-primary/5">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-muted-foreground">Total Deductions</p>
                                    <TrendingDown className="w-5 h-5 text-destructive" />
                                </div>
                                <p className="mt-2 text-2xl font-semibold text-destructive">LKR {totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-white border-none shadow-sm ring-1 ring-primary/5">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-muted-foreground">Net Payable</p>
                                    <Banknote className="w-5 h-5 text-primary" />
                                </div>
                                <p className="mt-2 text-2xl font-semibold text-primary">LKR {netPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div className="p-6 border bg-surface rounded-xl border-border">
                            <h3 className="mb-6 text-lg font-semibold text-primary-900">Earnings vs Deductions Summary</h3>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis tickFormatter={(val) => `LKR ${val.toLocaleString()}`} />
                                        <RechartsTooltip formatter={(value: any) => `LKR ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
                                        <Legend />
                                        <Bar dataKey="Earnings" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} barSize={50} />
                                        <Bar dataKey="Deductions" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} barSize={50} />
                                        <Bar dataKey="Net" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="p-6 border bg-surface rounded-xl border-border">
                            <h3 className="mb-6 text-lg font-semibold text-primary-900">Status Breakdown</h3>
                            <div className="h-80 w-full flex items-center justify-center">
                                {statusData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={statusData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                paddingAngle={5}
                                                dataKey="value"
                                                label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {statusData.map((entry) => (
                                                    <Cell key={`cell-${entry.name}`} fill={STATUS_PIE_COLORS[entry.name] || DEFAULT_COLOR} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-text-secondary">No data available for chart.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="border bg-surface rounded-xl border-border overflow-hidden">
                        <div className="p-4 border-b border-border bg-background/50 flex justify-between items-center">
                            <div className="flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-primary" />
                                <h3 className="font-semibold text-foreground">Payroll Datatable</h3>
                            </div>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Period</TableHead>
                                    <TableHead className="text-right">Earnings</TableHead>
                                    <TableHead className="text-right">Deductions</TableHead>
                                    <TableHead className="text-right">Net Payable</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
                                    </TableRow>
                                ) : filteredRecords.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No payroll records found.</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRecords.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell className="font-medium text-foreground">{record.userName || record.userId}</TableCell>
                                            <TableCell>{record.month}/{record.year}</TableCell>
                                            <TableCell className="text-right text-chart-2 font-medium">+{parseFloat(record.totalEarnings || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                                            <TableCell className="text-right text-destructive font-medium">-{parseFloat(record.totalDeductions || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                                            <TableCell className="text-right font-bold text-primary">LKR {parseFloat(record.netSalary || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${record.status === 'Draft' ? 'bg-muted text-muted-foreground border-border' :
                                                    record.status === 'Pending Approval' ? 'bg-chart-4/10 text-chart-4 border-chart-4/20' :
                                                        record.status === 'Approved' ? 'bg-primary/10 text-primary border-primary/20' :
                                                            record.status === 'Paid' ? 'bg-chart-2/10 text-chart-2 border-chart-2/20' :
                                                                'bg-destructive/10 text-destructive border-destructive/20'
                                                    }`}>
                                                    {record.status}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                </div>
            </main>
        </div>
    );
}
