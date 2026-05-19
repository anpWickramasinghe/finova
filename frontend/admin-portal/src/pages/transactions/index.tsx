import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { transactionService, type Transaction } from '@/services/transactionService';
import { branchService } from '@/services/branchService';
import type { Branch } from '@/pages/branch-management/types';
import {
  Loader2, CheckCircle2, XCircle, BookOpen,
  FileText, Clock, AlertCircle, Search, 
  Building2, SlidersHorizontal,
} from 'lucide-react';
import { format } from 'date-fns';
import { BranchTransferModal } from './components/BranchTransferModal';

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  pending_approval: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-blue-50 text-blue-700 border-blue-200',
  posted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  reconciled: 'bg-teal-50 text-teal-700 border-teal-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

const TYPE_COLORS: Record<string, string> = {
  journal: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  payment: 'bg-orange-50 text-orange-700 border-orange-200',
  receipt: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  transfer: 'bg-purple-50 text-purple-700 border-purple-200',
};

const StatusBadge = ({ status }: { status: string }) => (
  <Badge variant="outline" className={`capitalize text-xs ${STATUS_COLORS[status] || STATUS_COLORS.draft}`}>
    {status === 'pending_approval' ? 'Pending' : status}
  </Badge>
);

function mergeWithBranches(
  branches: Branch[],
  txns: Transaction[]
): { branchId: string; branchName: string; transactions: Transaction[] }[] {
  const txnMap = new Map<string, Transaction[]>();
  for (const txn of txns) {
    const key = txn.branchId || 'unknown';
    if (!txnMap.has(key)) txnMap.set(key, []);
    txnMap.get(key)!.push(txn);
  }
  return branches
    .map(b => ({
      branchId: String(b.id),
      branchName: b.name,
      transactions: txnMap.get(String(b.id)) || [],
    }))
    .sort((a, b) => a.branchName.localeCompare(b.branchName));
}

// ─── Branch Tab Content ──────────────────────────────────────────────────────

interface BranchTabContentProps {
  transactions: Transaction[];
  onRowClick: (txn: Transaction) => void;
  tabSearch: string;
}

