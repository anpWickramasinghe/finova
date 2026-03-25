import { Request, Response } from 'express';
import { db } from '../config/db.js';
import { branch, user } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const getAllBranches = async (req: Request, res: Response) => {
    try {

        const branches = await db.select({
            id: branch.id,
            name: branch.name,
            email: branch.email,
            manager: branch.manager,
            stripeAccountId: branch.stripeAccountId,
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
        const { name, email, password, manager, contactNumber } = req.body;

        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        const newBranch = {
            id: uuidv4(),
            name,
            email,
            password: hashedPassword,
            manager,
            contactNumber,
            employeeCount: '0',
            revenue: '0',
            stripeAccountId: req.body.stripeAccountId || null,
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
        const { name, email, password, manager, contactNumber } = req.body;

        const updateData: any = {
            name,
            email,
            manager,
            contactNumber,
            stripeAccountId: req.body.stripeAccountId !== undefined ? req.body.stripeAccountId : undefined,
            updatedAt: new Date()
        };

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await db.update(branch)
            .set(updateData)
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

export const loginBranch = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const branches = await db.select().from(branch).where(eq(branch.email, email));
        const foundBranch = branches[0];

        if (!foundBranch || !foundBranch.password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, foundBranch.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            {
                id: foundBranch.id,
                role: 'branch',
                name: foundBranch.name,
                email: foundBranch.email
            },
            process.env.JWT_SECRET!,
            { expiresIn: '12h' }
        );

        res.json({
            token,
            user: {
                id: foundBranch.id,
                name: foundBranch.name,
                email: foundBranch.email,
                role: 'branch'
            }
        });
    } catch (error) {
        console.error('Error logging in branch:', error);
        res.status(500).json({ message: 'Login failed' });
    }
};

import { createStripeTransfer, createConnectedTestAccount } from '../services/stripeService.js';

export const connectBranchStripe = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const branches = await db.select().from(branch).where(eq(branch.id, id));
        const foundBranch = branches[0];

        if (!foundBranch) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        if (foundBranch.stripeAccountId) {
            return res.status(400).json({ message: 'Branch already has a connected Stripe Account' });
        }

        // Create the connected account using the branch's email
        const account = await createConnectedTestAccount(foundBranch.email || '');

        // Save it to the database
        await db.update(branch)
            .set({ stripeAccountId: account.id })
            .where(eq(branch.id, id));

        const updatedBranches = await db.select().from(branch).where(eq(branch.id, id));

        res.json({
            message: 'Stripe account connected successfully',
            branch: updatedBranches[0]
        });
    } catch (error: any) {
        console.error('Error connecting branch Stripe account:', error);
        res.status(500).json({ message: error.message || 'Failed to connect Stripe account' });
    }
};

export const transferToBranchStripe = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { amount, currency = 'usd' } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid transfer amount' });
        }

        const branches = await db.select().from(branch).where(eq(branch.id, id));
        const foundBranch = branches[0];

        if (!foundBranch) {
            return res.status(404).json({ message: 'Branch not found' });
        }

        if (!foundBranch.stripeAccountId) {
            return res.status(400).json({ message: 'Branch does not have a connected Stripe Account' });
        }

        const transfer = await createStripeTransfer({
            amount,
            currency,
            destinationAccountId: foundBranch.stripeAccountId,
            description: `Fund transfer to branch ${foundBranch.name}`,
            metadata: {
                type: 'branch_fund_transfer',
                branchId: foundBranch.id,
            },
        });

        res.json({
            message: 'Transfer successful',
            transferId: transfer.id,
        });
    } catch (error: any) {
        console.error('Error in transferToBranchStripe:', error);
        res.status(500).json({ message: error.message || 'Transfer failed' });
    }
};
