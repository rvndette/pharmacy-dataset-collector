// =============================================================================
// navigation/RoleBasedNavigator.tsx — Route by role after auth
// =============================================================================

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useAuth } from '../context/AuthContext';

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

// User Screens
import { DrugInfo } from '../components/DrugCard';
import { DrugDetailScreen } from '../screens/user/DrugDetailScreen';
import { DrugSearchScreen } from '../screens/user/DrugSearchScreen';
import { PrescriptionUploadScreen } from '../screens/user/PrescriptionUploadScreen';
import { RegistrationScreen } from '../screens/user/RegistrationScreen';
import { SignatureScreen } from '../screens/user/SignatureScreen';

// Pharmacist Screens
import { PrescriptionDetailScreen } from '../screens/pharmacist/PrescriptionDetailScreen';
import { PrescriptionListScreen } from '../screens/pharmacist/PrescriptionListScreen';

// Admin Screens
import { AdminDashboardScreen } from '../screens/admin/AdminDashboardScreen';
import { DrugManagementScreen } from '../screens/admin/DrugManagementScreen';
import { ExportDataScreen } from '../screens/admin/ExportDataScreen';
import { UserManagementScreen } from '../screens/admin/UserManagementScreen';

// =============================================================================
// Stack Param Lists
// =============================================================================

export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

export type UserStackParamList = {
    Registration: undefined;
    DrugSearch: undefined;
    DrugDetail: { drug: DrugInfo };
    PrescriptionUpload: undefined;
    Signature: undefined;
};

export type PharmacistStackParamList = {
    PrescriptionList: undefined;
    PrescriptionDetail: { prescriptionId: string };
};

export type AdminStackParamList = {
    AdminDashboard: undefined;
    DrugManagement: undefined;
    UserManagement: undefined;
    ExportData: undefined;
};

// =============================================================================
// Stack Navigators
// =============================================================================

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const UserStack = createNativeStackNavigator<UserStackParamList>();
const PharmacistStack = createNativeStackNavigator<PharmacistStackParamList>();
const AdminStack = createNativeStackNavigator<AdminStackParamList>();

// =============================================================================
// Screen Options
// =============================================================================

const defaultScreenOptions = {
    headerStyle: { backgroundColor: '#FFFFFF' },
    headerTintColor: '#007AFF',
    headerTitleStyle: { fontWeight: '700' as const, fontSize: 17 },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: '#F2F2F7' },
    animation: 'slide_from_right' as const,
};

// =============================================================================
// Auth Navigator
// =============================================================================

function AuthNavigator(): React.JSX.Element {
    return (
        <AuthStack.Navigator screenOptions={{ ...defaultScreenOptions, headerShown: false }}>
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
    );
}

// =============================================================================
// User Navigator
// =============================================================================

function UserNavigator(): React.JSX.Element {
    return (
        <UserStack.Navigator screenOptions={defaultScreenOptions}>
            <UserStack.Screen
                name="Registration"
                component={RegistrationScreen}
                options={{ title: 'Data Biometrik', headerShown: false }}
            />
            <UserStack.Screen
                name="DrugSearch"
                component={DrugSearchScreen}
                options={{ title: 'Pencarian Obat' }}
            />
            <UserStack.Screen
                name="DrugDetail"
                component={DrugDetailScreen}
                options={({ route }) => ({ title: route.params.drug.name })}
            />
            <UserStack.Screen
                name="PrescriptionUpload"
                component={PrescriptionUploadScreen}
                options={{ title: 'Upload Resep' }}
            />
            <UserStack.Screen
                name="Signature"
                component={SignatureScreen}
                options={{ title: 'Tanda Tangan' }}
            />
        </UserStack.Navigator>
    );
}

// =============================================================================
// Pharmacist Navigator
// =============================================================================

function PharmacistNavigator(): React.JSX.Element {
    return (
        <PharmacistStack.Navigator screenOptions={defaultScreenOptions}>
            <PharmacistStack.Screen
                name="PrescriptionList"
                component={PrescriptionListScreen}
                options={{ title: 'Dashboard Resep' }}
            />
            <PharmacistStack.Screen
                name="PrescriptionDetail"
                component={PrescriptionDetailScreen}
                options={{ title: 'Detail Resep' }}
            />
        </PharmacistStack.Navigator>
    );
}

// =============================================================================
// Admin Navigator
// =============================================================================

function AdminNavigator(): React.JSX.Element {
    return (
        <AdminStack.Navigator screenOptions={defaultScreenOptions}>
            <AdminStack.Screen
                name="AdminDashboard"
                component={AdminDashboardScreen}
                options={{ title: 'Dashboard Admin' }}
            />
            <AdminStack.Screen
                name="DrugManagement"
                component={DrugManagementScreen}
                options={{ title: 'Manajemen Obat' }}
            />
            <AdminStack.Screen
                name="UserManagement"
                component={UserManagementScreen}
                options={{ title: 'Manajemen User' }}
            />
            <AdminStack.Screen
                name="ExportData"
                component={ExportDataScreen}
                options={{ title: 'Export Dataset' }}
            />
        </AdminStack.Navigator>
    );
}

// =============================================================================
// Role-Based Navigator — Switch by authenticated role
// =============================================================================

export function RoleBasedNavigator(): React.JSX.Element {
    const { isAuthenticated, role } = useAuth();

    if (!isAuthenticated) {
        return <AuthNavigator />;
    }

    switch (role) {
        case 'pharmacist':
            return <PharmacistNavigator />;
        case 'admin':
            return <AdminNavigator />;
        case 'user':
        default:
            return <UserNavigator />;
    }
}
