// =============================================================================
// keystrokeAnalyzer.ts — Keystroke dynamics analysis
// =============================================================================

import {
    CorrectionEvent,
    KeystrokeData,
    KeystrokeEvent,
    PauseEvent,
} from '../types/interaction';

const SPECIAL_KEYS = new Set([
    'Backspace',
    'Delete',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Tab',
    'Enter',
    'Escape',
]);

const THINKING_PAUSE_THRESHOLD_MS = 500;

interface KeyState {
    key: string;
    keyDownTime: number;
    keyUpTime: number;
}

/**
 * KeystrokeAnalyzer — Tracks keystroke dynamics per field.
 *
 * Menghitung holdTime dan flightTime, mendeteksi pause dan correction.
 * Content-blind: tidak menyimpan isi field, hanya timing data dan key names.
 */
export class KeystrokeAnalyzer {
    private lastKeyState: Map<string, KeyState> = new Map();
    private lastKeyUpTimePerField: Map<string, number> = new Map();
    private charCountPerField: Map<string, number> = new Map();

    /**
     * Record key down event.
     * Mengembalikan partial KeystrokeData (key_down_time diisi, key_up_time pending).
     */
    onKeyDown(
        key: string,
        fieldId: string,
        sessionId: string,
        screen: KeystrokeEvent['screen'],
    ): void {
        const now = performance.now();
        this.lastKeyState.set(fieldId, {
            key,
            keyDownTime: now,
            keyUpTime: 0,
        });
    }

    /**
     * Record key up event.
     * Mengembalikan complete KeystrokeEvent dengan holdTime dan flightTime.
     */
    onKeyUp(
        key: string,
        fieldId: string,
        sessionId: string,
        screen: KeystrokeEvent['screen'],
    ): KeystrokeEvent | null {
        const now = performance.now();
        const state = this.lastKeyState.get(fieldId);

        if (!state || state.key !== key) {
            return null;
        }

        state.keyUpTime = now;
        const holdTime = state.keyUpTime - state.keyDownTime;

        // Flight time: selisih antara keyDown saat ini dan keyUp sebelumnya
        const lastKeyUpTime = this.lastKeyUpTimePerField.get(fieldId);
        const flightTime =
            lastKeyUpTime !== undefined ? state.keyDownTime - lastKeyUpTime : null;

        // Update last key up time
        this.lastKeyUpTimePerField.set(fieldId, now);

        // Update char count
        const currentCount = this.charCountPerField.get(fieldId) ?? 0;
        if (!SPECIAL_KEYS.has(key)) {
            this.charCountPerField.set(fieldId, currentCount + 1);
        }

        const data: KeystrokeData = {
            key,
            field_id: fieldId,
            key_down_time: state.keyDownTime,
            key_up_time: state.keyUpTime,
            hold_time: holdTime,
            flight_time: flightTime,
            is_special_key: SPECIAL_KEYS.has(key),
        };

        return {
            session_id: sessionId,
            event_type: 'keystroke',
            timestamp: Date.now(),
            timestamp_hr: now,
            screen,
            data,
        };
    }

    /**
     * Detect jika ada pause (latency > 500ms) — thinking pause.
     */
    detectPause(
        fieldId: string,
        sessionId: string,
        screen: PauseEvent['screen'],
    ): PauseEvent | null {
        const now = performance.now();
        const lastKeyUpTime = this.lastKeyUpTimePerField.get(fieldId);

        if (lastKeyUpTime === undefined) {
            return null;
        }

        const pauseDuration = now - lastKeyUpTime;

        if (pauseDuration >= THINKING_PAUSE_THRESHOLD_MS) {
            return {
                session_id: sessionId,
                event_type: 'pause',
                timestamp: Date.now(),
                timestamp_hr: now,
                screen,
                data: {
                    duration: pauseDuration,
                    field_id: fieldId,
                    chars_before_pause: this.charCountPerField.get(fieldId) ?? 0,
                },
            };
        }

        return null;
    }

    /**
     * Detect correction event (backspace/delete).
     */
    detectCorrection(
        key: string,
        fieldId: string,
        fieldLength: number,
        sessionId: string,
        screen: CorrectionEvent['screen'],
    ): CorrectionEvent | null {
        if (key !== 'Backspace' && key !== 'Delete') {
            return null;
        }

        const now = performance.now();
        const correctionType = key === 'Backspace' ? 'backspace' : 'delete';

        // Update char count
        const currentCount = this.charCountPerField.get(fieldId) ?? 0;
        if (currentCount > 0) {
            this.charCountPerField.set(fieldId, currentCount - 1);
        }

        return {
            session_id: sessionId,
            event_type: 'correction',
            timestamp: Date.now(),
            timestamp_hr: now,
            screen,
            data: {
                correction_type: correctionType,
                field_id: fieldId,
                chars_deleted: 1,
                field_length_before: fieldLength,
            },
        };
    }

    /**
     * Reset analyzer state untuk field tertentu.
     */
    resetField(fieldId: string): void {
        this.lastKeyState.delete(fieldId);
        this.lastKeyUpTimePerField.delete(fieldId);
        this.charCountPerField.delete(fieldId);
    }

    /**
     * Reset all state.
     */
    resetAll(): void {
        this.lastKeyState.clear();
        this.lastKeyUpTimePerField.clear();
        this.charCountPerField.clear();
    }
}

/** Singleton instance */
export const keystrokeAnalyzer = new KeystrokeAnalyzer();
