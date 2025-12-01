import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { User } from '../types';

// Initialize a secondary app for user creation to avoid logging out the admin
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const secondaryApp = initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

const COLLECTION_NAME = 'user';

export const createUser = async (userData: Omit<User, 'id' | 'createdAt'>, password: string): Promise<void> => {
    // 1. Create Auth User
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, userData.email, password);
    const uid = userCredential.user.uid;

    // 2. Create Firestore Document
    await setDoc(doc(db, COLLECTION_NAME, uid), {
        ...userData,
        id: uid,
        createdAt: Date.now()
    });

    // 3. Sign out the secondary auth immediately so it doesn't interfere
    await signOut(secondaryAuth);
};

export const getUsers = async (): Promise<User[]> => {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    return snapshot.docs.map(doc => doc.data() as User);
};

export const updateUser = async (userId: string, data: Partial<User>): Promise<void> => {
    await updateDoc(doc(db, COLLECTION_NAME, userId), data);
};

export const toggleUserStatus = async (userId: string, currentStatus: boolean): Promise<void> => {
    await updateDoc(doc(db, COLLECTION_NAME, userId), { isActive: !currentStatus });
};
