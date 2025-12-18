import React from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, FileText, Settings, PieChart, CreditCard } from "lucide-react";

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    userRole: string;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", active: true },
        { icon: Users, label: "Clients", href: "/clients" },
        { icon: FileText, label: "Invoices", href: "/invoices" },
        { icon: CreditCard, label: "Expenses", href: "/expenses" },
        { icon: PieChart, label: "Reports", href: "/reports" },
        { icon: Settings, label: "Settings", href: "/settings" },
    ];

    return (
        <aside
            className={cn(
                "fixed left-0 top-16 bottom-0 border-r bg-background transition-all duration-300 z-40",
                collapsed ? "w-16" : "w-64"
            )}
        >
            <nav className="p-4 space-y-2">
                {navItems.map((item) => (
                    <Button
                        key={item.label}
                        variant={item.active ? "secondary" : "ghost"}
                        className={cn(
                            "w-full justify-start",
                            collapsed ? "px-2 justify-center" : "px-4"
                        )}
                    >
                        <item.icon className={cn("h-5 w-5", collapsed ? "mr-0" : "mr-2")} />
                        {!collapsed && <span>{item.label}</span>}
                    </Button>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
