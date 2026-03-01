// =============================================================================
// routes/prescriptions.ts — Prescription management routes
// =============================================================================

import { Request, Response, Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, authorize } from '../middleware/auth';
import { Prescription } from '../models/Prescription';

const router = Router();

// =============================================================================
// POST /api/prescriptions — User upload resep
// =============================================================================

interface CreatePrescriptionBody {
    session_id: string;
    image_url?: string;
    zoom_metadata?: {
        zoom_count: number;
        avg_zoom_level: number;
        total_viewing_time: number;
    };
}

router.post(
    '/',
    authenticate,
    authorize('user'),
    async (req: Request<object, object, CreatePrescriptionBody>, res: Response) => {
        try {
            const { session_id, image_url, zoom_metadata } = req.body;

            if (!session_id) {
                res.status(400).json({
                    error: 'Invalid payload',
                    message: 'session_id wajib diisi.',
                });
                return;
            }

            const prescription = new Prescription({
                prescription_id: uuidv4(),
                user_id: req.user!.user_id,
                session_id,
                image_url: image_url || '',
                status: 'pending',
                zoom_metadata: zoom_metadata || {
                    zoom_count: 0,
                    avg_zoom_level: 1,
                    total_viewing_time: 0,
                },
            });

            await prescription.save();

            res.status(201).json({
                success: true,
                prescription: {
                    prescription_id: prescription.prescription_id,
                    status: prescription.status,
                    created_at: prescription.created_at,
                },
            });
        } catch (error) {
            console.error('[Prescriptions] Create error:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    },
);

// =============================================================================
// GET /api/prescriptions — List prescriptions
// Pharmacist: semua pending; User: hanya milik sendiri
// =============================================================================

router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
        const { status, limit = '50', offset = '0' } = req.query;
        const filter: Record<string, unknown> = {};

        if (req.user!.role === 'user') {
            // User hanya bisa lihat milik sendiri
            filter.user_id = req.user!.user_id;
        }

        if (status && typeof status === 'string') {
            filter.status = status;
        }

        const prescriptions = await Prescription.find(filter)
            .sort({ created_at: -1 })
            .skip(Number(offset))
            .limit(Number(limit))
            .lean();

        const total = await Prescription.countDocuments(filter);

        res.json({ total, count: prescriptions.length, prescriptions });
    } catch (error) {
        console.error('[Prescriptions] List error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// =============================================================================
// GET /api/prescriptions/:id — Get prescription detail
// =============================================================================

router.get('/:id', authenticate, async (req: Request<{ id: string }>, res: Response) => {
    try {
        const prescription = await Prescription.findOne({
            prescription_id: req.params.id,
        }).lean();

        if (!prescription) {
            res.status(404).json({
                error: 'Not found',
                message: 'Resep tidak ditemukan.',
            });
            return;
        }

        // User hanya bisa lihat milik sendiri
        if (req.user!.role === 'user' && prescription.user_id !== req.user!.user_id) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'Anda tidak memiliki akses ke resep ini.',
            });
            return;
        }

        res.json(prescription);
    } catch (error) {
        console.error('[Prescriptions] Get error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// =============================================================================
// PATCH /api/prescriptions/:id/status — Approve/reject (pharmacist only)
// =============================================================================

interface UpdateStatusBody {
    status: 'approved' | 'rejected';
    notes?: string;
}

router.patch(
    '/:id/status',
    authenticate,
    authorize('pharmacist', 'admin'),
    async (req: Request<{ id: string }, object, UpdateStatusBody>, res: Response) => {
        try {
            const { status, notes } = req.body;

            if (!status || !['approved', 'rejected'].includes(status)) {
                res.status(400).json({
                    error: 'Invalid payload',
                    message: "status harus 'approved' atau 'rejected'.",
                });
                return;
            }

            const prescription = await Prescription.findOneAndUpdate(
                { prescription_id: req.params.id },
                {
                    $set: {
                        status,
                        reviewed_by: req.user!.user_id,
                        reviewed_at: new Date(),
                        notes: notes || '',
                    },
                },
                { new: true },
            ).lean();

            if (!prescription) {
                res.status(404).json({
                    error: 'Not found',
                    message: 'Resep tidak ditemukan.',
                });
                return;
            }

            res.json({
                success: true,
                prescription,
            });
        } catch (error) {
            console.error('[Prescriptions] Update status error:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    },
);

export default router;
