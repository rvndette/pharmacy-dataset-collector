// =============================================================================
// screens/pharmacist/PrescriptionDetailScreen.tsx — Verify prescription
// =============================================================================

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { PharmacistStackParamList } from '../../navigation/RoleBasedNavigator';
import { apiClient } from '../../services/api';
import { PrescriptionItem } from '../../types/role';

type Props = NativeStackScreenProps<PharmacistStackParamList, 'PrescriptionDetail'>;

export function PrescriptionDetailScreen({ route, navigation }: Props): React.JSX.Element {
    const { prescriptionId } = route.params;
    const [prescription, setPrescription] = useState<PrescriptionItem | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        apiClient.getPrescriptionDetail(prescriptionId).then(setPrescription);
    }, [prescriptionId]);

    const handleStatusUpdate = useCallback(async (status: 'approved' | 'rejected') => {
        const action = status === 'approved' ? 'menyetujui' : 'menolak';
        Alert.alert(
            'Konfirmasi',
            `Apakah Anda yakin ingin ${action} resep ini?`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: status === 'approved' ? 'Setujui' : 'Tolak',
                    style: status === 'rejected' ? 'destructive' : 'default',
                    onPress: async () => {
                        setIsUpdating(true);
                        const success = await apiClient.updatePrescriptionStatus(prescriptionId, status);
                        setIsUpdating(false);
                        if (success) {
                            Alert.alert('Berhasil', `Resep berhasil di-${status}.`, [
                                { text: 'OK', onPress: () => navigation.goBack() },
                            ]);
                        } else {
                            Alert.alert('Error', 'Gagal memperbarui status resep.');
                        }
                    },
                },
            ],
        );
    }, [prescriptionId, navigation]);

    if (!prescription) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Memuat detail resep...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Prescription Image Placeholder */}
            <View style={styles.imageSection}>
                <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderIcon}>📋</Text>
                    <Text style={styles.imagePlaceholderText}>Foto Resep</Text>
                    <Text style={styles.imagePlaceholderSub}>Preview gambar resep dari user</Text>
                </View>
            </View>

            {/* Info Card */}
            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>📝 Informasi Resep</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>ID Resep</Text>
                    <Text style={styles.infoValue}>{prescription.prescription_id.slice(0, 12)}...</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>User ID</Text>
                    <Text style={styles.infoValue}>{prescription.user_id.slice(0, 12)}...</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: prescription.status === 'pending' ? '#FFF3E0' : prescription.status === 'approved' ? '#E8F5E9' : '#FFEBEE' }]}>
                        <Text style={[styles.statusText, { color: prescription.status === 'pending' ? '#FF9500' : prescription.status === 'approved' ? '#34C759' : '#FF3B30' }]}>
                            {prescription.status.toUpperCase()}
                        </Text>
                    </View>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Diupload</Text>
                    <Text style={styles.infoValue}>{new Date(prescription.created_at).toLocaleString('id-ID')}</Text>
                </View>
            </View>

            {/* Zoom Metadata — privacy-safe interaction metrics */}
            <View style={styles.metadataCard}>
                <Text style={styles.metadataTitle}>🔍 Metadata Interaksi Zoom</Text>
                <Text style={styles.metadataNote}>
                    Indikator verifikasi visual user (bukan raw biometric data)
                </Text>
                <View style={styles.metadataGrid}>
                    <View style={styles.metadataItem}>
                        <Text style={styles.metadataValue}>{prescription.zoom_metadata.zoom_count}</Text>
                        <Text style={styles.metadataLabel}>Total Zoom Count</Text>
                    </View>
                    <View style={styles.metadataItem}>
                        <Text style={styles.metadataValue}>{prescription.zoom_metadata.avg_zoom_level.toFixed(2)}x</Text>
                        <Text style={styles.metadataLabel}>Avg Zoom Level</Text>
                    </View>
                    <View style={styles.metadataItem}>
                        <Text style={styles.metadataValue}>{(prescription.zoom_metadata.total_viewing_time / 1000).toFixed(1)}s</Text>
                        <Text style={styles.metadataLabel}>Total Viewing Time</Text>
                    </View>
                </View>
            </View>

            {/* Action Buttons */}
            {prescription.status === 'pending' && (
                <View style={styles.actionSection}>
                    <TouchableOpacity
                        style={[styles.approveButton, isUpdating && styles.buttonDisabled]}
                        onPress={() => handleStatusUpdate('approved')}
                        disabled={isUpdating}
                    >
                        <Text style={styles.approveButtonText}>✅ Setujui Resep</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.rejectButton, isUpdating && styles.buttonDisabled]}
                        onPress={() => handleStatusUpdate('rejected')}
                        disabled={isUpdating}
                    >
                        <Text style={styles.rejectButtonText}>❌ Tolak Resep</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Privacy Notice */}
            <View style={styles.privacyNotice}>
                <Text style={styles.privacyIcon}>🔒</Text>
                <Text style={styles.privacyText}>
                    Sebagai apoteker, Anda hanya dapat melihat metadata interaksi. Raw behavioral logs tidak dapat diakses (privacy constraint).
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7' },
    content: { padding: 24, paddingBottom: 48 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { fontSize: 16, color: '#8E8E93' },
    imageSection: { marginBottom: 16 },
    imagePlaceholder: { backgroundColor: '#E8E8ED', borderRadius: 20, padding: 48, alignItems: 'center', justifyContent: 'center' },
    imagePlaceholderIcon: { fontSize: 56, marginBottom: 12 },
    imagePlaceholderText: { fontSize: 18, fontWeight: '700', color: '#3A3A3C' },
    imagePlaceholderSub: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
    infoCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    infoTitle: { fontSize: 17, fontWeight: '700', color: '#1C1C1E', marginBottom: 12 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
    infoLabel: { fontSize: 14, color: '#8E8E93' },
    infoValue: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
    statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    statusText: { fontSize: 12, fontWeight: '700' },
    metadataCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#E5E5EA' },
    metadataTitle: { fontSize: 17, fontWeight: '700', color: '#1C1C1E', marginBottom: 4 },
    metadataNote: { fontSize: 12, color: '#8E8E93', marginBottom: 16, fontStyle: 'italic' },
    metadataGrid: { flexDirection: 'row', gap: 10 },
    metadataItem: { flex: 1, alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 12, padding: 16 },
    metadataValue: { fontSize: 22, fontWeight: '800', color: '#007AFF', marginBottom: 4 },
    metadataLabel: { fontSize: 11, color: '#8E8E93', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.3 },
    actionSection: { gap: 10, marginBottom: 16 },
    approveButton: { backgroundColor: '#34C759', borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: '#34C759', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    approveButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
    rejectButton: { backgroundColor: '#FF3B30', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
    rejectButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
    buttonDisabled: { opacity: 0.5 },
    privacyNotice: { flexDirection: 'row', backgroundColor: '#E5F1FF', borderRadius: 12, padding: 14, alignItems: 'flex-start' },
    privacyIcon: { fontSize: 16, marginRight: 10 },
    privacyText: { fontSize: 12, color: '#3A3A3C', flex: 1, lineHeight: 18 },
});
