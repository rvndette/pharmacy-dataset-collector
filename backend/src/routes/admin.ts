// =============================================================================
// routes/admin.ts — Admin dashboard, export, and management routes
// =============================================================================

import { Request, Response, Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { Drug } from '../models/Drug';
import { InteractionLog } from '../models/InteractionLog';
import { Prescription } from '../models/Prescription';
import { Session } from '../models/Session';
import { User } from '../models/User';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

// =============================================================================
// GET /api/admin/stats — Statistik sistem
// =============================================================================

router.get('/stats', async (_req: Request, res: Response) => {
    try {
        const [
            totalSessions,
            totalUsers,
            totalLogs,
            totalPrescriptions,
            totalDrugs,
        ] = await Promise.all([
            Session.countDocuments(),
            User.countDocuments(),
            InteractionLog.countDocuments(),
            Prescription.countDocuments(),
            Drug.countDocuments(),
        ]);

        // Rata-rata durasi sesi (hanya sesi yang completed)
        const avgDurationResult = await Session.aggregate([
            { $match: { status: 'completed', end_time: { $ne: null } } },
            {
                $project: {
                    duration: { $subtract: ['$end_time', '$start_time'] },
                },
            },
            {
                $group: {
                    _id: null,
                    avg_duration: { $avg: '$duration' },
                },
            },
        ]);

        const avgDuration = avgDurationResult.length > 0
            ? Math.round(avgDurationResult[0].avg_duration)
            : 0;

        // Distribusi device
        const deviceDistribution = await Session.aggregate([
            {
                $group: {
                    _id: '$device_info.platform',
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
        ]);

        // Distribusi role user
        const roleDistribution = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        // Rata-rata event per sesi
        const avgEventsResult = await InteractionLog.aggregate([
            { $group: { _id: '$session_id', count: { $sum: 1 } } },
            { $group: { _id: null, avg_events: { $avg: '$count' } } },
        ]);

        const avgEventsPerSession = avgEventsResult.length > 0
            ? Math.round(avgEventsResult[0].avg_events)
            : 0;

        res.json({
            total_sessions: totalSessions,
            total_users: totalUsers,
            total_interaction_logs: totalLogs,
            total_prescriptions: totalPrescriptions,
            total_drugs: totalDrugs,
            avg_session_duration_ms: avgDuration,
            avg_events_per_session: avgEventsPerSession,
            device_distribution: deviceDistribution.map(d => ({
                platform: d._id || 'unknown',
                count: d.count,
            })),
            role_distribution: roleDistribution.map(r => ({
                role: r._id,
                count: r.count,
            })),
        });
    } catch (error) {
        console.error('[Admin] Stats error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// =============================================================================
// GET /api/admin/logger-status — Status logging server
// =============================================================================

router.get('/logger-status', async (_req: Request, res: Response) => {
    try {
        const totalLogs = await InteractionLog.countDocuments();

        const recentLogs = await InteractionLog.countDocuments({
            created_at: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
        });

        const activeSessions = await Session.countDocuments({ status: 'active' });

        res.json({
            status: 'online',
            total_logs: totalLogs,
            logs_last_hour: recentLogs,
            active_sessions: activeSessions,
            server_uptime_seconds: Math.round(process.uptime()),
        });
    } catch (error) {
        console.error('[Admin] Logger status error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// =============================================================================
// GET /api/admin/users — List semua user
// =============================================================================

router.get('/users', async (req: Request, res: Response) => {
    try {
        const { role, limit = '50', offset = '0' } = req.query;
        const filter: Record<string, unknown> = {};

        if (role && typeof role === 'string') {
            filter.role = role;
        }

        const users = await User.find(filter)
            .select('-password_hash')
            .sort({ created_at: -1 })
            .skip(Number(offset))
            .limit(Number(limit))
            .lean();

        const total = await User.countDocuments(filter);

        res.json({ total, count: users.length, users });
    } catch (error) {
        console.error('[Admin] List users error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// =============================================================================
// DELETE /api/admin/users/:id — Delete user
// =============================================================================

router.delete('/users/:id', async (req: Request<{ id: string }>, res: Response) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            res.status(404).json({ error: 'Not found', message: 'User tidak ditemukan.' });
            return;
        }
        res.json({ success: true, message: 'User berhasil dihapus.' });
    } catch (error) {
        console.error('[Admin] Delete user error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// =============================================================================
// POST /api/admin/reset-sessions — Reset sesi penelitian
// =============================================================================

router.post('/reset-sessions', async (_req: Request, res: Response) => {
    try {
        const sessionsDeleted = await Session.deleteMany({});
        const logsDeleted = await InteractionLog.deleteMany({});

        res.json({
            success: true,
            sessions_deleted: sessionsDeleted.deletedCount,
            logs_deleted: logsDeleted.deletedCount,
            message: 'Semua sesi penelitian berhasil direset.',
        });
    } catch (error) {
        console.error('[Admin] Reset sessions error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// =============================================================================
// GET /api/admin/export/json — Export raw nested JSON (anonymized)
// =============================================================================

router.get('/export/json', async (req: Request, res: Response) => {
    try {
        const { event_type, start_date, end_date, device_type } = req.query;

        // Build session filter
        const sessionFilter: Record<string, unknown> = {};
        if (device_type && typeof device_type === 'string') {
            sessionFilter['device_info.platform'] = device_type;
        }
        if (start_date && typeof start_date === 'string') {
            sessionFilter.start_time = { $gte: new Date(start_date).getTime() };
        }
        if (end_date && typeof end_date === 'string') {
            sessionFilter.start_time = {
                ...((sessionFilter.start_time as Record<string, unknown>) || {}),
                $lte: new Date(end_date).getTime(),
            };
        }

        const sessions = await Session.find(sessionFilter)
            .select('-_id -__v')
            .lean();

        const sessionIds = sessions.map(s => s.session_id);

        // Build interaction filter
        const logFilter: Record<string, unknown> = {
            session_id: { $in: sessionIds },
        };
        if (event_type && typeof event_type === 'string') {
            logFilter.event_type = event_type;
        }

        const logs = await InteractionLog.find(logFilter)
            .select('-_id -__v')
            .lean();

        // Group logs by session (anonymized — only UUID, no email)
        const exportData = sessions.map(session => ({
            session_id: session.session_id,
            start_time: session.start_time,
            end_time: session.end_time,
            status: session.status,
            device_info: session.device_info,
            interactions: logs.filter(log => log.session_id === session.session_id),
        }));

        res.json({
            export_timestamp: Date.now(),
            total_sessions: exportData.length,
            total_interactions: logs.length,
            data: exportData,
        });
    } catch (error) {
        console.error('[Admin] Export JSON error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// =============================================================================
// GET /api/admin/export/csv — Export tabular CSV (anonymized)
// =============================================================================

router.get('/export/csv', async (req: Request, res: Response) => {
    try {
        const { event_type, start_date, end_date, device_type } = req.query;

        const sessionFilter: Record<string, unknown> = {};
        if (device_type && typeof device_type === 'string') {
            sessionFilter['device_info.platform'] = device_type;
        }
        if (start_date && typeof start_date === 'string') {
            sessionFilter.start_time = { $gte: new Date(start_date).getTime() };
        }
        if (end_date && typeof end_date === 'string') {
            sessionFilter.start_time = {
                ...((sessionFilter.start_time as Record<string, unknown>) || {}),
                $lte: new Date(end_date).getTime(),
            };
        }

        const sessions = await Session.find(sessionFilter).lean();
        const sessionIds = sessions.map(s => s.session_id);

        const logFilter: Record<string, unknown> = {
            session_id: { $in: sessionIds },
        };
        if (event_type && typeof event_type === 'string') {
            logFilter.event_type = event_type;
        }

        const logs = await InteractionLog.find(logFilter)
            .sort({ session_id: 1, timestamp: 1 })
            .lean();

        // Build CSV
        const headers = [
            'session_id',
            'event_type',
            'screen',
            'timestamp',
            'timestamp_hr',
            'data_json',
        ];

        const csvRows = [headers.join(',')];

        for (const log of logs) {
            const row = [
                log.session_id,
                log.event_type,
                log.screen,
                log.timestamp.toString(),
                log.timestamp_hr.toString(),
                `"${JSON.stringify(log.data).replace(/"/g, '""')}"`,
            ];
            csvRows.push(row.join(','));
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=export_${Date.now()}.csv`);
        res.send(csvRows.join('\n'));
    } catch (error) {
        console.error('[Admin] Export CSV error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;
