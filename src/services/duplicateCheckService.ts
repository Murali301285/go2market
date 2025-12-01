import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Lead } from '../types';

const COLLECTION_NAME = 'leads';

export interface DuplicateCheckResult {
    isDuplicate: boolean;
    duplicateLeads: Lead[];
    matchType: 'exact' | 'similar' | 'none';
    message: string;
}

/**
 * Check for duplicate leads based on multiple criteria
 * Priority: School Name + ZIP > Phone Number > School Name + Address
 */
export const checkForDuplicates = async (
    schoolName: string,
    zipCode: string,
    contactPhone: string,
    _address: string,
    excludeLeadId?: string
): Promise<DuplicateCheckResult> => {
    try {
        const leadsRef = collection(db, COLLECTION_NAME);

        // Check 1: Exact match - Same school name AND ZIP code
        const exactQuery = query(
            leadsRef,
            where('schoolName', '==', schoolName),
            where('zipCode', '==', zipCode)
        );
        const exactSnapshot = await getDocs(exactQuery);
        const exactMatches = exactSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Lead))
            .filter(lead => lead.id !== excludeLeadId);

        if (exactMatches.length > 0) {
            return {
                isDuplicate: true,
                duplicateLeads: exactMatches,
                matchType: 'exact',
                message: `A lead for "${schoolName}" in ZIP code "${zipCode}" already exists!`
            };
        }

        // Check 2: Phone number match (strong indicator)
        const phoneQuery = query(
            leadsRef,
            where('contactPhone', '==', contactPhone)
        );
        const phoneSnapshot = await getDocs(phoneQuery);
        const phoneMatches = phoneSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Lead))
            .filter(lead => lead.id !== excludeLeadId);

        if (phoneMatches.length > 0) {
            return {
                isDuplicate: true,
                duplicateLeads: phoneMatches,
                matchType: 'exact',
                message: `This phone number is already registered for "${phoneMatches[0].schoolName}"`
            };
        }

        // Check 3: Similar match - Same school name (different ZIP)
        const similarQuery = query(
            leadsRef,
            where('schoolName', '==', schoolName)
        );
        const similarSnapshot = await getDocs(similarQuery);
        const similarMatches = similarSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Lead))
            .filter(lead => lead.id !== excludeLeadId && lead.zipCode !== zipCode);

        if (similarMatches.length > 0) {
            return {
                isDuplicate: false, // Not blocking, just warning
                duplicateLeads: similarMatches,
                matchType: 'similar',
                message: `Warning: A school with similar name exists in a different location (ZIP: ${similarMatches[0].zipCode})`
            };
        }

        return {
            isDuplicate: false,
            duplicateLeads: [],
            matchType: 'none',
            message: 'No duplicates found'
        };

    } catch (error) {
        console.error('Error checking for duplicates:', error);
        // Don't block lead creation if check fails
        return {
            isDuplicate: false,
            duplicateLeads: [],
            matchType: 'none',
            message: 'Unable to check for duplicates'
        };
    }
};

/**
 * Validate ZIP code format (basic validation)
 */
export const validateZipCode = (zipCode: string): boolean => {
    // Indian PIN code: 6 digits
    const indianPinRegex = /^\d{6}$/;
    // US ZIP: 5 digits or 5+4 format
    const usZipRegex = /^\d{5}(-\d{4})?$/;

    return indianPinRegex.test(zipCode) || usZipRegex.test(zipCode);
};

/**
 * Validate phone number format
 */
export const validatePhoneNumber = (phone: string): boolean => {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    // Should be 10 digits (Indian) or 10-11 digits (with country code)
    return digitsOnly.length >= 10 && digitsOnly.length <= 12;
};
