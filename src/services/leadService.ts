import {
    collection, addDoc, getDocs, doc, getDoc, updateDoc, query, where, orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Lead, LeadUpdate } from '../types';

const COLLECTION_NAME = 'leads';

interface CreateLeadOptions {
    autoApprove?: boolean;
    userFullName?: string;
    defaultLockInMonths?: 1 | 3 | 6;
}

export const createLead = async (
    leadData: Omit<Lead, 'id' | 'createdAt' | 'updates' | 'status' | 'stage' | 'createdBy'>,
    userId: string,
    options?: CreateLeadOptions
): Promise<string> => {
    const { autoApprove = false, userFullName, defaultLockInMonths } = options || {};

    // Calculate lock expiry if auto-approving
    let lockedUntil: number | undefined;
    if (autoApprove && defaultLockInMonths) {
        const now = new Date();
        const expiryDate = new Date(now);
        expiryDate.setMonth(expiryDate.getMonth() + defaultLockInMonths);
        lockedUntil = expiryDate.getTime();
    }

    const newLead: Omit<Lead, 'id'> = {
        ...leadData,
        status: autoApprove ? 'LOCKED' : 'PENDING',
        stage: 'NEW',
        createdAt: Date.now(),
        createdBy: userId,
        updates: [],
        // Auto-assign to creator if auto-approved
        ...(autoApprove && {
            assignedToUserId: userId,
            assignedToName: userFullName,
            lockedUntil,
        }),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), newLead);
    return docRef.id;
};

export const getLeadsByUserId = async (userId: string): Promise<Lead[]> => {
    const q = query(
        collection(db, COLLECTION_NAME),
        where('assignedToUserId', '==', userId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
};

export const getLeadsCreatedByUser = async (userId: string): Promise<Lead[]> => {
    const q = query(
        collection(db, COLLECTION_NAME),
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
};

export const getPoolLeads = async (): Promise<Lead[]> => {
    const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'POOL'),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
};

export const getLeadById = async (leadId: string): Promise<Lead | null> => {
    const docRef = doc(db, COLLECTION_NAME, leadId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Lead;
    }
    return null;
};

export const addLeadUpdate = async (leadId: string, update: Omit<LeadUpdate, 'id' | 'timestamp'>): Promise<void> => {
    const leadRef = doc(db, COLLECTION_NAME, leadId);
    const leadSnap = await getDoc(leadRef);

    if (!leadSnap.exists()) throw new Error('Lead not found');

    const currentUpdates = leadSnap.data().updates || [];
    const newUpdate: LeadUpdate = {
        id: Date.now().toString(), // Simple ID
        timestamp: Date.now(),
        ...update
    };

    // Prepare updates for the lead document
    const leadUpdates: any = {
        updates: [newUpdate, ...currentUpdates]
    };

    // Update Stage if the status string matches a valid stage
    // (Assuming the UI passes the Stage ID as 'status')
    if (['NEW', 'CONTACTED', 'DEMO_SCHEDULED', 'DEMO_SHOWED', 'QUOTATION_SENT', 'NEGOTIATION', 'CONVERTED', 'CANCELLED'].includes(update.status)) {
        leadUpdates.stage = update.status;
    }

    // Update Status if Converted or Cancelled
    if (update.status === 'CONVERTED') leadUpdates.status = 'CONVERTED';
    if (update.status === 'CANCELLED') leadUpdates.status = 'CANCELLED';

    // Update Probability
    if (update.probability !== undefined) {
        leadUpdates.probability = update.probability;
    }

    await updateDoc(leadRef, leadUpdates);
};

export const claimLead = async (leadId: string, userId: string, userName: string, lockDurationMonths: number): Promise<void> => {
    const leadRef = doc(db, COLLECTION_NAME, leadId);

    const now = new Date();
    const lockedUntil = new Date(now.setMonth(now.getMonth() + lockDurationMonths)).getTime();

    await updateDoc(leadRef, {
        status: 'LOCKED',
        assignedToUserId: userId,
        assignedToName: userName,
        lockedUntil: lockedUntil
    });
};

export const getPendingLeads = async (): Promise<Lead[]> => {
    const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', 'PENDING'),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
};

export const approveLead = async (leadId: string, lockDurationMonths: number): Promise<void> => {
    const leadRef = doc(db, COLLECTION_NAME, leadId);
    const leadSnap = await getDoc(leadRef);

    if (!leadSnap.exists()) throw new Error('Lead not found');
    const leadData = leadSnap.data() as Lead;

    const now = new Date();
    const lockedUntil = new Date(now.setMonth(now.getMonth() + lockDurationMonths)).getTime();

    await updateDoc(leadRef, {
        status: 'LOCKED',
        assignedToUserId: leadData.createdBy,
        lockedUntil: lockedUntil
    });
};

export const rejectLead = async (leadId: string): Promise<void> => {
    const leadRef = doc(db, COLLECTION_NAME, leadId);
    await updateDoc(leadRef, {
        status: 'POOL',
        assignedToUserId: null,
        assignedToName: null
    });
};

export const getAllLeads = async (): Promise<Lead[]> => {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
};

export const updateLeadStage = async (leadId: string, stage: string): Promise<void> => {
    const leadRef = doc(db, COLLECTION_NAME, leadId);
    await updateDoc(leadRef, { stage });
};

export const updateLeadStatus = async (leadId: string, status: string): Promise<void> => {
    const leadRef = doc(db, COLLECTION_NAME, leadId);
    await updateDoc(leadRef, { status });
};
