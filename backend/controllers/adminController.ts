import { Request, Response } from 'express';
import { auth } from '../auth.js';
import crypto from 'crypto';
import { db } from '../config/db.js';
import { user, session, account } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const createUser = async (req: Request, res: Response) => {
    try {
        const { email, role, name, companyId } = req.body;

        // Generate strong temporary password
        const tempPassword = crypto.randomBytes(8).toString('hex') + 'A1!'; // Ensure complexity

        // Create user using better-auth API
        // This abstracts away the DB, so it works with Drizzle adapter automatically!
        const result = await auth.api.signUpEmail({
            body: {
                email,
                password: tempPassword,
                name,
                role,
                companyId,
                requiresPasswordChange: true,
                ...req.body // Pass other fields like phone, branch, etc. directly
            }
        });

        if (!result) {
            return res.status(400).json({ message: 'Failed to create user' });
        }

        res.status(201).json({
            message: 'User created successfully',
            user: result.user,
            tempPassword // Return this so Admin can share it
        });

    } catch (error: any) {
        // better-auth throws APIError
        res.status(500).json({ message: error.message || 'An error occurred' });
    }
};



export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await db.select().from(user);
        res.status(200).json(users);
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Failed to fetch users' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, email, role, phone, branchId, nic, address, epfNo, status, permissions } = req.body;

        await db.update(user)
            .set({
                name,
                email,
                role,
                phone,
                branchId,
                nic,
                address,
                epfNo,
                status,
                permissions: JSON.stringify(permissions), // Store as JSON string
                updatedAt: new Date()
            })
            .where(eq(user.id, id));

        const updatedUser = await db.select().from(user).where(eq(user.id, id));
        res.json(updatedUser[0]);
    } catch (error: any) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: error.message || 'Failed to update user' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Delete related sessions and accounts first to avoid foreign key constraints
        await db.delete(session).where(eq(session.userId, id));
        await db.delete(account).where(eq(account.userId, id));

        // Now delete the user
        await db.delete(user).where(eq(user.id, id));

        res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: error.message || 'Failed to delete user' });
    }
};
