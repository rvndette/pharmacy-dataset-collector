// =============================================================================
// context/AuthContext.tsx — Authentication context with JWT
// =============================================================================

import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import { apiClient } from '../services/api';
import { AuthResponse, LoginCredentials, RegisterData, Role, UserProfile } from '../types/user';

// =============================================================================
// Context Type
// =============================================================================

interface AuthContextType {
    /** Current user profile */
    user: UserProfile | null;
    /** JWT token */
    token: string | null;
    /** Current user role */
    role: Role | null;
    /** Whether user is authenticated */
    isAuthenticated: boolean;
    /** Loading state */
    isLoading: boolean;
    /** Login with credentials */
    login: (credentials: LoginCredentials) => Promise<void>;
    /** Register new user */
    register: (data: RegisterData) => Promise<void>;
    /** Logout */
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================================================
// Provider
// =============================================================================

interface AuthProviderProps {
    children: ReactNode;
}

// Simple in-memory token storage (for React Native, AsyncStorage would be used in production)
let storedToken: string | null = null;
let storedUser: UserProfile | null = null;

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
    const [user, setUser] = useState<UserProfile | null>(storedUser);
    const [token, setToken] = useState<string | null>(storedToken);
    const [isLoading, setIsLoading] = useState(false);

    // Restore token on mount
    useEffect(() => {
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(storedUser);
            apiClient.setAuthToken(storedToken);
        }
    }, []);

    const handleAuthResponse = useCallback((response: AuthResponse) => {
        storedToken = response.token;
        storedUser = response.user;
        setToken(response.token);
        setUser(response.user);
        apiClient.setAuthToken(response.token);
    }, []);

    const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
        setIsLoading(true);
        try {
            const response = await apiClient.login(credentials);
            handleAuthResponse(response);
        } finally {
            setIsLoading(false);
        }
    }, [handleAuthResponse]);

    const register = useCallback(async (data: RegisterData): Promise<void> => {
        setIsLoading(true);
        try {
            const response = await apiClient.register(data);
            handleAuthResponse(response);
        } finally {
            setIsLoading(false);
        }
    }, [handleAuthResponse]);

    const logout = useCallback(() => {
        storedToken = null;
        storedUser = null;
        setToken(null);
        setUser(null);
        apiClient.setAuthToken(null);
    }, []);

    const contextValue: AuthContextType = {
        user,
        token,
        role: user?.role ?? null,
        isAuthenticated: token !== null && user !== null,
        isLoading,
        login,
        register,
        logout,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}

// =============================================================================
// Hook
// =============================================================================

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
