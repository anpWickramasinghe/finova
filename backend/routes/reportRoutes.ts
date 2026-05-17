
import express from 'express';
import { getReportStats } from '../controllers/reportController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(requireAuth);

router.get('/stats', getReportStats);

export default router;
