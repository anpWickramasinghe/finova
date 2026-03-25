import express from 'express';
import {
    getAllBranches,
    createBranch,
    updateBranch,
    deleteBranch,
    getBranchEmployees,
    loginBranch,
    connectBranchStripe,
    transferToBranchStripe
} from '../controllers/branchController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginBranch);

// Apply auth middleware to all routes
router.use(requireAuth);

router.get('/', getAllBranches);
router.post('/', createBranch);
router.put('/:id', updateBranch);
router.delete('/:id', deleteBranch);
router.get('/:id/employees', getBranchEmployees);
router.post('/:id/stripe-connect', connectBranchStripe);
router.post('/:id/stripe-transfer', transferToBranchStripe);

export default router;
