import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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

                    console.log('User Profile Loaded:', profile);

                    // Check if user is inactive (strictly check for false)
                    if (profile && profile.isActive === false) {
                        console.log('User is marked as inactive (isActive === false), logging out...');
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
    const lastActivityRef = useRef(Date.now());
    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes

    const logout = async () => {
        await authLogout();
        setUser(null);
        setUserProfile(null);
    };

    useEffect(() => {
        if (!user) return;

        const handleActivity = () => {
            lastActivityRef.current = Date.now();
        };

        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        // Throttle event listeners to avoid performance hit
        let throttleTimer: ReturnType<typeof setTimeout>;
        const throttledHandler = () => {
            if (!throttleTimer) {
                throttleTimer = setTimeout(() => {
                    handleActivity();
                    throttleTimer = null!;
                }, 1000);
            }
        };

        events.forEach(event => window.addEventListener(event, throttledHandler));

        // Check inactivity every minute
        const checkInterval = setInterval(() => {
            const inactiveTime = Date.now() - lastActivityRef.current;
            if (inactiveTime > INACTIVITY_LIMIT) {
                console.log(`User inactive for ${inactiveTime / 60000} minutes. Auto-logout is currently DISABLED for debugging.`);
                // logout();
                // alert('Session expired due to inactivity.');
            }
        }, 60 * 1000); // Check every 1 minute

        return () => {
            events.forEach(event => window.removeEventListener(event, throttledHandler));
            clearInterval(checkInterval);
            if (throttleTimer) clearTimeout(throttleTimer);
        };
    }, [user]);

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
