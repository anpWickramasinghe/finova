import express from 'express';
import { createUser, getUsers, updateUser, deleteUser } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/users', requireAuth, requireRole(['Admin']), createUser);
router.get('/users', requireAuth, requireRole(['Admin']), getUsers);
router.put('/users/:id', requireAuth, requireRole(['Admin']), updateUser);
router.delete('/users/:id', requireAuth, requireRole(['Admin']), deleteUser);

export default router;
