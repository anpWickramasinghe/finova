import { Request, Response, NextFunction } from 'express';
import { auth } from '../auth.js';
import { fromNodeHeaders } from 'better-auth/node';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
    user?: any;
    session?: any;
}

// Protect middleware using Better Auth
export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers)
        });

        if (!session) {
            // Check for custom JWT (for branches)
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
                    req.user = decoded;
                    return next();
                } catch (err) {
                    // Token invalid, fall through to 401
                }
            }
            return res.status(401).json({ message: 'Not authorized' });
        }

        req.user = session.user;
        req.session = session.session;
        next();
    } catch (e) {
        console.error("Auth Middleware Error:", e);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const requireRole = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const userRole = req.user?.role?.toLowerCase();
        const allowedRoles = roles.map(r => r.toLowerCase());
        if (!userRole || !allowedRoles.includes(userRole)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient role' });
        }
        next();
    };
};

export const checkPasswordChangeRequired = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && req.user.requiresPasswordChange) {
        return res.status(403).json({
            message: 'Password change required',
            code: 'PASSWORD_CHANGE_REQUIRED'
        });
    }
    next();
};
