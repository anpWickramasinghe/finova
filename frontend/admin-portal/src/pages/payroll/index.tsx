import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Banknote, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { getPayrollRecords, generatePayroll } from '../../services/payrollService';
import { getUsers } from '../../services/userService';

const PayrollPage = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [records, setRecords] = useState<any[]>([]);
    const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
    const [year, setYear] = useState<string>(String(new Date().getFullYear()));

    const [users, setUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [generateMonth, setGenerateMonth] = useState<string>(String(new Date().getMonth() + 1));
    const [generateYear, setGenerateYear] = useState<string>(String(new Date().getFullYear()));
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);

    const currentUser = {
        name: "Admin",
        email: "admin@finova.com",
        role: "Admin",
        avatar: "" // Placeholder
    };

    const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);

    useEffect(() => {
        fetchRecords();
        fetchUsers();
    }, [month, year]);

    const fetchRecords = async () => {
        try {
            setIsLoading(true);
            const data = await getPayrollRecords(month, year);
            setRecords(data);
        } catch (error) {
            console.error("Failed to fetch payroll records", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        }
    };

    const handleGenerate = async () => {
        if (!selectedUser || !generateMonth || !generateYear) return;
        try {
            setIsGenerating(true);
            await generatePayroll(selectedUser, generateMonth, generateYear);
            setIsGenerateDialogOpen(false);
            fetchRecords(); // Refresh list
            alert("Payroll generated successfully!");
        } catch (error: any) {
            console.error("Failed to generate payroll", error);
            alert(`Error: ${error.message || 'Unknown error'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const years = [2024, 2025, 2026];

    return (
        <div className="min-h-screen bg-background">
            <Header
                user={currentUser}
                onMenuToggle={toggleSidebar}
                sidebarCollapsed={sidebarCollapsed}
            />

            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={toggleSidebar}
                userRole="partner"
            />

            <main className={`pt-header-height nav-transition ${sidebarCollapsed ? 'lg:pl-sidebar-collapsed' : 'lg:pl-sidebar-width'}`}>
                <div className="p-6">
                    <div className="flex flex-col mb-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="mb-2 text-3xl font-bold font-heading text-text-primary">Payroll Management</h1>
                            <p className="text-text-secondary">Manage and generate employee payroll records.</p>
                        </div>
                        <div className="mt-4 lg:mt-0">
                            <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="bg-primary text-white hover:bg-primary-700">
                                        <Banknote className="mr-2 h-4 w-4" />
                                        Generate Payroll
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Generate Payroll</DialogTitle>
                                        <DialogDescription>
                                            Select an employee and period to generate payroll.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="user" className="text-right">
                                                Employee
                                            </Label>
                                            <Select onValueChange={setSelectedUser} value={selectedUser}>
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue placeholder="Select Employee" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {users.map(u => (
                                                        <SelectItem key={u.id} value={u.id}>
                                                            {u.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="month" className="text-right">
                                                Month
                                            </Label>
                                            <Select onValueChange={setGenerateMonth} value={String(generateMonth)}>
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue placeholder="Select Month" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {months.map(m => (
                                                        <SelectItem key={m} value={String(m)}>
                                                            {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="year" className="text-right">
                                                Year
                                            </Label>
                                            <Select onValueChange={setGenerateYear} value={String(generateYear)}>
                                                <SelectTrigger className="col-span-3">
                                                    <SelectValue placeholder="Select Year" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {years.map(y => (
                                                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>Cancel</Button>
                                        <Button onClick={handleGenerate} disabled={isGenerating}>
                                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            Generate
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    <div className="mb-6 bg-surface p-4 rounded-lg border border-border flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Filter by Period:</span>
                            <Select onValueChange={setMonth} value={month}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map(m => (
                                        <SelectItem key={m} value={String(m)}>
                                            {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select onValueChange={setYear} value={year}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map(y => (
                                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" onClick={() => fetchRecords()}>
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-md border bg-surface">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Month/Year</TableHead>
                                    <TableHead>Work Hours</TableHead>
                                    <TableHead>Overtime</TableHead>
                                    <TableHead>Base Salary</TableHead>
                                    <TableHead>Total Pay</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : records.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            No payroll records found for this period.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    records.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell className="font-medium">{record.userName}</TableCell>
                                            <TableCell>{record.month}/{record.year}</TableCell>
                                            <TableCell>{record.totalWorkHours} hrs</TableCell>
                                            <TableCell>{record.totalOvertimeHours} hrs</TableCell>
                                            <TableCell>LKR {parseFloat(record.baseSalary).toFixed(2)}</TableCell>
                                            <TableCell className="font-bold">LKR {parseFloat(record.totalSalary).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.status === 'Paid' ? 'bg-green-100 text-green-800' :
                                                    record.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
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
};

export default PayrollPage;
