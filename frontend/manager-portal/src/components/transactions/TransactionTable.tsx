import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Transaction } from '@/services/transactionService';

interface TransactionTableProps {
    transactions: Transaction[];
    onTransactionClick: (transaction: Transaction) => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
    transactions,
    onTransactionClick,
}) => {
    const getTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            journal: 'bg-cyan-50 text-cyan-700 border-cyan-200',
            payment: 'bg-orange-50 text-orange-700 border-orange-200',
            receipt: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            transfer: 'bg-purple-50 text-purple-700 border-purple-200',
        };
        return <Badge variant="outline" className={`capitalize ${colors[type] || ''}`}>{type}</Badge>;
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            draft: 'bg-slate-100 text-slate-600 border-slate-200',
            pending: 'bg-amber-50 text-amber-700 border-amber-200',
            posted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            rejected: 'bg-red-50 text-red-700 border-red-200',
            voided: 'bg-gray-100 text-gray-500 border-gray-200',
        };
        return (
            <Badge variant="outline" className={`capitalize ${styles[status?.toLowerCase()] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                {status || 'draft'}
            </Badge>
        );
    };

    // Calculate totals
    const totalDebit = transactions.reduce(
        (sum, t) => sum + parseFloat(t.debit || '0'), 0
    );
    const totalCredit = transactions.reduce(
        (sum, t) => sum + parseFloat(t.credit || '0'), 0
    );

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>TXN #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                No transactions found. Click "New Transaction" to create one.
                            </TableCell>
                        </TableRow>
                    ) : (
                        transactions.map((transaction) => {
                            const debitVal = parseFloat(transaction.debit || '0');
                            const creditVal = parseFloat(transaction.credit || '0');
                            return (
                                <TableRow
                                    key={transaction.id}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => onTransactionClick(transaction)}
                                >
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {transaction.transactionNumber}
                                    </TableCell>
                                    <TableCell className="font-medium whitespace-nowrap">
                                        {format(new Date(transaction.date), "MMM dd, yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">{transaction.description}</span>
                                            {transaction.reference && (
                                                <span className="text-xs text-muted-foreground">
                                                    Ref: {transaction.reference}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getTypeBadge(transaction.type)}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(transaction.status)}
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-medium">
                                        {debitVal > 0 ? (
                                            <span className="text-green-600">
                                                ${debitVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-medium">
                                        {creditVal > 0 ? (
                                            <span className="text-red-600">
                                                ${creditVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
                {transactions.length > 0 && (
                    <TableFooter>
                        <TableRow className="bg-muted/50 font-semibold">
                            <TableCell colSpan={5} className="text-right">
                                Totals
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-green-600">
                                ${totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-red-600">
                                ${totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                )}
            </Table>
        </div>
    );
};

export default TransactionTable;
