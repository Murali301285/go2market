export type UserRole = 'admin' | 'distributor' | 'user';

export interface User {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    defaultLockInMonths: 1 | 3 | 6;
    assignedRegions: string[]; // Array of region IDs - required
    isActive: boolean;
    createdAt: number; // Timestamp
}

export interface Region {
    id: string;
    name: string;
    remarks?: string;
    isActive: boolean;
}

export type LeadStatus = 'PENDING' | 'LOCKED' | 'CONVERTED' | 'CANCELLED' | 'POOL';

export type LeadStage =
    | 'NEW'              // Just created
    | 'CONTACTED'        // Initial contact made
    | 'DEMO_SCHEDULED'   // Demo appointment set
    | 'DEMO_SHOWED'      // Demo completed
    | 'QUOTATION_SENT'   // Quote sent
    | 'NEGOTIATION'      // In negotiation
    | 'CONVERTED'        // Won
    | 'CANCELLED'        // Lost
    | 'EXPIRED';         // Lock period expired


export interface LeadUpdate {
    id: string;
    status: string; // e.g., "Demo Showed", "Quotation Sent"
    remarks: string;
    timestamp: number;
    updatedBy: string;
    attachments?: { name: string; url: string }[];
    probability?: number; // Added
}

export interface Lead {
    id: string;
    // Core Details
    schoolName: string;
    regionId: string;
    regionName: string; // Denormalized for easier display
    address: string;
    zipCode: string; // ZIP/Postal code for uniqueness
    landmark?: string;
    contactPerson: string;
    designation?: string; // Added field
    contactEmail: string;
    contactPhone: string;
    contactedDate?: number; // Timestamp for when contact was made
    isChain: boolean;
    chainName?: string;
    remarks: string;
    googlePlaceId?: string; // Optional: For future Google Maps integration

    // Ownership & Status
    status: LeadStatus;
    stage: LeadStage;
    probability?: number; // Conversion probability (10-95%)
    assignedToUserId?: string;
    assignedToName?: string; // Denormalized
    lockedUntil?: number; // Timestamp

    // Meta
    createdAt: number;
    createdBy: string;

    // History
    updates: LeadUpdate[];
}

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    createdAt: number;
    link?: string; // Optional link to navigate to
}

export interface DashboardStats {
    totalLeads: number;
    demosShowed: number;
    quotesSent: number;
    converted: number;
    failed: number;
}

export interface BulkUploadRow {
    id: string; // Temporary ID for the row
    originalData: {
        contactPerson: string;
        schoolName: string;
        designation: string;
        region: string; // Changed from inchargePersonName
        contactNo: string; // Added
    };
    verifiedData: {
        schoolName: string;
        address: string;
        zipCode: string;
        landmark: string;
        regionId: string;
        regionName: string;
        googlePlaceId?: string;
        contactPerson: string;
        designation: string;
        contactPhone: string;
        contactEmail: string;
        assignedToUserId: string;
        assignedToUserName: string;
    };
    status: 'PENDING' | 'VERIFYING' | 'VERIFIED' | 'DUPLICATE' | 'ERROR' | 'UPLOADED' | 'REGION_NOT_FOUND' | 'MULTIPLE_MATCHES' | 'NO_MATCH';
    message?: string;
    uploadDate: number;
}
