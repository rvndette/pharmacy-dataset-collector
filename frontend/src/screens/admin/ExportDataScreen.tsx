// =============================================================================
// screens/admin/ExportDataScreen.tsx — Export dataset JSON/CSV with filters
// =============================================================================

import React, { useCallback, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { apiClient } from '../../services/api';

const EVENT_TYPES = ['', 'keystroke', 'touch', 'scroll', 'pinch', 'signature', 'pause', 'correction', 'dwell_time'];
const DEVICE_TYPES = ['', 'android', 'ios'];

export function ExportDataScreen(): React.JSX.Element {
    const [eventType, setEventType] = useState('');
    const [deviceType, setDeviceType] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [exporting, setExporting] = useState(false);
    const [exportResult, setExportResult] = useState<string | null>(null);

    const filters = { event_type: eventType || undefined, device_type: deviceType || undefined, start_date: startDate || undefined, end_date: endDate || undefined };

    const handleExportJSON = useCallback(async () => {
        setExporting(true);
        setExportResult(null);
        try {
            const data = await apiClient.exportJSON(filters);
            if (data) {
                const jsonStr = JSON.stringify(data, null, 2);
                const preview = jsonStr.length > 2000 ? jsonStr.slice(0, 2000) + '\n... (truncated)' : jsonStr;
                setExportResult(preview);
                Alert.alert('Export JSON Berhasil', `Data berhasil diekspor.\nTotal: ${(data as Record<string, unknown>).total_sessions ?? 0} sesi`);
            } else {
                Alert.alert('Error', 'Gagal mengekspor data JSON.');
            }
        } catch { Alert.alert('Error', 'Terjadi kesalahan saat mengekspor.'); }
        setExporting(false);
    }, [filters]);

    const handleExportCSV = useCallback(async () => {
        setExporting(true);
        setExportResult(null);
        try {
            const csv = await apiClient.exportCSV(filters);
            if (csv) {
                const preview = csv.length > 2000 ? csv.slice(0, 2000) + '\n... (truncated)' : csv;
                setExportResult(preview);
                const rows = csv.split('\n');
                Alert.alert('Export CSV Berhasil', `Total: ${rows.length - 1} baris data`);
            } else {
                Alert.alert('Error', 'Gagal mengekspor data CSV.');
            }
        } catch { Alert.alert('Error', 'Terjadi kesalahan saat mengekspor.'); }
        setExporting(false);
    }, [filters]);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Info */}
            <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>🔒</Text>
                <Text style={styles.infoText}>
                    Export menggunakan UUID saja. Email dan data sensitif tidak disertakan (anonymization layer).
                </Text>
            </View>

            {/* Filters */}
            <Text style={styles.sectionTitle}>🔍 Filter Export</Text>
            <View style={styles.filterCard}>
                {/* Event Type */}
                <Text style={styles.filterLabel}>Event Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                    {EVENT_TYPES.map(et => (
                        <TouchableOpacity
                            key={et || 'all'} style={[styles.chip, eventType === et && styles.chipActive]}
                            onPress={() => setEventType(et)}
                        >
                            <Text style={[styles.chipText, eventType === et && styles.chipTextActive]}>{et || 'Semua'}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Device Type */}
                <Text style={styles.filterLabel}>Device Type</Text>
                <View style={styles.chipRow}>
                    {DEVICE_TYPES.map(dt => (
                        <TouchableOpacity
                            key={dt || 'all'} style={[styles.chip, deviceType === dt && styles.chipActive]}
                            onPress={() => setDeviceType(dt)}
                        >
                            <Text style={[styles.chipText, deviceType === dt && styles.chipTextActive]}>{dt || 'Semua'}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Date Range */}
                <Text style={styles.filterLabel}>Date Range</Text>
                <View style={styles.dateRow}>
                    <TextInput style={styles.dateInput} placeholder="YYYY-MM-DD" value={startDate} onChangeText={setStartDate} />
                    <Text style={styles.dateSeparator}>→</Text>
                    <TextInput style={styles.dateInput} placeholder="YYYY-MM-DD" value={endDate} onChangeText={setEndDate} />
                </View>
            </View>

            {/* Export Buttons */}
            <Text style={styles.sectionTitle}>📦 Export Dataset</Text>
            <View style={styles.exportButtons}>
                <TouchableOpacity
                    style={[styles.exportButton, styles.jsonButton, exporting && styles.buttonDisabled]}
                    onPress={handleExportJSON} disabled={exporting}
                >
                    <Text style={styles.exportIcon}>{ }</Text>
                    <Text style={styles.exportButtonText}>Export JSON</Text>
                    <Text style={styles.exportDesc}>Raw nested logs</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.exportButton, styles.csvButton, exporting && styles.buttonDisabled]}
                    onPress={handleExportCSV} disabled={exporting}
                >
                    <Text style={styles.exportIcon}>📊</Text>
                    <Text style={styles.exportButtonText}>Export CSV</Text>
                    <Text style={styles.exportDesc}>Tabular format</Text>
                </TouchableOpacity>
            </View>

            {/* Preview */}
            {exportResult && (
                <View style={styles.previewSection}>
                    <Text style={styles.sectionTitle}>👁️ Preview</Text>
                    <ScrollView style={styles.previewScroll} horizontal>
                        <Text style={styles.previewText}>{exportResult}</Text>
                    </ScrollView>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7' },
    content: { padding: 24, paddingBottom: 48 },
    infoBox: { flexDirection: 'row', backgroundColor: '#E5F1FF', borderRadius: 12, padding: 14, marginBottom: 20, alignItems: 'flex-start' },
    infoIcon: { fontSize: 16, marginRight: 10 },
    infoText: { fontSize: 13, color: '#3A3A3C', flex: 1, lineHeight: 18 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginBottom: 10 },
    filterCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 20 },
    filterLabel: { fontSize: 14, fontWeight: '600', color: '#3A3A3C', marginBottom: 6, marginTop: 10 },
    chipScroll: { marginBottom: 4 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: '#F2F2F7', marginRight: 6, marginBottom: 6 },
    chipActive: { backgroundColor: '#007AFF' },
    chipText: { fontSize: 13, fontWeight: '600', color: '#3A3A3C' },
    chipTextActive: { color: '#FFFFFF' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dateInput: { flex: 1, backgroundColor: '#F2F2F7', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
    dateSeparator: { fontSize: 16, color: '#8E8E93' },
    exportButtons: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    exportButton: { flex: 1, borderRadius: 14, padding: 20, alignItems: 'center' },
    jsonButton: { backgroundColor: '#1C1C1E' },
    csvButton: { backgroundColor: '#34C759' },
    buttonDisabled: { opacity: 0.5 },
    exportIcon: { fontSize: 28, marginBottom: 6 },
    exportButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 2 },
    exportDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
    previewSection: { marginTop: 4 },
    previewScroll: { backgroundColor: '#1C1C1E', borderRadius: 12, padding: 14, maxHeight: 300 },
    previewText: { color: '#98FB98', fontSize: 11, fontFamily: 'monospace', lineHeight: 16 },
});
