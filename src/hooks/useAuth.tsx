import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { subscribeToAuthChanges, getUserProfile, logout as authLogout } from '../services/authService';
import type { User } from '../types';
import PageLoading from '../components/common/PageLoading';

interface AuthContextType {
    user: FirebaseUser | null;
    userProfile: User | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    loading: true,
    logout: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userProfile, setUserProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                try {
                    const profile = await getUserProfile(firebaseUser.uid);

                    // Check if user is inactive
                    if (profile && !profile.isActive) {
                        console.log('User is inactive, logging out...');
                        await authLogout();
                        setUser(null);
                        setUserProfile(null);
                        setLoading(false);
                        alert('Your account has been deactivated. Please contact admin.');
                        return;
                    }

                    setUserProfile(profile);
                } catch (error) {
                    console.error("Failed to fetch user profile", error);
                    setUserProfile(null);
                }
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Inactivity Timer Logic
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes

    const logout = async () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        await authLogout();
        setUser(null);
        setUserProfile(null);
    };

    const resetTimer = React.useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (user) {
            timerRef.current = setTimeout(() => {
                console.log('User inactive for 5 minutes, logging out...');
                logout();
                alert('Session expired due to inactivity.');
            }, INACTIVITY_LIMIT);
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;

        // Set initial timer
        resetTimer();

        // Event listeners to detect activity
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        const handleActivity = () => resetTimer();

        events.forEach(event => window.addEventListener(event, handleActivity));

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            events.forEach(event => window.removeEventListener(event, handleActivity));
        };
    }, [user, resetTimer]);

    if (loading) {
        return <PageLoading message="Authenticating..." />;
    }

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
