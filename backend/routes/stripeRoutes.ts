import express from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import {
  createBranchTransfer,
  createStripeConnectedAccount,
  payPayrollViaStripe,
} from "../controllers/stripeController.js";

const router = express.Router();

router.use(requireAuth);

router.post(
  "/connected-accounts",
  requireRole(["admin", "manager"]),
  createStripeConnectedAccount,
);
router.post(
  "/branch-transfer",
  requireRole(["admin", "manager"]),
  createBranchTransfer,
);
router.post(
  "/payroll/:payrollId/pay",
  requireRole(["admin"]),
  payPayrollViaStripe,
);

export default router;
