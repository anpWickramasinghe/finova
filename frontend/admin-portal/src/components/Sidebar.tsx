import React from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Receipt, Building2, FileText, Calculator, Users, Globe, LogOut, Banknote, Timer, CalendarDays, Calendar, Settings, MessageCircle } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    userRole: string;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const iconMap: { [key: string]: React.ElementType } = {
        LayoutDashboard,
        Receipt,
        Building2,
        FileText,
        Calculator,
        Users,
        Globe,
        Banknote,
        Timer,
        Settings,
        CalendarDays,
        Calendar,
        MessageCircle
    };

    const navigationItems = [
        {
            section: 'overview',
            label: 'Overview',
            items: [
                {
                    label: 'Dashboard',
                    path: '/dashboard',
                    icon: 'LayoutDashboard',
                    roles: ['partner', 'staff', 'freelancer', 'client'],
                    tooltip: 'Financial overview and insights'
                }
            ]
        },
        {
            section: 'transactions',
            label: 'Transactions',
            items: [
                {
                    label: 'Transaction Management',
                    path: '/transactions-management',
                    icon: 'Receipt',
                    roles: ['partner', 'staff', 'freelancer'],
                    tooltip: 'Manage financial transactions'
                }
               
            ]
        },
        {
            section: 'reports',
            label: 'Reports',
            items: [
                {
                    label: 'Financial Reports',
                    path: '/financial-reports',
                    icon: 'FileText',
                    roles: ['partner', 'staff', 'freelancer'],
                    tooltip: 'Generate financial statements'
                },
                {
                    label: 'Payroll Reports',
                    path: '/payroll-reports',
                    icon: 'Banknote',
                    roles: ['partner', 'staff'],
                    tooltip: 'Generate payroll summaries and payslips'
                },
                {
                    label: 'HR Reports',
                    path: '/hr-reports',
                    icon: 'Timer',
                    roles: ['partner', 'staff'],
                    tooltip: 'Generate attendance and leave logs'
                }
            ]
        },
        {
            section: 'administration',
            label: 'Administration',
            items: [
                {
                    label: 'User Management',
                    path: '/user-management',
                    icon: 'Users',
                    roles: ['partner'],
                    tooltip: 'Manage system users'
                }, {
                    label: 'Branch Management',
                    path: '/branch-management',
                    icon: 'Building2',
                    roles: ['partner', 'staff', 'freelancer'],
                    tooltip: 'Manage branch'
                },
                {
                    label: 'Payroll',
                    path: '/payroll',
                    icon: 'Banknote',
                    roles: ['partner', 'staff'],
                    tooltip: 'Manage employee payroll'
                },
                {
                    label: 'Chat',
                    path: '/support-chat',
                    icon: 'MessageCircle',
                    roles: ['partner', 'staff'],
                    tooltip: 'Respond to employee and client messages'
                },
                {
                    label: 'Configuration',
                    path: '/configuration',
                    icon: 'Settings',
                    roles: ['partner'],
                    tooltip: 'System configuration'
                }
            ]
        }
    ];

    return (
        <aside
            className={cn(
                "fixed left-0 top-16 bottom-0 border-r bg-primary transition-all duration-300 z-40 overflow-y-auto",
                collapsed ? "w-16" : "w-64"
            )}
        >
            <nav className="p-4 space-y-6">

                {navigationItems.map((section) => (
                    <div key={section.section} className="space-y-2">
                        {!collapsed && (
                            <h3 className="px-1 mb-2 text-xs font-normal tracking-wider uppercase text-primary-foreground/70">
                                {section.label}
                            </h3>
                        )}
                        {section.items.map((item) => {
                            const Icon = iconMap[item.icon];
                            const isActive = location.pathname === item.path;

                            return (
                                <Button
                                    key={item.path}
                                    variant={isActive ? "outline" : "ghost"}
                                    className={cn(
                                        "w-full justify-start",
                                        collapsed ? "px-2 justify-center" : "px-4",
                                        isActive ? "text-black" : "text-white/80"
                                    )}
                                    asChild
                                >
                                    <Link to={item.path}>
                                        {Icon && <Icon className={cn("h-5 w-5", collapsed ? "mr-0" : "mr-2")} />}
                                        {!collapsed && <span className=''> {item.label}</span>}
                                    </Link>
                                </Button>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-foreground/10 bg-primary">
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-start text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground",
                        collapsed ? "px-2 justify-center" : "px-4"
                    )}
                    onClick={handleLogout}
                >
                    <LogOut className={cn("h-5 w-5", collapsed ? "mr-0" : "mr-2")} />
                    {!collapsed && <span>Logout</span>}
                </Button>
            </div>
        </aside>
    );
};

export default Sidebar;
