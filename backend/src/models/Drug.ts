// =============================================================================
// models/Drug.ts — Mongoose schema for drug master data
// =============================================================================

import mongoose, { Document, Schema } from 'mongoose';

// =============================================================================
// TypeScript Interface
// =============================================================================

export interface IDrug extends Document {
    drug_id: string;
    name: string;
    generic_name: string;
    category: string;
    dosage: string;
    price: string;
    requires_prescription: boolean;
    description: string;
    created_at: Date;
    updated_at: Date;
}

// =============================================================================
// Mongoose Schema
// =============================================================================

const DrugSchema = new Schema<IDrug>(
    {
        drug_id: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        generic_name: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        dosage: {
            type: String,
            required: true,
        },
        price: {
            type: String,
            required: true,
        },
        requires_prescription: {
            type: Boolean,
            required: true,
            default: false,
        },
        description: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'drugs',
    },
);

DrugSchema.index({ name: 'text', generic_name: 'text', category: 'text' });

export const Drug = mongoose.model<IDrug>('Drug', DrugSchema);
