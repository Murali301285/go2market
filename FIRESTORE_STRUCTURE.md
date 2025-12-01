# DisTrack - Firestore Database Structure

## 📊 Collections Overview

The DisTrack application uses three main Firestore collections:

1. **`users`** - User accounts and profiles
2. **`leads`** - School leads and their lifecycle
3. **`regions`** - Geographic regions for lead assignment

---

## 👥 Users Collection

**Collection Path:** `/users/{userId}`

### Document Structure

```typescript
{
  id: string;                    // Same as document ID (Firebase Auth UID)
  email: string;                 // User's email address
  fullName: string;              // Display name
  role: "admin" | "distributor"; // User role
  isActive: boolean;             // Account status
  defaultLockInMonths: number;   // Default lead lock period (1-12)
  createdAt: number;             // Timestamp when created
}
```

### Example Document

```json
{
  "id": "abc123xyz789",
  "email": "john.doe@example.com",
  "fullName": "John Doe",
  "role": "distributor",
  "isActive": true,
  "defaultLockInMonths": 3,
  "createdAt": 1700000000000
}
```

### Indexes Required

No additional indexes needed for basic queries.

### Security Rules

```javascript
match /users/{userId} {
  // Anyone authenticated can read user data
  allow read: if request.auth != null;
  
  // Users can update their own profile
  allow update: if request.auth != null && request.auth.uid == userId;
  
  // Only admins can create users (handled server-side)
  allow create: if request.auth != null && 
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

---

## 🎯 Leads Collection

**Collection Path:** `/leads/{leadId}`

### Document Structure

```typescript
{
  id: string;                    // Auto-generated document ID
  schoolName: string;            // Name of the school
  regionId: string;              // Reference to region document ID
  regionName: string;            // Denormalized region name for quick access
  address: string;               // School address
  landmark?: string;             // Optional landmark
  contactPerson: string;         // Primary contact name
  contactPhone: string;          // Contact phone number
  contactEmail?: string;         // Optional email
  isChain: boolean;              // Is this a chain school?
  chainName?: string;            // Chain name if applicable
  remarks: string;               // Initial remarks
  contactedAt?: number;          // When lead was contacted (TODO)
  
  // Lifecycle fields
  status: "PENDING" | "LOCKED" | "POOL";  // Current status
  createdBy: string;             // UID of user who created the lead
  createdAt: number;             // Timestamp when created
  
  // Assignment fields (null when status is PENDING or POOL)
  assignedToUserId: string | null;  // UID of assigned user
  assignedToName: string | null;    // Name of assigned user
  lockedUntil: number | null;       // Timestamp when lock expires
  
  // Activity tracking
  updates: Array<{
    status: string;              // Update status/title
    remarks: string;             // Update details
    timestamp: number;           // When update was made
    updatedBy: string;           // UID of user who made update
  }>;
}
```

### Example Document

```json
{
  "id": "lead_abc123",
  "schoolName": "ABC International School",
  "regionId": "region_north",
  "regionName": "North Zone",
  "address": "123 Main Street, City",
  "landmark": "Near Central Park",
  "contactPerson": "Jane Principal",
  "contactPhone": "1234567890",
  "contactEmail": "jane@abc.school",
  "isChain": true,
  "chainName": "ABC Education Group",
  "remarks": "Interested in digital solutions",
  "contactedAt": 1700000000000,
  
  "status": "LOCKED",
  "createdBy": "user_xyz789",
  "createdAt": 1700000000000,
  
  "assignedToUserId": "user_xyz789",
  "assignedToName": "John Doe",
  "lockedUntil": 1707776000000,
  
  "updates": [
    {
      "status": "Initial Contact",
      "remarks": "Had first meeting with principal",
      "timestamp": 1700100000000,
      "updatedBy": "user_xyz789"
    },
    {
      "status": "Demo Scheduled",
      "remarks": "Demo set for next week",
      "timestamp": 1700200000000,
      "updatedBy": "user_xyz789"
    }
  ]
}
```

### Lead Status Flow

```
PENDING → (Admin Approves) → LOCKED → (Time Expires) → POOL
                           ↓
                    (Admin Rejects)
                           ↓
                         POOL → (User Claims) → LOCKED
