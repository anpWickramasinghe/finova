import express from 'express';
import {
    getMyChat,
    markChatRead,
    getAdminChats,
    getAdminChatById,
    archiveChat,
    restoreChat,
    startAdminChat,
    getBranchChat,
    getAdminBranchChats
} from '../controllers/chatController.js';
import { upload, uploadFile } from '../controllers/uploadController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();


router.use(requireAuth);

// ---------- Upload  ----------
router.post('/upload', upload.single('file'), uploadFile);

// ---------- User endpoints ----------
router.get('/my-chat', getMyChat);
router.patch('/my-chat/read', markChatRead);
router.get('/branch/:branchId', getBranchChat);

// ---------- Admin endpoints ----------
router.get('/admin/chats', requireRole(['admin', 'manager']), getAdminChats);
router.get('/admin/branches', requireRole(['admin', 'manager']), getAdminBranchChats);
router.post('/admin/chats/start', requireRole(['admin', 'manager']), startAdminChat);
router.get('/admin/chats/:id', requireRole(['admin', 'manager']), getAdminChatById);
router.post('/admin/chats/:id/archive', requireRole(['admin', 'manager']), archiveChat);
router.post('/admin/chats/:id/restore', requireRole(['admin', 'manager']), restoreChat);

export default router;
