import express from 'express';
import {
    getTransactions,
    getTransactionById,
    createTransaction,
    updateTransaction,
    submitTransaction,
    bulkSubmitTransactions,
    approveTransaction,
    rejectTransaction,
    postTransaction,
    reconcileTransaction,
    getLedgerEntries,
    getReportsSummary,
    getProfitAndLossReport,
    getAccounts,
    getDashboardAnalytics,
} from '../controllers/transactionController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);
// Allow branch managers to access transactions
router.use(requireRole(['admin', 'manager', 'branch']));

// Chart of Accounts
router.get('/accounts', getAccounts);

// Dashboard Analytics (admin-aware aggregation)
router.get('/dashboard/analytics', getDashboardAnalytics);

// Transaction CRUD
router.get('/', getTransactions);
router.get('/ledger', getLedgerEntries);
router.get('/reports/summary', getReportsSummary);
router.get('/reports/profit-loss', getProfitAndLossReport);
router.get('/:id', getTransactionById);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);

// Workflow actions
router.post('/bulk-submit', bulkSubmitTransactions);   // ← bulk submission (must be before /:id routes)
router.post('/:id/submit', submitTransaction);
router.post('/:id/approve', approveTransaction);
router.post('/:id/reject', rejectTransaction);
router.post('/:id/post', postTransaction);
router.post('/:id/reconcile', reconcileTransaction);

export default router;
