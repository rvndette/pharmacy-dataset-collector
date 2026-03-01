// =============================================================================
// screens/auth/RegisterScreen.tsx — Registration with role selection
// =============================================================================

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BiometricTextInput } from '../../components/BiometricTextInput';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../navigation/RoleBasedNavigator';
import { Role } from '../../types/user';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const ROLES: { key: Role; label: string; icon: string; desc: string }[] = [
    { key: 'user', label: 'User', icon: '👤', desc: 'Responden (simulasi alur farmasi)' },
    { key: 'pharmacist', label: 'Apoteker', icon: '💊', desc: 'Verifikator resep' },
    { key: 'admin', label: 'Admin', icon: '🔬', desc: 'Peneliti (akses penuh dataset)' },
];

export function RegisterScreen({ navigation }: Props): React.JSX.Element {
    const { register, isLoading } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState<Role>('user');

    const handleRegister = async () => {
        if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
            Alert.alert('Error', 'Semua field wajib diisi.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Error', 'Password minimal 6 karakter.');
            return;
        }

        try {
            await register({
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                password,
                role: selectedRole,
            });
        } catch (error) {
            Alert.alert(
                'Registrasi Gagal',
                error instanceof Error ? error.message : 'Terjadi kesalahan.',
            );
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
        >
            {/* Header */}
            <View style={styles.headerSection}>
                <Text style={styles.headerIcon}>📋</Text>
                <Text style={styles.title}>Daftar Akun</Text>
                <Text style={styles.subtitle}>
                    Buat akun baru untuk mengakses sistem
                </Text>
            </View>

            {/* Role Selection */}
            <View style={styles.roleSection}>
                <Text style={styles.sectionLabel}>Pilih Role</Text>
                <View style={styles.roleGrid}>
                    {ROLES.map(role => (
                        <TouchableOpacity
                            key={role.key}
                            style={[
                                styles.roleCard,
                                selectedRole === role.key && styles.roleCardActive,
                            ]}
                            onPress={() => setSelectedRole(role.key)}
                        >
                            <Text style={styles.roleIcon}>{role.icon}</Text>
                            <Text style={[
                                styles.roleLabel,
                                selectedRole === role.key && styles.roleLabelActive,
                            ]}>{role.label}</Text>
                            <Text style={styles.roleDesc}>{role.desc}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Form */}
            <View style={styles.formSection}>
                <BiometricTextInput
                    fieldId="reg_name"
                    screen="registration"
                    label="Nama Lengkap"
                    placeholder="Masukkan nama lengkap"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                />

                <BiometricTextInput
                    fieldId="reg_email"
                    screen="registration"
                    label="Email"
                    placeholder="contoh@email.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <BiometricTextInput
                    fieldId="reg_phone"
                    screen="registration"
                    label="Nomor Telepon"
                    placeholder="08xxxxxxxxxx"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                />

                <BiometricTextInput
                    fieldId="reg_password"
                    screen="registration"
                    label="Password"
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    contentBlind
                />
            </View>

            {/* Register Button */}
            <TouchableOpacity
                style={[styles.registerButton, isLoading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
            >
                <Text style={styles.registerButtonText}>
                    {isLoading ? 'Memproses...' : 'Daftar'}
                </Text>
            </TouchableOpacity>

            {/* Login Link */}
            <TouchableOpacity
                style={styles.loginLink}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.loginLinkText}>
                    Sudah punya akun? <Text style={styles.loginLinkBold}>Masuk</Text>
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    content: {
        padding: 24,
        paddingTop: 48,
        paddingBottom: 48,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    headerIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1C1C1E',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
    },
    roleSection: {
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1C1C1E',
        marginBottom: 10,
    },
    roleGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    roleCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E5EA',
    },
    roleCardActive: {
        borderColor: '#007AFF',
        backgroundColor: '#EBF5FF',
    },
    roleIcon: {
        fontSize: 28,
        marginBottom: 6,
    },
    roleLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#3A3A3C',
        marginBottom: 2,
    },
    roleLabelActive: {
        color: '#007AFF',
    },
    roleDesc: {
        fontSize: 10,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 14,
    },
    formSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
        marginBottom: 24,
    },
    registerButton: {
        backgroundColor: '#34C759',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#34C759',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonDisabled: {
        backgroundColor: '#C7C7CC',
        shadowOpacity: 0,
        elevation: 0,
    },
    registerButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
    loginLink: {
        alignItems: 'center',
        marginTop: 20,
    },
    loginLinkText: {
        fontSize: 15,
        color: '#8E8E93',
    },
    loginLinkBold: {
        color: '#007AFF',
        fontWeight: '600',
    },
});
