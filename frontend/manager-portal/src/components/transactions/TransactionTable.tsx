import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Paperclip, FileText, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface Transaction {
    id: string;
    date: string;
    description: string;
    account: string;
    accountCode: string;
    debit: number;
    credit: number;
    type: string;
    status: string;
    reference: string;
    category: string;
    bankFeed: boolean;
    attachments: number;
}

interface TransactionTableProps {
    transactions: Transaction[];
    selectedTransactions: string[];
    onTransactionSelect: (ids: string[]) => void;
    onTransactionClick: (transaction: Transaction) => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
    transactions,
    selectedTransactions,
    onTransactionSelect,
    onTransactionClick,
}) => {
    const toggleSelectAll = () => {
        if (selectedTransactions.length === transactions.length) {
            onTransactionSelect([]);
        } else {
            onTransactionSelect(transactions.map((t) => t.id));
        }
    };

    const toggleSelect = (id: string, checked: boolean) => {
        if (checked) {
            onTransactionSelect([...selectedTransactions, id]);
        } else {
            onTransactionSelect(selectedTransactions.filter((t) => t !== id));
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'reconciled':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Reconciled</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">Pending</Badge>;
            case 'review':
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Needs Review</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]">
                            <Checkbox
                                checked={selectedTransactions.length === transactions.length && transactions.length > 0}
                                onCheckedChange={toggleSelectAll}
                                aria-label="Select all"
                            />
                        </TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                                No transactions found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        transactions.map((transaction) => (
                            <TableRow
                                key={transaction.id}
                                data-state={selectedTransactions.includes(transaction.id) && "selected"}
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={(e) => {
                                    // Prevent click when selecting checkbox or action menu
                                    if ((e.target as HTMLElement).closest('[role="checkbox"]') || (e.target as HTMLElement).closest('[data-radix-dropdown-menu-trigger]')) {
                                        return;
                                    }
                                    onTransactionClick(transaction);
                                }}
                            >
                                <TableCell>
                                    <Checkbox
                                        checked={selectedTransactions.includes(transaction.id)}
                                        onCheckedChange={(checked) => toggleSelect(transaction.id, !!checked)}
                                        aria-label={`Select transaction ${transaction.id}`}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </TableCell>
                                <TableCell className="font-medium whitespace-nowrap">
                                    {format(new Date(transaction.date), "MMM dd, yyyy")}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-foreground">{transaction.description}</span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            {transaction.reference}
                                            {transaction.attachments > 0 && <Paperclip className="h-3 w-3" />}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{transaction.account}</span>
                                        <span className="text-xs text-muted-foreground">{transaction.accountCode}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                    {transaction.debit > 0 ? `$${transaction.debit.toFixed(2)}` : "-"}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                    {transaction.credit > 0 ? `$${transaction.credit.toFixed(2)}` : "-"}
                                </TableCell>
                                <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => onTransactionClick(transaction)}>
                                                <FileText className="mr-2 h-4 w-4" /> View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <ExternalLink className="mr-2 h-4 w-4" /> View Source Document
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive">
                                                Delete Transaction
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default TransactionTable;
