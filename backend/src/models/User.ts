// =============================================================================
// models/User.ts — Mongoose schema for users with role-based access
// =============================================================================

import bcrypt from 'bcryptjs';
import mongoose, { Document, Schema } from 'mongoose';
import { Role } from '../types/role';

// =============================================================================
// TypeScript Interface
// =============================================================================

export interface IUser extends Document {
    email: string;
    password_hash: string;
    name: string;
    phone: string;
    role: Role;
    created_at: Date;
    updated_at: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

// =============================================================================
// Mongoose Schema
// =============================================================================

const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        password_hash: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        role: {
            type: String,
            required: true,
            enum: ['user', 'pharmacist', 'admin'],
            default: 'user',
        },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'users',
    },
);

// =============================================================================
// Pre-save hook — hash password sebelum simpan
// =============================================================================

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password_hash')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(12);
        this.password_hash = await bcrypt.hash(this.password_hash, salt);
        next();
    } catch (error) {
        next(error as Error);
    }
});

// =============================================================================
// Instance method — compare password
// =============================================================================

UserSchema.methods.comparePassword = async function (
    candidatePassword: string,
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password_hash);
};

// Index untuk pencarian cepat
UserSchema.index({ role: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
