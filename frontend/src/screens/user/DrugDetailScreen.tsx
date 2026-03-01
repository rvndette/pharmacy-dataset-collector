// =============================================================================
// screens/user/DrugDetailScreen.tsx — Scroll analysis & dwell time
// =============================================================================

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef } from 'react';
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSession } from '../../context/SessionContext';
import { UserStackParamList } from '../../navigation/RoleBasedNavigator';
import { scrollAnalyzer } from '../../utils/gestureAnalyzer';
import { throttle } from '../../utils/throttle';

type Props = NativeStackScreenProps<UserStackParamList, 'DrugDetail'>;

interface SectionLayout { name: string; y: number; height: number; }

export function DrugDetailScreen({ route, navigation }: Props): React.JSX.Element {
    const { drug } = route.params;
    const { sessionId, logEvent } = useSession();
    const sectionLayoutsRef = useRef<SectionLayout[]>([]);
    const dwellCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    const getCurrentSection = (scrollY: number): string => {
        const layouts = sectionLayoutsRef.current;
        for (let i = layouts.length - 1; i >= 0; i--) {
            if (scrollY >= layouts[i].y - 50) { return layouts[i].name; }
        }
        return 'header';
    };

    const throttledOnScroll = useRef(
        throttle((scrollY: number) => {
            const section = getCurrentSection(scrollY);
            const event = scrollAnalyzer.onScroll(scrollY, section, sessionId, 'drug_detail');
            logEvent(event);
        }, 50),
    ).current;

    useEffect(() => {
        dwellCheckInterval.current = setInterval(() => {
            const dwellEvent = scrollAnalyzer.checkDwellTime(sessionId, 'drug_detail');
            if (dwellEvent) { logEvent(dwellEvent); }
        }, 200);
        return () => {
            if (dwellCheckInterval.current) { clearInterval(dwellCheckInterval.current); }
            scrollAnalyzer.reset();
            throttledOnScroll.cancel();
        };
    }, [sessionId, logEvent, throttledOnScroll]);

    const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        throttledOnScroll(e.nativeEvent.contentOffset.y);
    }, [throttledOnScroll]);

    const registerSectionLayout = useCallback((name: string) => (e: LayoutChangeEvent) => {
        const { y, height } = e.nativeEvent.layout;
        sectionLayoutsRef.current = sectionLayoutsRef.current.filter(s => s.name !== name);
        sectionLayoutsRef.current.push({ name, y, height });
        sectionLayoutsRef.current.sort((a, b) => a.y - b.y);
    }, []);

    const handleNextPress = useCallback(() => { navigation.navigate('PrescriptionUpload'); }, [navigation]);

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} onScroll={handleScroll} scrollEventThrottle={16}>
                <View style={styles.headerCard} onLayout={registerSectionLayout('header')}>
                    <View style={styles.drugHeader}>
                        <Text style={styles.drugName}>{drug.name}</Text>
                        {drug.requires_prescription && <View style={styles.rxBadge}><Text style={styles.rxText}>Resep</Text></View>}
                    </View>
                    <Text style={styles.genericName}>{drug.generic_name}</Text>
                    <View style={styles.metaRow}>
                        <View style={styles.metaChip}><Text style={styles.metaChipText}>{drug.category}</Text></View>
                        <View style={styles.metaChip}><Text style={styles.metaChipText}>{drug.dosage}</Text></View>
                        <Text style={styles.priceText}>{drug.price}</Text>
                    </View>
                </View>

                <View style={styles.section} onLayout={registerSectionLayout('deskripsi')}>
                    <Text style={styles.sectionTitle}>📖 Deskripsi</Text>
                    <Text style={styles.sectionBody}>{drug.name} ({drug.generic_name}) adalah obat golongan {drug.category} dengan dosis {drug.dosage}. Obat ini digunakan untuk mengobati berbagai kondisi medis sesuai indikasi yang disetujui BPOM.</Text>
                </View>

                <View style={styles.section} onLayout={registerSectionLayout('indikasi')}>
                    <Text style={styles.sectionTitle}>✅ Indikasi</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Pengobatan infeksi bakteri ringan hingga sedang</Text>
                        <Text style={styles.bulletItem}>• Pengobatan kondisi inflamasi akut</Text>
                        <Text style={styles.bulletItem}>• Terapi pemeliharaan untuk kondisi kronis</Text>
                        <Text style={styles.bulletItem}>• Profilaksis sebelum prosedur medis tertentu</Text>
                    </View>
                </View>

                <View style={styles.section} onLayout={registerSectionLayout('dosis')}>
                    <Text style={styles.sectionTitle}>💊 Dosis & Cara Pakai</Text>
                    <View style={styles.dosageCard}>
                        <View style={styles.dosageRow}><Text style={styles.dosageLabel}>Dewasa:</Text><Text style={styles.dosageValue}>{drug.dosage}, 3x sehari</Text></View>
                        <View style={styles.dosageRow}><Text style={styles.dosageLabel}>Anak-anak:</Text><Text style={styles.dosageValue}>Sesuai berat badan</Text></View>
                        <View style={styles.dosageRow}><Text style={styles.dosageLabel}>Cara pakai:</Text><Text style={styles.dosageValue}>Diminum sesudah makan</Text></View>
                    </View>
                </View>

                <View style={styles.efekSampingSection} onLayout={registerSectionLayout('efek_samping')}>
                    <Text style={styles.sectionTitle}>⚠️ Efek Samping</Text>
                    <Text style={styles.warningNote}>Perhatikan efek samping berikut dan segera hubungi dokter jika terjadi:</Text>
                    <Text style={styles.subSectionTitle}>Efek samping umum:</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.bulletItem}>• Mual dan muntah (10-15% pasien)</Text>
                        <Text style={styles.bulletItem}>• Diare atau gangguan pencernaan</Text>
                        <Text style={styles.bulletItem}>• Sakit kepala ringan</Text>
                        <Text style={styles.bulletItem}>• Pusing atau mengantuk</Text>
                    </View>
                    <Text style={styles.subSectionTitle}>Efek samping serius:</Text>
                    <View style={styles.bulletList}>
                        <Text style={styles.seriousBullet}>• Reaksi alergi berat (anafilaksis)</Text>
                        <Text style={styles.seriousBullet}>• Gangguan fungsi hati</Text>
                        <Text style={styles.seriousBullet}>• Stevens-Johnson Syndrome</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.actionButton} onPress={handleNextPress}>
                    <Text style={styles.actionButtonText}>{drug.requires_prescription ? 'Upload Resep Dokter' : 'Lanjut ke Upload Resep'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7' },
    scrollView: { flex: 1 },
    content: { padding: 24, paddingBottom: 48 },
    headerCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
    drugHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    drugName: { fontSize: 24, fontWeight: '800', color: '#1C1C1E', flex: 1 },
    rxBadge: { backgroundColor: '#FF3B30', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 12 },
    rxText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
    genericName: { fontSize: 15, color: '#8E8E93', fontStyle: 'italic', marginTop: 4, marginBottom: 12 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    metaChip: { backgroundColor: '#F2F2F7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
    metaChipText: { fontSize: 13, color: '#3A3A3C', fontWeight: '500' },
    priceText: { fontSize: 18, fontWeight: '700', color: '#34C759', marginLeft: 'auto' },
    section: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginBottom: 10 },
    sectionBody: { fontSize: 15, color: '#3A3A3C', lineHeight: 24 },
    bulletList: { gap: 6 },
    bulletItem: { fontSize: 15, color: '#3A3A3C', lineHeight: 22, paddingLeft: 4 },
    efekSampingSection: { backgroundColor: '#FFF8F0', borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#FFD6A5' },
    warningNote: { fontSize: 14, color: '#FF9500', fontWeight: '600', marginBottom: 12, lineHeight: 20 },
    subSectionTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E', marginTop: 12, marginBottom: 6 },
    seriousBullet: { fontSize: 15, color: '#FF3B30', lineHeight: 22, paddingLeft: 4 },
    dosageCard: { backgroundColor: '#F2F2F7', borderRadius: 12, padding: 14, gap: 8 },
    dosageRow: { flexDirection: 'row', justifyContent: 'space-between' },
    dosageLabel: { fontSize: 14, color: '#8E8E93', fontWeight: '500' },
    dosageValue: { fontSize: 14, color: '#1C1C1E', fontWeight: '600', flex: 1, textAlign: 'right' },
    actionButton: { backgroundColor: '#007AFF', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    actionButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
