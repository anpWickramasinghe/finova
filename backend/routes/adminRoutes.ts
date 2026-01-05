import express from 'express';
import { createUser, getUsers } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/users', requireAuth, requireRole(['Admin']), createUser);
router.get('/users', requireAuth, requireRole(['Admin']), getUsers);

export default router;
