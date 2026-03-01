// =============================================================================
// screens/admin/AdminDashboardScreen.tsx — System stats & monitoring
// =============================================================================

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { AdminStackParamList } from '../../navigation/RoleBasedNavigator';
import { apiClient } from '../../services/api';
import { AdminStats, LoggerStatus } from '../../types/role';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminDashboard'>;

export function AdminDashboardScreen({ navigation }: Props): React.JSX.Element {
    const { logout } = useAuth();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loggerStatus, setLoggerStatus] = useState<LoggerStatus | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        setRefreshing(true);
        const [s, l] = await Promise.all([
            apiClient.getAdminStats(),
            apiClient.getLoggerStatus(),
        ]);
        setStats(s);
        setLoggerStatus(l);
        setRefreshing(false);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const formatDuration = (ms: number): string => {
        if (ms < 1000) { return `${ms}ms`; }
        if (ms < 60000) { return `${(ms / 1000).toFixed(1)}s`; }
        return `${(ms / 60000).toFixed(1)}m`;
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor="#007AFF" />}
        >
            {/* Header */}
            <View style={styles.headerBar}>
                <View>
                    <Text style={styles.greeting}>🔬 Admin Panel</Text>
                    <Text style={styles.greetingSub}>Dashboard Peneliti</Text>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Stats Cards */}
            <Text style={styles.sectionTitle}>📊 Statistik Sistem</Text>
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats?.total_sessions ?? '—'}</Text>
                    <Text style={styles.statLabel}>Total Sesi</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats?.total_users ?? '—'}</Text>
                    <Text style={styles.statLabel}>User Unik</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats ? formatDuration(stats.avg_session_duration_ms) : '—'}</Text>
                    <Text style={styles.statLabel}>Avg Durasi</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats?.avg_events_per_session ?? '—'}</Text>
                    <Text style={styles.statLabel}>Avg Events/Sesi</Text>
                </View>
            </View>

            {/* Device Distribution */}
            {stats?.device_distribution && stats.device_distribution.length > 0 && (
                <View style={styles.distributionCard}>
                    <Text style={styles.cardTitle}>📱 Distribusi Device</Text>
                    {stats.device_distribution.map(d => (
                        <View key={d.platform} style={styles.distRow}>
                            <Text style={styles.distLabel}>{d.platform}</Text>
                            <Text style={styles.distValue}>{d.count} sesi</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Logger Status */}
            <Text style={styles.sectionTitle}>📡 Monitoring Logger</Text>
            <View style={styles.loggerCard}>
                <View style={styles.loggerRow}>
                    <View style={[styles.statusDot, { backgroundColor: loggerStatus?.status === 'online' ? '#34C759' : '#FF3B30' }]} />
                    <Text style={styles.loggerStatusText}>{loggerStatus?.status === 'online' ? 'Server Online' : 'Server Offline'}</Text>
                </View>
                <View style={styles.loggerStats}>
                    <View style={styles.loggerStatItem}>
                        <Text style={styles.loggerStatValue}>{loggerStatus?.total_logs ?? '—'}</Text>
                        <Text style={styles.loggerStatLabel}>Total Logs</Text>
                    </View>
                    <View style={styles.loggerStatItem}>
                        <Text style={styles.loggerStatValue}>{loggerStatus?.logs_last_hour ?? '—'}</Text>
                        <Text style={styles.loggerStatLabel}>Last Hour</Text>
                    </View>
                    <View style={styles.loggerStatItem}>
                        <Text style={styles.loggerStatValue}>{loggerStatus?.active_sessions ?? '—'}</Text>
                        <Text style={styles.loggerStatLabel}>Active</Text>
                    </View>
                </View>
            </View>

            {/* Navigation Cards */}
            <Text style={styles.sectionTitle}>⚙️ Manajemen</Text>
            <View style={styles.navGrid}>
                <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate('DrugManagement')}>
                    <Text style={styles.navIcon}>💊</Text>
                    <Text style={styles.navLabel}>Master Data Obat</Text>
                    <Text style={styles.navSub}>{stats?.total_drugs ?? 0} obat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navCard} onPress={() => navigation.navigate('UserManagement')}>
                    <Text style={styles.navIcon}>👥</Text>
                    <Text style={styles.navLabel}>Manajemen User</Text>
                    <Text style={styles.navSub}>{stats?.total_users ?? 0} user</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.navCard, styles.navCardFull]} onPress={() => navigation.navigate('ExportData')}>
                    <Text style={styles.navIcon}>📦</Text>
                    <Text style={styles.navLabel}>Export Dataset</Text>
                    <Text style={styles.navSub}>JSON / CSV (anonymized)</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7' },
    content: { paddingBottom: 48 },
    headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
    greeting: { fontSize: 22, fontWeight: '800', color: '#1C1C1E' },
    greetingSub: { fontSize: 14, color: '#8E8E93', marginTop: 2 },
    logoutBtn: { backgroundColor: '#FF3B30', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
    logoutText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 10 },
    statCard: { flex: 1, minWidth: '45%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    statValue: { fontSize: 24, fontWeight: '800', color: '#007AFF', marginBottom: 4 },
    statLabel: { fontSize: 12, color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.3 },
    distributionCard: { backgroundColor: '#FFFFFF', marginHorizontal: 24, marginTop: 12, borderRadius: 14, padding: 16 },
    cardTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 10 },
    distRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
    distLabel: { fontSize: 14, color: '#3A3A3C', fontWeight: '500' },
    distValue: { fontSize: 14, color: '#007AFF', fontWeight: '600' },
    loggerCard: { backgroundColor: '#FFFFFF', marginHorizontal: 24, borderRadius: 14, padding: 16 },
    loggerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    loggerStatusText: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
    loggerStats: { flexDirection: 'row', gap: 10 },
    loggerStatItem: { flex: 1, alignItems: 'center', backgroundColor: '#F2F2F7', borderRadius: 10, padding: 12 },
    loggerStatValue: { fontSize: 18, fontWeight: '800', color: '#1C1C1E', marginBottom: 2 },
    loggerStatLabel: { fontSize: 10, color: '#8E8E93', textTransform: 'uppercase' },
    navGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 10, marginBottom: 12 },
    navCard: { flex: 1, minWidth: '45%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    navCardFull: { minWidth: '100%' },
    navIcon: { fontSize: 32, marginBottom: 8 },
    navLabel: { fontSize: 15, fontWeight: '700', color: '#1C1C1E', marginBottom: 2 },
    navSub: { fontSize: 12, color: '#8E8E93' },
});
