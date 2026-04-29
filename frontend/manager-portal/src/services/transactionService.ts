import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeader = () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.token) {
            return { Authorization: `Bearer ${user.token}` };
        }
    }
    return {};
};

// ===== Types =====

export interface ChartOfAccount {
    id: string;
    code: string;
    name: string;
    type: string;
}

export interface Transaction {
    id: string;
    transactionNumber: string;
    date: string;
    description: string;
    reference: string;
    type: 'journal' | 'payment' | 'receipt' | 'transfer';
    status: string;
    totalAmount: string;
    notes: string;
    branchId: string;
    createdBy: string;
    creatorName?: string;
    createdAt: string;
    debit: string;
    credit: string;
}

export interface CreateTransactionData {
    date: string;
    description: string;
    reference?: string;
    type: string;
    amount: string;
    accountId: string;       // Main account (e.g., Expense)
    contraAccountId: string; // Offset account (e.g., Cash/Bank)
    notes?: string;
}

export interface ReportsSummary {
    totalTransactions: number;
    statusCounts: Record<string, number>;
    typeTotals: Record<string, number>;
    ledgerTotals: {
        totalDebit: string;
        totalCredit: string;
    };
    trialBalance: {
        accountId: string;
        accountCode: string;
        accountName: string;
        accountType: string;
        totalDebit: string;
        totalCredit: string;
    }[];
}

export interface ProfitAndLossReport {
    revenues: {
        accountId: string;
        accountCode: string;
        accountName: string;
        accountType: string;
        totalDebit: number;
        totalCredit: number;
        netBalance: number;
        entries: any[];
    }[];
    expenses: {
        accountId: string;
        accountCode: string;
        accountName: string;
        accountType: string;
        totalDebit: number;
        totalCredit: number;
        netBalance: number;
        entries: any[];
    }[];
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
}

// ===== Service =====

export const transactionService = {
    // Get all accounts
    getAccounts: async (): Promise<ChartOfAccount[]> => {
        const response = await axios.get(`${API_URL}/transactions/accounts`, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    // Get all transactions with optional filters
    getTransactions: async (filters?: {
        type?: string;
        startDate?: string;
        endDate?: string;
        search?: string;
    }): Promise<Transaction[]> => {
        const params = new URLSearchParams();
        if (filters?.type && filters.type !== 'all') params.append('type', filters.type);
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);
        if (filters?.search) params.append('search', filters.search);

        const response = await axios.get(`${API_URL}/transactions?${params.toString()}`, {
            headers: getAuthHeader(),
        });

        // Map the API response to include debit/credit fields clearly
        return response.data.map((t: any) => {
            const amount = parseFloat(t.totalAmount || '0');
            // Logic: 
            // - Receipt: money comes IN (Debit Cash, Credit Other). To the branch, it adds value (Asset increases).
            // - Payment: money goes OUT (Credit Cash, Debit Expense).

            // For the transaction list view:
            // "Receipts" are generally positive/debits to cash.
            // "Payments" are negative/credits to cash.

            let debit = '0.00';
            let credit = '0.00';

            if (t.type === 'receipt') {
                debit = amount.toFixed(2);
            } else if (t.type === 'payment') {
                credit = amount.toFixed(2);
            } else {
                // For journals/transfers, logic might vary, but default to debit for now or handle specifically
                debit = amount.toFixed(2);
            }

            return {
                ...t,
                debit,
                credit
            };
        });
    },

    // Get a single transaction by ID
    getTransactionById: async (id: string): Promise<Transaction> => {
        const response = await axios.get(`${API_URL}/transactions/${id}`, {
            headers: getAuthHeader(),
        });
        const t = response.data;
        // Same mapping logic for single view
        const amount = parseFloat(t.totalAmount || '0');
        let debit = '0.00';
        let credit = '0.00';

        if (t.type === 'receipt') {
            debit = amount.toFixed(2);
        } else if (t.type === 'payment') {
            credit = amount.toFixed(2);
        } else {
            debit = amount.toFixed(2);
        }

        return {
            ...t,
            debit,
            credit
        };
    },

    // Create a new transaction
    createTransaction: async (data: CreateTransactionData) => {
        // Construct balanced journal lines
        const lines = [];

        if (data.type === 'payment') {
            // Payment: Debit Expense (accountId), Credit Cash (contraAccountId)
            lines.push({
                accountId: data.accountId,
                description: data.description,
                debit: data.amount,
                credit: '0'
            });
            lines.push({
                accountId: data.contraAccountId,
                description: `Payment via ${data.contraAccountId}`, // ideally account name
                debit: '0',
                credit: data.amount
            });
        } else if (data.type === 'receipt') {
            // Receipt: Debit Cash (contraAccountId), Credit Revenue (accountId)
            lines.push({
                accountId: data.contraAccountId,
                description: `Receipt into ${data.contraAccountId}`,
                debit: data.amount,
                credit: '0'
            });
            lines.push({
                accountId: data.accountId,
                description: data.description,
                debit: '0',
                credit: data.amount
            });
        } else {
            // Default/Journal: fallback to user entry logic (simplified)
            // Using logic: Debit Main, Credit Contra
            lines.push({
                accountId: data.accountId,
                description: data.description,
                debit: data.amount,
                credit: '0'
            });
            lines.push({
                accountId: data.contraAccountId,
                description: 'Offset',
                debit: '0',
                credit: data.amount
            });
        }

        const payload = {
            date: data.date,
            description: data.description,
            reference: data.reference,
            type: data.type,
            notes: data.notes,
            journalLines: lines
        };

        const response = await axios.post(`${API_URL}/transactions`, payload, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    // Reports summary
    getReportsSummary: async (filters?: {
        startDate?: string;
        endDate?: string;
    }): Promise<ReportsSummary> => {
        const params = new URLSearchParams();
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);

        const response = await axios.get(`${API_URL}/transactions/reports/summary?${params.toString()}`, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    getProfitAndLossReport: async (filters?: {
        startDate?: string;
        endDate?: string;
    }): Promise<ProfitAndLossReport> => {
        const params = new URLSearchParams();
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);

        const response = await axios.get(`${API_URL}/transactions/reports/profit-loss?${params.toString()}`, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    // Submit a draft transaction for approval
    submitTransaction: async (id: string): Promise<void> => {
        await axios.post(`${API_URL}/transactions/${id}/submit`, {}, {
            headers: getAuthHeader(),
        });
    },

    // Bulk submit all draft/rejected transactions (by period YYYY-MM or explicit IDs)
    bulkSubmitTransactions: async (options: {
        transactionIds?: string[];
        period?: string;
    }): Promise<{ submitted: number; failed: { id: string; reason: string }[]; message: string }> => {
        const response = await axios.post(`${API_URL}/transactions/bulk-submit`, options, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    // Approve a pending transaction (admin / maker-checker)
    approveTransaction: async (id: string): Promise<void> => {
        await axios.post(`${API_URL}/transactions/${id}/approve`, {}, {
            headers: getAuthHeader(),
        });
    },

    // Reject a pending transaction with a reason
    rejectTransaction: async (id: string, reason: string): Promise<void> => {
        await axios.post(`${API_URL}/transactions/${id}/reject`, { reason }, {
            headers: getAuthHeader(),
        });
    },

    // Post an approved transaction to the ledger
    postTransaction: async (id: string): Promise<void> => {
        await axios.post(`${API_URL}/transactions/${id}/post`, {}, {
            headers: getAuthHeader(),
        });
    },
};
