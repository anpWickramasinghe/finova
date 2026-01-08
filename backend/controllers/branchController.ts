import { Request, Response } from 'express';
import { db } from '../config/db.js';
import { branch, user } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { sql } from 'drizzle-orm';

export const getAllBranches = async (req: Request, res: Response) => {
    try {
        // Get branches with employee count
        const branches = await db.select({
            id: branch.id,
            name: branch.name,
            manager: branch.manager,
            contactNumber: branch.contactNumber,
            revenue: branch.revenue,
            lastAudit: branch.lastAudit,
            createdAt: branch.createdAt,
            updatedAt: branch.updatedAt,
            employeeCount: sql<number>`count(${user.id})`.mapWith(Number)
        })
            .from(branch)
            .leftJoin(user, eq(branch.id, user.branchId))
            .groupBy(branch.id);

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

        // Unassign users from this branch first
        await db.update(user)
            .set({ branchId: null })
            .where(eq(user.branchId, id));

        // Delete the branch
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

        // Get employees where branchId matches the requested branch ID
        const employees = await db.select().from(user).where(eq(user.branchId, id));
        res.json(employees);
    } catch (error) {
        console.error('Error fetching branch employees:', error);
        res.status(500).json({ message: 'Failed to fetch branch employees' });
    }
};
