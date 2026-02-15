import React from 'react';
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface TransactionFiltersProps {
    filters: {
        search: string;
        type: string;
        startDate: string;
        endDate: string;
    };
    onFilterChange: (newFilters: any) => void;
    resultCount: number;
}

const TransactionFilters: React.FC<TransactionFiltersProps> = ({
    filters,
    onFilterChange,
    resultCount,
}) => {
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange({ ...filters, search: e.target.value });
    };

    const handleSelectChange = (key: string, value: string) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const handleDateChange = (key: string, value: string) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        onFilterChange({
            search: '',
            type: 'all',
            startDate: '',
            endDate: '',
        });
    };

    const hasActiveFilters =
        filters.search !== '' ||
        filters.type !== 'all' ||
        filters.startDate !== '' ||
        filters.endDate !== '';

    return (
        <div className="space-y-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by description, reference, or transaction #..."
                        value={filters.search}
                        onChange={handleSearchChange}
                        className="pl-8"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    <Select
                        value={filters.type}
                        onValueChange={(value) => handleSelectChange('type', value)}
                    >
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="payment">Payment</SelectItem>
                            <SelectItem value="receipt">Receipt</SelectItem>
                            <SelectItem value="transfer">Transfer</SelectItem>
                            <SelectItem value="journal">Journal Entry</SelectItem>
                        </SelectContent>
                    </Select>

                    <Input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleDateChange('startDate', e.target.value)}
                        className="w-[150px]"
                        placeholder="From"
                    />
                    <Input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleDateChange('endDate', e.target.value)}
                        className="w-[150px]"
                        placeholder="To"
                    />

                    {hasActiveFilters && (
                        <Button variant="ghost" onClick={clearFilters} className="px-2 lg:px-4">
                            <X className="mr-2 h-4 w-4" />
                            Clear
                        </Button>
                    )}
                </div>
            </div>
            <div className="text-sm text-muted-foreground">
                Showing {resultCount} transaction{resultCount !== 1 && 's'}
            </div>
        </div>
    );
};

export default TransactionFilters;
