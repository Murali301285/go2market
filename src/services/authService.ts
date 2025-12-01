import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import type { User } from '../types';

export const login = async (email: string, password: string) => {
    // First, authenticate with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Then check if user is active in Firestore
    const userProfile = await getUserProfile(userCredential.user.uid);

    if (!userProfile) {
        // Sign out immediately if no profile found
        await signOut(auth);
        throw new Error('User profile not found. Please contact admin.');
    }

    if (!userProfile.isActive) {
        // Sign out immediately if user is inactive
        await signOut(auth);
        throw new Error('Your account has been deactivated. Please contact admin to reactivate your account.');
    }

    // User is active, return the credential
    return userCredential;
};

export const logout = async () => {
    return await signOut(auth);
};

export const resetPassword = async (email: string) => {
    return await sendPasswordResetEmail(auth, email);
};

export const getUserProfile = async (uid: string): Promise<User | null> => {
    console.log('Fetching user profile for UID:', uid);
    console.log('Collection path:', 'user/' + uid);
    try {
        const userDoc = await getDoc(doc(db, 'user', uid));
        console.log('Document exists:', userDoc.exists());
        if (userDoc.exists()) {
            console.log('Document data:', userDoc.data());
            return userDoc.data() as User;
        }
        console.log('Document does not exist');
        return null;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
};

export const subscribeToAuthChanges = (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
};
