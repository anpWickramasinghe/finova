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
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
    subType: string;
    normalBalance: 'debit' | 'credit';
    isSystem: boolean;
    isActive: boolean;
}

export interface JournalLine {
    id?: string;
    accountId: string;
    accountCode?: string;
    accountName?: string;
    description?: string;
    debit: string;
    credit: string;
    lineOrder?: number;
}

export interface Transaction {
    id: string;
    transactionNumber: string;
    date: string;
    description: string;
    reference: string;
    type: 'journal' | 'payment' | 'receipt' | 'transfer';
    status: 'draft' | 'pending_approval' | 'approved' | 'posted' | 'reconciled' | 'rejected';
    totalAmount: string;
    notes: string;
    branchId: string;
    createdBy: string;
    creatorName?: string;
    approvedBy?: string;
    approverName?: string;
    approvedAt?: string;
    submittedAt?: string;
    rejectedBy?: string;
    rejectionReason?: string;
    postedAt?: string;
    requiresAdminApproval: boolean;
    createdAt: string;
    journalLines?: JournalLine[];
    ledgerEntries?: any[];
    reconciliation?: any;
}

export interface CreateTransactionData {
    date: string;
    description: string;
    reference?: string;
    type: string;
    notes?: string;
    journalLines: {
        accountId: string;
        description?: string;
        debit: string;
        credit: string;
    }[];
}

export interface ReconcileData {
    bankStatementRef: string;
    bankDate?: string;
    matchedAmount: string;
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

// ===== Service =====

export const transactionService = {
    // Chart of Accounts
    getAccounts: async (): Promise<ChartOfAccount[]> => {
        const response = await axios.get(`${API_URL}/transactions/accounts`, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    // Transactions CRUD
    getTransactions: async (filters?: {
        status?: string;
        type?: string;
        startDate?: string;
        endDate?: string;
        search?: string;
    }): Promise<Transaction[]> => {
        const params = new URLSearchParams();
        if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
        if (filters?.type && filters.type !== 'all') params.append('type', filters.type);
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);
        if (filters?.search) params.append('search', filters.search);

        const response = await axios.get(`${API_URL}/transactions?${params.toString()}`, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    getTransactionById: async (id: string): Promise<Transaction> => {
        const response = await axios.get(`${API_URL}/transactions/${id}`, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    createTransaction: async (data: CreateTransactionData) => {
        const response = await axios.post(`${API_URL}/transactions`, data, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    updateTransaction: async (id: string, data: CreateTransactionData) => {
        const response = await axios.put(`${API_URL}/transactions/${id}`, data, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    // Workflow Actions
    submitForApproval: async (id: string) => {
        const response = await axios.post(`${API_URL}/transactions/${id}/submit`, {}, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    approveTransaction: async (id: string) => {
        const response = await axios.post(`${API_URL}/transactions/${id}/approve`, {}, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    rejectTransaction: async (id: string, reason: string) => {
        const response = await axios.post(`${API_URL}/transactions/${id}/reject`, { reason }, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    postToLedger: async (id: string) => {
        const response = await axios.post(`${API_URL}/transactions/${id}/post`, {}, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    reconcileTransaction: async (id: string, data: ReconcileData) => {
        const response = await axios.post(`${API_URL}/transactions/${id}/reconcile`, data, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    // Ledger & Reports
    getLedgerEntries: async (filters?: {
        accountId?: string;
        startDate?: string;
        endDate?: string;
    }) => {
        const params = new URLSearchParams();
        if (filters?.accountId) params.append('accountId', filters.accountId);
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);

        const response = await axios.get(`${API_URL}/transactions/ledger?${params.toString()}`, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    getReportsSummary: async (): Promise<ReportsSummary> => {
        const response = await axios.get(`${API_URL}/transactions/reports/summary`, {
            headers: getAuthHeader(),
        });
        return response.data;
    },
};
