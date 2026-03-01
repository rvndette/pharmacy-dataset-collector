// =============================================================================
// SessionContext.tsx — React Context for session management
// =============================================================================

import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { Dimensions, Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { apiClient } from '../services/api';
import { interactionLogger } from '../services/logger';
import { InteractionLog } from '../types/interaction';
import { DEFAULT_SESSION_CONFIG, DeviceInfo, Session, SessionConfig } from '../types/session';

// =============================================================================
// Context Type
// =============================================================================

interface SessionContextType {
    /** Current session data */
    session: Session | null;
    /** Session ID (shortcut) */
    sessionId: string;
    /** Mulai session baru */
    startSession: () => Promise<void>;
    /** Akhiri session */
    endSession: () => Promise<void>;
    /** Log interaction event (non-blocking) */
    logEvent: (event: InteractionLog) => void;
    /** Apakah session aktif */
    isSessionActive: boolean;
    /** Session config */
    config: SessionConfig;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// =============================================================================
// Provider
// =============================================================================

interface SessionProviderProps {
    children: ReactNode;
    config?: Partial<SessionConfig>;
}

export function SessionProvider({ children, config: userConfig }: SessionProviderProps): React.JSX.Element {
    const config: SessionConfig = { ...DEFAULT_SESSION_CONFIG, ...userConfig };
    const [session, setSession] = useState<Session | null>(null);
    const sessionIdRef = useRef<string>('');

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (interactionLogger.isActive) {
                interactionLogger.stop();
            }
        };
    }, []);

    const getDeviceInfo = useCallback((): DeviceInfo => {
        const { width, height } = Dimensions.get('window');
        return {
            platform: Platform.OS,
            os_version: Platform.Version?.toString() ?? 'unknown',
            device_model: Platform.OS === 'ios' ? 'iPhone' : 'Android Device',
            screen_width: width,
            screen_height: height,
        };
    }, []);

    const startSession = useCallback(async (): Promise<void> => {
        const newSessionId = uuidv4();
        const now = Date.now();
        const nowHr = performance.now();

        const newSession: Session = {
            session_id: newSessionId,
            start_time: now,
            start_time_hr: nowHr,
            end_time: null,
            device_info: getDeviceInfo(),
            status: 'active',
        };

        sessionIdRef.current = newSessionId;
        setSession(newSession);

        // Start logger
        interactionLogger.start(newSessionId);

        // Kirim session ke backend (non-blocking)
        apiClient.createSession(newSession).catch(error => {
            console.warn('[Session] Failed to create session on backend:', error);
        });
    }, [getDeviceInfo]);

    const endSession = useCallback(async (): Promise<void> => {
        if (!session) return;

        const updatedSession: Session = {
            ...session,
            end_time: Date.now(),
            status: 'completed',
        };

        setSession(updatedSession);

        // Flush remaining logs dan stop logger
        await interactionLogger.stop();

        // Update session di backend
        await apiClient.updateSession(session.session_id, {
            end_time: updatedSession.end_time,
            status: 'completed',
        });

        sessionIdRef.current = '';
        setSession(null);
    }, [session]);

    const logEvent = useCallback((event: InteractionLog): void => {
        interactionLogger.logEvent(event);
    }, []);

    const contextValue: SessionContextType = {
        session,
        sessionId: sessionIdRef.current,
        startSession,
        endSession,
        logEvent,
        isSessionActive: session !== null && session.status === 'active',
        config,
    };

    return (
        <SessionContext.Provider value={contextValue}>
            {children}
        </SessionContext.Provider>
    );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to access session context.
 * Must be used within a SessionProvider.
 */
export function useSession(): SessionContextType {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
}
