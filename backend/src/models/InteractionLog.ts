// =============================================================================
// models/InteractionLog.ts — Mongoose schema for interaction logs
// =============================================================================

import mongoose, { Document, Schema } from 'mongoose';

// =============================================================================
// TypeScript Interface
// =============================================================================

export interface IInteractionLog extends Document {
    session_id: string;
    batch_id: string;
    event_type: string;
    timestamp: number;
    timestamp_hr: number;
    screen: string;
    data: Record<string, unknown>;
    created_at: Date;
}

// =============================================================================
// Mongoose Schema
// =============================================================================

const InteractionLogSchema = new Schema<IInteractionLog>(
    {
        session_id: {
            type: String,
            required: true,
            index: true,
        },
        batch_id: {
            type: String,
            required: true,
        },
        event_type: {
            type: String,
            required: true,
            enum: [
                'keystroke',
                'touch',
                'scroll',
                'pinch',
                'signature',
                'pause',
                'correction',
                'dwell_time',
            ],
            index: true,
        },
        timestamp: {
            type: Number,
            required: true,
        },
        timestamp_hr: {
            type: Number,
            required: true,
        },
        screen: {
            type: String,
            required: true,
            enum: [
                'registration',
                'drug_search',
                'drug_detail',
                'prescription_upload',
                'signature',
            ],
        },
        data: {
            type: Schema.Types.Mixed,
            required: true,
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: false },
        collection: 'interaction_logs',
    },
);

// Compound index untuk query efisien
InteractionLogSchema.index({ session_id: 1, event_type: 1 });
InteractionLogSchema.index({ session_id: 1, screen: 1 });
InteractionLogSchema.index({ session_id: 1, timestamp: 1 });

export const InteractionLog = mongoose.model<IInteractionLog>(
    'InteractionLog',
    InteractionLogSchema,
);
