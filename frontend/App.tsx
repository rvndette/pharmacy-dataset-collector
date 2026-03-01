// =============================================================================
// App.tsx — Root component with AuthProvider + RoleBasedNavigator
// =============================================================================

import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider } from './src/context/AuthContext';
import { SessionProvider } from './src/context/SessionContext';
import { RoleBasedNavigator } from './src/navigation/RoleBasedNavigator';

// =============================================================================
// App
// =============================================================================

export default function App(): React.JSX.Element {
    return (
        <GestureHandlerRootView style={styles.root}>
            <AuthProvider>
                <SessionProvider>
                    <NavigationContainer>
                        <RoleBasedNavigator />
                    </NavigationContainer>
                </SessionProvider>
            </AuthProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
});
