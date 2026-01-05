import React from 'react';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface FilterToolbarProps {
    filters: {
        search: string;
    };
    onFiltersChange: (filters: any) => void;
    branchCount: number;
}

const FilterToolbar: React.FC<FilterToolbarProps> = ({
    filters,
    onFiltersChange,
    branchCount,
}) => {
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFiltersChange({ ...filters, search: e.target.value });
    };

    return (
        <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search branches..."
                        value={filters.search}
                        onChange={handleSearchChange}
                        className="pl-8"
                    />
                </div>
            </div>
            <div className="text-sm text-muted-foreground">
                Showing {branchCount} branches
            </div>
        </div>
    );
};

export default FilterToolbar;
