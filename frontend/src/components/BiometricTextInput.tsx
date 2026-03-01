// =============================================================================
// BiometricTextInput.tsx — TextInput wrapper with keystroke dynamics recording
// =============================================================================

import React, { useCallback, useRef } from 'react';
import {
    NativeSyntheticEvent,
    StyleSheet,
    Text,
    TextInput,
    TextInputChangeEventData,
    TextInputKeyPressEventData,
    TextInputProps,
    View,
} from 'react-native';
import { useSession } from '../context/SessionContext';
import { ScreenName } from '../types/interaction';
import { keystrokeAnalyzer } from '../utils/keystrokeAnalyzer';
import { throttle } from '../utils/throttle';

interface BiometricTextInputProps extends Omit<TextInputProps, 'onKeyPress' | 'onChange'> {
    /** Unique field identifier (e.g., 'name', 'email') */
    fieldId: string;
    /** Screen dimana input berada */
    screen: ScreenName;
    /** Label untuk ditampilkan di atas input */
    label?: string;
    /** Content-blind mode (untuk password fields — hanya log timing, bukan key) */
    contentBlind?: boolean;
}

/**
 * BiometricTextInput — TextInput yang otomatis merekam keystroke dynamics.
 *
 * Features:
 * - Record keyDownTime & keyUpTime via onKeyPress
 * - Compute holdTime & flightTime
 * - Detect corrections (backspace/delete)
 * - Detect thinking pauses (> 500ms)
 * - Content-blind mode untuk sensitive fields
 * - Throttled logging (50ms)
 */
export function BiometricTextInput({
    fieldId,
    screen,
    label,
    contentBlind = false,
    style,
    ...textInputProps
}: BiometricTextInputProps): React.JSX.Element {
    const { sessionId, logEvent } = useSession();
    const textLengthRef = useRef(0);

    // Throttled pause detection
    const throttledPauseCheck = useRef(
        throttle(() => {
            const pauseEvent = keystrokeAnalyzer.detectPause(fieldId, sessionId, screen);
            if (pauseEvent) {
                logEvent(pauseEvent);
            }
        }, 100),
    ).current;

    const handleKeyPress = useCallback(
        (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
            const key = e.nativeEvent.key;
            const safeKey = contentBlind ? '•' : key;

            // Record key down
            keystrokeAnalyzer.onKeyDown(safeKey, fieldId, sessionId, screen);

            // Simulate key up setelah short delay (React Native tidak punya onKeyUp)
            setTimeout(() => {
                const keystrokeEvent = keystrokeAnalyzer.onKeyUp(
                    safeKey,
                    fieldId,
                    sessionId,
                    screen,
                );

                if (keystrokeEvent) {
                    logEvent(keystrokeEvent);
                }

                // Detect corrections
                const correctionEvent = keystrokeAnalyzer.detectCorrection(
                    key,
                    fieldId,
                    textLengthRef.current,
                    sessionId,
                    screen,
                );

                if (correctionEvent) {
                    logEvent(correctionEvent);
                }
            }, 10);

            // Schedule pause detection
            throttledPauseCheck();
        },
        [sessionId, fieldId, screen, contentBlind, logEvent, throttledPauseCheck],
    );

    const handleChange = useCallback(
        (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
            textLengthRef.current = e.nativeEvent.text.length;
        },
        [],
    );

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                {...textInputProps}
                style={[styles.input, style]}
                onKeyPress={handleKeyPress}
                onChange={handleChange}
                placeholderTextColor="#8E8E93"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 6,
        letterSpacing: 0.3,
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#D1D1D6',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1C1C1E',
        backgroundColor: '#F9F9FB',
    },
});
