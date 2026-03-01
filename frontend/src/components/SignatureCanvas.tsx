// =============================================================================
// SignatureCanvas.tsx — Digital signature dengan trajectory recording
// =============================================================================

import React, { useCallback, useRef, useState } from 'react';
import { Dimensions, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSession } from '../context/SessionContext';
import { SignatureEvent, SignaturePoint } from '../types/interaction';

interface SignatureCanvasProps {
    /** Callback ketika signature selesai (trajectory dikirim) */
    onSignatureEnd?: (trajectory: SignaturePoint[]) => void;
    /** Lebar canvas */
    width?: number;
    /** Tinggi canvas */
    height?: number;
}

/**
 * SignatureCanvas — canvas tanda tangan digital menggunakan react-native-svg.
 *
 * Menyimpan full trajectory { x, y, t }[] (bukan hanya PNG).
 * Trajectory digunakan untuk analisis velocity & acceleration.
 */
export function SignatureCanvas({
    onSignatureEnd,
    width = Dimensions.get('window').width - 48,
    height = 250,
}: SignatureCanvasProps): React.JSX.Element {
    const { sessionId, logEvent } = useSession();
    const [paths, setPaths] = useState<string[]>([]);
    const [currentPath, setCurrentPath] = useState<string>('');
    const trajectoryRef = useRef<SignaturePoint[]>([]);
    const strokeCountRef = useRef(0);
    const startTimeRef = useRef(0);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,

            onPanResponderGrant: (evt) => {
                const { locationX, locationY } = evt.nativeEvent;
                const now = performance.now();

                if (trajectoryRef.current.length === 0) {
                    startTimeRef.current = now;
                }

                strokeCountRef.current += 1;
                trajectoryRef.current.push({ x: locationX, y: locationY, t: now });
                setCurrentPath(`M${locationX},${locationY}`);
            },

            onPanResponderMove: (evt) => {
                const { locationX, locationY } = evt.nativeEvent;
                const now = performance.now();

                trajectoryRef.current.push({ x: locationX, y: locationY, t: now });
                setCurrentPath(prev => `${prev} L${locationX},${locationY}`);
            },

            onPanResponderRelease: () => {
                if (currentPath) {
                    setPaths(prev => [...prev, currentPath]);
                    setCurrentPath('');
                }
            },
        }),
    ).current;

    const handleSubmit = useCallback(() => {
        const trajectory = [...trajectoryRef.current];
        const totalDuration =
            trajectory.length > 1
                ? trajectory[trajectory.length - 1].t - trajectory[0].t
                : 0;

        const event: SignatureEvent = {
            session_id: sessionId,
            event_type: 'signature',
            timestamp: Date.now(),
            timestamp_hr: performance.now(),
            screen: 'signature',
            data: {
                trajectory,
                total_duration: totalDuration,
                stroke_count: strokeCountRef.current,
            },
        };

        logEvent(event);
        onSignatureEnd?.(trajectory);
    }, [sessionId, logEvent, onSignatureEnd]);

    const handleClear = useCallback(() => {
        setPaths([]);
        setCurrentPath('');
        trajectoryRef.current = [];
        strokeCountRef.current = 0;
        startTimeRef.current = 0;
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Tanda Tangan Digital</Text>
            <View
                style={[styles.canvasWrapper, { width, height }]}
                {...panResponder.panHandlers}
            >
                <Svg width={width} height={height} style={styles.svg}>
                    {paths.map((d, index) => (
                        <Path
                            key={`path-${index}`}
                            d={d}
                            stroke="#1C1C1E"
                            strokeWidth={2.5}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    ))}
                    {currentPath ? (
                        <Path
                            d={currentPath}
                            stroke="#007AFF"
                            strokeWidth={2.5}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    ) : null}
                </Svg>
            </View>

            <View style={styles.statsRow}>
                <Text style={styles.statsText}>
                    Points: {trajectoryRef.current.length} | Strokes: {strokeCountRef.current}
                </Text>
            </View>

            <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                    <Text style={styles.clearButtonText}>Hapus</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                    <Text style={styles.submitButtonText}>Konfirmasi</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 12,
    },
    canvasWrapper: {
        borderWidth: 2,
        borderColor: '#D1D1D6',
        borderRadius: 16,
        borderStyle: 'dashed',
        backgroundColor: '#FAFAFA',
        overflow: 'hidden',
    },
    svg: {
        backgroundColor: 'transparent',
    },
    statsRow: {
        marginTop: 8,
        paddingHorizontal: 16,
    },
    statsText: {
        fontSize: 12,
        color: '#8E8E93',
    },
    buttonRow: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 12,
    },
    clearButton: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#FF3B30',
        backgroundColor: '#FFF',
    },
    clearButtonText: {
        color: '#FF3B30',
        fontWeight: '600',
        fontSize: 16,
    },
    submitButton: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#007AFF',
    },
    submitButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 16,
    },
});
