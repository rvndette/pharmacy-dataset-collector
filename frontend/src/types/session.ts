// =============================================================================
// session.ts — Type definitions for sessions
// =============================================================================

export interface Session {
    /** UUID unik per sesi */
    session_id: string;
    /** Epoch timestamp awal sesi (Date.now()) */
    start_time: number;
    /** High-resolution timestamp awal sesi (performance.now()) */
    start_time_hr: number;
    /** Epoch timestamp akhir sesi, null jika masih aktif */
    end_time: number | null;
    /** Metadata device */
    device_info: DeviceInfo;
    /** Status sesi */
    status: SessionStatus;
}

export type SessionStatus = 'active' | 'completed' | 'abandoned';

export interface DeviceInfo {
    /** Platform: 'ios' | 'android' */
    platform: string;
    /** Versi OS */
    os_version: string;
    /** Model device */
    device_model: string;
    /** Lebar layar */
    screen_width: number;
    /** Tinggi layar */
    screen_height: number;
}

export interface SessionConfig {
    /** Interval flush buffer (ms) — default 5000 */
    flush_interval: number;
    /** Ukuran maksimal buffer sebelum flush — default 50 */
    buffer_size: number;
    /** Throttle interval untuk high-frequency events (ms) — default 50 */
    throttle_interval: number;
    /** API base URL */
    api_base_url: string;
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
    flush_interval: 5000,
    buffer_size: 50,
    throttle_interval: 50,
    api_base_url: 'http://10.0.2.2:3000/api', // Android emulator localhost
};
