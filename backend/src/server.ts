// =============================================================================
// server.ts — Express server entry point
// =============================================================================

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';

import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import drugRoutes from './routes/drugs';
import interactionRoutes from './routes/interactions';
import prescriptionRoutes from './routes/prescriptions';
import sessionRoutes from './routes/sessions';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacy_biometrics';

// =============================================================================
// Middleware
// =============================================================================

app.use(cors({
    origin: '*', // In production, restrict to specific origins
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' })); // Large payloads for batch interaction logs
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, _res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// =============================================================================
// Routes
// =============================================================================

// Public / Auth
app.use('/api/auth', authRoutes);
app.use('/api/drugs', drugRoutes);

// Authenticated
app.use('/api/sessions', sessionRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/prescriptions', prescriptionRoutes);

// Admin only
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: Date.now(),
        uptime: process.uptime(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
});

// =============================================================================
// MongoDB Connection & Server Start
// =============================================================================

async function startServer(): Promise<void> {
    try {
        console.log(`[Server] Connecting to MongoDB...`);

        await mongoose.connect(MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log('[Server] ✅ MongoDB connected successfully');

        app.listen(PORT, () => {
            console.log(`[Server] 🚀 Server running on http://localhost:${PORT}`);
            console.log(`[Server] 📋 API endpoints:`);
            console.log(`  POST   /api/auth/register      — Register user`);
            console.log(`  POST   /api/auth/login          — Login`);
            console.log(`  GET    /api/drugs               — List drugs`);
            console.log(`  POST   /api/drugs               — Create drug (admin)`);
            console.log(`  POST   /api/sessions            — Create session`);
            console.log(`  GET    /api/sessions             — List sessions`);
            console.log(`  PATCH  /api/sessions/:id         — Update session`);
            console.log(`  POST   /api/interactions         — Batch insert logs`);
            console.log(`  GET    /api/interactions/:sid     — Get session logs`);
            console.log(`  POST   /api/prescriptions        — Upload prescription`);
            console.log(`  GET    /api/prescriptions         — List prescriptions`);
            console.log(`  PATCH  /api/prescriptions/:id/status — Approve/reject`);
            console.log(`  GET    /api/admin/stats           — System stats`);
            console.log(`  GET    /api/admin/export/json     — Export JSON`);
            console.log(`  GET    /api/admin/export/csv      — Export CSV`);
            console.log(`  GET    /api/health                — Health check`);
        });
    } catch (error) {
        console.error('[Server] ❌ Failed to start:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n[Server] Shutting down gracefully...');
    await mongoose.connection.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n[Server] Received SIGTERM, shutting down...');
    await mongoose.connection.close();
    process.exit(0);
});

startServer();
