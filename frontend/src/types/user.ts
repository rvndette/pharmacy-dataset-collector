// =============================================================================
// types/user.ts — User, auth, and profile type definitions
// =============================================================================

export type Role = 'user' | 'pharmacist' | 'admin';

export interface UserProfile {
    user_id: string;
    email: string;
    name: string;
    phone: string;
    role: Role;
}

export interface AuthResponse {
    success: boolean;
    token: string;
    user: UserProfile;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
    phone: string;
    role: Role;
}