const BranchTabContent = ({ transactions, onRowClick, tabSearch }: BranchTabContentProps) => {
  const filtered = tabSearch
    ? transactions.filter(
      t =>
        t.description?.toLowerCase().includes(tabSearch.toLowerCase()) ||
        t.transactionNumber?.toLowerCase().includes(tabSearch.toLowerCase()) ||
        t.reference?.toLowerCase().includes(tabSearch.toLowerCase())
    )
    : transactions;

  const totalAmount = filtered.reduce((s, t) => s + parseFloat(t.totalAmount || '0'), 0);
  const pending = filtered.filter(t => t.status === 'pending_approval').length;
  const posted = filtered.filter(t => t.status === 'posted').length;

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
        <div className="p-4 rounded-full bg-muted/50">
          <Building2 className="h-8 w-8 opacity-40" />
        </div>
        <p className="text-sm font-medium">No transactions for this branch</p>
        <p className="text-xs opacity-60">Transactions will appear here once created</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Branch mini stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-amber-50/60 dark:bg-amber-900/10 px-4 py-3 flex items-center gap-3">
          <Clock className="h-4 w-4 text-amber-500 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground font-medium">Pending</p>
            <p className="text-lg font-bold text-amber-600">{pending}</p>
          </div>
        </div>
        <div className="rounded-lg border bg-emerald-50/60 dark:bg-emerald-900/10 px-4 py-3 flex items-center gap-3">
          <BookOpen className="h-4 w-4 text-emerald-500 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground font-medium">Posted</p>
            <p className="text-lg font-bold text-emerald-600">{posted}</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3">
          <FileText className="h-4 w-4 text-primary/60 shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Volume</p>
            <p className="text-lg font-bold font-mono">
              LKR{" "} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card py-10 text-center text-sm text-muted-foreground">
          No transactions match your search.
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs font-semibold">TXN #</TableHead>
                <TableHead className="text-xs font-semibold">Date</TableHead>
                <TableHead className="text-xs font-semibold">Description</TableHead>
                <TableHead className="text-xs font-semibold">Type</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="text-right text-xs font-semibold">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(txn => (
                <TableRow
                  key={txn.id}
                  className="cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => onRowClick(txn)}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {txn.transactionNumber}
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap text-sm">
                    {format(new Date(txn.date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{txn.description}</span>
                      {txn.reference && (
                        <span className="text-xs text-muted-foreground">Ref: {txn.reference}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize text-xs ${TYPE_COLORS[txn.type] || ''}`}>
                      {txn.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={txn.status} />
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium text-sm">
                    LKR{" "}{parseFloat(txn.totalAmount || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const TransactionsManagement = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [activeTab, setActiveTab] = useState<string>('');
  const [tabSearch, setTabSearch] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);

  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
  });

  useEffect(() => {
    loadTransactions();
  }, [filters.status, filters.type]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const [txnData, branchData] = await Promise.all([
        transactionService.getTransactions({
          status: filters.status !== 'all' ? filters.status : undefined,
          type: filters.type !== 'all' ? filters.type : undefined,
        }),
        branchService.getAllBranches(),
      ]);
      setTransactions(txnData);
      setBranches(branchData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = async (txn: Transaction) => {
    setActionError('');
    setRejectReason('');
    setSelected(txn);
    setDetailsLoading(true);
    try {
      const full = await transactionService.getTransactionById(txn.id);
      setSelected(full);
    } catch {
      // keep the list data already shown
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selected) return;
    setActionLoading(true);
    setActionError('');
    try {
      await transactionService.approveTransaction(selected.id);
      setSelected(null);
      loadTransactions();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to approve transaction');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    if (!rejectReason.trim()) {
      setActionError('Please provide a rejection reason');
      return;
    }
    setActionLoading(true);
    setActionError('');
    try {
      await transactionService.rejectTransaction(selected.id, rejectReason.trim());
      setShowRejectDialog(false);
      setSelected(null);
      loadTransactions();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to reject transaction');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePost = async () => {
    if (!selected) return;
    setActionLoading(true);
    setActionError('');
    try {
      await transactionService.postToLedger(selected.id);
      setSelected(null);
      loadTransactions();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to post transaction');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Stats (global) ──
  const globalPending = transactions.filter(t => t.status === 'pending_approval').length;
  const globalApproved = transactions.filter(t => t.status === 'approved').length;
  const globalPosted = transactions.filter(t => t.status === 'posted').length;

  const branchGroups = mergeWithBranches(branches, transactions);

  // set default tab once loaded
  useEffect(() => {
    if (!activeTab && branchGroups.length > 0) {
      setActiveTab(branchGroups[0].branchId);
    }
  }, [branchGroups.length]);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Transaction Review</h1>
            <p className="text-muted-foreground">
              Review, approve, reject, and post branch transactions to the ledger.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Button onClick={() => setShowTransferModal(true)} className="bg-primary text-primary-foreground">
              <BookOpen className="h-4 w-4 mr-2" />
              New Branch Transfer
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 border rounded-lg px-3 py-2">
              <Building2 className="h-3.5 w-3.5" />
              <span>{branchGroups.length} branch{branchGroups.length !== 1 ? 'es' : ''}</span>
              <span className="text-border">·</span>
              <span>{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Pending Approval</p>
                <p className="text-2xl font-bold text-amber-600">{globalPending}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Approved (Unposted)</p>
                <p className="text-2xl font-bold text-blue-600">{globalApproved}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <BookOpen className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Posted to Ledger</p>
                <p className="text-2xl font-bold text-emerald-600">{globalPosted}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4 shrink-0" />
            <span className="font-medium">Filters:</span>
          </div>
          <Select value={filters.status} onValueChange={v => { setFilters(f => ({ ...f, status: v })); setTabSearch(''); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending_approval">Pending Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="posted">Posted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="reconciled">Reconciled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.type} onValueChange={v => { setFilters(f => ({ ...f, type: v })); setTabSearch(''); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="payment">Payment</SelectItem>
              <SelectItem value="receipt">Receipt</SelectItem>
              <SelectItem value="journal">Journal</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>

          {/* Per-branch search */}
          <div className="relative ml-auto min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search in branch..."
              className="pl-9"
              value={tabSearch}
              onChange={e => setTabSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Branch tabs */}
        {loading ? (
          <div className="flex items-center justify-center h-60">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : branchGroups.length === 0 ? (
          <div className="rounded-lg border bg-card flex flex-col items-center justify-center h-60 text-muted-foreground gap-3">
            <Building2 className="h-10 w-10 opacity-30" />
            <p className="text-sm font-medium">No branches or transactions found</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setTabSearch(''); }}>
            {/* Tab list — scrollable if many branches */}
            <div className="border-b overflow-x-auto">
              <TabsList className="h-auto bg-transparent p-0 w-max">
                {branchGroups.map(group => {
                  const pendingCount = group.transactions.filter(t => t.status === 'pending_approval').length;
                  return (
                    <TabsTrigger
                      key={group.branchId}
                      value={group.branchId}
                      className="relative flex items-center gap-2 rounded-none border-b-2 border-transparent px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span>{group.branchName}</span>
                      <span className="text-xs text-muted-foreground/60 tabular-nums">
                        ({group.transactions.length})
                      </span>
                      {pendingCount > 0 && (
                        <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white leading-none">
                          {pendingCount}
                        </span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Tab contents */}
            {branchGroups.map(group => (
              <TabsContent key={group.branchId} value={group.branchId} className="mt-5 focus-visible:outline-none">
                <BranchTabContent
                  transactions={group.transactions}
                  onRowClick={handleRowClick}
                  tabSearch={tabSearch}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      {/* ── Transaction Details Dialog ── */}
      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setActionError(''); }}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              {selected?.transactionNumber}
              {detailsLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 py-2">
              {/* Branch info */}
              {selected.branchName && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>{selected.branchName}</span>
                </div>
              )}

              {/* Meta row */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Date</p>
                  <p className="font-medium text-sm">{format(new Date(selected.date), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Type</p>
                  <Badge variant="outline" className={`capitalize text-xs ${TYPE_COLORS[selected.type] || ''}`}>
                    {selected.type}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Status</p>
                  <StatusBadge status={selected.status} />
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Description</p>
                <p className="font-medium text-sm">{selected.description}</p>
              </div>

              {selected.reference && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Reference</p>
                  <p className="text-sm">{selected.reference}</p>
                </div>
              )}

              {/* Amount */}
              <div className="p-4 rounded-lg border bg-muted/30 text-center">
                <p className="text-xs text-muted-foreground font-medium mb-1">Total Amount</p>
                <p className="text-2xl font-bold font-mono">
                  LKR {parseFloat(selected.totalAmount || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                {selected.requiresAdminApproval && (
                  <p className="text-xs text-amber-600 mt-1 font-medium">⚠ Requires admin approval (≥ LKR 10,000)</p>
                )}
              </div>

              {/* Journal lines */}
              {selected.journalLines && selected.journalLines.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Journal Lines
                  </p>
                  <div className="rounded-md border overflow-hidden text-xs">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-2 font-medium">Account</th>
                          <th className="text-right p-2 font-medium">Debit</th>
                          <th className="text-right p-2 font-medium">Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.journalLines.map((line, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2 text-muted-foreground">
                              {line.accountCode ? `${line.accountCode} - ${line.accountName}` : line.accountId}
                            </td>
                            <td className="p-2 text-right font-mono text-green-600">
                              {parseFloat(line.debit || '0') > 0 ? `${parseFloat(line.debit).toFixed(2)}` : '—'}
                            </td>
                            <td className="p-2 text-right font-mono text-red-600">
                              {parseFloat(line.credit || '0') > 0 ? `${parseFloat(line.credit).toFixed(2)}` : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Rejection reason */}
              {selected.status === 'rejected' && selected.rejectionReason && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Rejection Reason</p>
                    <p className="text-xs mt-0.5">{selected.rejectionReason}</p>
                  </div>
                </div>
              )}

              {/* Posted confirmation */}
              {(selected.status === 'posted' || selected.status === 'reconciled') && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 text-emerald-700 text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <p>Posted to ledger{selected.postedAt ? ` on ${format(new Date(selected.postedAt), 'MMM dd, yyyy')}` : ''}.</p>
                </div>
              )}

              {/* Action error */}
              {actionError && (
                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200">
                  {actionError}
                </div>
              )}

              {/* Action Buttons */}
              {selected.status === 'pending_approval' && (
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => { setActionError(''); setShowRejectDialog(true); }}
                    disabled={actionLoading}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleApprove}
                    disabled={actionLoading}
                  >
                    {actionLoading
                      ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      : <CheckCircle2 className="mr-2 h-4 w-4" />
                    }
                    Approve
                  </Button>
                </div>
              )}

              {selected.status === 'approved' && (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handlePost}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <BookOpen className="mr-2 h-4 w-4" />
                  }
                  Post to Ledger
                </Button>
              )}

              <div className="text-xs text-muted-foreground pt-2 border-t">
                Created {format(new Date(selected.createdAt), 'MMM dd, yyyy HH:mm')}
                {selected.creatorName && ` by ${selected.creatorName}`}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Reject Reason Dialog ── */}
      <Dialog open={showRejectDialog} onOpenChange={v => { setShowRejectDialog(v); if (!v) setActionError(''); }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Reject Transaction</DialogTitle>
            <DialogDescription>
              Provide a reason. The branch manager will see this.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Reason *</Label>
              <Textarea
                id="rejectReason"
                placeholder="e.g. Missing supporting documents, incorrect account..."
                value={rejectReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
            {actionError && (
              <p className="text-sm text-red-600">{actionError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleReject}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BranchTransferModal 
        open={showTransferModal}
        onOpenChange={setShowTransferModal}
        branches={branches}
        onSuccess={loadTransactions}
      />
    </div>
  );
};

export default TransactionsManagement;