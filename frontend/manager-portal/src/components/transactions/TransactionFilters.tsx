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
import { Search, Filter, X } from "lucide-react";

interface TransactionFiltersProps {
    filters: {
        search: string;
        account: string;
        type: string;
        status: string;
        dateRange: string;
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

    const clearFilters = () => {
        onFilterChange({
            search: '',
            account: 'all',
            type: 'all',
            status: 'all',
            dateRange: 'all',
        });
    };

    const hasActiveFilters =
        filters.search !== '' ||
        filters.account !== 'all' ||
        filters.type !== 'all' ||
        filters.status !== 'all' ||
        filters.dateRange !== 'all';

    return (
        <div className="space-y-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search transactions..."
                        value={filters.search}
                        onChange={handleSearchChange}
                        className="pl-8"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    <Select
                        value={filters.account}
                        onValueChange={(value) => handleSelectChange('account', value)}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Account" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Accounts</SelectItem>
                            <SelectItem value="Office Expenses">Office Expenses</SelectItem>
                            <SelectItem value="Accounts Receivable">Accounts Receivable</SelectItem>
                            <SelectItem value="Bank Charges">Bank Charges</SelectItem>
                            <SelectItem value="Fixed Assets">Fixed Assets</SelectItem>
                            <SelectItem value="Utilities">Utilities</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.type}
                        onValueChange={(value) => handleSelectChange('type', value)}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="income">Income</SelectItem>
                            <SelectItem value="expense">Expense</SelectItem>
                            <SelectItem value="asset">Asset</SelectItem>
                            <SelectItem value="liability">Liability</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.status}
                        onValueChange={(value) => handleSelectChange('status', value)}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="reconciled">Reconciled</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="review">Review</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                    </Button>

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
