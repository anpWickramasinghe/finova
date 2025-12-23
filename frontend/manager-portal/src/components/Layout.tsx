import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    
    const mockUser = {
        name: "Sarah Johnson",
        email: "sarah.johnson@accountingpro.com",
        role: "Senior Accountant",
        avatar: "https://randomuser.me/api/portraits/women/32.jpg"
    };

    const handleSidebarToggle = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };
    

  
    const userRole = 'staff';

    return (
        <div className="min-h-screen bg-background">
            <Header
                user={mockUser}
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
