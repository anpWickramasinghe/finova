import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, PlayCircle, Settings, Users, Calculator } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

import PayrollStatsCards from './components/PayrollStatsCards';
import PayrollTable from './components/PayrollTable';
import PayrollDetailDrawer from './components/PayrollDetailDrawer';
import GeneratePayrollWizard from './components/GeneratePayrollWizard';
import CompensationConfigurator from './components/CompensationConfigurator';
import EmployeeSalaryMapping from './components/EmployeeSalaryMapping';
import { branchService } from '../../services/branchService';

const API_URL = import.meta.env.VITE_API_URL;
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function PayrollPage() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Data States
    const [records, setRecords] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Filters
    const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
    const [year, setYear] = useState<string>(String(new Date().getFullYear()));

    // UI States
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(null);

    const currentUser = { name: "Admin", email: "admin@finova.com", role: "Admin", avatar: "" };

    const loadRecords = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`${API_URL}/payroll?month=${month}&year=${year}`, { headers: getAuthHeader() });
            setRecords(res.data);
        } catch {
            toast.error('Failed to load records');
        } finally {
            setIsLoading(false);
        }
    }, [month, year]);

    const loadUsers = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/users`, { headers: getAuthHeader() });
            setEmployees(res.data || []);
        } catch {
            // ignore error for fetching users
        }
    }, []);

    const loadBranches = useCallback(async () => {
        try {
            const data = await branchService.getAllBranches();
            setBranches(data || []);
        } catch {
            // ignore error
        }
    }, []);

    useEffect(() => { loadRecords(); }, [loadRecords]);
    useEffect(() => { loadUsers(); }, [loadUsers]);
    useEffect(() => { loadBranches(); }, [loadBranches]);

    const augmentedRecords = records.map(record => {
        const employee = employees.find(e => e.id === record.userId);
        const branch = branches.find(b => String(b.id) === String(employee?.branchId));
        return {
            ...record,
            branchName: branch ? branch.name : 'Unassigned / HQ'
        };
    });

    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const years = [2024, 2025, 2026];

    return (
        <div className="min-h-screen bg-background">
            <Header user={currentUser} onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} sidebarCollapsed={sidebarCollapsed} />
            <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} userRole="admin" />

            <main className={`pt-header-height nav-transition ${sidebarCollapsed ? 'lg:pl-sidebar-collapsed' : 'lg:pl-sidebar-width'}`}>
                <div className="p-6 max-w-7xl mx-auto">

                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold font-heading text-text-primary mb-1">Payroll Management</h1>
                            <p className="text-text-secondary">Process monthly comp, configure rules, and manage ledger integrations.</p>
                        </div>
                        <div className="mt-4 md:mt-0 flex gap-3">
                            <Button className="bg-primary text-white" onClick={() => setIsWizardOpen(true)}>
                                <PlayCircle className="w-4 h-4 mr-2" /> Run Engine
                            </Button>
                        </div>
                    </div>

                    <Tabs defaultValue="processing" className="space-y-6">
                        <TabsList className="bg-surface border border-border p-1 w-full flex overflow-x-auto justify-start h-12">
                            <TabsTrigger value="processing" className="data-[state=active]:bg-background min-w-[150px]"><Calculator className="w-4 h-4 mr-2" /> Batch Processing</TabsTrigger>
                            <TabsTrigger value="employee_config" className="data-[state=active]:bg-background min-w-[150px]"><Users className="w-4 h-4 mr-2" /> Employee Rules</TabsTrigger>
                            <TabsTrigger value="global_config" className="data-[state=active]:bg-background min-w-[150px]"><Settings className="w-4 h-4 mr-2" /> Global Components</TabsTrigger>
                        </TabsList>

                        {/* TAB 1: Main Payroll Processing */}
                        <TabsContent value="processing" className="animate-fade-in space-y-6">
                            <PayrollStatsCards records={records} />

                            <div className="bg-surface p-4 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <span className="text-sm font-medium whitespace-nowrap">Filter Period:</span>
                                    <Select value={month} onValueChange={setMonth}>
                                        <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {months.map(m => (
                                                <SelectItem key={m} value={String(m)}>
                                                    {new Date(0, m - 1).toLocaleString('default', { month: 'short' })}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={year} onValueChange={setYear}>
                                        <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Button variant="ghost" size="icon" onClick={() => loadRecords()}>
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <PayrollTable
                                records={augmentedRecords}
                                isLoading={isLoading}
                                onViewDetails={(id) => setSelectedPayrollId(id)}
                            />
                        </TabsContent>

                        {/* TAB 2: Employee Mapping */}
                        <TabsContent value="employee_config" className="animate-fade-in">
                            <EmployeeSalaryMapping employees={employees} />
                        </TabsContent>

                        {/* TAB 3: Global Rules */}
                        <TabsContent value="global_config" className="animate-fade-in">
                            <CompensationConfigurator />
                        </TabsContent>
                    </Tabs>

                    <PayrollDetailDrawer
                        payrollId={selectedPayrollId}
                        open={!!selectedPayrollId}
                        onClose={() => setSelectedPayrollId(null)}
                        onStatusChange={loadRecords}
                    />

                    <GeneratePayrollWizard
                        open={isWizardOpen}
                        onOpenChange={setIsWizardOpen}
                        onSuccess={loadRecords}
                    />

                </div>
            </main>
        </div>
    );
}
