import { Request, Response } from "express";
import { db } from "../config/db.js";
import { payroll, transaction } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import {
  createConnectedTestAccount,
  createStripeTransfer,
} from "../services/stripeService.js";

interface AuthRequest extends Request {
  user?: any;
}

const generateTxnNumber = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 999)
    .toString()
    .padStart(3, "0");
  return `TXN-${dateStr}-${random}`;
};

export const createStripeConnectedAccount = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { email, country } = req.body;
    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }

    const account = await createConnectedTestAccount(email, country || "US");
    res.status(201).json({
      message: "Stripe test connected account created",
      accountId: account.id,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    });
  } catch (error: any) {
    console.error("Error creating connected account:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const createBranchTransfer = async (req: AuthRequest, res: Response) => {
  try {
    const {
      amount,
      destinationAccountId,
      currency,
      toBranchId,
      description,
      notes,
      reference,
    } = req.body;

    if (!amount || !destinationAccountId) {
      return res
        .status(400)
        .json({ message: "amount and destinationAccountId are required" });
    }

    const transfer = await createStripeTransfer({
      amount: parseFloat(String(amount)),
      currency: currency || "usd",
      destinationAccountId,
      description: description || "Inter-branch transfer (test mode)",
      metadata: {
        type: "branch_transfer",
        fromBranchId: req.user?.branchId || "main",
        toBranchId: toBranchId || "unknown",
      },
    });

    const txnId = uuidv4();
    await db.insert(transaction).values({
      id: txnId,
      transactionNumber: generateTxnNumber(),
      date: new Date(),
      description: description || "Inter-branch fund transfer",
      reference: reference || transfer.id,
      type: "transfer",
      status: "approved",
      branchId: req.user?.branchId || null,
      totalAmount: parseFloat(String(amount)).toFixed(2),
      notes:
        notes ||
        `Stripe Test Transfer ${transfer.id} -> ${destinationAccountId}${toBranchId ? ` (toBranchId=${toBranchId})` : ""}`,
      createdBy: req.user?.id || null,
      approvedBy: req.user?.id || null,
      approvedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({
      message: "Branch transfer completed in Stripe test mode",
      transferId: transfer.id,
      transactionId: txnId,
      amount,
      currency: currency || "usd",
    });
  } catch (error: any) {
    console.error("Error creating branch transfer:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const payPayrollViaStripe = async (req: AuthRequest, res: Response) => {
  try {
    const { payrollId } = req.params;
    const { employeeAccountId, currency } = req.body;

    if (!employeeAccountId) {
      return res.status(400).json({ message: "employeeAccountId is required" });
    }

    const records = await db
      .select()
      .from(payroll)
      .where(eq(payroll.id, payrollId))
      .limit(1);

    if (records.length === 0) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    const record = records[0];
    const netSalary = parseFloat(record.netSalary || "0");
    if (!netSalary || netSalary <= 0) {
      return res.status(400).json({ message: "Invalid payroll net salary" });
    }

    if (!["Approved", "Paid"].includes(record.status || "")) {
      return res
        .status(400)
        .json({ message: "Payroll must be Approved before Stripe payout" });
    }

    const transfer = await createStripeTransfer({
      amount: netSalary,
      currency: currency || "usd",
      destinationAccountId: employeeAccountId,
      description: `Salary payout for payroll ${payrollId}`,
      metadata: {
        type: "salary_payout",
        payrollId,
        userId: record.userId,
      },
    });

    await db
      .update(payroll)
      .set({
        status: "Paid",
        paymentMethod: "Stripe Test Transfer",
        paymentReference: transfer.id,
        updatedAt: new Date(),
      })
      .where(eq(payroll.id, payrollId));

    res.status(200).json({
      message: "Payroll paid via Stripe test transfer",
      payrollId,
      transferId: transfer.id,
      amount: netSalary,
      currency: currency || "usd",
    });
  } catch (error: any) {
    console.error("Error paying payroll via Stripe:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};
