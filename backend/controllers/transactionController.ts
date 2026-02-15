import { Request, Response } from 'express';
import { db } from '../config/db.js';
import { transaction, journal_line, ledger_entry, reconciliation, chart_of_accounts, user, branch } from '../db/schema.js';
import { eq, and, sql, desc, asc, between } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

interface AuthRequest extends Request {
    user?: any;
}

// Helper: Generate transaction number
const generateTxnNumber = () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    return `TXN-${dateStr}-${random}`;
};

// Helper: Admin approval threshold (configurable)
const ADMIN_APPROVAL_THRESHOLD = 10000;

// ==========================================
// LIST TRANSACTIONS (branch-wise, with filters)
// ==========================================
export const getTransactions = async (req: AuthRequest, res: Response) => {
    try {
        const { status, type, startDate, endDate, search } = req.query;
        const userBranchId = req.user?.branchId;

        const conditions: any[] = [];
        if (userBranchId) conditions.push(eq(transaction.branchId, userBranchId));
        if (status && status !== 'all') conditions.push(eq(transaction.status, status as string));
        if (type && type !== 'all') conditions.push(eq(transaction.type, type as string));
        if (startDate && endDate) {
            conditions.push(sql`${transaction.date} >= ${new Date(startDate as string)}`);
            conditions.push(sql`${transaction.date} <= ${new Date(endDate as string)}`);
        }
        if (search) {
            conditions.push(sql`(${transaction.description} ILIKE ${'%' + search + '%'} OR ${transaction.transactionNumber} ILIKE ${'%' + search + '%'} OR ${transaction.reference} ILIKE ${'%' + search + '%'})`);
        }

        const transactions = await db.select({
            id: transaction.id,
            transactionNumber: transaction.transactionNumber,
            date: transaction.date,
            description: transaction.description,
            reference: transaction.reference,
            type: transaction.type,
            status: transaction.status,
            totalAmount: transaction.totalAmount,
            notes: transaction.notes,
            createdBy: transaction.createdBy,
            branchId: transaction.branchId,
            submittedAt: transaction.submittedAt,
            approvedBy: transaction.approvedBy,
            approvedAt: transaction.approvedAt,
            rejectedBy: transaction.rejectedBy,
            rejectionReason: transaction.rejectionReason,
            postedAt: transaction.postedAt,
            requiresAdminApproval: transaction.requiresAdminApproval,
            createdAt: transaction.createdAt,
        })
            .from(transaction)
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(transaction.createdAt));

        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ==========================================
// GET SINGLE TRANSACTION (with journal lines, ledger, reconciliation)
// ==========================================
export const getTransactionById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const txns = await db.select().from(transaction).where(eq(transaction.id, id)).limit(1);
        if (txns.length === 0) return res.status(404).json({ message: 'Transaction not found' });

        const txn = txns[0];

        // Get journal lines with account info
        const lines = await db.select({
            id: journal_line.id,
            accountId: journal_line.accountId,
            accountCode: chart_of_accounts.code,
            accountName: chart_of_accounts.name,
            description: journal_line.description,
            debit: journal_line.debit,
            credit: journal_line.credit,
            lineOrder: journal_line.lineOrder,
        })
            .from(journal_line)
            .innerJoin(chart_of_accounts, eq(journal_line.accountId, chart_of_accounts.id))
            .where(eq(journal_line.transactionId, id))
            .orderBy(asc(journal_line.lineOrder));

        // Get ledger entries if posted
        let ledgerEntries: any[] = [];
        if (['posted', 'reconciled'].includes(txn.status)) {
            ledgerEntries = await db.select({
                id: ledger_entry.id,
                accountId: ledger_entry.accountId,
                accountCode: chart_of_accounts.code,
                accountName: chart_of_accounts.name,
                date: ledger_entry.date,
                debit: ledger_entry.debit,
                credit: ledger_entry.credit,
                postedAt: ledger_entry.postedAt,
            })
                .from(ledger_entry)
                .innerJoin(chart_of_accounts, eq(ledger_entry.accountId, chart_of_accounts.id))
                .where(eq(ledger_entry.transactionId, id));
        }

        // Get reconciliation info
        let reconInfo: any = null;
        if (txn.status === 'reconciled') {
            const reconRecords = await db.select().from(reconciliation)
                .where(eq(reconciliation.transactionId, id)).limit(1);
            if (reconRecords.length > 0) reconInfo = reconRecords[0];
        }

        // Get user names for audit trail
        const creatorName = txn.createdBy
            ? (await db.select({ name: user.name }).from(user).where(eq(user.id, txn.createdBy)).limit(1))[0]?.name
            : null;
        const approverName = txn.approvedBy
            ? (await db.select({ name: user.name }).from(user).where(eq(user.id, txn.approvedBy)).limit(1))[0]?.name
            : null;

        res.status(200).json({
            ...txn,
            creatorName,
            approverName,
            journalLines: lines,
            ledgerEntries,
            reconciliation: reconInfo,
        });
    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ==========================================
// CREATE DRAFT TRANSACTION with journal lines
// ==========================================
export const createTransaction = async (req: AuthRequest, res: Response) => {
    try {
        // const { date, description, reference, type, notes, journalLines } = req.body;
        const { date, description, reference, type, notes, journalLines } = req.body;

        let userId = req.user?.id;
        let branchId = req.user?.branchId;

        // Handle Branch Login (Manager Portal)
        if (req.user?.role === 'branch') {
            branchId = req.user.id;
            userId = null; // Branches are not Users, so createdBy must be null
        }

        if (!date || !description || !type) {
            return res.status(400).json({ message: 'Missing required fields: date, description, type' });
        }
        if (!journalLines || journalLines.length < 2) {
            return res.status(400).json({ message: 'At least 2 journal lines required (debit + credit)' });
        }

        const txnId = uuidv4();
        const txnNumber = generateTxnNumber();

        // Calculate total amount
        let totalDebit = 0;
        let totalCredit = 0;
        journalLines.forEach((line: any) => {
            totalDebit += parseFloat(line.debit || '0');
            totalCredit += parseFloat(line.credit || '0');
        });

        const totalAmount = Math.max(totalDebit, totalCredit);
        const requiresAdmin = totalAmount >= ADMIN_APPROVAL_THRESHOLD;

        // Create transaction header
        await db.insert(transaction).values({
            id: txnId,
            transactionNumber: txnNumber,
            date: new Date(date),
            description,
            reference: reference || null,
            type,
            status: 'draft',
            branchId: branchId || null,
            totalAmount: totalAmount.toFixed(2),
            notes: notes || null,
            createdBy: userId,
            requiresAdminApproval: requiresAdmin,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Create journal lines
        for (let i = 0; i < journalLines.length; i++) {
            const line = journalLines[i];
            await db.insert(journal_line).values({
                id: uuidv4(),
                transactionId: txnId,
                accountId: line.accountId,
                description: line.description || null,
                debit: (parseFloat(line.debit || '0')).toFixed(2),
                credit: (parseFloat(line.credit || '0')).toFixed(2),
                lineOrder: i,
                createdAt: new Date(),
            });
        }

        res.status(201).json({
            message: 'Transaction created as draft',
            id: txnId,
            transactionNumber: txnNumber,
            requiresAdminApproval: requiresAdmin,
        });
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ==========================================
// UPDATE DRAFT TRANSACTION
// ==========================================
export const updateTransaction = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { date, description, reference, type, notes, journalLines } = req.body;

        const txns = await db.select().from(transaction).where(eq(transaction.id, id)).limit(1);
        if (txns.length === 0) return res.status(404).json({ message: 'Transaction not found' });

        if (txns[0].status !== 'draft') {
            return res.status(400).json({ message: 'Only draft transactions can be edited' });
        }

        // Recalculate totals
        let totalDebit = 0;
        let totalCredit = 0;
        if (journalLines) {
            journalLines.forEach((line: any) => {
                totalDebit += parseFloat(line.debit || '0');
                totalCredit += parseFloat(line.credit || '0');
            });
        }

        const totalAmount = Math.max(totalDebit, totalCredit);

        await db.update(transaction).set({
            date: date ? new Date(date) : undefined,
            description,
            reference,
            type,
            notes,
            totalAmount: totalAmount.toFixed(2),
            requiresAdminApproval: totalAmount >= ADMIN_APPROVAL_THRESHOLD,
            updatedAt: new Date(),
        }).where(eq(transaction.id, id));

        // Replace journal lines
        if (journalLines) {
            await db.delete(journal_line).where(eq(journal_line.transactionId, id));
            for (let i = 0; i < journalLines.length; i++) {
                const line = journalLines[i];
                await db.insert(journal_line).values({
                    id: uuidv4(),
                    transactionId: id,
                    accountId: line.accountId,
                    description: line.description || null,
                    debit: (parseFloat(line.debit || '0')).toFixed(2),
                    credit: (parseFloat(line.credit || '0')).toFixed(2),
                    lineOrder: i,
                    createdAt: new Date(),
                });
            }
        }

        res.status(200).json({ message: 'Transaction updated' });
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ==========================================
// SUBMIT FOR APPROVAL (validate debit = credit)
// ==========================================
export const submitTransaction = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const txns = await db.select().from(transaction).where(eq(transaction.id, id)).limit(1);
        if (txns.length === 0) return res.status(404).json({ message: 'Transaction not found' });
        if (txns[0].status !== 'draft') {
            return res.status(400).json({ message: 'Only draft transactions can be submitted' });
        }

        // Validate: total debits must equal total credits
        const lines = await db.select({
            debit: journal_line.debit,
            credit: journal_line.credit,
        }).from(journal_line).where(eq(journal_line.transactionId, id));

        const totalDebit = lines.reduce((sum, l) => sum + parseFloat(l.debit || '0'), 0);
        const totalCredit = lines.reduce((sum, l) => sum + parseFloat(l.credit || '0'), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            return res.status(400).json({
                message: `Debits ($${totalDebit.toFixed(2)}) must equal Credits ($${totalCredit.toFixed(2)})`,
                totalDebit: totalDebit.toFixed(2),
                totalCredit: totalCredit.toFixed(2),
            });
        }

        if (lines.length < 2) {
            return res.status(400).json({ message: 'At least 2 journal lines required' });
        }

        await db.update(transaction).set({
            status: 'pending_approval',
            submittedAt: new Date(),
            updatedAt: new Date(),
        }).where(eq(transaction.id, id));

        res.status(200).json({ message: 'Transaction submitted for approval' });
    } catch (error) {
        console.error('Error submitting transaction:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ==========================================
// APPROVE TRANSACTION (maker-checker: approver ≠ creator)
// ==========================================
export const approveTransaction = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const txns = await db.select().from(transaction).where(eq(transaction.id, id)).limit(1);
        if (txns.length === 0) return res.status(404).json({ message: 'Transaction not found' });

        const txn = txns[0];
        if (txn.status !== 'pending_approval') {
            return res.status(400).json({ message: 'Only pending transactions can be approved' });
        }

        // Maker-Checker: approver cannot be the creator
        if (txn.createdBy === userId) {
            return res.status(403).json({ message: 'You cannot approve your own transaction (Maker-Checker policy)' });
        }

        await db.update(transaction).set({
            status: 'approved',
            approvedBy: userId,
            approvedAt: new Date(),
            updatedAt: new Date(),
        }).where(eq(transaction.id, id));

        res.status(200).json({ message: 'Transaction approved' });
    } catch (error) {
        console.error('Error approving transaction:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ==========================================
// REJECT TRANSACTION
// ==========================================
export const rejectTransaction = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user?.id;

        const txns = await db.select().from(transaction).where(eq(transaction.id, id)).limit(1);
        if (txns.length === 0) return res.status(404).json({ message: 'Transaction not found' });

        if (txns[0].status !== 'pending_approval') {
            return res.status(400).json({ message: 'Only pending transactions can be rejected' });
        }

        await db.update(transaction).set({
            status: 'rejected',
            rejectedBy: userId,
            rejectedAt: new Date(),
            rejectionReason: reason || 'No reason provided',
            updatedAt: new Date(),
        }).where(eq(transaction.id, id));

        res.status(200).json({ message: 'Transaction rejected' });
    } catch (error) {
        console.error('Error rejecting transaction:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ==========================================
// POST TO LEDGER (create immutable ledger entries)
// ==========================================
export const postTransaction = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const txns = await db.select().from(transaction).where(eq(transaction.id, id)).limit(1);
        if (txns.length === 0) return res.status(404).json({ message: 'Transaction not found' });

        if (txns[0].status !== 'approved') {
            return res.status(400).json({ message: 'Only approved transactions can be posted to ledger' });
        }

        const lines = await db.select().from(journal_line).where(eq(journal_line.transactionId, id));

        // Create immutable ledger entries from journal lines
        for (const line of lines) {
            await db.insert(ledger_entry).values({
                id: uuidv4(),
                transactionId: id,
                journalLineId: line.id,
                accountId: line.accountId,
                date: txns[0].date,
                debit: line.debit,
                credit: line.credit,
                branchId: txns[0].branchId,
                postedAt: new Date(),
            });
        }

        await db.update(transaction).set({
            status: 'posted',
            postedBy: userId,
            postedAt: new Date(),
            updatedAt: new Date(),
        }).where(eq(transaction.id, id));

        res.status(200).json({ message: 'Transaction posted to ledger' });
    } catch (error) {
        console.error('Error posting transaction:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ==========================================
// RECONCILE TRANSACTION
// ==========================================
export const reconcileTransaction = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { bankStatementRef, bankDate, matchedAmount, notes } = req.body;
        const userId = req.user?.id;

        const txns = await db.select().from(transaction).where(eq(transaction.id, id)).limit(1);
        if (txns.length === 0) return res.status(404).json({ message: 'Transaction not found' });

        if (txns[0].status !== 'posted') {
            return res.status(400).json({ message: 'Only posted transactions can be reconciled' });
        }

        const txnAmount = parseFloat(txns[0].totalAmount || '0');
        const matched = parseFloat(matchedAmount || '0');
        const difference = Math.abs(txnAmount - matched);
        const reconStatus = difference < 0.01 ? 'matched' : (matched > 0 ? 'partial' : 'unmatched');

        await db.insert(reconciliation).values({
            id: uuidv4(),
            transactionId: id,
            bankStatementRef: bankStatementRef || null,
            bankDate: bankDate ? new Date(bankDate) : null,
            matchedAmount: matched.toFixed(2),
            difference: difference.toFixed(2),
            status: reconStatus,
            reconciledBy: userId,
            reconciledAt: new Date(),
            notes: notes || null,
        });

        await db.update(transaction).set({
            status: 'reconciled',
            updatedAt: new Date(),
        }).where(eq(transaction.id, id));

        res.status(200).json({ message: 'Transaction reconciled', reconStatus });
    } catch (error) {
        console.error('Error reconciling transaction:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ==========================================
// GET LEDGER ENTRIES
// ==========================================
export const getLedgerEntries = async (req: AuthRequest, res: Response) => {
    try {
        const { accountId, startDate, endDate } = req.query;
        const branchId = req.user?.branchId;

        const conditions: any[] = [];
        if (branchId) conditions.push(eq(ledger_entry.branchId, branchId));
        if (accountId) conditions.push(eq(ledger_entry.accountId, accountId as string));
        if (startDate && endDate) {
            conditions.push(sql`${ledger_entry.date} >= ${new Date(startDate as string)}`);
            conditions.push(sql`${ledger_entry.date} <= ${new Date(endDate as string)}`);
        }

        const entries = await db.select({
            id: ledger_entry.id,
            transactionId: ledger_entry.transactionId,
            accountId: ledger_entry.accountId,
            accountCode: chart_of_accounts.code,
            accountName: chart_of_accounts.name,
            date: ledger_entry.date,
            debit: ledger_entry.debit,
            credit: ledger_entry.credit,
            postedAt: ledger_entry.postedAt,
        })
            .from(ledger_entry)
            .innerJoin(chart_of_accounts, eq(ledger_entry.accountId, chart_of_accounts.id))
            .where(conditions.length > 0 ? and(...conditions) : undefined)
            .orderBy(desc(ledger_entry.postedAt));

        res.status(200).json(entries);
    } catch (error) {
        console.error('Error fetching ledger:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ==========================================
// REPORTS: SUMMARY
// ==========================================
export const getReportsSummary = async (req: AuthRequest, res: Response) => {
    try {
        const branchId = req.user?.branchId;

        const conditions: any[] = [];
        if (branchId) conditions.push(eq(transaction.branchId, branchId));

        const allTxns = await db.select({
            status: transaction.status,
            totalAmount: transaction.totalAmount,
            type: transaction.type,
            date: transaction.date,
        })
            .from(transaction)
            .where(conditions.length > 0 ? and(...conditions) : undefined);

        // Status breakdown
        const statusCounts: Record<string, number> = {};
        allTxns.forEach(t => {
            statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
        });

        // Totals by type
        const typeTotals: Record<string, number> = {};
        allTxns.forEach(t => {
            typeTotals[t.type] = (typeTotals[t.type] || 0) + parseFloat(t.totalAmount || '0');
        });

        // Debit vs Credit from ledger
        const ledgerConditions: any[] = [];
        if (branchId) ledgerConditions.push(eq(ledger_entry.branchId, branchId));

        const ledgerAgg = await db.select({
            totalDebit: sql<string>`COALESCE(SUM(${ledger_entry.debit}), 0)`,
            totalCredit: sql<string>`COALESCE(SUM(${ledger_entry.credit}), 0)`,
        })
            .from(ledger_entry)
            .where(ledgerConditions.length > 0 ? and(...ledgerConditions) : undefined);

        // Trial balance by account
        const trialBalance = await db.select({
            accountId: ledger_entry.accountId,
            accountCode: chart_of_accounts.code,
            accountName: chart_of_accounts.name,
            accountType: chart_of_accounts.type,
            totalDebit: sql<string>`COALESCE(SUM(${ledger_entry.debit}), 0)`,
            totalCredit: sql<string>`COALESCE(SUM(${ledger_entry.credit}), 0)`,
        })
            .from(ledger_entry)
            .innerJoin(chart_of_accounts, eq(ledger_entry.accountId, chart_of_accounts.id))
            .where(ledgerConditions.length > 0 ? and(...ledgerConditions) : undefined)
            .groupBy(ledger_entry.accountId, chart_of_accounts.code, chart_of_accounts.name, chart_of_accounts.type);

        res.status(200).json({
            totalTransactions: allTxns.length,
            statusCounts,
            typeTotals,
            ledgerTotals: {
                totalDebit: ledgerAgg[0]?.totalDebit || '0',
                totalCredit: ledgerAgg[0]?.totalCredit || '0',
            },
            trialBalance,
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ==========================================
// GET CHART OF ACCOUNTS
// ==========================================
export const getAccounts = async (req: AuthRequest, res: Response) => {
    try {
        const accounts = await db.select()
            .from(chart_of_accounts)
            .where(eq(chart_of_accounts.isActive, true))
            .orderBy(asc(chart_of_accounts.code));

        res.status(200).json(accounts);
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
