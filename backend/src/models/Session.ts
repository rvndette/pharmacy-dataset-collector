// =============================================================================
// models/Session.ts — Mongoose schema for sessions
// =============================================================================

import mongoose, { Document, Schema } from 'mongoose';

// =============================================================================
// TypeScript Interface
// =============================================================================

export interface ISession extends Document {
    session_id: string;
    user_id: string;
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
    created_at: Date;
    updated_at: Date;
}

// =============================================================================
// Mongoose Schema
// =============================================================================

const SessionSchema = new Schema<ISession>(
    {
        session_id: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        user_id: {
            type: String,
            default: '',
            index: true,
        },
        start_time: {
            type: Number,
            required: true,
        },
        start_time_hr: {
            type: Number,
            required: true,
        },
        end_time: {
            type: Number,
            default: null,
        },
        status: {
            type: String,
            required: true,
            enum: ['active', 'completed', 'abandoned'],
            default: 'active',
        },
        device_info: {
            platform: { type: String, required: true },
            os_version: { type: String, required: true },
            device_model: { type: String, required: true },
            screen_width: { type: Number, required: true },
            screen_height: { type: Number, required: true },
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'sessions',
    },
);

SessionSchema.index({ status: 1 });
SessionSchema.index({ start_time: -1 });

export const Session = mongoose.model<ISession>('Session', SessionSchema);
