// =============================================================================
// screens/pharmacist/PrescriptionListScreen.tsx — Dashboard resep masuk
// =============================================================================

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { PharmacistStackParamList } from '../../navigation/RoleBasedNavigator';
import { apiClient } from '../../services/api';
import { PrescriptionItem, PrescriptionStatus } from '../../types/role';

type Props = NativeStackScreenProps<PharmacistStackParamList, 'PrescriptionList'>;

const STATUS_CONFIG: Record<PrescriptionStatus, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pending', color: '#FF9500', bg: '#FFF3E0' },
    approved: { label: 'Approved', color: '#34C759', bg: '#E8F5E9' },
    rejected: { label: 'Rejected', color: '#FF3B30', bg: '#FFEBEE' },
};

export function PrescriptionListScreen({ navigation }: Props): React.JSX.Element {
    const { logout } = useAuth();
    const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [filterStatus, setFilterStatus] = useState<PrescriptionStatus | 'all'>('all');

    const loadPrescriptions = useCallback(async () => {
        setRefreshing(true);
        const data = await apiClient.getPrescriptions(
            filterStatus === 'all' ? undefined : filterStatus,
        );
        setPrescriptions(data);
        setRefreshing(false);
    }, [filterStatus]);

    useEffect(() => { loadPrescriptions(); }, [loadPrescriptions]);

    const renderItem = useCallback(({ item }: { item: PrescriptionItem }) => {
        const config = STATUS_CONFIG[item.status];
        return (
            <TouchableOpacity
                style={styles.prescriptionCard}
                onPress={() => navigation.navigate('PrescriptionDetail', { prescriptionId: item.prescription_id })}
            >
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.userId}>User: {item.user_id.slice(0, 8)}...</Text>
                        <Text style={styles.uploadTime}>
                            {new Date(item.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                            })}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                        <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                    </View>
                </View>

                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaIcon}>🔍</Text>
                        <Text style={styles.metaValue}>{item.zoom_metadata.zoom_count}</Text>
                        <Text style={styles.metaLabel}>Zoom</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaIcon}>📏</Text>
                        <Text style={styles.metaValue}>{item.zoom_metadata.avg_zoom_level.toFixed(1)}x</Text>
                        <Text style={styles.metaLabel}>Avg Level</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaIcon}>⏱️</Text>
                        <Text style={styles.metaValue}>{(item.zoom_metadata.total_viewing_time / 1000).toFixed(1)}s</Text>
                        <Text style={styles.metaLabel}>View Time</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }, [navigation]);

    return (
        <View style={styles.container}>
            {/* Header with Logout */}
            <View style={styles.headerBar}>
                <View>
                    <Text style={styles.greeting}>💊 Dashboard Apoteker</Text>
                    <Text style={styles.greetingSub}>{prescriptions.length} resep ditemukan</Text>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Status Filter */}
            <View style={styles.filterRow}>
                {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
                    <TouchableOpacity
                        key={status}
                        style={[styles.filterChip, filterStatus === status && styles.filterChipActive]}
                        onPress={() => setFilterStatus(status)}
                    >
                        <Text style={[styles.filterChipText, filterStatus === status && styles.filterChipTextActive]}>
                            {status === 'all' ? 'Semua' : STATUS_CONFIG[status].label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={prescriptions}
                renderItem={renderItem}
                keyExtractor={(item) => item.prescription_id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadPrescriptions} tintColor="#007AFF" />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📋</Text>
                        <Text style={styles.emptyText}>Belum ada resep masuk</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7' },
    headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
    greeting: { fontSize: 22, fontWeight: '800', color: '#1C1C1E' },
    greetingSub: { fontSize: 14, color: '#8E8E93', marginTop: 2 },
    logoutBtn: { backgroundColor: '#FF3B30', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
    logoutText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
    filterRow: { flexDirection: 'row', paddingHorizontal: 24, paddingVertical: 12, gap: 8 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E5E5EA' },
    filterChipActive: { backgroundColor: '#007AFF' },
    filterChipText: { fontSize: 13, fontWeight: '600', color: '#3A3A3C' },
    filterChipTextActive: { color: '#FFFFFF' },
    listContent: { paddingHorizontal: 24, paddingBottom: 24 },
    prescriptionCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    userId: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
    uploadTime: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
    statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    statusText: { fontSize: 12, fontWeight: '700' },
    metaRow: { flexDirection: 'row', gap: 12 },
    metaItem: { flex: 1, alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 10, padding: 10 },
    metaIcon: { fontSize: 16, marginBottom: 2 },
    metaValue: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
    metaLabel: { fontSize: 10, color: '#8E8E93', textTransform: 'uppercase', marginTop: 2 },
    emptyState: { alignItems: 'center', paddingTop: 60 },
    emptyIcon: { fontSize: 56, marginBottom: 12 },
    emptyText: { fontSize: 16, color: '#8E8E93' },
});
