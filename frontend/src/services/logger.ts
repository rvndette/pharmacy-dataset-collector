// =============================================================================
// logger.ts — Async non-blocking interaction logger with buffer & batch flush
// =============================================================================

import { v4 as uuidv4 } from 'uuid';
import { InteractionBatchPayload, InteractionLog } from '../types/interaction';
import { DEFAULT_SESSION_CONFIG, SessionConfig } from '../types/session';
import { ApiClient } from './api';

/**
 * InteractionLogger — async logger yang tidak mengganggu UI thread.
 *
 * Fitur:
 * - Internal buffer untuk menampung event
 * - Auto-flush ketika buffer penuh (buffer_size threshold)
 * - Periodic flush setiap flush_interval ms
 * - Batch send ke backend via ApiClient
 * - Non-blocking: semua operasi menggunakan Promise tanpa await di caller
 */
export class InteractionLogger {
    private buffer: InteractionLog[] = [];
    private config: SessionConfig;
    private apiClient: ApiClient;
    private flushTimer: ReturnType<typeof setInterval> | null = null;
    private sessionId: string = '';
    private isFlushing: boolean = false;

    constructor(config: Partial<SessionConfig> = {}) {
        this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
        this.apiClient = new ApiClient(this.config);
    }

    /**
     * Inisialisasi logger untuk session tertentu.
     * Memulai periodic flush timer.
     */
    start(sessionId: string): void {
        this.sessionId = sessionId;
        this.buffer = [];

        // Periodic flush
        this.flushTimer = setInterval(() => {
            this.flush();
        }, this.config.flush_interval);
    }

    /**
     * Stop logger dan flush sisa buffer.
     */
    async stop(): Promise<void> {
        if (this.flushTimer !== null) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }

        // Final flush
        await this.flushSync();
    }

    /**
     * Log satu interaction event.
     * Non-blocking — push ke buffer, flush otomatis jika penuh.
     */
    logEvent(event: InteractionLog): void {
        this.buffer.push(event);

        // Auto-flush jika buffer penuh (non-blocking)
        if (this.buffer.length >= this.config.buffer_size) {
            this.flush();
        }
    }

    /**
     * Log multiple events sekaligus.
     */
    logEvents(events: InteractionLog[]): void {
        this.buffer.push(...events);

        if (this.buffer.length >= this.config.buffer_size) {
            this.flush();
        }
    }

    /**
     * Non-blocking flush — kirim buffer ke backend via fire-and-forget Promise.
     * Tidak menunggu response, tidak memblokir UI thread.
     */
    flush(): void {
        if (this.buffer.length === 0 || this.isFlushing) {
            return;
        }

        // Ambil events dari buffer dan kosongkan
        const eventsToSend = [...this.buffer];
        this.buffer = [];

        // Fire-and-forget — tidak di-await
        this.sendBatch(eventsToSend).catch(error => {
            console.warn('[Logger] Batch send failed, re-buffering:', error);
            // Re-buffer events yang gagal dikirim (prepend ke awal)
            this.buffer = [...eventsToSend, ...this.buffer];
        });
    }

    /**
     * Synchronous flush — menunggu sampai batch terkirim.
     * Digunakan saat stop() atau app background.
     */
    async flushSync(): Promise<void> {
        if (this.buffer.length === 0) {
            return;
        }

        const eventsToSend = [...this.buffer];
        this.buffer = [];

        await this.sendBatch(eventsToSend);
    }

    /**
     * Kirim batch events ke backend.
     */
    private async sendBatch(events: InteractionLog[]): Promise<void> {
        this.isFlushing = true;

        try {
            const payload: InteractionBatchPayload = {
                session_id: this.sessionId,
                batch_id: uuidv4(),
                timestamp: Date.now(),
                events,
                event_count: events.length,
            };

            await this.apiClient.sendInteractionBatch(payload);
        } finally {
            this.isFlushing = false;
        }
    }

    /**
     * Jumlah event di buffer saat ini.
     */
    get bufferSize(): number {
        return this.buffer.length;
    }

    /**
     * Apakah logger sedang aktif.
     */
    get isActive(): boolean {
        return this.flushTimer !== null;
    }
}

/** Singleton logger instance */
export const interactionLogger = new InteractionLogger();
