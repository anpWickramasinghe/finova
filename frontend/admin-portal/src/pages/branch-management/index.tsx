import { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Building2, Plus, FileText, Users, TrendingUp } from 'lucide-react';
import BranchTable from '../../components/branch-management/BranchTable';
import BranchDetailPanel from '../../components/branch-management/BranchDetailPanel';
import FilterToolbar from '../../components/branch-management/FilterToolbar';
import BulkActions from '../../components/branch-management/BulkActions';
import AddBranchModal from '../../components/branch-management/AddBranchModal';
import AuditLogModal from '../../components/branch-management/AuditLogModal';
import type { Branch } from './types';

const BranchManagement = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [selectedBranches, setSelectedBranches] = useState<(number | string)[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [showAddBranchModal, setShowAddBranchModal] = useState(false);
    const [showAuditLogModal, setShowAuditLogModal] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
    });

    // Mock branch data
    const [branches, setBranches] = useState<Branch[]>([
        {
            id: 1,
            name: "Headquarters",
            manager: "Sarah Johnson",
            contactNumber: "+1 (555) 123-4567",
            employeeCount: 150,
            revenue: 5000000,
            lastAudit: new Date('2024-03-01'),
            auditLog: [
                { action: 'Updated operational hours', timestamp: new Date('2024-03-10T10:15:00'), user: 'Admin' },
                { action: 'Added new department', timestamp: new Date('2024-02-15T09:30:00'), user: 'Manager' }
            ]
        },
        {
            id: 2,
            name: "London Branch",
            manager: "James Smith",
            contactNumber: "+44 20 7123 4567",
            employeeCount: 45,
            revenue: 2100000,
            lastAudit: new Date('2024-02-28'),
            auditLog: [
                { action: 'Staff reorganization', timestamp: new Date('2024-03-05T14:20:00'), user: 'Admin' }
            ]
        },
        {
            id: 3,
            name: "Tokyo Office",
            manager: "Kenji Tanaka",
            contactNumber: "+81 3 1234 5678",
            employeeCount: 30,
            revenue: 1800000,
            lastAudit: new Date('2024-03-05'),
            auditLog: []
        },
        {
            id: 4,
            name: "Singapore Hub",
            manager: "Wei Chen",
            contactNumber: "+65 6789 0123",
            employeeCount: 25,
            revenue: 1500000,
            lastAudit: new Date('2024-01-15'),
            auditLog: [
                { action: 'System maintenance', timestamp: new Date('2024-03-12T08:00:00'), user: 'IT Support' }
            ]
        }
    ]);

    const currentUser = {
        name: "Sarah Johnson",
        email: "sarah.johnson@company.com",
        role: "Admin",
        avatar: "https://randomuser.me/api/portraits/women/1.jpg"
    };

    // Filter branches based on current filters
    const filteredBranches = branches.filter(branch => {
        const matchesSearch = branch.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            branch.manager.toLowerCase().includes(filters.search.toLowerCase());

        return matchesSearch;
    });

    const handleBranchSelect = (branchId: number | string) => {
        setSelectedBranches(prev =>
            prev.includes(branchId)
                ? prev.filter(id => id !== branchId)
                : [...prev, branchId]
        );
    };

    const handleSelectAll = () => {
        if (selectedBranches.length === filteredBranches.length) {
            setSelectedBranches([]);
        } else {
            setSelectedBranches(filteredBranches.map(branch => branch.id));
        }
    };

    const handleBranchClick = (branch: Branch) => {
        setSelectedBranch(branch);
    };

    const handleAddBranch = (branchData: any) => {
        const newBranch: Branch = {
            id: branches.length + 1,
            ...branchData,
            employeeCount: 0,
            revenue: 0,
            lastAudit: new Date(),
            auditLog: []
        };
        setBranches(prev => [...prev, newBranch]);
        setShowAddBranchModal(false);
    };

    const handleUpdateBranch = (updatedBranch: Branch) => {
        setBranches(prev => prev.map(branch =>
            branch.id === updatedBranch.id ? updatedBranch : branch
        ));
        setSelectedBranch(updatedBranch);
    };

    const handleBulkAction = (action: string) => {
        console.log(`Performing ${action} on branches:`, selectedBranches);
        // Implement bulk actions here
        setSelectedBranches([]);
    };

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

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

            <main className={`pt-header-height nav-transition ${sidebarCollapsed ? 'lg:pl-sidebar-collapsed' : 'lg:pl-sidebar-width'
                }`}>
                <div className="p-6">
                    {/* Page Header */}
                    <div className="mb-8">
                        <div className="flex flex-col mb-6 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h1 className="mb-2 text-3xl font-bold font-heading text-text-primary">Branch Management</h1>
                                <p className="text-text-secondary">Manage your organization's branches and locations</p>
                            </div>

                            <div className="flex flex-col gap-3 mt-4 sm:flex-row lg:mt-0">
                                <button
                                    onClick={() => setShowAuditLogModal(true)}
                                    className="flex items-center px-4 py-2 space-x-2 border rounded-lg bg-surface border-border text-text-primary hover:bg-background nav-transition"
                                >
                                    <FileText size={16} className="text-text-primary" />
                                    <span>Audit Log</span>
                                </button>

                                <button
                                    onClick={() => setShowAddBranchModal(true)}
                                    className="flex items-center px-6 py-2 space-x-2 text-white rounded-lg bg-primary hover:bg-primary-700 nav-transition"
                                >
                                    <Plus size={16} className="text-white" />
                                    <span>Add Branch</span>
                                </button>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
                            <div className="p-4 border rounded-lg bg-surface border-border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-text-secondary">Total Branches</p>
                                        <p className="text-2xl font-bold text-text-primary">{branches.length}</p>
                                    </div>
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100">
                                        <Building2 size={20} className="text-primary" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border rounded-lg bg-surface border-border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-text-secondary">Total Employees</p>
                                        <p className="text-2xl font-bold text-accent">
                                            {branches.reduce((acc, curr) => acc + curr.employeeCount, 0)}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent-100">
                                        <Users size={20} className="text-accent" />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border rounded-lg bg-surface border-border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-text-secondary">Total Revenue</p>
                                        <p className="text-2xl font-bold text-secondary">
                                            ${(branches.reduce((acc, curr) => acc + curr.revenue, 0) / 1000000).toFixed(1)}M
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary-100">
                                        <TrendingUp size={20} className="text-secondary" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filter Toolbar */}
                    <FilterToolbar
                        filters={filters}
                        onFiltersChange={setFilters}
                        branchCount={filteredBranches.length}
                    />

                    {/* Bulk Actions */}
                    {selectedBranches.length > 0 && (
                        <BulkActions
                            selectedCount={selectedBranches.length}
                            onBulkAction={handleBulkAction}
                            onClearSelection={() => setSelectedBranches([])}
                        />
                    )}

                    {/* Main Content */}
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                        {/* Branch Table */}
                        <div className="xl:col-span-2">
                            <BranchTable
                                branches={filteredBranches}
                                selectedBranches={selectedBranches}
                                onBranchSelect={handleBranchSelect}
                                onSelectAll={handleSelectAll}
                                onBranchClick={handleBranchClick}
                                selectedBranch={selectedBranch}
                            />
                        </div>

                        {/* Branch Detail Panel */}
                        <div className="xl:col-span-1">
                            <BranchDetailPanel
                                branch={selectedBranch}
                                onUpdateBranch={handleUpdateBranch}
                            />
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals */}
            {showAddBranchModal && (
                <AddBranchModal
                    isOpen={showAddBranchModal}
                    onClose={() => setShowAddBranchModal(false)}
                    onAddBranch={handleAddBranch}
                />
            )}

            {showAuditLogModal && (
                <AuditLogModal
                    onClose={() => setShowAuditLogModal(false)}
                    branches={branches}
                />
            )}
        </div>
    );
};

export default BranchManagement;