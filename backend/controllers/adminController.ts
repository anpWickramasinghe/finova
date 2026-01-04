import { Request, Response } from 'express';
import { auth } from '../auth.js';
import crypto from 'crypto';

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
