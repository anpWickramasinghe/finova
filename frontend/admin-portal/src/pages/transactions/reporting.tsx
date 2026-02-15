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
    DollarSign, BarChart3, Loader2, AlertTriangle, CheckCircle
} from 'lucide-react';
import { transactionService, type ReportsSummary } from '@/services/transactionService';
import { useNavigate } from 'react-router-dom';

const TransactionReporting = () => {
    const navigate = useNavigate();
    const [report, setReport] = useState<ReportsSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReport();
    }, []);

    const loadReport = async () => {
        setLoading(true);
        try {
            const data = await transactionService.getReportsSummary();
            setReport(data);
        } catch (err) {
            console.error('Failed to load report:', err);
        } finally {
            setLoading(false);
        }
    };

    const exportCSV = () => {
        if (!report?.trialBalance) return;
        const headers = ['Account Code', 'Account Name', 'Type', 'Total Debit', 'Total Credit', 'Net Balance'];
        const rows = report.trialBalance.map(row => [
            row.accountCode,
            row.accountName,
            row.accountType,
            row.totalDebit,
            row.totalCredit,
            (parseFloat(row.totalDebit) - parseFloat(row.totalCredit)).toFixed(2),
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trial-balance-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const totalDebit = parseFloat(report?.ledgerTotals?.totalDebit || '0');
    const totalCredit = parseFloat(report?.ledgerTotals?.totalCredit || '0');
    const isLedgerBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    return (
        <div className="min-h-screen font-sans bg-background text-foreground">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate('/transactions-management')}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
                            <p className="text-muted-foreground">
                                Trial balance, transaction summaries, and reconciliation status.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={exportCSV}>
                            <FileSpreadsheet className="w-4 h-4 mr-2" /> Export CSV
                        </Button>
                        <Button variant="outline">
                            <Download className="w-4 h-4 mr-2" /> Export PDF
                        </Button>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                                    <BarChart3 className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Total Transactions</p>
                                    <p className="text-2xl font-bold">{report?.totalTransactions || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg dark:bg-green-900/30">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Total Debits</p>
                                    <p className="font-mono text-2xl font-bold">
                                        ${totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg dark:bg-orange-900/30">
                                    <TrendingDown className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Total Credits</p>
                                    <p className="font-mono text-2xl font-bold">
                                        ${totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isLedgerBalanced ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                    {isLedgerBalanced
                                        ? <CheckCircle className="w-5 h-5 text-green-600" />
                                        : <AlertTriangle className="w-5 h-5 text-red-600" />
                                    }
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Ledger Balance</p>
                                    <p className={`text-sm font-bold ${isLedgerBalanced ? 'text-green-600' : 'text-red-600'}`}>
                                        {isLedgerBalanced ? 'Balanced' : `Off by $${Math.abs(totalDebit - totalCredit).toFixed(2)}`}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="trial-balance" className="w-full">
                    <TabsList>
                        <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
                        <TabsTrigger value="status-summary">Status Summary</TabsTrigger>
                        <TabsTrigger value="type-summary">Type Summary</TabsTrigger>
                    </TabsList>

                    {/* Trial Balance */}
                    <TabsContent value="trial-balance" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Trial Balance Report</CardTitle>
                                <CardDescription>
                                    Account-level debit and credit totals from posted ledger entries.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Code</TableHead>
                                                <TableHead>Account Name</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead className="text-right">Debit</TableHead>
                                                <TableHead className="text-right">Credit</TableHead>
                                                <TableHead className="text-right">Net</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {report?.trialBalance && report.trialBalance.length > 0 ? (
                                                report.trialBalance.map((row, i) => {
                                                    const net = parseFloat(row.totalDebit) - parseFloat(row.totalCredit);
                                                    return (
                                                        <TableRow key={i}>
                                                            <TableCell className="font-mono text-sm">{row.accountCode}</TableCell>
                                                            <TableCell className="font-medium">{row.accountName}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className="text-xs capitalize">{row.accountType}</Badge>
                                                            </TableCell>
                                                            <TableCell className="font-mono text-right">
                                                                ${parseFloat(row.totalDebit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </TableCell>
                                                            <TableCell className="font-mono text-right">
                                                                ${parseFloat(row.totalCredit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </TableCell>
                                                            <TableCell className={`text-right font-mono font-bold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {net >= 0 ? '' : '-'}${Math.abs(net).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                        No ledger entries found. Post transactions to see the trial balance.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Status Summary */}
                    <TabsContent value="status-summary" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Transaction Status Distribution</CardTitle>
                                <CardDescription>
                                    Breakdown of transactions by their current status.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                                    {report?.statusCounts && Object.entries(report.statusCounts).map(([status, count]) => {
                                        const colors: Record<string, string> = {
                                            draft: 'bg-slate-100 text-slate-700 border-slate-200',
                                            pending_approval: 'bg-amber-100 text-amber-700 border-amber-200',
                                            approved: 'bg-blue-100 text-blue-700 border-blue-200',
                                            posted: 'bg-violet-100 text-violet-700 border-violet-200',
                                            reconciled: 'bg-green-100 text-green-700 border-green-200',
                                            rejected: 'bg-red-100 text-red-700 border-red-200',
                                        };
                                        return (
                                            <div key={status} className={`p-4 rounded-lg border ${colors[status] || 'bg-muted'}`}>
                                                <p className="text-sm font-medium capitalize">{status.replace('_', ' ')}</p>
                                                <p className="mt-1 text-3xl font-bold">{count}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Type Summary */}
                    <TabsContent value="type-summary" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Transaction Type Totals</CardTitle>
                                <CardDescription>
                                    Total amounts by transaction type.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                    {report?.typeTotals && Object.entries(report.typeTotals).map(([type, total]) => {
                                        const icons: Record<string, React.ReactNode> = {
                                            journal: <DollarSign className="w-5 h-5" />,
                                            payment: <TrendingDown className="w-5 h-5" />,
                                            receipt: <TrendingUp className="w-5 h-5" />,
                                            transfer: <BarChart3 className="w-5 h-5" />,
                                        };
                                        return (
                                            <div key={type} className="p-4 border rounded-lg bg-card">
                                                <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                                                    {icons[type] || <DollarSign className="w-5 h-5" />}
                                                    <span className="text-sm font-medium capitalize">{type}</span>
                                                </div>
                                                <p className="font-mono text-2xl font-bold">
                                                    ${parseFloat(String(total)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        );
                                    })}
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
