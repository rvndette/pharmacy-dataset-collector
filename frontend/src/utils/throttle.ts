// =============================================================================
// throttle.ts — Generic throttle utility for high-frequency events
// =============================================================================

/**
 * Creates a throttled version of a function that only executes at most once
 * every `intervalMs` milliseconds. Uses trailing edge execution to ensure
 * the last call is always processed.
 *
 * @param fn - Function to throttle
 * @param intervalMs - Minimum interval between executions (50-100ms recommended)
 * @returns Throttled function with cancel() method
 *
 * @example
 * const throttledScroll = throttle(handleScroll, 50);
 * scrollView.onScroll = throttledScroll;
 * // Later: throttledScroll.cancel();
 */
export function throttle<T extends (...args: Parameters<T>) => void>(
    fn: T,
    intervalMs: number,
): ThrottledFunction<T> {
    let lastExecutionTime = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: Parameters<T> | null = null;

    const throttled = (...args: Parameters<T>): void => {
        const now = performance.now();
        const elapsed = now - lastExecutionTime;

        lastArgs = args;

        if (elapsed >= intervalMs) {
            // Cukup waktu telah berlalu, eksekusi langsung
            lastExecutionTime = now;
            fn(...args);
        } else if (timeoutId === null) {
            // Jadwalkan eksekusi di akhir interval (trailing edge)
            timeoutId = setTimeout(() => {
                lastExecutionTime = performance.now();
                timeoutId = null;
                if (lastArgs !== null) {
                    fn(...lastArgs);
                    lastArgs = null;
                }
            }, intervalMs - elapsed);
        }
    };

    throttled.cancel = (): void => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        lastArgs = null;
    };

    return throttled as ThrottledFunction<T>;
}

export interface ThrottledFunction<T extends (...args: Parameters<T>) => void> {
    (...args: Parameters<T>): void;
    /** Batalkan eksekusi pending */
    cancel: () => void;
}

// =============================================================================
// debounce.ts — Debounce utility for pause detection
// =============================================================================

/**
 * Creates a debounced function that delays invoking `fn` until after
 * `delayMs` milliseconds have elapsed since the last invocation.
 * Useful for detecting typing pauses (> 500ms = thinking pause).
 *
 * @param fn - Function to debounce
 * @param delayMs - Delay in milliseconds
 * @returns Debounced function with cancel() method
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
    fn: T,
    delayMs: number,
): ThrottledFunction<T> {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const debounced = (...args: Parameters<T>): void => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            timeoutId = null;
            fn(...args);
        }, delayMs);
    };

    debounced.cancel = (): void => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };

    return debounced as ThrottledFunction<T>;
}
