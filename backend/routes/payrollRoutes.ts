import express from "express";
import {
  generatePayroll,
  bulkGeneratePayroll,
  bulkSubmitApproval,
  bulkApprovePayroll,
  getPayrollRecords,
  getPayrollById,
  updatePayrollStatus,
  deletePayroll,
} from "../controllers/payrollController.js";
import {
  getSalaryComponents,
  createSalaryComponent,
  updateSalaryComponent,
  deleteSalaryComponent,
  getEmployeeComponents,
  assignComponentToEmployee,
  removeComponentFromEmployee,
} from "../controllers/salaryComponentController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(requireAuth);

// --- SALARY COMPONENTS CONFIGURATION ---
router.get(
  "/components",
  requireRole(["admin", "manager"]),
  getSalaryComponents,
);
router.post("/components", requireRole(["admin"]), createSalaryComponent);
router.put("/components/:id", requireRole(["admin"]), updateSalaryComponent);
router.delete("/components/:id", requireRole(["admin"]), deleteSalaryComponent);

// --- EMPLOYEE SALARY MAPPINGS ---
router.get(
  "/mappings/:userId",
  requireRole(["admin", "manager"]),
  getEmployeeComponents,
);
router.post(
  "/mappings/:userId",
  requireRole(["admin"]),
  assignComponentToEmployee,
);
router.delete(
  "/mappings/entry/:id",
  requireRole(["admin"]),
  removeComponentFromEmployee,
);

// --- PAYROLL LIFECYCLE ---
router.post("/generate", requireRole(["admin", "manager"]), generatePayroll);
router.post("/bulk", requireRole(["admin", "manager"]), bulkGeneratePayroll);
router.post(
  "/bulk-submit",
  requireRole(["admin", "manager"]),
  bulkSubmitApproval,
);
router.post("/bulk-approve", requireRole(["admin"]), bulkApprovePayroll);
router.get("/", requireRole(["admin", "manager"]), getPayrollRecords);
router.get("/:id", requireRole(["admin", "manager"]), getPayrollById);
router.patch("/:id/status", requireRole(["admin"]), updatePayrollStatus);
router.delete("/:id", requireRole(["admin"]), deletePayroll);

export default router;
