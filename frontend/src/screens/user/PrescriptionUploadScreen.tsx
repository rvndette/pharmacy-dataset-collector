// =============================================================================
// screens/user/PrescriptionUploadScreen.tsx — Pinch gesture detection
// =============================================================================

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSession } from '../../context/SessionContext';
import { UserStackParamList } from '../../navigation/RoleBasedNavigator';
import { pinchGestureAnalyzer } from '../../utils/gestureAnalyzer';
import { throttle } from '../../utils/throttle';

type Props = NativeStackScreenProps<UserStackParamList, 'PrescriptionUpload'>;
const SCREEN_WIDTH = Dimensions.get('window').width;

export function PrescriptionUploadScreen({ navigation }: Props): React.JSX.Element {
    const { sessionId, logEvent } = useSession();
    const [scale, setScale] = useState(1);
    const [hasUploaded, setHasUploaded] = useState(false);
    const savedScale = useRef(1);

    const throttledPinchUpdate = useRef(
        throttle((scaleFactor: number, focalX: number, focalY: number) => {
            pinchGestureAnalyzer.onPinchUpdate(scaleFactor, focalX, focalY);
        }, 50),
    ).current;

    const pinchGesture = Gesture.Pinch()
        .onStart(() => { pinchGestureAnalyzer.onPinchStart(); })
        .onUpdate((e) => {
            const newScale = savedScale.current * e.scale;
            setScale(Math.max(0.5, Math.min(newScale, 3)));
            throttledPinchUpdate(e.scale, e.focalX, e.focalY);
        })
        .onEnd(() => {
            savedScale.current = scale;
            const event = pinchGestureAnalyzer.onPinchEnd(sessionId, 'prescription_upload');
            if (event) { logEvent(event); }
        });

    const handleUpload = useCallback(() => {
        setHasUploaded(true);
        Alert.alert('Resep Diupload', 'Simulasi upload resep berhasil.');
    }, []);

    const handleNext = useCallback(() => { navigation.navigate('Signature'); }, [navigation]);

    return (
        <GestureHandlerRootView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerIcon}>📋</Text>
                <Text style={styles.title}>Upload Resep</Text>
                <Text style={styles.subtitle}>Upload foto resep dokter dan gunakan pinch untuk zoom</Text>
            </View>

            {!hasUploaded ? (
                <TouchableOpacity style={styles.uploadArea} onPress={handleUpload}>
                    <Text style={styles.uploadIcon}>📷</Text>
                    <Text style={styles.uploadText}>Tap untuk Upload Resep</Text>
                    <Text style={styles.uploadSubtext}>Ambil foto atau pilih dari galeri</Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.imageContainer}>
                    <Text style={styles.zoomHint}>🔍 Gunakan pinch gesture untuk zoom ({(scale * 100).toFixed(0)}%)</Text>
                    <GestureDetector gesture={pinchGesture}>
                        <View style={styles.imageWrapper}>
                            <View style={[styles.prescriptionImage, { transform: [{ scale }] }]}>
                                <View style={styles.prescriptionContent}>
                                    <Text style={styles.prescriptionHeader}>RESEP DOKTER</Text>
                                    <View style={styles.prescriptionLine} />
                                    <Text style={styles.prescriptionRx}>R/</Text>
                                    <Text style={styles.prescriptionItem}>Amoxicillin 500mg tab No. XXI</Text>
                                    <Text style={styles.prescriptionSig}>S 3 dd 1 tab p.c.</Text>
                                    <Text style={styles.prescriptionItem}>Paracetamol 500mg tab No. X</Text>
                                    <Text style={styles.prescriptionSig}>S 3 dd 1 tab p.r.n.</Text>
                                    <View style={styles.prescriptionLine} />
                                    <Text style={styles.prescriptionFooter}>Pro: Tn. Ahmad Fauzi (45 th)</Text>
                                </View>
                            </View>
                        </View>
                    </GestureDetector>
                    <View style={styles.gestureInfo}>
                        <Text style={styles.gestureInfoText}>📊 Gesture data sedang direkam secara real-time</Text>
                    </View>
                </View>
            )}

            {hasUploaded && (
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <Text style={styles.nextButtonText}>Lanjut ke Tanda Tangan</Text>
                </TouchableOpacity>
            )}
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7', padding: 24 },
    header: { alignItems: 'center', marginBottom: 24, paddingTop: 16 },
    headerIcon: { fontSize: 40, marginBottom: 8 },
    title: { fontSize: 26, fontWeight: '800', color: '#1C1C1E', marginBottom: 4 },
    subtitle: { fontSize: 14, color: '#8E8E93', textAlign: 'center' },
    uploadArea: { backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 2, borderColor: '#D1D1D6', borderStyle: 'dashed', padding: 48, alignItems: 'center', justifyContent: 'center' },
    uploadIcon: { fontSize: 56, marginBottom: 16 },
    uploadText: { fontSize: 18, fontWeight: '700', color: '#007AFF', marginBottom: 4 },
    uploadSubtext: { fontSize: 14, color: '#8E8E93' },
    imageContainer: { flex: 1 },
    zoomHint: { fontSize: 14, color: '#007AFF', fontWeight: '600', textAlign: 'center', marginBottom: 12 },
    imageWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 16, backgroundColor: '#E8E8ED' },
    prescriptionImage: { width: SCREEN_WIDTH - 72, backgroundColor: '#FFFEF5', borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 },
    prescriptionContent: { padding: 20 },
    prescriptionHeader: { fontSize: 18, fontWeight: '800', color: '#1C1C1E', textAlign: 'center', marginBottom: 8 },
    prescriptionLine: { height: 1, backgroundColor: '#D1D1D6', marginVertical: 10 },
    prescriptionRx: { fontSize: 20, fontWeight: '700', color: '#1C1C1E', marginBottom: 8 },
    prescriptionItem: { fontSize: 14, color: '#1C1C1E', marginBottom: 2, paddingLeft: 16 },
    prescriptionSig: { fontSize: 13, color: '#007AFF', fontStyle: 'italic', marginBottom: 8, paddingLeft: 32 },
    prescriptionFooter: { fontSize: 13, color: '#3A3A3C', fontWeight: '500' },
    gestureInfo: { backgroundColor: '#E5F5E6', borderRadius: 10, padding: 12, marginTop: 12, alignItems: 'center' },
    gestureInfoText: { fontSize: 13, color: '#34C759', fontWeight: '600' },
    nextButton: { backgroundColor: '#007AFF', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 16, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    nextButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
