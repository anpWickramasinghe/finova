import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '@/context/AuthContext';

const Layout = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { user } = useAuth();

    const displayUser = {
        name: user?.name || user?.email?.split('@')[0] || "User",
        email: user?.email || "",
        role: user?.role || "Staff",
        avatar: "https://randomuser.me/api/portraits/women/32.jpg" 
    };

    const handleSidebarToggle = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    const userRole = user?.role || 'staff';

    return (
        <div className="min-h-screen bg-background">
            <Header
                user={displayUser}
                onMenuToggle={handleSidebarToggle}
                sidebarCollapsed={sidebarCollapsed}
            />

            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={handleSidebarToggle}
                userRole={userRole}
            />

            <main className={`
                pt-16 transition-all duration-300
                ${sidebarCollapsed ? 'ml-16' : 'ml-64'}
            `}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
