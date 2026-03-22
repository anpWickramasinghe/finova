import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import TransactionTable from '../../components/transactions/TransactionTable';
import TransactionFilters from '../../components/transactions/TransactionFilters';
import AddTransactionModal from '../../components/transactions/AddTransactionModal';
import { transactionService, type Transaction } from '@/services/transactionService';
import {
  Download, Plus, FileText, TrendingUp, TrendingDown,
  DollarSign, Loader2, BarChart3, Send, CheckCircle2, AlertCircle, CalendarCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Toast {
  type: 'success' | 'error';
  message: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const TransactionsManagement = () => {
  const navigate = useNavigate();

  // Core state
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    search: '',
    startDate: '',
    endDate: '',
  });

  // ── Bulk-approval modal state ──────────────────────────────────────────────
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkPeriod, setBulkPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [eligibleTxns, setEligibleTxns] = useState<Transaction[]>([]);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (type: Toast['type'], message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // ── Data loading ─────────────────────────────────────────────────────────

  useEffect(() => {
    loadTransactions();
  }, [filters]);

  // Re-fetch eligible transactions whenever the modal opens or the period changes
  useEffect(() => {
    if (!showBulkModal) return;
    fetchEligible();
  }, [showBulkModal, bulkPeriod]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await transactionService.getTransactions({
        type: filters.type !== 'all' ? filters.type : undefined,
        search: filters.search || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch draft/rejected transactions for the selected month
  const fetchEligible = async () => {
    setLoadingEligible(true);
    try {
      const [year, month] = bulkPeriod.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1).toISOString().slice(0, 10);
      const endDate = new Date(year, month, 0).toISOString().slice(0, 10);
      const all = await transactionService.getTransactions({ startDate, endDate });
      setEligibleTxns(all.filter(t => t.status === 'draft' || t.status === 'rejected'));
    } catch {
      setEligibleTxns([]);
    } finally {
      setLoadingEligible(false);
    }
  };

  const handleBulkSubmit = async () => {
    setBulkSubmitting(true);
    try {
      const result = await transactionService.bulkSubmitTransactions({ period: bulkPeriod });
      setShowBulkModal(false);
      loadTransactions();
      if (result.failed.length === 0) {
        showToast('success', `${result.submitted} transaction(s) submitted for approval.`);
      } else {
        showToast(
          'error',
          `${result.submitted} submitted, ${result.failed.length} failed. ` +
          result.failed.map(f => `${f.id.slice(0, 8)}: ${f.reason}`).join(' | ')
        );
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Bulk submission failed.');
    } finally {
      setBulkSubmitting(false);
    }
  };

  // ── Individual actions ────────────────────────────────────────────────────

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleAddTransaction = () => {
    setShowAddModal(false);
    loadTransactions();
  };

  const handleAction = async (action: 'submit' | 'post') => {
    if (!selectedTransaction) return;
    setActionLoading(true);
    setActionError('');
    try {
      if (action === 'submit') {
        await transactionService.submitTransaction(selectedTransaction.id);
      } else if (action === 'post') {
        await transactionService.postTransaction(selectedTransaction.id);
      }
      setSelectedTransaction(null);
      loadTransactions();
    } catch (err: any) {
      setActionError(err.response?.data?.message || `Failed to ${action} transaction`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = () => {
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
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // ── Stats ─────────────────────────────────────────────────────────────────

  const totalDebit = transactions.reduce((sum, t) => sum + parseFloat(t.debit || '0'), 0);
  const totalCredit = transactions.reduce((sum, t) => sum + parseFloat(t.credit || '0'), 0);
  const netBalance = totalDebit - totalCredit;

  // Eligible count for the badge on the button
  const draftRejectedCount = transactions.filter(t => t.status === 'draft' || t.status === 'rejected').length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="p-6 space-y-6">
        {/* Toast notification */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 flex items-start gap-2 px-4 py-3 rounded-lg shadow-lg text-sm max-w-md border
              ${toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:border-emerald-700 dark:text-emerald-200'
                : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/40 dark:border-red-700 dark:text-red-200'
              }`}
          >
            {toast.type === 'success'
              ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            }
            <span>{toast.message}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">
              Transactions
            </h1>
            <p className="text-muted-foreground">
              View and manage your company's debit and credit transactions.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/transactions-management/reports')}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Reports
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>

            {/* ── Bulk Request Approval ────────────────────────────── */}
            <Button
              variant="outline"
              className="relative border-amber-400 text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-900/20"
              onClick={() => setShowBulkModal(true)}
            >
              <CalendarCheck className="mr-2 h-4 w-4" />
              Request Approval
              {draftRejectedCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                  {draftRejectedCount > 99 ? '99+' : draftRejectedCount}
                </span>
              )}
            </Button>

            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Transaction
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Transactions</p>
                  <p className="text-2xl font-bold">{transactions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex flex-col justify-between h-full">
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
            <CardContent className="p-4 flex flex-col justify-between h-full">
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
            <CardContent className="p-4 flex flex-col justify-between h-full">
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

        <div className="flex flex-col gap-4">
          {/* Filters */}
          <TransactionFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            resultCount={transactions.length}
          />

          {/* Main Content */}
          <div className="grid grid-cols-1 gap-6">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <TransactionTable
                transactions={transactions}
                onTransactionClick={handleTransactionClick}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Bulk Approval Modal ───────────────────────────────────────────────── */}
      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-amber-500" />
              Request Bulk Approval
            </DialogTitle>
            <DialogDescription>
              Select a month and submit all eligible draft or rejected transactions for admin approval at once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Month picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Month</label>
              <input
                type="month"
                value={bulkPeriod}
                onChange={e => setBulkPeriod(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Eligible transactions */}
            <div className="rounded-lg border bg-muted/30 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
                <span className="text-sm font-medium">Eligible Transactions</span>
                {loadingEligible ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Badge variant="secondary">{eligibleTxns.length}</Badge>
                )}
              </div>

              {loadingEligible ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : eligibleTxns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm gap-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  <p>No draft or rejected transactions for this period.</p>
                </div>
              ) : (
                <div className="max-h-52 overflow-y-auto divide-y">
                  {eligibleTxns.map(t => (
                    <div key={t.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs text-muted-foreground">{t.transactionNumber}</span>
                        <span className="font-medium truncate max-w-[260px]">{t.description}</span>
                      </div>
                      <div className="flex items-center gap-2 ml-4 shrink-0">
                        <Badge
                          variant="outline"
                          className={t.status === 'rejected'
                            ? 'border-red-300 text-red-600 dark:border-red-700 dark:text-red-400'
                            : 'border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-400'
                          }
                        >
                          {t.status}
                        </Badge>
                        <span className="font-mono text-xs">
                          ${parseFloat(t.totalAmount || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Note */}
            {eligibleTxns.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Already pending, approved, or posted transactions are skipped automatically.
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowBulkModal(false)}
                disabled={bulkSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                onClick={handleBulkSubmit}
                disabled={bulkSubmitting || eligibleTxns.length === 0 || loadingEligible}
              >
                {bulkSubmitting
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</>
                  : <><Send className="mr-2 h-4 w-4" /> Submit All for Approval</>
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════
          Individual Transaction Details Dialog
         ══════════════════════════════════════════════════════════════ */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => { setSelectedTransaction(null); setActionError(''); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              {selectedTransaction?.transactionNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Date</p>
                  <p className="font-medium">{format(new Date(selectedTransaction.date), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Type</p>
                  <Badge variant="outline" className="capitalize">{selectedTransaction.type}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Status</p>
                  <Badge variant="outline" className="capitalize">{selectedTransaction.status || 'draft'}</Badge>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Description</p>
                <p className="font-medium">{selectedTransaction.description}</p>
              </div>

              {selectedTransaction.reference && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Reference</p>
                  <p className="font-medium">{selectedTransaction.reference}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border bg-muted/30">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Debit</p>
                  <p className="text-xl font-bold font-mono text-green-600">
                    ${parseFloat(selectedTransaction.debit || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Credit</p>
                  <p className="text-xl font-bold font-mono text-red-600">
                    ${parseFloat(selectedTransaction.credit || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {selectedTransaction.notes && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Notes</p>
                  <p className="text-sm">{selectedTransaction.notes}</p>
                </div>
              )}

              {/* Rejection reason banner */}
              {selectedTransaction.status === 'rejected' && (selectedTransaction as any).rejectionReason && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Rejected</p>
                    <p className="text-xs mt-0.5">{(selectedTransaction as any).rejectionReason}</p>
                  </div>
                </div>
              )}

              {/* Pending approval info */}
              {selectedTransaction.status === 'pending_approval' && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 text-amber-700 text-sm">
                  <Loader2 className="h-4 w-4 shrink-0" />
                  <p>Waiting for admin approval.</p>
                </div>
              )}

              {/* Posted confirmation */}
              {(selectedTransaction.status === 'posted' || selectedTransaction.status === 'reconciled') && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 text-emerald-700 text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <p>This transaction has been posted to the ledger.</p>
                </div>
              )}

              {/* Action error */}
              {actionError && (
                <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200">
                  {actionError}
                </div>
              )}

              {/* Action buttons */}
              {(selectedTransaction.status === 'draft' || selectedTransaction.status === 'rejected') && (
                <Button
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={() => handleAction('submit')}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Submit for Approval
                </Button>
              )}

              {selectedTransaction.status === 'approved' && (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleAction('post')}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Post to Ledger
                </Button>
              )}

              <div className="text-xs text-muted-foreground pt-2 border-t">
                Created {format(new Date(selectedTransaction.createdAt), 'MMM dd, yyyy HH:mm')}
                {selectedTransaction.creatorName && ` by ${selectedTransaction.creatorName}`}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <AddTransactionModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddTransaction}
        />
      )}
    </div>
  );
};

export default TransactionsManagement;