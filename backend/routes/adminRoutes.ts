import express from 'express';
import { createUser, getUsers, updateUser, deleteUser } from '../controllers/adminController.js';
import {
    getOvertimeSettings, updateOvertimeSettings,
    getHolidays, createHoliday, deleteHoliday, syncHolidays,

} from '../controllers/overtimeController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/users', requireAuth, requireRole(['Admin']), createUser);
router.get('/users', requireAuth, requireRole(['Admin']), getUsers);
router.put('/users/:id', requireAuth, requireRole(['Admin']), updateUser);
router.delete('/users/:id', requireAuth, requireRole(['Admin']), deleteUser);

// Overtime Settings
router.get('/overtime-settings', requireAuth, requireRole(['Admin']), getOvertimeSettings);
router.put('/overtime-settings', requireAuth, requireRole(['Admin']), updateOvertimeSettings);

// Holidays
router.get('/holidays', requireAuth, requireRole(['Admin']), getHolidays);
router.post('/holidays', requireAuth, requireRole(['Admin']), createHoliday);
router.post('/holidays/sync', requireAuth, requireRole(['Admin']), syncHolidays);
router.delete('/holidays/:id', requireAuth, requireRole(['Admin']), deleteHoliday);



export default router;
