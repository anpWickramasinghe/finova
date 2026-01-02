import { auth } from '../auth.js';
import { fromNodeHeaders } from 'better-auth/node';

// Protect middleware using Better Auth
export const requireAuth = async (req, res, next) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers)
        });

        if (!session) {
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

export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient role' });
        }
        next();
    };
};

export const checkPasswordChangeRequired = (req, res, next) => {
    if (req.user && req.user.requiresPasswordChange) {
        return res.status(403).json({
            message: 'Password change required',
            code: 'PASSWORD_CHANGE_REQUIRED'
        });
    }
    next();
};
