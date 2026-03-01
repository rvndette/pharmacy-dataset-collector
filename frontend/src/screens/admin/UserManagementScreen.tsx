// =============================================================================
// screens/admin/UserManagementScreen.tsx — User list, delete, session reset
// =============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { apiClient } from '../../services/api';

interface UserItem {
    _id: string;
    email: string;
    name: string;
    role: string;
}

const ROLE_CONFIG: Record<string, { color: string; bg: string }> = {
    user: { color: '#007AFF', bg: '#E5F1FF' },
    pharmacist: { color: '#34C759', bg: '#E8F5E9' },
    admin: { color: '#AF52DE', bg: '#F3E5F5' },
};

export function UserManagementScreen(): React.JSX.Element {
    const [users, setUsers] = useState<UserItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadUsers = useCallback(async () => {
        setRefreshing(true);
        const data = await apiClient.getUsers();
        setUsers(data);
        setRefreshing(false);
    }, []);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    const handleDeleteUser = useCallback((user: UserItem) => {
        Alert.alert(
            'Hapus User',
            `Yakin ingin menghapus ${user.name} (${user.email})?`,
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Hapus', style: 'destructive',
                    onPress: async () => { await apiClient.deleteUser(user._id); loadUsers(); },
                },
            ],
        );
    }, [loadUsers]);

    const handleResetSessions = useCallback(() => {
        Alert.alert(
            '⚠️ Reset Sesi',
            'Ini akan menghapus SEMUA data sesi dan interaction logs. Aksi ini tidak bisa dibatalkan.',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        const success = await apiClient.resetSessions();
                        Alert.alert(success ? 'Berhasil' : 'Gagal', success ? 'Semua sesi berhasil direset.' : 'Gagal mereset sesi.');
                    },
                },
            ],
        );
    }, []);

    const renderItem = useCallback(({ item }: { item: UserItem }) => {
        const roleConfig = ROLE_CONFIG[item.role] || ROLE_CONFIG.user;
        return (
            <View style={styles.userCard}>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                    <View style={[styles.roleBadge, { backgroundColor: roleConfig.bg }]}>
                        <Text style={[styles.roleText, { color: roleConfig.color }]}>{item.role}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteUser(item)}>
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
            </View>
        );
    }, [handleDeleteUser]);

    return (
        <View style={styles.container}>
            {/* Reset Sessions Button */}
            <TouchableOpacity style={styles.resetButton} onPress={handleResetSessions}>
                <Text style={styles.resetButtonText}>⚠️ Reset Semua Sesi Penelitian</Text>
            </TouchableOpacity>

            <Text style={styles.listHeader}>{users.length} user terdaftar</Text>

            <FlatList
                data={users} renderItem={renderItem} keyExtractor={item => item._id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadUsers} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}><Text style={styles.emptyIcon}>👥</Text><Text style={styles.emptyText}>Belum ada user</Text></View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7' },
    resetButton: { backgroundColor: '#FF3B30', borderRadius: 12, paddingVertical: 14, marginHorizontal: 24, marginTop: 24, alignItems: 'center' },
    resetButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    listHeader: { fontSize: 15, fontWeight: '600', color: '#8E8E93', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
    listContent: { paddingHorizontal: 24, paddingBottom: 24 },
    userCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, alignItems: 'center' },
    userInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
    userEmail: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
    roleBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
    roleText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
    deleteBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
    deleteBtnText: { fontSize: 18 },
    emptyState: { alignItems: 'center', paddingTop: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 16, color: '#8E8E93' },
});
