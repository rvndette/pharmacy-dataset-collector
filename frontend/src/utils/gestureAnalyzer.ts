// =============================================================================
// gestureAnalyzer.ts — Gesture & scroll analysis utilities
// =============================================================================

import {
    DwellTimeEvent,
    PinchGestureData,
    PinchGestureEvent,
    PinchTrajectoryPoint,
    ScreenName,
    ScrollData,
    ScrollEvent,
} from '../types/interaction';

// =============================================================================
// Scroll Analyzer
// =============================================================================

interface ScrollState {
    lastScrollY: number;
    lastTimestamp: number;
    dwellStartTime: number | null;
    dwellScrollY: number;
    currentSection: string;
}

/**
 * ScrollAnalyzer — menganalisis scroll behavior.
 *
 * Menghitung velocity (deltaY / deltaTime) dan mendeteksi dwell time
 * ketika velocity mendekati 0 selama > 1000ms di section tertentu.
 */
export class ScrollAnalyzer {
    private state: ScrollState = {
        lastScrollY: 0,
        lastTimestamp: 0,
        dwellStartTime: null,
        dwellScrollY: 0,
        currentSection: '',
    };

    private static readonly DWELL_THRESHOLD_MS = 1000;
    private static readonly VELOCITY_NEAR_ZERO = 0.05; // px/ms

    /**
     * Process scroll event dan kembalikan ScrollEvent.
     */
    onScroll(
        scrollY: number,
        visibleSection: string,
        sessionId: string,
        screen: ScreenName,
    ): ScrollEvent {
        const now = performance.now();
        const deltaY = scrollY - this.state.lastScrollY;
        const deltaTime = this.state.lastTimestamp > 0
            ? now - this.state.lastTimestamp
            : 1; // Prevent division by zero

        const velocity = deltaTime > 0 ? deltaY / deltaTime : 0;

        const data: ScrollData = {
            scroll_y: scrollY,
            delta_y: deltaY,
            delta_time: deltaTime,
            velocity,
            visible_section: visibleSection,
        };

        // Track dwell time
        if (visibleSection !== this.state.currentSection) {
            this.state.dwellStartTime = now;
            this.state.dwellScrollY = scrollY;
            this.state.currentSection = visibleSection;
        }

        this.state.lastScrollY = scrollY;
        this.state.lastTimestamp = now;

        return {
            session_id: sessionId,
            event_type: 'scroll',
            timestamp: Date.now(),
            timestamp_hr: now,
            screen,
            data,
        };
    }

    /**
     * Deteksi dwell time — ketika velocity mendekati 0 selama > 1000ms.
     * Panggil secara periodik (e.g., setiap 200ms) untuk cek dwell.
     */
    checkDwellTime(
        sessionId: string,
        screen: ScreenName,
    ): DwellTimeEvent | null {
        const now = performance.now();

        if (this.state.dwellStartTime === null) {
            return null;
        }

        const elapsed = now - this.state.dwellStartTime;

        // Cek apakah velocity mendekati 0 (user berhenti scroll)
        const timeSinceLastScroll = now - this.state.lastTimestamp;

        if (
            timeSinceLastScroll > ScrollAnalyzer.DWELL_THRESHOLD_MS &&
            elapsed >= ScrollAnalyzer.DWELL_THRESHOLD_MS
        ) {
            const event: DwellTimeEvent = {
                session_id: sessionId,
                event_type: 'dwell_time',
                timestamp: Date.now(),
                timestamp_hr: now,
                screen,
                data: {
                    section: this.state.currentSection,
                    duration: elapsed,
                    scroll_y_start: this.state.dwellScrollY,
                    scroll_y_end: this.state.lastScrollY,
                },
            };

            // Reset dwell tracking setelah emit
            this.state.dwellStartTime = now;
            this.state.dwellScrollY = this.state.lastScrollY;

            return event;
        }

        return null;
    }

    /**
     * Reset state.
     */
    reset(): void {
        this.state = {
            lastScrollY: 0,
            lastTimestamp: 0,
            dwellStartTime: null,
            dwellScrollY: 0,
            currentSection: '',
        };
    }
}

// =============================================================================
// Pinch Gesture Analyzer
// =============================================================================

/**
 * PinchGestureAnalyzer — tracks pinch gesture trajectory.
 *
 * Mengumpulkan trajectory points selama pinch gesture berlangsung
 * dan menghasilkan PinchGestureEvent ketika gesture berakhir.
 */
export class PinchGestureAnalyzer {
    private trajectoryBuffer: PinchTrajectoryPoint[] = [];
    private gestureActive = false;

    /**
     * Mulai recording pinch gesture.
     */
    onPinchStart(): void {
        this.trajectoryBuffer = [];
        this.gestureActive = true;
    }

    /**
     * Record satu titik trajectory selama pinch berlangsung.
     */
    onPinchUpdate(scaleFactor: number, focalX: number, focalY: number): void {
        if (!this.gestureActive) return;

        this.trajectoryBuffer.push({
            scale_factor: scaleFactor,
            focal_x: focalX,
            focal_y: focalY,
            timestamp: performance.now(),
        });
    }

    /**
     * Akhiri pinch gesture dan kembalikan event lengkap.
     */
    onPinchEnd(
        sessionId: string,
        screen: ScreenName,
    ): PinchGestureEvent | null {
        if (!this.gestureActive || this.trajectoryBuffer.length === 0) {
            this.gestureActive = false;
            return null;
        }

        this.gestureActive = false;

        const lastPoint = this.trajectoryBuffer[this.trajectoryBuffer.length - 1];
        const data: PinchGestureData = {
            scale_factor: lastPoint.scale_factor,
            focal_x: lastPoint.focal_x,
            focal_y: lastPoint.focal_y,
            trajectory: [...this.trajectoryBuffer],
        };

        const event: PinchGestureEvent = {
            session_id: sessionId,
            event_type: 'pinch',
            timestamp: Date.now(),
            timestamp_hr: performance.now(),
            screen,
            data,
        };

        this.trajectoryBuffer = [];
        return event;
    }

    /**
     * Reset state.
     */
    reset(): void {
        this.trajectoryBuffer = [];
        this.gestureActive = false;
    }
}

/** Singleton instances */
export const scrollAnalyzer = new ScrollAnalyzer();
export const pinchGestureAnalyzer = new PinchGestureAnalyzer();
