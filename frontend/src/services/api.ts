// =============================================================================
// services/api.ts — REST API client with auth support
// =============================================================================

import { InteractionBatchPayload } from '../types/interaction';
import { AdminStats, DrugItem, LoggerStatus, PrescriptionItem } from '../types/role';
import { DEFAULT_SESSION_CONFIG, Session, SessionConfig } from '../types/session';
import { AuthResponse, LoginCredentials, RegisterData } from '../types/user';

/**
 * ApiClient — async REST client dengan JWT auth support.
 */
export class ApiClient {
    private baseUrl: string;
    private maxRetries: number;
    private authToken: string | null = null;

    constructor(config: Partial<SessionConfig> = {}) {
        this.baseUrl = config.api_base_url ?? DEFAULT_SESSION_CONFIG.api_base_url;
        this.maxRetries = 3;
    }

    // =========================================================================
    // Auth Token Management
    // =========================================================================

    setAuthToken(token: string | null): void {
        this.authToken = token;
    }

    private getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };
        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        return headers;
    }

    // =========================================================================
    // Auth Endpoints
    // =========================================================================

    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const response = await fetch(`${this.baseUrl}/auth/login`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login gagal');
        }

        return response.json();
    }

    async register(data: RegisterData): Promise<AuthResponse> {
        const response = await fetch(`${this.baseUrl}/auth/register`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Registrasi gagal');
        }

        return response.json();
    }

    // =========================================================================
    // Session Endpoints
    // =========================================================================

    async sendInteractionBatch(payload: InteractionBatchPayload): Promise<boolean> {
        return this.postWithRetry(`${this.baseUrl}/interactions`, payload);
    }

    async createSession(session: Session): Promise<boolean> {
        return this.postWithRetry(`${this.baseUrl}/sessions`, session);
    }

    async updateSession(
        sessionId: string,
        update: Partial<Session>,
    ): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/sessions/${sessionId}`, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify(update),
            });
            return response.ok;
        } catch (error) {
            console.warn('[ApiClient] Failed to update session:', error);
            return false;
        }
    }

    // =========================================================================
    // Drug Endpoints
    // =========================================================================

    async getDrugs(search?: string): Promise<DrugItem[]> {
        try {
            const params = search ? `?search=${encodeURIComponent(search)}` : '';
            const response = await fetch(`${this.baseUrl}/drugs${params}`, {
                headers: this.getHeaders(),
            });
            if (!response.ok) { return []; }
            const data = await response.json();
            return data.drugs || [];
        } catch {
            return [];
        }
    }

    async createDrug(drug: Omit<DrugItem, 'drug_id'>): Promise<DrugItem | null> {
        try {
            const response = await fetch(`${this.baseUrl}/drugs`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(drug),
            });
            if (!response.ok) { return null; }
            const data = await response.json();
            return data.drug;
        } catch {
            return null;
        }
    }

    async updateDrug(drugId: string, drug: Partial<DrugItem>): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/drugs/${drugId}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(drug),
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    async deleteDrug(drugId: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/drugs/${drugId}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    // =========================================================================
    // Prescription Endpoints
    // =========================================================================

    async getPrescriptions(status?: string): Promise<PrescriptionItem[]> {
        try {
            const params = status ? `?status=${status}` : '';
            const response = await fetch(`${this.baseUrl}/prescriptions${params}`, {
                headers: this.getHeaders(),
            });
            if (!response.ok) { return []; }
            const data = await response.json();
            return data.prescriptions || [];
        } catch {
            return [];
        }
    }

    async getPrescriptionDetail(id: string): Promise<PrescriptionItem | null> {
        try {
            const response = await fetch(`${this.baseUrl}/prescriptions/${id}`, {
                headers: this.getHeaders(),
            });
            if (!response.ok) { return null; }
            return response.json();
        } catch {
            return null;
        }
    }

    async createPrescription(data: {
        session_id: string;
        zoom_metadata?: { zoom_count: number; avg_zoom_level: number; total_viewing_time: number };
    }): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/prescriptions`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    async updatePrescriptionStatus(
        id: string,
        status: 'approved' | 'rejected',
        notes?: string,
    ): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/prescriptions/${id}/status`, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify({ status, notes }),
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    // =========================================================================
    // Admin Endpoints
    // =========================================================================

    async getAdminStats(): Promise<AdminStats | null> {
        try {
            const response = await fetch(`${this.baseUrl}/admin/stats`, {
                headers: this.getHeaders(),
            });
            if (!response.ok) { return null; }
            return response.json();
        } catch {
            return null;
        }
    }

    async getLoggerStatus(): Promise<LoggerStatus | null> {
        try {
            const response = await fetch(`${this.baseUrl}/admin/logger-status`, {
                headers: this.getHeaders(),
            });
            if (!response.ok) { return null; }
            return response.json();
        } catch {
            return null;
        }
    }

    async getUsers(): Promise<Array<{ _id: string; email: string; name: string; role: string }>> {
        try {
            const response = await fetch(`${this.baseUrl}/admin/users`, {
                headers: this.getHeaders(),
            });
            if (!response.ok) { return []; }
            const data = await response.json();
            return data.users || [];
        } catch {
            return [];
        }
    }

    async deleteUser(userId: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/admin/users/${userId}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    async resetSessions(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/admin/reset-sessions`, {
                method: 'POST',
                headers: this.getHeaders(),
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    async exportJSON(filters?: {
        event_type?: string;
        start_date?: string;
        end_date?: string;
        device_type?: string;
    }): Promise<unknown> {
        try {
            const params = new URLSearchParams();
            if (filters?.event_type) { params.append('event_type', filters.event_type); }
            if (filters?.start_date) { params.append('start_date', filters.start_date); }
            if (filters?.end_date) { params.append('end_date', filters.end_date); }
            if (filters?.device_type) { params.append('device_type', filters.device_type); }
            const query = params.toString() ? `?${params.toString()}` : '';
            const response = await fetch(`${this.baseUrl}/admin/export/json${query}`, {
                headers: this.getHeaders(),
            });
            if (!response.ok) { return null; }
            return response.json();
        } catch {
            return null;
        }
    }

    async exportCSV(filters?: {
        event_type?: string;
        start_date?: string;
        end_date?: string;
        device_type?: string;
    }): Promise<string | null> {
        try {
            const params = new URLSearchParams();
            if (filters?.event_type) { params.append('event_type', filters.event_type); }
            if (filters?.start_date) { params.append('start_date', filters.start_date); }
            if (filters?.end_date) { params.append('end_date', filters.end_date); }
            if (filters?.device_type) { params.append('device_type', filters.device_type); }
            const query = params.toString() ? `?${params.toString()}` : '';
            const response = await fetch(`${this.baseUrl}/admin/export/csv${query}`, {
                headers: this.getHeaders(),
            });
            if (!response.ok) { return null; }
            return response.text();
        } catch {
            return null;
        }
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    private async postWithRetry(
        url: string,
        body: Record<string, unknown> | InteractionBatchPayload | Session,
        attempt: number = 0,
    ): Promise<boolean> {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(body),
            });

            if (!response.ok && attempt < this.maxRetries) {
                const delay = Math.pow(2, attempt) * 1000;
                await this.sleep(delay);
                return this.postWithRetry(url, body, attempt + 1);
            }

            return response.ok;
        } catch (error) {
            if (attempt < this.maxRetries) {
                const delay = Math.pow(2, attempt) * 1000;
                await this.sleep(delay);
                return this.postWithRetry(url, body, attempt + 1);
            }
            console.warn(`[ApiClient] POST ${url} failed after ${this.maxRetries} retries:`, error);
            return false;
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/** Singleton instance */
export const apiClient = new ApiClient();
