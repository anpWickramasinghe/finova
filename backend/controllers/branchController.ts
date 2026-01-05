import { Request, Response } from 'express';
import { db } from '../config/db.js';
import { branch, user } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const getAllBranches = async (req: Request, res: Response) => {
    try {
        const branches = await db.select().from(branch);
        res.json(branches);
    } catch (error) {
        console.error('Error fetching branches:', error);
        res.status(500).json({ message: 'Failed to fetch branches' });
    }
};

export const createBranch = async (req: Request, res: Response) => {
    try {
        const { name, manager, contactNumber } = req.body;
        const newBranch = {
            id: uuidv4(),
            name,
            manager,
            contactNumber,
            employeeCount: '0',
            revenue: '0',
            lastAudit: new Date(),
        };

        await db.insert(branch).values(newBranch);
        res.status(201).json(newBranch);
    } catch (error) {
        console.error('Error creating branch:', error);
        res.status(500).json({ message: 'Failed to create branch' });
    }
};

export const updateBranch = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, manager, contactNumber } = req.body;

        await db.update(branch)
            .set({ name, manager, contactNumber, updatedAt: new Date() })
            .where(eq(branch.id, id));

        const updatedBranch = await db.select().from(branch).where(eq(branch.id, id));
        res.json(updatedBranch[0]);
    } catch (error) {
        console.error('Error updating branch:', error);
        res.status(500).json({ message: 'Failed to update branch' });
    }
};

export const deleteBranch = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await db.delete(branch).where(eq(branch.id, id));
        res.json({ message: 'Branch deleted successfully' });
    } catch (error) {
        console.error('Error deleting branch:', error);
        res.status(500).json({ message: 'Failed to delete branch' });
    }
};

export const getBranchEmployees = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // First get the branch name to match with user's branch field
        // Note: In a real app, we should use IDs, but the user schema uses 'branch' name string
        const branchData = await db.select().from(branch).where(eq(branch.id, id));

        if (!branchData.length) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        const branchName = branchData[0].name;

        const employees = await db.select().from(user).where(eq(user.branchId, branchName));
        res.json(employees);
    } catch (error) {
        console.error('Error fetching branch employees:', error);
        res.status(500).json({ message: 'Failed to fetch branch employees' });
    }
};
