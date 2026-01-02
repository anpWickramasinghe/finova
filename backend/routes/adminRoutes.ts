import express from 'express';
import { createUser } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/users', requireAuth, requireRole(['admin']), createUser);

export default router;
