// =============================================================================
// DrugCard.tsx — Kartu hasil pencarian obat
// =============================================================================

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface DrugInfo {
    id: string;
    name: string;
    generic_name: string;
    category: string;
    dosage: string;
    price: string;
    requires_prescription: boolean;
}

interface DrugCardProps {
    drug: DrugInfo;
    onPress: (drug: DrugInfo) => void;
}

/**
 * DrugCard — komponen kartu obat untuk ditampilkan di hasil pencarian.
 */
export function DrugCard({ drug, onPress }: DrugCardProps): React.JSX.Element {
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onPress(drug)}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <Text style={styles.drugName}>{drug.name}</Text>
                {drug.requires_prescription && (
                    <View style={styles.rxBadge}>
                        <Text style={styles.rxText}>Rx</Text>
                    </View>
                )}
            </View>
            <Text style={styles.genericName}>{drug.generic_name}</Text>

            <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Kategori</Text>
                    <Text style={styles.detailValue}>{drug.category}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Dosis</Text>
                    <Text style={styles.detailValue}>{drug.dosage}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Harga</Text>
                    <Text style={styles.priceValue}>{drug.price}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F0F5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    drugName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1C1C1E',
        flex: 1,
    },
    rxBadge: {
        backgroundColor: '#FF3B30',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginLeft: 8,
    },
    rxText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '800',
    },
    genericName: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 12,
        fontStyle: 'italic',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 11,
        color: '#AEAEB2',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 14,
        color: '#3A3A3C',
        fontWeight: '500',
    },
    priceValue: {
        fontSize: 14,
        color: '#34C759',
        fontWeight: '700',
    },
});
