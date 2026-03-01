// =============================================================================
// screens/user/RegistrationScreen.tsx — Baseline typing biometrics collection
// =============================================================================

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BiometricTextInput } from '../../components/BiometricTextInput';
import { useSession } from '../../context/SessionContext';
import { UserStackParamList } from '../../navigation/RoleBasedNavigator';

type Props = NativeStackScreenProps<UserStackParamList, 'Registration'>;

const MIN_ADDRESS_LENGTH = 50;

export function RegistrationScreen({ navigation }: Props): React.JSX.Element {
    const { startSession, isSessionActive } = useSession();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (!isSessionActive) {
            startSession();
        }
    }, [isSessionActive, startSession]);

    const isFormValid =
        name.trim().length > 0 &&
        email.trim().length > 0 &&
        phone.trim().length > 0 &&
        address.trim().length >= MIN_ADDRESS_LENGTH &&
        password.trim().length >= 6;

    const handleSubmit = () => {
        if (!isFormValid) {
            Alert.alert(
                'Form Belum Lengkap',
                `Pastikan semua field terisi. Alamat minimal ${MIN_ADDRESS_LENGTH} karakter.`,
            );
            return;
        }
        navigation.navigate('DrugSearch');
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.headerSection}>
                <Text style={styles.headerIcon}>🏥</Text>
                <Text style={styles.title}>Registrasi Pasien</Text>
                <Text style={styles.subtitle}>
                    Lengkapi data diri Anda untuk memulai layanan farmasi
                </Text>
            </View>

            <View style={styles.formSection}>
                <BiometricTextInput
                    fieldId="name"
                    screen="registration"
                    label="Nama Lengkap"
                    placeholder="Masukkan nama lengkap"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                />
                <BiometricTextInput
                    fieldId="email"
                    screen="registration"
                    label="Email"
                    placeholder="contoh@email.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <BiometricTextInput
                    fieldId="phone"
                    screen="registration"
                    label="Nomor Telepon"
                    placeholder="08xxxxxxxxxx"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                />
                <BiometricTextInput
                    fieldId="address"
                    screen="registration"
                    label={`Alamat Lengkap (min. ${MIN_ADDRESS_LENGTH} karakter)`}
                    placeholder="Masukkan alamat lengkap termasuk RT/RW, kelurahan, kecamatan, kota, provinsi, dan kode pos"
                    value={address}
                    onChangeText={setAddress}
                    multiline
                    numberOfLines={4}
                    style={styles.textArea}
                />
                <Text style={styles.charCount}>
                    {address.length}/{MIN_ADDRESS_LENGTH} karakter
                </Text>
                <BiometricTextInput
                    fieldId="password"
                    screen="registration"
                    label="Password"
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    contentBlind
                />
            </View>

            <TouchableOpacity
                style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={!isFormValid}
            >
                <Text style={styles.submitButtonText}>Lanjut ke Pencarian Obat</Text>
            </TouchableOpacity>

            <View style={styles.privacyNotice}>
                <Text style={styles.privacyIcon}>🔒</Text>
                <Text style={styles.privacyText}>
                    Data biometrik typing dikumpulkan untuk riset. Isi password tidak disimpan.
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F2F2F7' },
    content: { padding: 24, paddingBottom: 48 },
    headerSection: { alignItems: 'center', marginBottom: 32, paddingTop: 16 },
    headerIcon: { fontSize: 48, marginBottom: 12 },
    title: { fontSize: 28, fontWeight: '800', color: '#1C1C1E', marginBottom: 8 },
    subtitle: { fontSize: 15, color: '#8E8E93', textAlign: 'center', lineHeight: 22 },
    formSection: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3, marginBottom: 24 },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    charCount: { fontSize: 12, color: '#AEAEB2', textAlign: 'right', marginTop: -12, marginBottom: 16 },
    submitButton: { backgroundColor: '#007AFF', borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    submitButtonDisabled: { backgroundColor: '#C7C7CC', shadowOpacity: 0, elevation: 0 },
    submitButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
    privacyNotice: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingHorizontal: 12 },
    privacyIcon: { fontSize: 16, marginRight: 8 },
    privacyText: { fontSize: 12, color: '#AEAEB2', flex: 1, lineHeight: 18 },
});
