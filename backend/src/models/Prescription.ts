// =============================================================================
// models/Prescription.ts — Mongoose schema for prescriptions
// =============================================================================

import mongoose, { Document, Schema } from 'mongoose';

// =============================================================================
// TypeScript Interface
// =============================================================================

export interface IZoomMetadata {
    zoom_count: number;
    avg_zoom_level: number;
    total_viewing_time: number;
}

export interface IPrescription extends Document {
    prescription_id: string;
    user_id: string;
    session_id: string;
    image_url: string;
    status: 'pending' | 'approved' | 'rejected';
    zoom_metadata: IZoomMetadata;
    reviewed_by: string | null;
    reviewed_at: Date | null;
    notes: string;
    created_at: Date;
    updated_at: Date;
}

// =============================================================================
// Mongoose Schema
// =============================================================================

const PrescriptionSchema = new Schema<IPrescription>(
    {
        prescription_id: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        user_id: {
            type: String,
            required: true,
            index: true,
        },
        session_id: {
            type: String,
            required: true,
        },
        image_url: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            required: true,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        zoom_metadata: {
            zoom_count: { type: Number, default: 0 },
            avg_zoom_level: { type: Number, default: 1 },
            total_viewing_time: { type: Number, default: 0 },
        },
        reviewed_by: {
            type: String,
            default: null,
        },
        reviewed_at: {
            type: Date,
            default: null,
        },
        notes: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'prescriptions',
    },
);

PrescriptionSchema.index({ status: 1 });
PrescriptionSchema.index({ user_id: 1, status: 1 });

export const Prescription = mongoose.model<IPrescription>(
    'Prescription',
    PrescriptionSchema,
);
