# 🔄 Database Migration: Add ZIP Code to Existing Leads

## ⚠️ IMPORTANT: Run This Migration

All existing leads in your database need a `zipCode` field added.

---

## 📋 Migration Script

### Option 1: Firebase Console (Recommended for Small Datasets)

1. Go to **Firebase Console** → **Firestore Database**
2. Open **Browser Console** (F12)
3. Copy and paste this script:

```javascript
// Migration Script: Add zipCode to existing leads
const migrateLeads = async () => {
    const db = firebase.firestore();
    const leadsRef = db.collection('leads');
    
    try {
        const snapshot = await leadsRef.get();
        console.log(`Found ${snapshot.size} leads to migrate`);
        
        const batch = db.batch();
        let count = 0;
        
        snapshot.docs.forEach(doc => {
            // Add default zipCode (you'll need to update these manually)
            batch.update(doc.ref, { 
                zipCode: '000000', // Default placeholder
                googlePlaceId: null // Optional field for future use
            });
            count++;
        });
        
        await batch.commit();
        console.log(`✅ Successfully migrated ${count} leads`);
        console.log('⚠️ Please update ZIP codes manually for existing leads');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
};

// Run the migration
migrateLeads();
```

### Option 2: Node.js Script (For Large Datasets)

Create a file `migrate-zipcodes.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-your-service-account-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateLeads() {
    try {
        const leadsSnapshot = await db.collection('leads').get();
        console.log(`Found ${leadsSnapshot.size} leads to migrate`);
        
        const batch = db.batch();
        let count = 0;
        
        leadsSnapshot.docs.forEach(doc => {
            batch.update(doc.ref, {
                zipCode: '000000', // Default placeholder
                googlePlaceId: null
            });
            count++;
            
            // Firestore batch limit is 500
            if (count % 500 === 0) {
                console.log(`Processed ${count} leads...`);
            }
        });
        
        await batch.commit();
        console.log(`✅ Successfully migrated ${count} leads`);
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

migrateLeads();
```

Run with: `node migrate-zipcodes.js`

---

## 🔍 Verification

After migration, verify in Firebase Console:

1. Go to any lead document
2. Check that `zipCode` field exists
3. Update placeholder values with actual ZIP codes

---

## 📝 Manual Update Process

For existing leads with placeholder ZIP codes:

1. **Admin Dashboard** → **All Leads**
2. Click on each lead
3. Edit and add correct ZIP code
4. Save

---

## 🎯 New Leads

All new leads created after this update will automatically have:
- ✅ Required `zipCode` field
- ✅ Duplicate checking (School + ZIP + Phone)
- ✅ ZIP code validation
- ✅ Optional `googlePlaceId` for future Google Maps integration

---

## ⚡ Quick Test

Create a test lead to verify:
1. Go to **Create Lead** page
2. Try creating without ZIP → Should show error
3. Try creating with invalid ZIP (e.g., "123") → Should show error
4. Try creating with valid ZIP (e.g., "560001") → Should work
5. Try creating duplicate (same name + ZIP) → Should block
6. Try creating similar (same name, different ZIP) → Should warn

---

**Run the migration script now to ensure all existing leads have the zipCode field!**
