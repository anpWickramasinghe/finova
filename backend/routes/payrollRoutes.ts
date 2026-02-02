import express from 'express';
import { generatePayroll, getPayrollRecords } from '../controllers/payrollController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

// Generate payroll (Admin/Manager only?)
router.post('/generate', requireRole(['admin', 'manager']), generatePayroll);

// Get records
router.get('/', requireRole(['admin', 'manager']), getPayrollRecords);

export default router;
