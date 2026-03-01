// =============================================================================
// routes/sessions.ts — Express routes for session management
// =============================================================================

import { Request, Response, Router } from 'express';
import { Session } from '../models/Session';

const router = Router();

// =============================================================================
// POST /api/sessions — Create a new session
// =============================================================================

interface CreateSessionBody {
    session_id: string;
    start_time: number;
    start_time_hr: number;
    end_time: number | null;
    status: 'active' | 'completed' | 'abandoned';
    device_info: {
        platform: string;
        os_version: string;
        device_model: string;
        screen_width: number;
        screen_height: number;
    };
}

router.post('/', async (req: Request<object, object, CreateSessionBody>, res: Response) => {
    try {
        const { session_id, start_time, start_time_hr, device_info, status } = req.body;

        if (!session_id || !start_time || !device_info) {
            res.status(400).json({
                error: 'Invalid payload',
                message: 'session_id, start_time, and device_info are required',
            });
            return;
        }

        const session = new Session({
            session_id,
            start_time,
            start_time_hr,
            end_time: null,
            status: status || 'active',
            device_info,
        });

        await session.save();

        res.status(201).json({
            success: true,
            session_id: session.session_id,
            message: 'Session created successfully',
        });
    } catch (error) {
        // Handle duplicate session_id
        if (error instanceof Error && 'code' in error && (error as Record<string, unknown>).code === 11000) {
            res.status(409).json({
                error: 'Duplicate session',
                message: 'Session with this ID already exists',
            });
            return;
        }

        console.error('[Sessions] Create error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// =============================================================================
// GET /api/sessions/:id — Get session by ID
// =============================================================================

router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
    try {
        const session = await Session.findOne({ session_id: req.params.id }).lean();

        if (!session) {
            res.status(404).json({
                error: 'Not found',
                message: `Session ${req.params.id} not found`,
            });
            return;
        }

        res.json(session);
    } catch (error) {
        console.error('[Sessions] Fetch error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// =============================================================================
// PATCH /api/sessions/:id — Update session (e.g., end_time, status)
// =============================================================================

interface UpdateSessionBody {
    end_time?: number;
    status?: 'active' | 'completed' | 'abandoned';
}

router.patch('/:id', async (req: Request<{ id: string }, object, UpdateSessionBody>, res: Response) => {
    try {
        const update: Record<string, unknown> = {};

        if (req.body.end_time !== undefined) {
            update.end_time = req.body.end_time;
        }
        if (req.body.status !== undefined) {
            update.status = req.body.status;
        }

        const session = await Session.findOneAndUpdate(
            { session_id: req.params.id },
            { $set: update },
            { new: true },
        ).lean();

        if (!session) {
            res.status(404).json({
                error: 'Not found',
                message: `Session ${req.params.id} not found`,
            });
            return;
        }

        res.json({
            success: true,
            session,
        });
    } catch (error) {
        console.error('[Sessions] Update error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// =============================================================================
// GET /api/sessions — List all sessions (with pagination)
// =============================================================================

router.get('/', async (req: Request, res: Response) => {
    try {
        const { status, limit = '50', offset = '0' } = req.query;

        const filter: Record<string, unknown> = {};
        if (status && typeof status === 'string') {
            filter.status = status;
        }

        const sessions = await Session.find(filter)
            .sort({ start_time: -1 })
            .skip(Number(offset))
            .limit(Number(limit))
            .lean();

        const total = await Session.countDocuments(filter);

        res.json({
            total,
            count: sessions.length,
            offset: Number(offset),
            limit: Number(limit),
            sessions,
        });
    } catch (error) {
        console.error('[Sessions] List error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;
