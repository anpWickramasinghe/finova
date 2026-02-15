import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowLeft, Download, FileSpreadsheet, TrendingUp, TrendingDown,
    DollarSign, BarChart3, Loader2
} from 'lucide-react';
import { transactionService, type Transaction } from '@/services/transactionService';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const TransactionReporting = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const txns = await transactionService.getTransactions();
            setTransactions(txns);
        } catch (err) {
            console.error('Failed to load report data:', err);
        } finally {
            setLoading(false);
        }
    };

    const exportCSV = () => {
        if (transactions.length === 0) return;
        const headers = ['TXN #', 'Date', 'Description', 'Reference', 'Type', 'Debit', 'Credit'];
        const rows = transactions.map(t => [
            t.transactionNumber,
            t.date,
            t.description,
            t.reference || '',
            t.type,
            t.debit,
            t.credit,
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-report-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const totalDebit = transactions.reduce((sum, t) => sum + parseFloat(t.debit || '0'), 0);
    const totalCredit = transactions.reduce((sum, t) => sum + parseFloat(t.credit || '0'), 0);
    const netBalance = totalDebit - totalCredit;

    // Group transactions by month for monthly summary
    const monthlyData: Record<string, { debit: number; credit: number; count: number }> = {};
    transactions.forEach(t => {
        const monthKey = t.date.slice(0, 7); // yyyy-MM
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { debit: 0, credit: 0, count: 0 };
        }
        monthlyData[monthKey].debit += parseFloat(t.debit || '0');
        monthlyData[monthKey].credit += parseFloat(t.credit || '0');
        monthlyData[monthKey].count += 1;
    });
    const sortedMonths = Object.keys(monthlyData).sort().reverse();

    // Group by type for type summary
    const typeData: Record<string, { debit: number; credit: number; count: number }> = {};
    transactions.forEach(t => {
        if (!typeData[t.type]) {
            typeData[t.type] = { debit: 0, credit: 0, count: 0 };
        }
        typeData[t.type].debit += parseFloat(t.debit || '0');
        typeData[t.type].credit += parseFloat(t.credit || '0');
        typeData[t.type].count += 1;
    });

    return (
        <div className="min-h-screen bg-background font-sans text-foreground">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate('/transactions-management')}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Transaction Reports</h1>
                            <p className="text-muted-foreground">
                                Debit and credit summaries for your company.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={exportCSV}>
                            <FileSpreadsheet className="mr-2 h-4 w-4" /> Export CSV
                        </Button>
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" /> Export PDF
                        </Button>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                    <BarChart3 className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium">Total Transactions</p>
                                    <p className="text-2xl font-bold">{transactions.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium">Total Debits</p>
                                    <p className="text-2xl font-bold font-mono text-green-600">
                                        ${totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                                    <TrendingDown className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium">Total Credits</p>
                                    <p className="text-2xl font-bold font-mono text-red-600">
                                        ${totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${netBalance >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
                                    <DollarSign className={`h-5 w-5 ${netBalance >= 0 ? 'text-emerald-600' : 'text-orange-600'}`} />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium">Net Balance</p>
                                    <p className={`text-2xl font-bold font-mono ${netBalance >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                                        {netBalance >= 0 ? '' : '-'}${Math.abs(netBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList>
                        <TabsTrigger value="overview">All Transactions</TabsTrigger>
                        <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
                        <TabsTrigger value="by-type">By Type</TabsTrigger>
                    </TabsList>

                    {/* All Transactions */}
                    <TabsContent value="overview" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Transaction History</CardTitle>
                                <CardDescription>
                                    Complete list of all debit and credit entries.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>TXN #</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead className="text-right">Debit</TableHead>
                                                <TableHead className="text-right">Credit</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transactions.length > 0 ? (
                                                transactions.map((t, i) => {
                                                    const debitVal = parseFloat(t.debit || '0');
                                                    const creditVal = parseFloat(t.credit || '0');
                                                    return (
                                                        <TableRow key={i}>
                                                            <TableCell className="font-mono text-sm">{t.transactionNumber}</TableCell>
                                                            <TableCell className="whitespace-nowrap">
                                                                {format(new Date(t.date), 'MMM dd, yyyy')}
                                                            </TableCell>
                                                            <TableCell className="font-medium">{t.description}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className="capitalize text-xs">{t.type}</Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right font-mono">
                                                                {debitVal > 0 ? (
                                                                    <span className="text-green-600">
                                                                        ${debitVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted-foreground">—</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right font-mono">
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
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                                        No transactions found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Monthly Summary */}
                    <TabsContent value="monthly" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Monthly Summary</CardTitle>
                                <CardDescription>
                                    Aggregated debit and credit totals by month.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {sortedMonths.length > 0 ? (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Month</TableHead>
                                                    <TableHead className="text-center"># Transactions</TableHead>
                                                    <TableHead className="text-right">Total Debit</TableHead>
                                                    <TableHead className="text-right">Total Credit</TableHead>
                                                    <TableHead className="text-right">Net</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {sortedMonths.map(month => {
                                                    const data = monthlyData[month];
                                                    const net = data.debit - data.credit;
                                                    const [year, m] = month.split('-');
                                                    const monthName = new Date(parseInt(year), parseInt(m) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
                                                    return (
                                                        <TableRow key={month}>
                                                            <TableCell className="font-medium">{monthName}</TableCell>
                                                            <TableCell className="text-center">{data.count}</TableCell>
                                                            <TableCell className="text-right font-mono text-green-600">
                                                                ${data.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </TableCell>
                                                            <TableCell className="text-right font-mono text-red-600">
                                                                ${data.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </TableCell>
                                                            <TableCell className={`text-right font-mono font-bold ${net >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                                                                {net >= 0 ? '' : '-'}${Math.abs(net).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No transaction data available for monthly summary.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* By Type */}
                    <TabsContent value="by-type" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Summary by Type</CardTitle>
                                <CardDescription>
                                    Debit and credit breakdown by transaction type.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(typeData).map(([type, data]) => {
                                        const net = data.debit - data.credit;
                                        const icons: Record<string, React.ReactNode> = {
                                            journal: <DollarSign className="h-5 w-5" />,
                                            payment: <TrendingDown className="h-5 w-5" />,
                                            receipt: <TrendingUp className="h-5 w-5" />,
                                            transfer: <BarChart3 className="h-5 w-5" />,
                                        };
                                        return (
                                            <div key={type} className="p-5 rounded-lg border bg-card hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                                                    {icons[type] || <DollarSign className="h-5 w-5" />}
                                                    <span className="text-base font-semibold capitalize">{type}</span>
                                                    <Badge variant="outline" className="ml-auto">{data.count} txns</Badge>
                                                </div>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1">Debit</p>
                                                        <p className="font-mono font-bold text-green-600">
                                                            ${data.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1">Credit</p>
                                                        <p className="font-mono font-bold text-red-600">
                                                            ${data.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground mb-1">Net</p>
                                                        <p className={`font-mono font-bold ${net >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                                                            {net >= 0 ? '' : '-'}${Math.abs(net).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {Object.keys(typeData).length === 0 && (
                                        <div className="col-span-2 text-center py-8 text-muted-foreground">
                                            No transaction data available.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default TransactionReporting;
