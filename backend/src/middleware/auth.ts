// =============================================================================
// middleware/auth.ts — JWT authentication & role authorization
// =============================================================================

import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, Role } from '../types/role';

const JWT_SECRET = process.env.JWT_SECRET || 'pharmacy_biometrics_secret_key_2026';

// =============================================================================
// Extend Express Request type
// =============================================================================

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

// =============================================================================
// authenticate — Verify JWT token dari header Authorization
// =============================================================================

export function authenticate(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Token tidak ditemukan. Gunakan header Authorization: Bearer <token>',
        });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                error: 'Token expired',
                message: 'Token sudah kadaluarsa. Silakan login ulang.',
            });
            return;
        }
        res.status(401).json({
            error: 'Invalid token',
            message: 'Token tidak valid.',
        });
    }
}

// =============================================================================
// authorize — Role-based access control
// =============================================================================

export function authorize(...allowedRoles: Role[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Autentikasi diperlukan.',
            });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                error: 'Forbidden',
                message: `Role '${req.user.role}' tidak memiliki akses ke resource ini.`,
            });
            return;
        }

        next();
    };
}
