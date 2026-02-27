import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request to include userId
declare global {
    namespace Express {
        interface Request {
            userId?: number;
        }
    }
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const authenticateUser = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const token = req.cookies?.auth_token;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        req.userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};
