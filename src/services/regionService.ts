import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Region } from '../types';

const COLLECTION_NAME = 'regions';

export const getRegions = async (): Promise<Region[]> => {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Region));
};

export const getActiveRegions = async (): Promise<Region[]> => {
    const regions = await getRegions();
    return regions.filter(r => r.isActive);
};

export const addRegion = async (name: string, remarks?: string): Promise<Region> => {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        name,
        remarks: remarks || '',
        isActive: true
    });
    return { id: docRef.id, name, remarks, isActive: true };
};

export const updateRegion = async (id: string, data: Partial<Omit<Region, 'id'>>): Promise<void> => {
    await updateDoc(doc(db, COLLECTION_NAME, id), data);
};

export const toggleRegionStatus = async (id: string, currentStatus: boolean): Promise<void> => {
    await updateDoc(doc(db, COLLECTION_NAME, id), { isActive: !currentStatus });
};

export const deleteRegion = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
};
