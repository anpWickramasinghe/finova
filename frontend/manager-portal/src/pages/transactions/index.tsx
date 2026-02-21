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
  DollarSign, Loader2, BarChart3, Send, CheckCircle2, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const TransactionsManagement = () => {
  const navigate = useNavigate();
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

  useEffect(() => {
    loadTransactions();
  }, [filters]);

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

  // Compute stats
  const totalDebit = transactions.reduce((sum, t) => sum + parseFloat(t.debit || '0'), 0);
  const totalCredit = transactions.reduce((sum, t) => sum + parseFloat(t.credit || '0'), 0);
  const netBalance = totalDebit - totalCredit;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="p-6 space-y-6">
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

      {/* Transaction Details Dialog */}
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