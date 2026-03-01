// =============================================================================
// routes/auth.ts — Authentication routes (register & login)
// =============================================================================

import { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { JwtPayload, Role } from '../types/role';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pharmacy_biometrics_secret_key_2026';
const JWT_EXPIRES_IN = '7d';

// =============================================================================
// POST /api/auth/register — Registrasi user baru
// =============================================================================

interface RegisterBody {
    email: string;
    password: string;
    name: string;
    phone: string;
    role?: Role;
}

router.post('/register', async (req: Request<object, object, RegisterBody>, res: Response) => {
    try {
        const { email, password, name, phone, role } = req.body;

        if (!email || !password || !name || !phone) {
            res.status(400).json({
                error: 'Invalid payload',
                message: 'email, password, name, dan phone wajib diisi.',
            });
            return;
        }

        if (password.length < 6) {
            res.status(400).json({
                error: 'Validation error',
                message: 'Password minimal 6 karakter.',
            });
            return;
        }

        // Cek email sudah terdaftar
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            res.status(409).json({
                error: 'Duplicate email',
                message: 'Email sudah terdaftar.',
            });
            return;
        }

        const validRoles: Role[] = ['user', 'pharmacist', 'admin'];
        const userRole: Role = role && validRoles.includes(role) ? role : 'user';

        const user = new User({
            email: email.toLowerCase(),
            password_hash: password, // Will be hashed by pre-save hook
            name,
            phone,
            role: userRole,
        });

        await user.save();

        // Generate JWT
        const payload: JwtPayload = {
            user_id: String(user._id),
            email: user.email,
            role: user.role,
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        res.status(201).json({
            success: true,
            token,
            user: {
                user_id: user._id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('[Auth] Register error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// =============================================================================
// POST /api/auth/login — Login dengan email & password
// =============================================================================

interface LoginBody {
    email: string;
    password: string;
}

router.post('/login', async (req: Request<object, object, LoginBody>, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({
                error: 'Invalid payload',
                message: 'email dan password wajib diisi.',
            });
            return;
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            res.status(401).json({
                error: 'Authentication failed',
                message: 'Email atau password salah.',
            });
            return;
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({
                error: 'Authentication failed',
                message: 'Email atau password salah.',
            });
            return;
        }

        // Generate JWT
        const payload: JwtPayload = {
            user_id: String(user._id),
            email: user.email,
            role: user.role,
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        res.json({
            success: true,
            token,
            user: {
                user_id: user._id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('[Auth] Login error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;
