import React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface HeaderProps {
    user: {
        name: string;
        email: string;
        avatar: string;
    };
    onMenuToggle: () => void;
    sidebarCollapsed: boolean;
}

const Header: React.FC<HeaderProps> = ({ user, onMenuToggle }) => {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-16 px-4 border-b bg-background">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onMenuToggle}>
                    <Menu className="w-5 h-5" />
                </Button>
                <div className="text-xl font-bold">Finova</div>
            </div>

            <div className="items-center flex-1 hidden max-w-md gap-4 mx-4 md:flex">
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="w-full pl-8 bg-muted/50"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon">
                    <Bell className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-2">
                    <div className="hidden text-right sm:block">
                        <div className="text-sm font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                    <Avatar>
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>SJ</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    );
};

export default Header;
