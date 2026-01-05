import { Request, Response } from 'express';
import { auth } from '../auth.js';
import crypto from 'crypto';
import { db } from '../config/db.js';
import { user } from '../db/schema.js';

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
