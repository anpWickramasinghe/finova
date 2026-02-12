import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import TransactionTable from '../../components/transactions/TransactionTable';
import TransactionFilters from '../../components/transactions/TransactionFilters';
import TransactionDetails from '../../components/transactions/TransactionDetails';
import BulkActions from '../../components/transactions/BulkActions';
import AddTransactionModal from '../../components/transactions/AddTransactionModal';
import { Upload, Download, Plus, FileText, CheckCircle, Clock, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

const TransactionsManagement = () => {
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'all',
    account: 'all',
    type: 'all',
    status: 'all',
    search: ''
  });


  // Mock transactions data
  const transactions = [
    {
      id: "TXN-001",
      date: "2024-01-15",
      description: "Office Supplies Purchase",
      account: "Office Expenses",
      accountCode: "6200",
      debit: 450.00,
      credit: 0,
      type: "expense",
      status: "reconciled",
      reference: "INV-2024-001",
      category: "Operating Expenses",
      bankFeed: false,
      attachments: 1
    },
    {
      id: "TXN-002",
      date: "2024-01-14",
      description: "Client Payment - ABC Corp",
      account: "Accounts Receivable",
      accountCode: "1200",
      debit: 0,
      credit: 2500.00,
      type: "income",
      status: "pending",
      reference: "PAY-2024-002",
      category: "Revenue",
      bankFeed: true,
      attachments: 0
    },
    {
      id: "TXN-003",
      date: "2024-01-13",
      description: "Bank Service Charges",
      account: "Bank Charges",
      accountCode: "6300",
      debit: 25.00,
      credit: 0,
      type: "expense",
      status: "review",
      reference: "BSC-2024-001",
      category: "Financial Expenses",
      bankFeed: true,
      attachments: 0
    },
    {
      id: "TXN-004",
      date: "2024-01-12",
      description: "Equipment Purchase",
      account: "Fixed Assets",
      accountCode: "1500",
      debit: 3200.00,
      credit: 0,
      type: "asset",
      status: "reconciled",
      reference: "EQ-2024-001",
      category: "Capital Expenditure",
      bankFeed: false,
      attachments: 2
    },
    {
      id: "TXN-005",
      date: "2024-01-11",
      description: "Utility Bill Payment",
      account: "Utilities",
      accountCode: "6400",
      debit: 180.00,
      credit: 0,
      type: "expense",
      status: "pending",
      reference: "UTL-2024-001",
      category: "Operating Expenses",
      bankFeed: true,
      attachments: 1
    }
  ];


  const handleTransactionSelect = (transactionIds: string[]) => {
    setSelectedTransactions(transactionIds);
  };

  const handleTransactionClick = (transaction: any) => {
    setSelectedTransaction(transaction);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleBulkAction = (action: string) => {
    console.log(`Performing ${action} on transactions:`, selectedTransactions);
    // Handle bulk actions
    setSelectedTransactions([]);
  };

  const handleAddTransaction = (transactionData: any) => {
    console.log('Adding new transaction:', transactionData);
    setShowAddModal(false);
  };

  const handleExport = () => {
    console.log('Exporting transactions...');
  };

  const handleImport = () => {
    console.log('Importing transactions...');
  };

  // Filter transactions based on current filters
  const filteredTransactions = transactions.filter(transaction => {
    if (filters.search && !transaction.description.toLowerCase().includes(filters.search.toLowerCase()) &&
      !transaction.account.toLowerCase().includes(filters.search.toLowerCase()) &&
      !transaction.reference.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.account !== 'all' && transaction.account !== filters.account) return false;
    if (filters.type !== 'all' && transaction.type !== filters.type) return false;
    if (filters.status !== 'all' && transaction.status !== filters.status) return false;
    return true;
  });

  const stats = {
    total: filteredTransactions.length,
    reconciled: filteredTransactions.filter(t => t.status === 'reconciled').length,
    pending: filteredTransactions.filter(t => t.status === 'pending').length,
    review: filteredTransactions.filter(t => t.status === 'review').length,
    totalDebit: filteredTransactions.reduce((sum, t) => sum + t.debit, 0),
    totalCredit: filteredTransactions.reduce((sum, t) => sum + t.credit, 0)
  };

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
                Manage and reconcile your financial transactions.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleImport}>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">Total</span>
                </div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Reconciled</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{stats.reconciled}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Pending</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Review</span>
                </div>
                <div className="text-2xl font-bold text-red-600">{stats.review}</div>
              </CardContent>
            </Card>

            <Card className="col-span-2 md:col-span-1">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                  <TrendingUp className="h-4 w-4 text-cyan-600" />
                  <span className="text-sm font-medium">Total Debit</span>
                </div>
                <div className="text-lg font-bold text-cyan-700">${stats.totalDebit.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="col-span-2 md:col-span-1">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                  <TrendingDown className="h-4 w-4 text-cyan-600" />
                  <span className="text-sm font-medium">Total Credit</span>
                </div>
                <div className="text-lg font-bold text-cyan-700">${stats.totalCredit.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            {/* Filters */}
            <TransactionFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              resultCount={filteredTransactions.length}
            />

            {/* Bulk Actions */}
            {selectedTransactions.length > 0 && (
              <BulkActions
                selectedCount={selectedTransactions.length}
                onBulkAction={handleBulkAction}
                onClearSelection={() => setSelectedTransactions([])}
              />
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 gap-6">
              <TransactionTable
                transactions={filteredTransactions}
                selectedTransactions={selectedTransactions}
                onTransactionSelect={handleTransactionSelect}
                onTransactionClick={handleTransactionClick}
              />
            </div>
          </div>
        </div>
      
      {/* Transaction Details Panel */}
      <TransactionDetails
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
      />

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