```

### Indexes Required

Create these composite indexes in Firebase Console:

1. **For getUserLeads query:**
   - Collection: `leads`
   - Fields: `assignedToUserId` (Ascending), `createdAt` (Descending)

2. **For getPendingLeads query:**
   - Collection: `leads`
   - Fields: `status` (Ascending), `createdAt` (Descending)

3. **For getPoolLeads query:**
   - Collection: `leads`
   - Fields: `status` (Ascending), `createdAt` (Descending)

4. **For expired leads (Cloud Function):**
   - Collection: `leads`
   - Fields: `status` (Ascending), `lockedUntil` (Ascending)

### Security Rules

```javascript
match /leads/{leadId} {
  // Anyone authenticated can read leads
  allow read: if request.auth != null;
  
  // Anyone authenticated can create leads
  allow create: if request.auth != null &&
                   request.resource.data.createdBy == request.auth.uid;
  
  // Users can update their own leads or admins can update any
  allow update: if request.auth != null && (
    resource.data.assignedToUserId == request.auth.uid ||
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
  );
  
  // Only admins can delete
  allow delete: if request.auth != null &&
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

---

## 🗺️ Regions Collection

**Collection Path:** `/regions/{regionId}`

### Document Structure

```typescript
{
  id: string;        // Auto-generated document ID
  name: string;      // Region name (e.g., "North Zone")
  createdAt: number; // Timestamp when created
}
```

### Example Document

```json
{
  "id": "region_north",
  "name": "North Zone",
  "createdAt": 1700000000000
}
```

### Indexes Required

No additional indexes needed.

### Security Rules

```javascript
match /regions/{regionId} {
  // Anyone authenticated can read regions
  allow read: if request.auth != null;
  
  // Only admins can create/update/delete regions
  allow write: if request.auth != null &&
                  get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

---

## 📈 Data Relationships

### User → Leads (One-to-Many)

A user can have multiple leads assigned to them:

```typescript
// Get all leads for a user
const userLeads = await getDocs(
  query(
    collection(db, 'leads'),
    where('assignedToUserId', '==', userId)
  )
);
```

### Region → Leads (One-to-Many)

A region can have multiple leads:

```typescript
// Get all leads in a region
const regionLeads = await getDocs(
  query(
    collection(db, 'leads'),
    where('regionId', '==', regionId)
  )
);
```

### Lead → Updates (One-to-Many - Embedded)

Updates are stored as an array within the lead document for simplicity and atomic updates.

---

## 🔢 Sample Data for Testing

### Create Sample Regions

```javascript
const regions = [
  { name: "North Zone" },
  { name: "South Zone" },
  { name: "East Zone" },
  { name: "West Zone" },
  { name: "Central Zone" }
];

for (const region of regions) {
  await addDoc(collection(db, 'regions'), {
    ...region,
    createdAt: Date.now()
  });
}
```

### Create Sample Users

```javascript
// Admin user
{
  "id": "<firebase_auth_uid>",
  "email": "admin@distrack.com",
  "fullName": "Admin User",
  "role": "admin",
  "isActive": true,
  "defaultLockInMonths": 3,
  "createdAt": 1700000000000
}

// Distributor users
{
  "id": "<firebase_auth_uid>",
  "email": "john@distrack.com",
  "fullName": "John Distributor",
  "role": "distributor",
  "isActive": true,
  "defaultLockInMonths": 3,
  "createdAt": 1700000000000
}
```

### Create Sample Leads

```javascript
const sampleLeads = [
  {
    schoolName: "ABC International School",
    regionId: "region_north",
    regionName: "North Zone",
    address: "123 Main St",
    contactPerson: "Jane Doe",
    contactPhone: "1234567890",
    status: "PENDING",
    createdBy: "user_john",
    createdAt: Date.now(),
    updates: []
  },
  {
    schoolName: "XYZ Public School",
    regionId: "region_south",
    regionName: "South Zone",
    address: "456 Oak Ave",
    contactPerson: "Bob Smith",
    contactPhone: "9876543210",
    status: "LOCKED",
    createdBy: "user_john",
    createdAt: Date.now(),
    assignedToUserId: "user_john",
    assignedToName: "John Distributor",
    lockedUntil: Date.now() + (90 * 24 * 60 * 60 * 1000), // 90 days
    updates: [
      {
        status: "Initial Contact",
        remarks: "Met with principal",
        timestamp: Date.now(),
        updatedBy: "user_john"
      }
    ]
  }
];
```

---

## 📊 Dashboard Queries

### Admin Dashboard Stats

```typescript
// Total leads
const totalLeads = (await getDocs(collection(db, 'leads'))).size;

// Pending approvals
const pendingLeads = (await getDocs(
  query(collection(db, 'leads'), where('status', '==', 'PENDING'))
)).size;

// Active users
const activeUsers = (await getDocs(
  query(collection(db, 'users'), where('isActive', '==', true))
)).size;

// Total regions
const totalRegions = (await getDocs(collection(db, 'regions'))).size;
```

### User Dashboard Stats

```typescript
// My total leads
const myLeads = (await getDocs(
  query(collection(db, 'leads'), where('assignedToUserId', '==', userId))
)).size;

// My locked leads
const lockedLeads = (await getDocs(
  query(
    collection(db, 'leads'),
    where('assignedToUserId', '==', userId),
    where('status', '==', 'LOCKED')
  )
)).size;

// My pending leads
const pendingLeads = (await getDocs(
  query(
    collection(db, 'leads'),
    where('createdBy', '==', userId),
    where('status', '==', 'PENDING')
  )
)).size;

// Available pool leads
const poolLeads = (await getDocs(
  query(collection(db, 'leads'), where('status', '==', 'POOL'))
)).size;
```

---

## 🔒 Complete Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAdmin();
      allow update: if isAuthenticated() && (
        request.auth.uid == userId || isAdmin()
      );
      allow delete: if isAdmin();
    }
    
    // Leads collection
    match /leads/{leadId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && 
                       request.resource.data.createdBy == request.auth.uid;
      allow update: if isAuthenticated() && (
        resource.data.assignedToUserId == request.auth.uid ||
        resource.data.createdBy == request.auth.uid ||
        isAdmin()
      );
      allow delete: if isAdmin();
    }
    
    // Regions collection
    match /regions/{regionId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
  }
}
```

---

## 📝 Data Migration Scripts

If you need to migrate or update existing data:

### Update All Leads with New Field

```javascript
const batch = writeBatch(db);
const leadsSnapshot = await getDocs(collection(db, 'leads'));

leadsSnapshot.forEach((doc) => {
  batch.update(doc.ref, {
    contactedAt: doc.data().createdAt // Set to creation time as default
  });
});

await batch.commit();
```

### Bulk Update User Roles

```javascript
const batch = writeBatch(db);
const usersSnapshot = await getDocs(
  query(collection(db, 'users'), where('role', '==', 'user'))
);

usersSnapshot.forEach((doc) => {
  batch.update(doc.ref, {
    role: 'distributor' // Rename role
  });
});

await batch.commit();
```

---

## 🎯 Best Practices

1. **Always use transactions** for operations that update multiple documents
2. **Denormalize data** (like `regionName`) for faster reads
3. **Use batch writes** for bulk operations (max 500 operations per batch)
4. **Index frequently queried fields** to improve performance
5. **Keep documents under 1MB** (Firestore limit)
6. **Use subcollections** for large nested data (not needed for this app)
7. **Implement pagination** for large result sets (use `limit()` and `startAfter()`)

---

## 📚 References

- [Firestore Data Model](https://firebase.google.com/docs/firestore/data-model)
- [Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Query Data](https://firebase.google.com/docs/firestore/query-data/queries)
- [Indexing](https://firebase.google.com/docs/firestore/query-data/indexing)
