import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { branchService, type Employee } from '@/services/branchService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    Loader2,
    Users,
    UserCheck,
    UserX,
    Search,
    Building2,
    Mail,
    Phone,
    Briefcase,
    MapPin,
    CreditCard,
    Hash,
} from 'lucide-react';

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

const STATUS_STYLES: Record<string, string> = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Inactive: 'bg-slate-100 text-slate-600 border-slate-200',
    Suspended: 'bg-red-50 text-red-700 border-red-200',
};

interface StatCardProps {
    label: string;
    value: number;
    icon: React.ReactNode;
    iconBg: string;
    valueColor?: string;
}

const StatCard = ({ label, value, icon, iconBg, valueColor }: StatCardProps) => (
    <Card>
        <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-2.5 rounded-xl shrink-0 ${iconBg}`}>{icon}</div>
            <div>
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <p className={`text-2xl font-bold leading-tight ${valueColor ?? ''}`}>{value}</p>
            </div>
        </CardContent>
    </Card>
);

const EmployeeAvatar = ({ employee, size = 'sm' }: { employee: Employee; size?: 'sm' | 'lg' }) => {
    const dim = size === 'lg' ? 'w-16 h-16 text-xl' : 'w-8 h-8 text-xs';
    if (employee.avatar) {
        return (
            <img
                src={employee.avatar}
                alt={employee.name}
                className={`${dim} rounded-full object-cover`}
            />
        );
    }
    return (
        <div className={`${dim} rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary`}>
            {getInitials(employee.name)}
        </div>
    );
};

interface DetailRowProps {
    icon: React.ReactNode;
    label: string;
    value: string | null | undefined;
}

const DetailRow = ({ icon, label, value }: DetailRowProps) => (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
        <div className="mt-0.5 text-muted-foreground shrink-0">{icon}</div>
        <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>
            <p className="text-sm font-medium break-all">{value ?? <span className="text-muted-foreground italic">—</span>}</p>
        </div>
    </div>
);

const UserManagement = () => {
    const { user } = useAuth();
    const branchId = user?._id ?? null;

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    useEffect(() => {
        if (!branchId) return;
        setLoading(true);
        branchService
            .getBranchEmployees(branchId)
            .then((data) => {
                setEmployees(data);
                setError('');
            })
            .catch(() => setError('Failed to load employees. Please try again.'))
            .finally(() => setLoading(false));
    }, [branchId]);

    const activeCount = employees.filter((e) => e.status === 'Active').length;
    const inactiveCount = employees.filter((e) => e.status !== 'Active').length;

    const filtered = employees.filter((e) => {
        const q = search.toLowerCase();
        const matchesSearch =
            e.name.toLowerCase().includes(q) ||
            e.email.toLowerCase().includes(q) ||
            (e.designation ?? '').toLowerCase().includes(q) ||
            (e.role ?? '').toLowerCase().includes(q);
        const matchesStatus =
            statusFilter === 'all' ? true : e.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="text-sm">Loading employees…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background font-sans text-foreground">
            <div className="p-6 space-y-7 max-w-[1400px]">

                <div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                        <Building2 className="h-4 w-4" />
                        <span>Manager Portal</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Team members assigned to your branch
                    </p>
                </div>

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard
                        label="Total Employees"
                        value={employees.length}
                        icon={<Users className="h-5 w-5 text-blue-600" />}
                        iconBg="bg-blue-100 dark:bg-blue-900/30"
                    />
                    <StatCard
                        label="Active"
                        value={activeCount}
                        icon={<UserCheck className="h-5 w-5 text-emerald-600" />}
                        iconBg="bg-emerald-100 dark:bg-emerald-900/30"
                        valueColor="text-emerald-700 dark:text-emerald-400"
                    />
                    <StatCard
                        label="Inactive"
                        value={inactiveCount}
                        icon={<UserX className="h-5 w-5 text-slate-500" />}
                        iconBg="bg-slate-100 dark:bg-slate-800"
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, role…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex gap-2">
                        {(['all', 'Active', 'Inactive'] as const).map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${statusFilter === s
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background border-border text-muted-foreground hover:bg-muted'
                                    }`}
                            >
                                {s === 'all' ? 'All' : s}
                            </button>
                        ))}
                    </div>
                </div>

                <Card>
                    <CardContent className="p-0">
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                                <Users className="h-10 w-10 opacity-25" />
                                <p className="text-sm">
                                    {employees.length === 0
                                        ? 'No employees assigned to this branch yet.'
                                        : 'No employees match your search.'}
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/20">
                                        <TableHead className="pl-5 text-xs">Employee</TableHead>
                                        <TableHead className="text-xs">
                                            <span className="flex items-center gap-1">
                                                <Mail className="h-3 w-3" /> Email
                                            </span>
                                        </TableHead>
                                        <TableHead className="text-xs">
                                            <span className="flex items-center gap-1">
                                                <Briefcase className="h-3 w-3" /> Role / Designation
                                            </span>
                                        </TableHead>
                                        <TableHead className="text-xs">
                                            <span className="flex items-center gap-1">
                                                <Phone className="h-3 w-3" /> Phone
                                            </span>
                                        </TableHead>
                                        <TableHead className="text-xs pr-5">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((emp) => (
                                        <TableRow
                                            key={emp.id}
                                            className="hover:bg-muted/30 transition-colors cursor-pointer"
                                            onClick={() => setSelectedEmployee(emp)}
                                        >
                                            <TableCell className="pl-5">
                                                <div className="flex items-center gap-3">
                                                    <EmployeeAvatar employee={emp} />
                                                    <div>
                                                        <p className="text-sm font-medium leading-tight">
                                                            {emp.name}
                                                        </p>
                                                        {emp.nic && (
                                                            <p className="text-xs text-muted-foreground">
                                                                NIC: {emp.nic}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-sm text-muted-foreground">
                                                {emp.email}
                                            </TableCell>

                                            <TableCell>
                                                <div className="flex flex-col">
                                                    {emp.role && (
                                                        <span className="text-sm font-medium capitalize">
                                                            {emp.role}
                                                        </span>
                                                    )}
                                                    {emp.designation && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {emp.designation}
                                                        </span>
                                                    )}
                                                    {!emp.role && !emp.designation && (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell className="text-sm text-muted-foreground">
                                                {emp.phone ?? '—'}
                                            </TableCell>

                                            <TableCell className="pr-5">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs ${STATUS_STYLES[emp.status] ?? STATUS_STYLES['Inactive']
                                                        }`}
                                                >
                                                    {emp.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                        {filtered.length > 0 && (
                            <div className="px-5 py-3 border-t text-xs text-muted-foreground">
                                Showing {filtered.length} of {employees.length} employee
                                {employees.length !== 1 ? 's' : ''}
                                {' '}· Click a row to view details
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>

            {/* ── Employee Detail Sheet ── */}
            <Sheet open={!!selectedEmployee} onOpenChange={(open) => { if (!open) setSelectedEmployee(null); }}>
                <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                    {selectedEmployee && (
                        <>
                            <SheetHeader className="pb-4 border-b">
                                <div className="flex items-center gap-4">
                                    <EmployeeAvatar employee={selectedEmployee} size="lg" />
                                    <div>
                                        <SheetTitle className="text-xl leading-tight">
                                            {selectedEmployee.name}
                                        </SheetTitle>
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                            {selectedEmployee.designation ?? selectedEmployee.role ?? 'Employee'}
                                        </p>
                                        <Badge
                                            variant="outline"
                                            className={`mt-1.5 text-xs ${STATUS_STYLES[selectedEmployee.status] ?? STATUS_STYLES['Inactive']}`}
                                        >
                                            {selectedEmployee.status}
                                        </Badge>
                                    </div>
                                </div>
                            </SheetHeader>

                            <div className="mt-4 space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                    Contact Information
                                </p>
                                <DetailRow
                                    icon={<Mail className="h-4 w-4" />}
                                    label="Email"
                                    value={selectedEmployee.email}
                                />
                                <DetailRow
                                    icon={<Phone className="h-4 w-4" />}
                                    label="Phone"
                                    value={selectedEmployee.phone}
                                />
                                <DetailRow
                                    icon={<MapPin className="h-4 w-4" />}
                                    label="Address"
                                    value={selectedEmployee.address}
                                />
                            </div>

                            <div className="mt-6 space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                    Work Details
                                </p>
                                <DetailRow
                                    icon={<Briefcase className="h-4 w-4" />}
                                    label="Role"
                                    value={selectedEmployee.role}
                                />
                                <DetailRow
                                    icon={<Briefcase className="h-4 w-4" />}
                                    label="Designation"
                                    value={selectedEmployee.designation}
                                />
                                <DetailRow
                                    icon={<Hash className="h-4 w-4" />}
                                    label="Branch ID"
                                    value={selectedEmployee.branchId}
                                />
                                <DetailRow
                                    icon={<Hash className="h-4 w-4" />}
                                    label="Employee ID"
                                    value={selectedEmployee.id}
                                />
                            </div>

                            <div className="mt-6 space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                    Identity
                                </p>
                                <DetailRow
                                    icon={<CreditCard className="h-4 w-4" />}
                                    label="NIC"
                                    value={selectedEmployee.nic}
                                />
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default UserManagement;