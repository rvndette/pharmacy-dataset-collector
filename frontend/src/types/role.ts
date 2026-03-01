// =============================================================================
// types/role.ts — Role-related interfaces for frontend
// =============================================================================

export type PrescriptionStatus = 'pending' | 'approved' | 'rejected';

export interface PrescriptionItem {
    prescription_id: string;
    user_id: string;
    session_id: string;
    image_url: string;
    status: PrescriptionStatus;
    zoom_metadata: {
        zoom_count: number;
        avg_zoom_level: number;
        total_viewing_time: number;
    };
    reviewed_by: string | null;
    reviewed_at: string | null;
    notes: string;
    created_at: string;
}

export interface DrugItem {
    drug_id: string;
    name: string;
    generic_name: string;
    category: string;
    dosage: string;
    price: string;
    requires_prescription: boolean;
    description: string;
}

export interface AdminStats {
    total_sessions: number;
    total_users: number;
    total_interaction_logs: number;
    total_prescriptions: number;
    total_drugs: number;
    avg_session_duration_ms: number;
    avg_events_per_session: number;
    device_distribution: Array<{ platform: string; count: number }>;
    role_distribution: Array<{ role: string; count: number }>;
}

export interface LoggerStatus {
    status: string;
    total_logs: number;
    logs_last_hour: number;
    active_sessions: number;
    server_uptime_seconds: number;
}
