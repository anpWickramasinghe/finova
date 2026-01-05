import express from 'express';
import {
    getAllBranches,
    createBranch,
    updateBranch,
    deleteBranch,
    getBranchEmployees
} from '../controllers/branchController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(requireAuth);

router.get('/', getAllBranches);
router.post('/', createBranch);
router.put('/:id', updateBranch);
router.delete('/:id', deleteBranch);
router.get('/:id/employees', getBranchEmployees);

export default router;
