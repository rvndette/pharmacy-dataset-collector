// =============================================================================
// screens/admin/DrugManagementScreen.tsx — CRUD master data obat
// =============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { apiClient } from '../../services/api';
import { DrugItem } from '../../types/role';

export function DrugManagementScreen(): React.JSX.Element {
    const [drugs, setDrugs] = useState<DrugItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editDrug, setEditDrug] = useState<Partial<DrugItem> | null>(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formGenericName, setFormGenericName] = useState('');
    const [formCategory, setFormCategory] = useState('');
    const [formDosage, setFormDosage] = useState('');
    const [formPrice, setFormPrice] = useState('');

    const loadDrugs = useCallback(async () => {
        setRefreshing(true);
        const data = await apiClient.getDrugs();
        setDrugs(data);
        setRefreshing(false);
    }, []);

    useEffect(() => { loadDrugs(); }, [loadDrugs]);

    const openAddModal = useCallback(() => {
        setEditDrug(null);
        setFormName(''); setFormGenericName(''); setFormCategory(''); setFormDosage(''); setFormPrice('');
        setModalVisible(true);
    }, []);

    const openEditModal = useCallback((drug: DrugItem) => {
        setEditDrug(drug);
        setFormName(drug.name); setFormGenericName(drug.generic_name); setFormCategory(drug.category);
        setFormDosage(drug.dosage); setFormPrice(drug.price);
        setModalVisible(true);
    }, []);

    const handleSave = useCallback(async () => {
        if (!formName || !formGenericName || !formCategory || !formDosage || !formPrice) {
            Alert.alert('Error', 'Semua field wajib diisi.');
            return;
        }
        const data = {
            name: formName, generic_name: formGenericName, category: formCategory,
            dosage: formDosage, price: formPrice, requires_prescription: false, description: '',
        };
        if (editDrug?.drug_id) {
            await apiClient.updateDrug(editDrug.drug_id, data);
        } else {
            await apiClient.createDrug(data);
        }
        setModalVisible(false);
        loadDrugs();
    }, [formName, formGenericName, formCategory, formDosage, formPrice, editDrug, loadDrugs]);

    const handleDelete = useCallback((drug: DrugItem) => {
        Alert.alert('Hapus Obat', `Yakin ingin menghapus ${drug.name}?`, [
            { text: 'Batal', style: 'cancel' },
            { text: 'Hapus', style: 'destructive', onPress: async () => { await apiClient.deleteDrug(drug.drug_id); loadDrugs(); } },
        ]);
    }, [loadDrugs]);

    const renderItem = useCallback(({ item }: { item: DrugItem }) => (
        <View style={styles.drugCard}>
            <View style={styles.drugInfo}>
                <Text style={styles.drugName}>{item.name}</Text>
                <Text style={styles.drugGeneric}>{item.generic_name} • {item.category}</Text>
                <Text style={styles.drugMeta}>{item.dosage} — {item.price}</Text>
            </View>
            <View style={styles.drugActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                    <Text style={styles.editBtnText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
            </View>
        </View>
    ), [openEditModal, handleDelete]);

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                <Text style={styles.addButtonText}>+ Tambah Obat Baru</Text>
            </TouchableOpacity>
            <FlatList
                data={drugs} renderItem={renderItem} keyExtractor={item => item.drug_id}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadDrugs} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}><Text style={styles.emptyIcon}>💊</Text><Text style={styles.emptyText}>Belum ada data obat</Text></View>
                }
            />

            {/* Add/Edit Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{editDrug ? 'Edit Obat' : 'Tambah Obat Baru'}</Text>
                        <TextInput style={styles.input} placeholder="Nama Obat" value={formName} onChangeText={setFormName} />
                        <TextInput style={styles.input} placeholder="Nama Generik" value={formGenericName} onChangeText={setFormGenericName} />
                        <TextInput style={styles.input} placeholder="Kategori" value={formCategory} onChangeText={setFormCategory} />
                        <TextInput style={styles.input} placeholder="Dosis" value={formDosage} onChangeText={setFormDosage} />
                        <TextInput style={styles.input} placeholder="Harga" value={formPrice} onChangeText={setFormPrice} />
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelBtnText}>Batal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                <Text style={styles.saveBtnText}>Simpan</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7' },
    addButton: { backgroundColor: '#007AFF', borderRadius: 12, paddingVertical: 14, margin: 24, marginBottom: 0, alignItems: 'center' },
    addButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    listContent: { padding: 24, paddingTop: 12 },
    drugCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    drugInfo: { flex: 1 },
    drugName: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
    drugGeneric: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
    drugMeta: { fontSize: 13, color: '#007AFF', fontWeight: '500', marginTop: 4 },
    drugActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    editBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5F1FF', alignItems: 'center', justifyContent: 'center' },
    editBtnText: { fontSize: 16 },
    deleteBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFEBEE', alignItems: 'center', justifyContent: 'center' },
    deleteBtnText: { fontSize: 16 },
    emptyState: { alignItems: 'center', paddingTop: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 16, color: '#8E8E93' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 24 },
    modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#1C1C1E', marginBottom: 20 },
    input: { backgroundColor: '#F2F2F7', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 10 },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
    cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#F2F2F7', alignItems: 'center' },
    cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#3A3A3C' },
    saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#007AFF', alignItems: 'center' },
    saveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});
