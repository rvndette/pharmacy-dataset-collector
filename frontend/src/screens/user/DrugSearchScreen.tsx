// =============================================================================
// screens/user/DrugSearchScreen.tsx — Cognitive load analysis via search
// =============================================================================

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { BiometricTextInput } from '../../components/BiometricTextInput';
import { DrugCard, DrugInfo } from '../../components/DrugCard';
import { useSession } from '../../context/SessionContext';
import { UserStackParamList } from '../../navigation/RoleBasedNavigator';
import { debounce } from '../../utils/throttle';

type Props = NativeStackScreenProps<UserStackParamList, 'DrugSearch'>;

const DRUG_DATABASE: DrugInfo[] = [
    { id: '1', name: 'Amoxicillin', generic_name: 'Amoxicillin Trihydrate', category: 'Antibiotik', dosage: '500mg', price: 'Rp 15.000', requires_prescription: true },
    { id: '2', name: 'Paracetamol', generic_name: 'Acetaminophen', category: 'Analgesik', dosage: '500mg', price: 'Rp 5.000', requires_prescription: false },
    { id: '3', name: 'Omeprazole', generic_name: 'Omeprazole', category: 'Antasida', dosage: '20mg', price: 'Rp 12.000', requires_prescription: true },
    { id: '4', name: 'Cetirizine', generic_name: 'Cetirizine HCl', category: 'Antihistamin', dosage: '10mg', price: 'Rp 8.000', requires_prescription: false },
    { id: '5', name: 'Metformin', generic_name: 'Metformin HCl', category: 'Antidiabetes', dosage: '500mg', price: 'Rp 10.000', requires_prescription: true },
    { id: '6', name: 'Ibuprofen', generic_name: 'Ibuprofen', category: 'Anti-inflamasi', dosage: '400mg', price: 'Rp 7.500', requires_prescription: false },
    { id: '7', name: 'Captopril', generic_name: 'Captopril', category: 'Antihipertensi', dosage: '25mg', price: 'Rp 9.000', requires_prescription: true },
    { id: '8', name: 'Dexamethasone', generic_name: 'Dexamethasone', category: 'Kortikosteroid', dosage: '0.5mg', price: 'Rp 6.000', requires_prescription: true },
    { id: '9', name: 'Loratadine', generic_name: 'Loratadine', category: 'Antihistamin', dosage: '10mg', price: 'Rp 11.000', requires_prescription: false },
    { id: '10', name: 'Simvastatin', generic_name: 'Simvastatin', category: 'Antilipidemia', dosage: '20mg', price: 'Rp 14.000', requires_prescription: true },
];

export function DrugSearchScreen({ navigation }: Props): React.JSX.Element {
    const { logEvent, sessionId } = useSession();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<DrugInfo[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    const debouncedSearch = useRef(
        debounce((query: string) => {
            if (query.trim().length === 0) { setResults([]); setHasSearched(false); return; }
            setHasSearched(true);
            const filtered = DRUG_DATABASE.filter(
                drug => drug.name.toLowerCase().includes(query.toLowerCase()) ||
                    drug.generic_name.toLowerCase().includes(query.toLowerCase()) ||
                    drug.category.toLowerCase().includes(query.toLowerCase()),
            );
            setResults(filtered);
        }, 300),
    ).current;

    const handleSearchChange = useCallback((text: string) => { setSearchQuery(text); debouncedSearch(text); }, [debouncedSearch]);
    const handleDrugPress = useCallback((drug: DrugInfo) => { navigation.navigate('DrugDetail', { drug }); }, [navigation]);
    const renderDrug = useCallback(({ item }: { item: DrugInfo }) => (<DrugCard drug={item} onPress={handleDrugPress} />), [handleDrugPress]);
    const keyExtractor = useCallback((item: DrugInfo) => item.id, []);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerIcon}>💊</Text>
                <Text style={styles.title}>Cari Obat</Text>
                <Text style={styles.subtitle}>Ketik nama obat, zat aktif, atau kategori</Text>
            </View>
            <View style={styles.searchSection}>
                <BiometricTextInput
                    fieldId="drug_search" screen="drug_search"
                    placeholder="Contoh: Paracetamol, Antibiotik..."
                    value={searchQuery} onChangeText={handleSearchChange}
                    autoCorrect={false} autoComplete="off" spellCheck={false}
                    style={styles.searchInput}
                />
            </View>
            <FlatList
                data={results} renderItem={renderDrug} keyExtractor={keyExtractor}
                contentContainerStyle={styles.resultsList}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        {hasSearched ? (
                            <><Text style={styles.emptyIcon}>🔍</Text><Text style={styles.emptyText}>Tidak ada obat ditemukan untuk "{searchQuery}"</Text></>
                        ) : (
                            <><Text style={styles.emptyIcon}>📋</Text><Text style={styles.emptyText}>Mulai mengetik untuk mencari obat</Text><Text style={styles.emptySubtext}>Tersedia {DRUG_DATABASE.length} obat dalam database</Text></>
                        )}
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7' },
    header: { alignItems: 'center', paddingTop: 20, paddingBottom: 8, paddingHorizontal: 24 },
    headerIcon: { fontSize: 40, marginBottom: 8 },
    title: { fontSize: 26, fontWeight: '800', color: '#1C1C1E', marginBottom: 4 },
    subtitle: { fontSize: 14, color: '#8E8E93', textAlign: 'center' },
    searchSection: { paddingHorizontal: 24, paddingVertical: 12 },
    searchInput: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E5E5EA', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
    resultsList: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
    emptyState: { alignItems: 'center', paddingTop: 48 },
    emptyIcon: { fontSize: 48, marginBottom: 16 },
    emptyText: { fontSize: 16, color: '#8E8E93', textAlign: 'center' },
    emptySubtext: { fontSize: 13, color: '#AEAEB2', marginTop: 4 },
});
