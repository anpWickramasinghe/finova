import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { FileText, UserPlus, Users, UserCheck, Crown, Wifi, Loader2 } from 'lucide-react';
import UserTable from '../../components/user-management/UserTable';
import UserDetailPanel from '../../components/user-management/UserDetailPanel';
import FilterToolbar from '../../components/user-management/FilterToolbar';
import BulkActions from '../../components/user-management/BulkActions';
import AddUserModal from '../../components/user-management/AddUserModal';
import AuditLogModal from '../../components/user-management/AuditLogModal';
import type { User } from './types';
import { branchService } from '../../services/branchService';
import { getUsers, updateUser, deleteUser } from '../../services/userService';

const UserManagement = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<(number | string)[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAuditLogModal, setShowAuditLogModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    permission: 'all',
    branch: 'all',
    status: 'all'
  });

  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBranches();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await getUsers();
      // Transform data if necessary to match User type
      const formattedUsers = data.map((user: any) => ({
        ...user,
        // Ensure dates are Date objects
        lastActivity: user.updatedAt ? new Date(user.updatedAt) : new Date(),
        joinDate: user.createdAt ? new Date(user.createdAt) : new Date(),
        // Ensure arrays exist
        loginHistory: [],
        activityLog: [],
        permissions: user.permissions ? JSON.parse(user.permissions) : []
      }));
      setUsers(formattedUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const data = await branchService.getAllBranches();
      setBranches(data);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };

  // Mock user data
  const [users, setUsers] = useState<User[]>([]);

  const currentUser = {
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    role: "Admin",
    avatar: "https://randomuser.me/api/portraits/women/1.jpg"
  };

  // Filter users based on current filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase());
    const matchesRole = filters.role === 'all' || user.role === filters.role;
    const matchesStatus = filters.status === 'all' || user.status === filters.status;
    const matchesBranch = filters.branch === 'all' || String(user.branchId) === filters.branch;

    return matchesSearch && matchesRole && matchesStatus && matchesBranch;
  });

  const handleUserSelect = (userId: number | string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
  };

  const handleAddUser = (userData: User | Partial<User>) => {
    // If it's a full user object (from backend), use it directly
    if ('id' in userData) {
      const newUser: User = {
        ...userData as any,
        // Ensure dates are Date objects
        lastActivity: userData.lastActivity ? new Date(userData.lastActivity) : new Date(),
        joinDate: userData.joinDate ? new Date(userData.joinDate) : new Date(),
        // Ensure arrays exist
        loginHistory: userData.loginHistory || [],
        activityLog: userData.activityLog || [],
        // Ensure other required fields have defaults if missing
        status: userData.status || 'Active',
        role: userData.role || 'Labour',
        permissions: userData.permissions || []
      };
      setUsers(prev => [...prev, newUser]);
    } else {
      // Fallback for mock/partial data (shouldn't happen with real API)
      const newUser: User = {
        id: users.length + 1,
        name: userData.name || '',
        email: userData.email || '',
        role: userData.role || 'Labour',
        permissions: userData.permissions || [],
        status: userData.status || 'Active',
        lastActivity: new Date(),
        avatar: (userData as any).avatar || `https://randomuser.me/api/portraits/${(userData as any).gender || 'men'}/${users.length + 1}.jpg`,
        phone: userData.phone || '',
        branchId: userData.branchId || '',
        nic: userData.nic || '',
        address: userData.address || '',
        epfNo: userData.epfNo || '',
        joinDate: new Date(),
        loginHistory: [],
        activityLog: []
      };
      setUsers(prev => [...prev, newUser]);
    }
    setShowAddUserModal(false);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      // Call backend API
      const result = await updateUser(updatedUser);

      // Transform result to match User type
      const formattedResult = {
        ...result,
        permissions: typeof result.permissions === 'string' ? JSON.parse(result.permissions) : result.permissions,
        lastActivity: result.updatedAt ? new Date(result.updatedAt) : new Date(),
        joinDate: result.createdAt ? new Date(result.createdAt) : new Date(),
      };

      // Update local state
      setUsers(prev => prev.map(user =>
        user.id === updatedUser.id ? { ...user, ...formattedResult } : user
      ));
      setSelectedUser({ ...updatedUser, ...formattedResult });
    } catch (error) {
      console.error('Failed to update user:', error);
      // Optionally show error toast/notification here
    }
  };

  const handleDeleteUser = async (userId: number | string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        setUsers(prev => prev.filter(user => user.id !== userId));
        if (selectedUser?.id === userId) {
          setSelectedUser(null);
        }
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const handleBulkAction = (action: string) => {
    console.log(`Performing ${action} on users:`, selectedUsers);
    // Implement bulk actions here
    setSelectedUsers([]);
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
                <h1 className="mb-2 text-3xl font-bold font-heading text-text-primary">User Management</h1>
                <p className="text-text-secondary">Manage team members, roles, and permissions across your organization</p>
                {isLoading && (
                  <div className="flex items-center mt-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading users...
                  </div>
                )}
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
                  onClick={() => setShowAddUserModal(true)}
                  className="flex items-center px-6 py-2 space-x-2 text-white rounded-lg bg-primary hover:bg-primary-700 nav-transition"
                >
                  <UserPlus size={16} className="text-white" />
                  <span>Add User</span>
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 border rounded-lg bg-surface border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Total Employees</p>
                    <p className="text-2xl font-bold text-text-primary">{users.length}</p>
                  </div>
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100">
                    <Users size={20} className="text-primary" />
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-surface border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Active Employees</p>
                    <p className="text-2xl font-bold text-success">{users.filter(u => u.status === 'Active').length}</p>
                  </div>
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success-100">
                    <UserCheck size={20} className="text-success" />
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-surface border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Admins</p>
                    <p className="text-2xl font-bold text-accent">{users.filter(u => u.role === 'Admin').length}</p>
                  </div>
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent-100">
                    <Crown size={20} className="text-accent" />
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-surface border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Online Now</p>
                    <p className="text-2xl font-bold text-secondary">
                      {users.filter(u => Date.now() - u.lastActivity.getTime() < 900000).length}
                    </p>
                  </div>
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary-100">
                    <Wifi size={20} className="text-secondary" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Toolbar */}
          <FilterToolbar
            filters={filters}
            onFiltersChange={setFilters}
            userCount={filteredUsers.length}
          />

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <BulkActions
              selectedCount={selectedUsers.length}
              onBulkAction={handleBulkAction}
              onClearSelection={() => setSelectedUsers([])}
            />
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* User Table */}
            <div className="xl:col-span-2">
              <UserTable
                users={filteredUsers}
                selectedUsers={selectedUsers}
                onUserSelect={handleUserSelect}
                onSelectAll={handleSelectAll}
                onUserClick={handleUserClick}
                selectedUser={selectedUser}
                branches={branches}
                onDeleteUser={handleDeleteUser}
              />
            </div>

            {/* User Detail Panel */}
            <div className="xl:col-span-1">
              <UserDetailPanel
                user={selectedUser}
                onUpdateUser={handleUpdateUser}
                branches={branches}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showAddUserModal && (
        <AddUserModal
          isOpen={showAddUserModal}
          onClose={() => setShowAddUserModal(false)}
          onAddUser={handleAddUser}
        />
      )}

      {showAuditLogModal && (
        <AuditLogModal
          onClose={() => setShowAuditLogModal(false)}
          users={users}
        />
      )}
    </div>
  );
};

export default UserManagement;






