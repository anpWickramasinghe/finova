import React from 'react';
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface FilterToolbarProps {
    filters: {
        search: string;
        role: string;
        status: string;
        branch: string;
        permission: string;
    };
    onFiltersChange: (filters: any) => void;
    userCount: number;
    branches?: any[];
}

const FilterToolbar: React.FC<FilterToolbarProps> = ({
    filters,
    onFiltersChange,
    userCount,
    branches = [],
}) => {
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFiltersChange({ ...filters, search: e.target.value });
    };

    const handleRoleChange = (value: string) => {
        onFiltersChange({ ...filters, role: value });
    };

    const handleStatusChange = (value: string) => {
        onFiltersChange({ ...filters, status: value });
    };

    const handleBranchChange = (value: string) => {
        onFiltersChange({ ...filters, branch: value });
    };

    return (
        <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        value={filters.search}
                        onChange={handleSearchChange}
                        className="pl-8"
                    />
                </div>
                <Select value={filters.role} onValueChange={handleRoleChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by Role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Labour">Labour</SelectItem>
                        <SelectItem value="Security">Security</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filters.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={filters.branch} onValueChange={handleBranchChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by Branch" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Branch</SelectItem>
                        {branches.map((branch) => (
                            <SelectItem key={branch.id} value={String(branch.id)}>
                                {branch.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="text-sm text-muted-foreground">
                Showing {userCount} users
            </div>
        </div>
    );
};

export default FilterToolbar;
