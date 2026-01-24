import express from 'express';
import { createLeaveRequest, getLeaveRequests, updateLeaveStatus, getLeaveStats } from '../controllers/leaveController.js';

import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth); // Protect all leave routes

router.post('/', createLeaveRequest);

router.get('/stats', getLeaveStats);
router.get('/', getLeaveRequests);
router.patch('/:id/status', updateLeaveStatus);

export default router;
