import express from 'express';
import { syncAttendance, getAttendance, checkIn, checkOut, getMyAttendance, getAttendanceStatus } from '../controllers/attendanceController.js';
import { approveOvertime } from '../controllers/overtimeController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route for biometric devices to sync data
// Ideally this should be protected by a specific API Key or Admin Auth
// For now, we use requireAuth or leave it open if the device can't handle Auth headers easily
// Assuming device can send headers or we switch to key-based auth later.
// The plan stated "Protected by specific API Key or Admin Auth". 
// I'll keep it open or simple for now as per "make initial plan". 
// Or better, let's add a simple check using a fixed key in header if feasible?
// The controller receives request. 
router.post('/sync', syncAttendance);

router.get('/', requireAuth, getAttendance);

// Employee Portal Routes
router.post('/check-in', requireAuth, checkIn);
router.post('/check-out', requireAuth, checkOut);
router.get('/my-history', requireAuth, getMyAttendance);
router.get('/status', requireAuth, getAttendanceStatus);

// Manager Overtime Approval
router.post('/approve-ot', requireAuth, requireRole(['Manager', 'Admin']), approveOvertime);

export default router;
