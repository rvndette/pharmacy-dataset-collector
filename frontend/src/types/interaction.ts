// =============================================================================
// interaction.ts — Type definitions for all behavioral biometrics events
// =============================================================================

/**
 * Base event interface — semua interaction event mengextend ini
 */
export interface BaseEvent {
    /** UUID sesi saat ini */
    session_id: string;
    /** Tipe event: keystroke, touch, scroll, pinch, signature, pause, correction, dwell_time */
    event_type: EventType;
    /** Epoch timestamp (Date.now()) */
    timestamp: number;
    /** High-resolution timestamp (performance.now()) */
    timestamp_hr: number;
    /** Screen/module tempat event terjadi */
    screen: ScreenName;
}

export type EventType =
    | 'keystroke'
    | 'touch'
    | 'scroll'
    | 'pinch'
    | 'signature'
    | 'pause'
    | 'correction'
    | 'dwell_time';

export type ScreenName =
    | 'registration'
    | 'drug_search'
    | 'drug_detail'
    | 'prescription_upload'
    | 'signature';

// =============================================================================
// Keystroke Dynamics
// =============================================================================

export interface KeystrokeEvent extends BaseEvent {
    event_type: 'keystroke';
    data: KeystrokeData;
}

export interface KeystrokeData {
    /** Nama key yang ditekan (e.g., 'a', 'Backspace', 'Enter') */
    key: string;
    /** Field identifier (e.g., 'name', 'email') — BUKAN isi field */
    field_id: string;
    /** Timestamp key down (performance.now()) */
    key_down_time: number;
    /** Timestamp key up (performance.now()) */
    key_up_time: number;
    /** Durasi key ditekan: keyUp - keyDown (ms) */
    hold_time: number;
    /** Waktu antara key sebelumnya up dan key ini down (ms). null untuk key pertama */
    flight_time: number | null;
    /** Apakah key ini adalah special key (backspace, delete, arrow) */
    is_special_key: boolean;
}

// =============================================================================
// Touch Gesture
// =============================================================================

export interface TouchGestureEvent extends BaseEvent {
    event_type: 'touch';
    data: TouchGestureData;
}

export interface TouchGestureData {
    /** Tipe gesture: tap, swipe, long_press */
    gesture_type: 'tap' | 'swipe' | 'long_press';
    /** Start position */
    start_x: number;
    start_y: number;
    /** End position */
    end_x: number;
    end_y: number;
    /** Duration gesture (ms) */
    duration: number;
    /** Tekanan (0-1) jika tersedia */
    pressure: number | null;
}

// =============================================================================
// Scroll Analysis
// =============================================================================

export interface ScrollEvent extends BaseEvent {
    event_type: 'scroll';
    data: ScrollData;
}

export interface ScrollData {
    /** Posisi Y scroll saat ini */
    scroll_y: number;
    /** Delta Y dari posisi sebelumnya */
    delta_y: number;
    /** Delta waktu dari event sebelumnya (ms) */
    delta_time: number;
    /** Kecepatan scroll: deltaY / deltaTime (px/ms) */
    velocity: number;
    /** Section yang sedang terlihat */
    visible_section: string;
}

// =============================================================================
// Dwell Time
// =============================================================================

export interface DwellTimeEvent extends BaseEvent {
    event_type: 'dwell_time';
    data: DwellTimeData;
}

export interface DwellTimeData {
    /** Section dimana user berhenti lama */
    section: string;
    /** Durasi dwell (ms) */
    duration: number;
    /** Posisi scroll Y awal */
    scroll_y_start: number;
    /** Posisi scroll Y akhir */
    scroll_y_end: number;
}

// =============================================================================
// Pinch Gesture
// =============================================================================

export interface PinchGestureEvent extends BaseEvent {
    event_type: 'pinch';
    data: PinchGestureData;
}

export interface PinchGestureData {
    /** Faktor skala pinch */
    scale_factor: number;
    /** Titik fokus X */
    focal_x: number;
    /** Titik fokus Y */
    focal_y: number;
    /** Array trajectory gesture */
    trajectory: PinchTrajectoryPoint[];
}

export interface PinchTrajectoryPoint {
    scale_factor: number;
    focal_x: number;
    focal_y: number;
    timestamp: number;
}

// =============================================================================
// Signature Trajectory
// =============================================================================

export interface SignatureEvent extends BaseEvent {
    event_type: 'signature';
    data: SignatureData;
}

export interface SignatureData {
    /** Array titik trajectory tanda tangan */
    trajectory: SignaturePoint[];
    /** Total durasi tanda tangan (ms) */
    total_duration: number;
    /** Jumlah strokes (angkat pena) */
    stroke_count: number;
}

export interface SignaturePoint {
    /** Koordinat X */
    x: number;
    /** Koordinat Y */
    y: number;
    /** Timestamp high-resolution (performance.now()) */
    t: number;
}

// =============================================================================
// Pause / Thinking Event
// =============================================================================

export interface PauseEvent extends BaseEvent {
    event_type: 'pause';
    data: PauseData;
}

export interface PauseData {
    /** Durasi pause (ms) */
    duration: number;
    /** Field dimana pause terjadi */
    field_id: string;
    /** Jumlah karakter yang sudah diketik sebelum pause */
    chars_before_pause: number;
}

// =============================================================================
// Correction Event
// =============================================================================

export interface CorrectionEvent extends BaseEvent {
    event_type: 'correction';
    data: CorrectionData;
}

export interface CorrectionData {
    /** Tipe koreksi: backspace, delete, select_all_delete */
    correction_type: 'backspace' | 'delete' | 'select_all_delete';
    /** Field dimana koreksi terjadi */
    field_id: string;
    /** Jumlah karakter yang dihapus */
    chars_deleted: number;
    /** Jumlah karakter total di field sebelum koreksi */
    field_length_before: number;
}

// =============================================================================
// Union type untuk semua interaction logs
// =============================================================================

export type InteractionLog =
    | KeystrokeEvent
    | TouchGestureEvent
    | ScrollEvent
    | DwellTimeEvent
    | PinchGestureEvent
    | SignatureEvent
    | PauseEvent
    | CorrectionEvent;

// =============================================================================
// Batch payload untuk dikirim ke backend
// =============================================================================

export interface InteractionBatchPayload {
    session_id: string;
    batch_id: string;
    timestamp: number;
    events: InteractionLog[];
    event_count: number;
}
