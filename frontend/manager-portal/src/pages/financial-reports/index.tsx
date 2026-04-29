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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
    Download, FileSpreadsheet, TrendingUp, TrendingDown,
    DollarSign, BarChart3, Loader2, AlertTriangle, CheckCircle, Calculator
} from 'lucide-react';
import { transactionService, type ReportsSummary, type ProfitAndLossReport } from '@/services/transactionService';

const FinancialReports = () => {
    const [report, setReport] = useState<ReportsSummary | null>(null);
    const [pnlReport, setPnlReport] = useState<ProfitAndLossReport | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState(
        new Date().toISOString().split('T')[0]
    );

    useEffect(() => {
        loadReport();
    }, [startDate, endDate]);

    const loadReport = async () => {
        setLoading(true);
        try {
            const [data, pnlData] = await Promise.all([
                transactionService.getReportsSummary({ startDate, endDate }),
                transactionService.getProfitAndLossReport({ startDate, endDate })
            ]);
            setReport(data);
            setPnlReport(pnlData);
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
            `"${row.accountName}"`, // Quote to handle commas in names
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
        a.download = `financial-report-${new Date().toISOString().slice(0, 10)}.csv`;
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

    // Derived Financial Statements
    const assets = report?.trialBalance.filter(a => a.accountType === 'asset') || [];
    const liabilities = report?.trialBalance.filter(a => a.accountType === 'liability') || [];
    const equities = report?.trialBalance.filter(a => a.accountType === 'equity') || [];

    const sumBalance = (accounts: any[], normalBalance: 'debit' | 'credit') => {
        return accounts.reduce((sum, acc) => {
            const d = parseFloat(acc.totalDebit);
            const c = parseFloat(acc.totalCredit);
            return sum + (normalBalance === 'debit' ? (d - c) : (c - d));
        }, 0);
    };

    const totalRevenue = pnlReport?.totalRevenue || 0;
    const totalExpenses = pnlReport?.totalExpenses || 0;
    const netIncome = pnlReport?.netIncome || 0;
    
    const revenues = pnlReport?.revenues || [];
    const expenses = pnlReport?.expenses || [];

    const totalAssets = sumBalance(assets, 'debit');
    const totalLiabilities = sumBalance(liabilities, 'credit');
    const totalEquity = sumBalance(equities, 'credit') + netIncome; // Retained earnings include net income

    return (
        <div className="min-h-screen font-sans bg-background text-foreground">
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Financial & Accounting Reports</h1>
                        <p className="text-muted-foreground">
                            Comprehensive financial statements, trial balance, and transaction summaries.
                        </p>
                    </div>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-md">
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-auto h-9"
                            />
                            <span className="text-muted-foreground text-sm font-medium px-1">to</span>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-auto h-9"
                            />
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
                                    <p className="text-xs font-medium text-muted-foreground">Total Revenue</p>
                                    <p className="font-mono text-xl font-bold">
                                        LKR{''} {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg dark:bg-indigo-900/30">
                                    <Calculator className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Net Income</p>
                                    <p className={`font-mono text-xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        LKR{''} {netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                <Tabs defaultValue="pl" className="w-full">
                    <TabsList className="mb-4">
                        <TabsTrigger value="pl">Profit & Loss</TabsTrigger>
                        <TabsTrigger value="bs">Balance Sheet</TabsTrigger>
                        <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
                        <TabsTrigger value="status-summary">Transaction Summary</TabsTrigger>
                    </TabsList>

                    {/* Profit & Loss */}
                    <TabsContent value="pl">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="h-full">
                                <CardHeader>
                                    <CardTitle>Profit & Loss Statement</CardTitle>
                                    <CardDescription>Income and expenses summary determining net income.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2 border-b pb-2">Revenue</h3>
                                            <div className="space-y-2">
                                                {revenues.map(r => (
                                                    <div 
                                                        key={r.accountCode} 
                                                        className="flex justify-between items-center text-sm py-1 border-b border-dashed border-muted cursor-pointer hover:bg-muted/50 transition-colors px-2 -mx-2 rounded"
                                                        onClick={() => {
                                                            setSelectedAccount(r);
                                                            setIsDialogOpen(true);
                                                        }}
                                                    >
                                                        <span>{r.accountCode} - {r.accountName} <span className="text-xs text-muted-foreground ml-2">({r.entries?.length || 0} entries)</span></span>
                                                        <span className="font-mono"> {Number(r.netBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between items-center font-bold text-sm pt-2">
                                                    <span>Total Revenue</span>
                                                    <span className="font-mono text-green-600">LKR{''}{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2 border-b pb-2">Expenses</h3>
                                            <div className="space-y-2">
                                                {expenses.map(e => (
                                                    <div 
                                                        key={e.accountCode} 
                                                        className="flex justify-between items-center text-sm py-1 border-b border-dashed border-muted cursor-pointer hover:bg-muted/50 transition-colors px-2 -mx-2 rounded"
                                                        onClick={() => {
                                                            setSelectedAccount(e);
                                                            setIsDialogOpen(true);
                                                        }}
                                                    >
                                                        <span>{e.accountCode} - {e.accountName} <span className="text-xs text-muted-foreground ml-2">({e.entries?.length || 0} entries)</span></span>
                                                        <span className="font-mono">${Number(e.netBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between items-center font-bold text-sm pt-2">
                                                    <span>Total Expenses</span>
                                                    <span className="font-mono text-orange-600">LKR{''} {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center font-bold text-lg pt-4 border-t-2 border-primary">
                                            <span>Net Income</span>
                                            <span className={`font-mono ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                LKR{''} {netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="flex flex-col">
                                <CardHeader>
                                    <CardTitle>Revenue vs Expenses</CardTitle>
                                    <CardDescription>Visual comparison for the selected period.</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 min-h-[300px] flex items-center justify-center pt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={[
                                                { name: 'Financials', Revenue: totalRevenue, Expenses: totalExpenses }
                                            ]}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                                            <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                            <YAxis tickLine={false} axisLine={false} tickFormatter={(val) => `LKR ${val}`} />
                                            <RechartsTooltip cursor={{ fill: 'transparent' }} formatter={(value) => `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                            <Bar dataKey="Revenue" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={100} />
                                            <Bar dataKey="Expenses" fill="#ea580c" radius={[4, 4, 0, 0]} maxBarSize={100} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Balance Sheet */}
                    <TabsContent value="bs">
                        <Card>
                            <CardHeader>
                                <CardTitle>Balance Sheet</CardTitle>
                                <CardDescription>Statement of financial position: Assets = Liabilities + Equity.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Assets */}
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2 border-b pb-2">Assets</h3>
                                        <div className="space-y-2">
                                            {assets.map(a => (
                                                <div key={a.accountCode} className="flex justify-between items-center text-sm py-1 border-b border-dashed border-muted">
                                                    <span>{a.accountCode} - {a.accountName}</span>
                                                    <span className="font-mono">${(parseFloat(a.totalDebit) - parseFloat(a.totalCredit)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            ))}
                                            <div className="flex justify-between items-center font-bold text-sm pt-2">
                                                <span>Total Assets</span>
                                                <span className="font-mono text-blue-600">${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Liabilities & Equity */}
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2 border-b pb-2">Liabilities</h3>
                                            <div className="space-y-2">
                                                {liabilities.map(l => (
                                                    <div key={l.accountCode} className="flex justify-between items-center text-sm py-1 border-b border-dashed border-muted">
                                                        <span>{l.accountCode} - {l.accountName}</span>
                                                        <span className="font-mono">${(parseFloat(l.totalCredit) - parseFloat(l.totalDebit)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between items-center font-bold text-sm pt-2">
                                                    <span>Total Liabilities</span>
                                                    <span className="font-mono text-orange-600">LKR {totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </div>  
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2 border-b pb-2">Equity</h3>
                                            <div className="space-y-2">
                                                {equities.map(e => (
                                                    <div key={e.accountCode} className="flex justify-between items-center text-sm py-1 border-b border-dashed border-muted">
                                                        <span>{e.accountCode} - {e.accountName}</span>
                                                        <span className="font-mono">LKR {(parseFloat(e.totalCredit) - parseFloat(e.totalDebit)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between items-center text-sm py-1 border-b border-dashed border-muted">
                                                    <span>Retained Earnings (Net Income)</span>
                                                    <span className="font-mono">LKR {netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </div>
                                                <div className="flex justify-between ims-center font-bold text-sm pt-2">
                                                    <span>Total Equity</span>
                                                    <span className="font-mono text-indigo-600">LKR {totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center font-bold text-lg pt-4 border-t-2 border-primary">
                                            <span>Total Liabilities & Equity</span>
                                            <span className="font-mono text-blue-600">
                                                LKR {(totalLiabilities + totalEquity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Trial Balance */}
                    <TabsContent value="trial-balance">
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
                                                <TableHead className="text-right">Net Activity</TableHead>
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
                                                            <TableCell className={`text-right font-mono font-bold ${net > 0 ? 'text-blue-600' : net < 0 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                                                                {net > 0 ? '+' : net < 0 ? '-' : ''}${Math.abs(net).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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

                    {/* Status & Type Summary */}
                    <TabsContent value="status-summary">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="flex flex-col">
                                <CardHeader>
                                    <CardTitle>Transaction Status Distribution</CardTitle>
                                    <CardDescription>
                                        Breakdown of transactions by their current status.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <div className="grid grid-cols-2 gap-4 mb-6">
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
                                    <div className="h-[250px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={Object.entries(report?.statusCounts || {}).map(([name, value]) => ({ name, value }))}
                                                    cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value"
                                                >
                                                    {Object.entries(report?.statusCounts || {}).map(([name], index) => {
                                                        const pieColors: Record<string, string> = {
                                                            draft: '#94a3b8', pending_approval: '#fbbf24', approved: '#3b82f6',
                                                            posted: '#8b5cf6', reconciled: '#22c55e', rejected: '#ef4444'
                                                        };
                                                        return <Cell key={`cell-${index}`} fill={pieColors[name] || '#cbd5e1'} />;
                                                    })}
                                                </Pie>
                                                <RechartsTooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="flex flex-col">
                                <CardHeader>
                                    <CardTitle>Transaction Type Totals</CardTitle>
                                    <CardDescription>
                                        Total amounts by transaction type.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col">
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        {report?.typeTotals && Object.entries(report.typeTotals).map(([type, total]) => {
                                            const icons: Record<string, React.ReactNode> = {
                                                journal: <DollarSign className="w-5 h-5" />,
                                                payment: <TrendingDown className="w-5 h-5" />,
                                                receipt: <TrendingUp className="w-5 h-5" />,
                                                transfer: <BarChart3 className="w-5 h-5" />,
                                            };
                                            return (
                                                <div key={type} className="p-4 border rounded-lg bg-card shadow-sm">
                                                    <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                                                        {icons[type] || <DollarSign className="w-5 h-5" />}
                                                        <span className="text-sm font-medium capitalize">{type}</span>
                                                    </div>
                                                    <p className="font-mono text-xl font-bold">
                                                        ${parseFloat(String(total)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="h-[250px] mt-auto border-t pt-4 border-dashed">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={Object.entries(report?.typeTotals || {}).map(([name, value]) => ({ name, value: Number(value) }))}
                                                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                                                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} className="capitalize" />
                                                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                                <RechartsTooltip formatter={(value) => `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} cursor={{ fill: 'transparent' }} />
                                                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedAccount?.accountCode} - {selectedAccount?.accountName}</DialogTitle>
                        <DialogDescription>
                            Ledger records from {startDate} to {endDate}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedAccount?.entries?.length > 0 ? (
                        <div className="border rounded-md mt-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Debit</TableHead>
                                        <TableHead>Credit</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedAccount.entries.map((entry: any) => (
                                        <TableRow key={entry.id}>
                                            <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                                            <TableCell className="font-mono text-red-600">${parseFloat(entry.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                            <TableCell className="font-mono text-green-600">${parseFloat(entry.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-muted/50 font-bold">
                                        <TableCell>Total Net Balance</TableCell>
                                        <TableCell colSpan={2} className="text-right font-mono">
                                            ${Number(selectedAccount.netBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="py-8 text-center text-muted-foreground">
                            No ledger entries found for this account in the selected period.
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FinancialReports;
