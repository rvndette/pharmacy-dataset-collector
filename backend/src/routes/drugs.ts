// =============================================================================
// routes/drugs.ts — Drug master data CRUD routes
// =============================================================================

import { Request, Response, Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, authorize } from '../middleware/auth';
import { Drug } from '../models/Drug';

const router = Router();

// =============================================================================
// GET /api/drugs — List semua obat (public)
// =============================================================================

router.get('/', async (req: Request, res: Response) => {
    try {
        const { search, category, limit = '50', offset = '0' } = req.query;

        const filter: Record<string, unknown> = {};
        if (search && typeof search === 'string') {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { generic_name: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
            ];
        }
        if (category && typeof category === 'string') {
            filter.category = category;
        }

        const drugs = await Drug.find(filter)
            .sort({ name: 1 })
            .skip(Number(offset))
            .limit(Number(limit))
            .lean();

        const total = await Drug.countDocuments(filter);

        res.json({ total, count: drugs.length, drugs });
    } catch (error) {
        console.error('[Drugs] List error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// =============================================================================
// GET /api/drugs/:id — Get drug detail
// =============================================================================

router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
    try {
        const drug = await Drug.findOne({ drug_id: req.params.id }).lean();
        if (!drug) {
            res.status(404).json({ error: 'Not found', message: 'Obat tidak ditemukan.' });
            return;
        }
        res.json(drug);
    } catch (error) {
        console.error('[Drugs] Get error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// =============================================================================
// POST /api/drugs — Create drug (admin only)
// =============================================================================

router.post('/', authenticate, authorize('admin'), async (req: Request, res: Response) => {
    try {
        const { name, generic_name, category, dosage, price, requires_prescription, description } = req.body;

        if (!name || !generic_name || !category || !dosage || !price) {
            res.status(400).json({
                error: 'Invalid payload',
                message: 'name, generic_name, category, dosage, dan price wajib diisi.',
            });
            return;
        }

        const drug = new Drug({
            drug_id: uuidv4(),
            name,
            generic_name,
            category,
            dosage,
            price,
            requires_prescription: requires_prescription || false,
            description: description || '',
        });

        await drug.save();

        res.status(201).json({ success: true, drug });
    } catch (error) {
        console.error('[Drugs] Create error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// =============================================================================
// PUT /api/drugs/:id — Update drug (admin only)
// =============================================================================

router.put('/:id', authenticate, authorize('admin'), async (req: Request<{ id: string }>, res: Response) => {
    try {
        const drug = await Drug.findOneAndUpdate(
            { drug_id: req.params.id },
            { $set: req.body },
            { new: true },
        ).lean();

        if (!drug) {
            res.status(404).json({ error: 'Not found', message: 'Obat tidak ditemukan.' });
            return;
        }

        res.json({ success: true, drug });
    } catch (error) {
        console.error('[Drugs] Update error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// =============================================================================
// DELETE /api/drugs/:id — Delete drug (admin only)
// =============================================================================

router.delete('/:id', authenticate, authorize('admin'), async (req: Request<{ id: string }>, res: Response) => {
    try {
        const drug = await Drug.findOneAndDelete({ drug_id: req.params.id });

        if (!drug) {
            res.status(404).json({ error: 'Not found', message: 'Obat tidak ditemukan.' });
            return;
        }

        res.json({ success: true, message: 'Obat berhasil dihapus.' });
    } catch (error) {
        console.error('[Drugs] Delete error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;
