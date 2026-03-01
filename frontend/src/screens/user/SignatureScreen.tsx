// =============================================================================
// screens/user/SignatureScreen.tsx — Digital signature with trajectory analysis
// =============================================================================

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SignatureCanvas } from '../../components/SignatureCanvas';
import { useSession } from '../../context/SessionContext';
import { UserStackParamList } from '../../navigation/RoleBasedNavigator';
import { SignaturePoint } from '../../types/interaction';

type Props = NativeStackScreenProps<UserStackParamList, 'Signature'>;

interface TrajectoryStats { totalPoints: number; duration: string; avgVelocity: string; maxVelocity: string; }

function computeTrajectoryStats(points: SignaturePoint[]): TrajectoryStats {
    if (points.length < 2) { return { totalPoints: points.length, duration: '0', avgVelocity: '0', maxVelocity: '0' }; }
    const totalDuration = points[points.length - 1].t - points[0].t;
    let totalVelocity = 0; let maxVelocity = 0;
    for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x; const dy = points[i].y - points[i - 1].y; const dt = points[i].t - points[i - 1].t;
        if (dt > 0) { const distance = Math.sqrt(dx * dx + dy * dy); const velocity = distance / dt; totalVelocity += velocity; maxVelocity = Math.max(maxVelocity, velocity); }
    }
    return { totalPoints: points.length, duration: totalDuration.toFixed(0), avgVelocity: (totalVelocity / (points.length - 1)).toFixed(2), maxVelocity: maxVelocity.toFixed(2) };
}

export function SignatureScreen({ navigation }: Props): React.JSX.Element {
    const { endSession } = useSession();
    const [signatureData, setSignatureData] = useState<SignaturePoint[] | null>(null);
    const [isCompleted, setIsCompleted] = useState(false);

    const handleSignatureEnd = useCallback((trajectory: SignaturePoint[]) => { setSignatureData(trajectory); }, []);

    const handleComplete = useCallback(async () => {
        if (!signatureData || signatureData.length < 10) {
            Alert.alert('Tanda Tangan Diperlukan', 'Silakan berikan tanda tangan Anda sebelum melanjutkan.');
            return;
        }
        setIsCompleted(true);
        await endSession();
        Alert.alert('✅ Sesi Selesai', `Semua data behavioral biometrics telah berhasil dikumpulkan.\n\nTotal trajectory points: ${signatureData.length}`, [
            { text: 'Mulai Sesi Baru', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Registration' }] }) },
        ]);
    }, [signatureData, endSession, navigation]);

    const stats = signatureData ? computeTrajectoryStats(signatureData) : null;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.headerIcon}>✍️</Text>
                <Text style={styles.title}>Tanda Tangan Digital</Text>
                <Text style={styles.subtitle}>Berikan tanda tangan Anda untuk verifikasi identitas</Text>
            </View>
            <View style={styles.canvasSection}><SignatureCanvas onSignatureEnd={handleSignatureEnd} /></View>
            {stats && (
                <View style={styles.statsSection}>
                    <Text style={styles.statsTitle}>📊 Analisis Trajectory</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}><Text style={styles.statValue}>{stats.totalPoints}</Text><Text style={styles.statLabel}>Total Points</Text></View>
                        <View style={styles.statCard}><Text style={styles.statValue}>{stats.duration}ms</Text><Text style={styles.statLabel}>Durasi</Text></View>
                        <View style={styles.statCard}><Text style={styles.statValue}>{stats.avgVelocity}</Text><Text style={styles.statLabel}>Avg Velocity</Text></View>
                        <View style={styles.statCard}><Text style={styles.statValue}>{stats.maxVelocity}</Text><Text style={styles.statLabel}>Max Velocity</Text></View>
                    </View>
                </View>
            )}
            <TouchableOpacity style={[styles.completeButton, (!signatureData || isCompleted) && styles.completeButtonDisabled]} onPress={handleComplete} disabled={!signatureData || isCompleted}>
                <Text style={styles.completeButtonText}>{isCompleted ? '✅ Sesi Selesai' : 'Selesaikan Sesi'}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7' },
    content: { padding: 24, paddingBottom: 48 },
    header: { alignItems: 'center', marginBottom: 24, paddingTop: 16 },
    headerIcon: { fontSize: 48, marginBottom: 8 },
    title: { fontSize: 26, fontWeight: '800', color: '#1C1C1E', marginBottom: 4 },
    subtitle: { fontSize: 14, color: '#8E8E93', textAlign: 'center', lineHeight: 20 },
    canvasSection: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3, marginBottom: 16 },
    statsSection: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16 },
    statsTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 12 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    statCard: { flex: 1, minWidth: '45%', backgroundColor: '#F2F2F7', borderRadius: 12, padding: 14, alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '800', color: '#007AFF', marginBottom: 2 },
    statLabel: { fontSize: 11, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.5 },
    completeButton: { backgroundColor: '#34C759', borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: '#34C759', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    completeButtonDisabled: { backgroundColor: '#C7C7CC', shadowOpacity: 0, elevation: 0 },
    completeButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
