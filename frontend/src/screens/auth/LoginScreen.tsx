// =============================================================================
// screens/auth/LoginScreen.tsx — Login with role selection
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

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props): React.JSX.Element {
    const { login, isLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Email dan password wajib diisi.');
            return;
        }

        try {
            await login({ email: email.trim(), password });
        } catch (error) {
            Alert.alert(
                'Login Gagal',
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
                <Text style={styles.headerIcon}>🏥</Text>
                <Text style={styles.title}>Mobile Pharmacy</Text>
                <Text style={styles.subtitle}>Dataset Collector</Text>
                <Text style={styles.description}>
                    Masuk untuk memulai sesi pengumpulan data biometrik
                </Text>
            </View>

            {/* Form */}
            <View style={styles.formSection}>
                <BiometricTextInput
                    fieldId="login_email"
                    screen="registration"
                    label="Email"
                    placeholder="contoh@email.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <BiometricTextInput
                    fieldId="login_password"
                    screen="registration"
                    label="Password"
                    placeholder="Masukkan password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    contentBlind
                />
            </View>

            {/* Login Button */}
            <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
            >
                <Text style={styles.loginButtonText}>
                    {isLoading ? 'Memproses...' : 'Masuk'}
                </Text>
            </TouchableOpacity>

            {/* Register Link */}
            <TouchableOpacity
                style={styles.registerLink}
                onPress={() => navigation.navigate('Register')}
            >
                <Text style={styles.registerLinkText}>
                    Belum punya akun? <Text style={styles.registerLinkBold}>Daftar di sini</Text>
                </Text>
            </TouchableOpacity>

            {/* Info */}
            <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>ℹ️</Text>
                <Text style={styles.infoText}>
                    Aplikasi ini adalah simulator farmasi untuk riset behavioral biometrics.
                    Bukan layanan farmasi sungguhan.
                </Text>
            </View>
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
        paddingTop: 60,
        paddingBottom: 48,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 36,
    },
    headerIcon: {
        fontSize: 56,
        marginBottom: 12,
    },
    title: {
        fontSize: 30,
        fontWeight: '800',
        color: '#1C1C1E',
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#007AFF',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 20,
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
    loginButton: {
        backgroundColor: '#007AFF',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#007AFF',
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
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
    registerLink: {
        alignItems: 'center',
        marginTop: 20,
    },
    registerLinkText: {
        fontSize: 15,
        color: '#8E8E93',
    },
    registerLinkBold: {
        color: '#007AFF',
        fontWeight: '600',
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#E5F1FF',
        borderRadius: 12,
        padding: 14,
        marginTop: 32,
        alignItems: 'flex-start',
    },
    infoIcon: {
        fontSize: 16,
        marginRight: 10,
    },
    infoText: {
        fontSize: 12,
        color: '#3A3A3C',
        flex: 1,
        lineHeight: 18,
    },
});
