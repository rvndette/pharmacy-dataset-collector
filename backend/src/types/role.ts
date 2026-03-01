// =============================================================================
// types/role.ts — Role and JWT type definitions
// =============================================================================

export type Role = 'user' | 'pharmacist' | 'admin';

export interface JwtPayload {
    user_id: string;
    email: string;
    role: Role;
    iat?: number;
    exp?: number;
}

export interface AuthenticatedRequest {
    user?: JwtPayload;
}
