// =============================================================================
// routes/interactions.ts — Express routes for interaction logs
// =============================================================================

import { Request, Response, Router } from 'express';
import { InteractionLog } from '../models/InteractionLog';

const router = Router();

// =============================================================================
// POST /api/interactions — Batch insert interaction logs
// =============================================================================

interface BatchRequestBody {
    session_id: string;
    batch_id: string;
    timestamp: number;
    events: Array<{
        session_id: string;
        event_type: string;
        timestamp: number;
        timestamp_hr: number;
        screen: string;
        data: Record<string, unknown>;
    }>;
    event_count: number;
}

router.post('/', async (req: Request<object, object, BatchRequestBody>, res: Response) => {
    try {
        const { session_id, batch_id, events, event_count } = req.body;

        if (!session_id || !batch_id || !events || !Array.isArray(events)) {
            res.status(400).json({
                error: 'Invalid payload',
                message: 'session_id, batch_id, and events array are required',
            });
            return;
        }

        // Tambahkan batch_id ke setiap event
        const enrichedEvents = events.map(event => ({
            ...event,
            batch_id,
            session_id, // Pastikan session_id konsisten
        }));

        // Batch insert menggunakan insertMany untuk performance
        const result = await InteractionLog.insertMany(enrichedEvents, {
            ordered: false, // Continue inserting even if some fail
        });

        res.status(201).json({
            success: true,
            inserted_count: result.length,
            batch_id,
            session_id,
        });
    } catch (error) {
        console.error('[Interactions] Batch insert error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// =============================================================================
// GET /api/interactions/:sessionId — Get logs by session ID
// =============================================================================

router.get('/:sessionId', async (req: Request<{ sessionId: string }>, res: Response) => {
    try {
        const { sessionId } = req.params;
        const { event_type, screen, limit = '1000', offset = '0' } = req.query;

        // Build query filter
        const filter: Record<string, unknown> = { session_id: sessionId };

        if (event_type && typeof event_type === 'string') {
            filter.event_type = event_type;
        }
        if (screen && typeof screen === 'string') {
            filter.screen = screen;
        }

        const logs = await InteractionLog.find(filter)
            .sort({ timestamp: 1 })
            .skip(Number(offset))
            .limit(Number(limit))
            .lean();

        const total = await InteractionLog.countDocuments(filter);

        res.json({
            session_id: sessionId,
            total,
            count: logs.length,
            offset: Number(offset),
            limit: Number(limit),
            logs,
        });
    } catch (error) {
        console.error('[Interactions] Fetch error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// =============================================================================
// GET /api/interactions/:sessionId/summary — Get session interaction summary
// =============================================================================

router.get('/:sessionId/summary', async (req: Request<{ sessionId: string }>, res: Response) => {
    try {
        const { sessionId } = req.params;

        const summary = await InteractionLog.aggregate([
            { $match: { session_id: sessionId } },
            {
                $group: {
                    _id: { event_type: '$event_type', screen: '$screen' },
                    count: { $sum: 1 },
                    first_timestamp: { $min: '$timestamp' },
                    last_timestamp: { $max: '$timestamp' },
                },
            },
            {
                $group: {
                    _id: '$_id.screen',
                    events: {
                        $push: {
                            event_type: '$_id.event_type',
                            count: '$count',
                            first_timestamp: '$first_timestamp',
                            last_timestamp: '$last_timestamp',
                        },
                    },
                    total_events: { $sum: '$count' },
                },
            },
            { $sort: { '_id': 1 } },
        ]);

        const totalEvents = summary.reduce(
            (sum: number, s: { total_events: number }) => sum + s.total_events,
            0,
        );

        res.json({
            session_id: sessionId,
            total_events: totalEvents,
            screens: summary.map(s => ({
                screen: s._id,
                total_events: s.total_events,
                events: s.events,
            })),
        });
    } catch (error) {
        console.error('[Interactions] Summary error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;
