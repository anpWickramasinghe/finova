import { useState, useEffect, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, FileText, Users, Calendar, Clock, CheckSquare } from 'lucide-react';
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
import { branchService } from '@/services/branchService';

const API_URL = import.meta.env.VITE_API_URL;
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const STATUS_PIE_COLORS: Record<string, string> = {
    'Approved': '#10b981',     // Emerald-500
    'Pending': '#f59e0b', // Amber-500
    'Rejected': '#ef4444',  // Red-500
    'Draft': '#64748b'     // Slate-500
};
const DEFAULT_COLOR = '#94a3b8'; // Slate-400

export default function HrReports() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [records, setRecords] = useState<any[]>([]);
    
    const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
    const [year, setYear] = useState<string>(String(new Date().getFullYear()));
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [selectedBranch, setSelectedBranch] = useState("All");
    const [branches, setBranches] = useState<any[]>([]);

    const currentUser = {
        name: 'Admin',
        email: 'admin@finova.com',
        role: 'Admin',
        avatar: ''
    };

    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const data = await branchService.getAllBranches();
                setBranches(data);
            } catch (error) {
                console.error("Failed to load branches", error);
            }
        };
        fetchBranches();
    }, []);

    const loadRecords = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_URL}/hr-reports?month=${month}&year=${year}${selectedBranch !== 'All' ? `&branchId=${selectedBranch}` : ''}`, { headers: getAuthHeader() });
            setRecords(res.data);
        } catch {
            // Since end point might not be ready, let's catch the error without aggressive spamming,
            // optionally load dummy data so that page looks functional.
            toast.error("HR Endpoint not available. Showing dummy data for observation.");
            setRecords([
                { id: 1, userId: "EMP001", userName: "John Doe", month, year, branchId: 1, branchName: "Colombo", totalWorkingDays: 22, presentDays: 20, leavesTaken: 2, status: "Approved" },
                { id: 2, userId: "EMP002", userName: "Jane Smith", month, year, branchId: 1, branchName: "Colombo", totalWorkingDays: 22, presentDays: 22, leavesTaken: 0, status: "Approved" },
                { id: 3, userId: "EMP003", userName: "Bob Brown", month, year, branchId: 2, branchName: "Kandy", totalWorkingDays: 22, presentDays: 18, leavesTaken: 4, status: "Pending" },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, [month, year, selectedBranch]);

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
        if (selectedBranch !== 'All') {
            result = result.filter(record => String(record.branchId) === selectedBranch);
        }
        return result;
    }, [records, searchQuery, statusFilter, selectedBranch]);

    // KPI Metrics
    const totalEmployees = filteredRecords.length;
    const totalLeavesTaken = filteredRecords.reduce((sum, record) => sum + (record.leavesTaken || 0), 0);
    const totalPresentDays = filteredRecords.reduce((sum, record) => sum + (record.presentDays || 0), 0);
    const totalWorkingDays = filteredRecords.reduce((sum, record) => sum + (record.totalWorkingDays || 0), 0);
    const avgAttendanceRate = totalWorkingDays ? ((totalPresentDays / totalWorkingDays) * 100).toFixed(1) : 0;
    const pendingRequests = filteredRecords.filter(r => r.status === 'Pending').length;

    // Chart Data Preparation
    const barChartData = [
        {
            name: 'Attendance Overview',
            Present: totalPresentDays,
            Leaves: totalLeavesTaken
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
        const headers = ["Employee ID / Name", "Branch", "Period", "Working Days", "Present Days", "Leaves Taken", "Status"];
        const csvRows = [headers.join(",")];

        for (const record of filteredRecords) {
            const row = [
                `"${record.userName || record.userId}"`,
                `"${record.branchName || ''}"`,
                `"${record.month}/${record.year}"`,
                record.totalWorkingDays,
                record.presentDays,
                record.leavesTaken,
                record.status
            ];
            csvRows.push(row.join(","));
        }

        const csvString = csvRows.join("\n");
        const blob = new Blob([csvString], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `HR_Report_${month}_${year}.csv`;
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
                            <h1 className="mb-1 text-3xl font-bold font-heading text-text-primary">HR Reports</h1>
                            <p className="text-text-secondary">Generate and view attendance and leave logs.</p>
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
                            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                                <SelectTrigger className="w-full sm:w-[150px]">
                                    <SelectValue placeholder="Branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Branches</SelectItem>
                                    {branches.map(b => (
                                        <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-[150px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Statuses</SelectItem>
                                    <SelectItem value="Draft">Draft</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Approved">Approved</SelectItem>
                                    <SelectItem value="Rejected">Rejected</SelectItem>
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
                                    <p className="text-sm font-medium text-text-secondary">Total Employees</p>
                                    <Users className="w-5 h-5 text-blue-500" />
                                </div>
                                <p className="mt-2 text-3xl font-semibold text-primary-900">{totalEmployees}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-white border-none shadow-sm ring-1 ring-primary/5">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-text-secondary">Avg Attendance</p>
                                    <CheckSquare className="w-5 h-5 text-green-500" />
                                </div>
                                <p className="mt-2 text-3xl font-semibold text-green-600">{avgAttendanceRate}%</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-white border-none shadow-sm ring-1 ring-primary/5">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-text-secondary">Total Leaves Taken</p>
                                    <Calendar className="w-5 h-5 text-red-500" />
                                </div>
                                <p className="mt-2 text-3xl font-semibold text-red-500">{totalLeavesTaken}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-white border-none shadow-sm ring-1 ring-primary/5">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-text-secondary">Pending Requests</p>
                                    <Clock className="w-5 h-5 text-amber-500" />
                                </div>
                                <p className="mt-2 text-3xl font-semibold text-amber-500">{pendingRequests}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div className="p-6 border bg-surface rounded-xl border-border">
                            <h3 className="mb-6 text-lg font-semibold text-primary-900">Attendance vs Leave Summary</h3>
                            <div className="h-80 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <RechartsTooltip />
                                        <Legend />
                                        <Bar dataKey="Present" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={50} />
                                        <Bar dataKey="Leaves" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="p-6 border bg-surface rounded-xl border-border">
                            <h3 className="mb-6 text-lg font-semibold text-primary-900">Leave Status Breakdown</h3>
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
                                <h3 className="font-semibold text-text-primary">Attendance & Leave Datatable</h3>
                            </div>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead>Period</TableHead>
                                    <TableHead className="text-right">Working Days</TableHead>
                                    <TableHead className="text-right">Present</TableHead>
                                    <TableHead className="text-right">Leaves</TableHead>
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
                                        <TableCell colSpan={6} className="h-24 text-center text-text-secondary">No HR records found.</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRecords.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell className="font-medium text-text-primary">{record.userName || record.userId}</TableCell>
                                            <TableCell className="text-text-secondary">{record.branchName || 'N/A'}</TableCell>
                                            <TableCell>{record.month}/{record.year}</TableCell>
                                            <TableCell className="text-right font-medium">{record.totalWorkingDays}</TableCell>
                                            <TableCell className="text-right text-green-600 font-medium">{record.presentDays}</TableCell>
                                            <TableCell className="text-right text-red-500 font-medium">{record.leavesTaken}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${record.status === 'Draft' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                                    record.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                        record.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                                'bg-red-50 text-red-700 border-red-200'
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
