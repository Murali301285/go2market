# 🔄 Database Migration Guide

## Overview
We've added new fields to the database schema. Existing data needs to be updated.

---

## Required Migrations

### 1. Add `stage` field to existing Leads

**What changed:**
- Added `stage: LeadStage` field to Lead interface
- Tracks sales pipeline progress

**Migration needed:**
All existing leads in Firestore `leads` collection need a `stage` field.

**Default values:**
```javascript
if (lead.status === 'CONVERTED') {
    stage = 'CONVERTED'
} else if (lead.status === 'CANCELLED') {
    stage = 'CANCELLED'
} else {
    stage = 'NEW'
}
```

**Manual migration (Firebase Console):**
1. Go to Firestore → `leads` collection
2. For each document, click to edit
3. Add field: `stage` (string)
4. Set value based on current `status`

**OR use this script** (run in browser console on Firebase Console page):
```javascript
// This is a manual script - adapt as needed
const leads = await firebase.firestore().collection('leads').get();
const batch = firebase.firestore().batch();

leads.docs.forEach(doc => {
    const data = doc.data();
    let stage = 'NEW';
    
    if (data.status === 'CONVERTED') stage = 'CONVERTED';
    else if (data.status === 'CANCELLED') stage = 'CANCELLED';
    
    batch.update(doc.ref, { stage });
});

await batch.commit();
console.log('Migration complete!');
```

---

### 2. Add `isActive` and `remarks` to existing Regions

**What changed:**
- Added `isActive: boolean` field to Region interface
- Added `remarks?: string` field to Region interface

**Migration needed:**
All existing regions in Firestore `regions` collection need these fields.

**Default values:**
- `isActive`: `true`
- `remarks`: `''` (empty string)

**Manual migration (Firebase Console):**
1. Go to Firestore → `regions` collection
2. For each document, click to edit
3. Add field: `isActive` (boolean) = `true`
4. Add field: `remarks` (string) = `''`

**OR use this script:**
```javascript
const regions = await firebase.firestore().collection('regions').get();
const batch = firebase.firestore().batch();

regions.docs.forEach(doc => {
    batch.update(doc.ref, { 
        isActive: true,
        remarks: ''
    });
});

await batch.commit();
console.log('Regions migration complete!');
```

---

## Testing After Migration

### Test Regions:
1. Go to Admin → Regions
2. Verify all regions show with "Active" chip
3. Try toggling a region to inactive
4. Create a new lead - verify only active regions appear

### Test Leads:
1. Go to Admin → Dashboard
2. Verify funnel chart displays correctly
3. All leads should have a stage
4. No console errors

---

## Rollback Plan

If issues occur:

### Regions:
Remove the new fields:
```javascript
const regions = await firebase.firestore().collection('regions').get();
const batch = firebase.firestore().batch();
regions.docs.forEach(doc => {
    batch.update(doc.ref, { 
        isActive: firebase.firestore.FieldValue.delete(),
        remarks: firebase.firestore.FieldValue.delete()
    });
});
await batch.commit();
```

### Leads:
Remove stage field:
```javascript
const leads = await firebase.firestore().collection('leads').get();
const batch = firebase.firestore().batch();
leads.docs.forEach(doc => {
    batch.update(doc.ref, { 
        stage: firebase.firestore.FieldValue.delete()
    });
});
await batch.commit();
```

---

## Future Leads

**Good news:** New leads created through the app will automatically have:
- `stage: 'NEW'` (set in createLead function)
- Regions will have `isActive: true` and `remarks: ''` (set in addRegion function)

Only existing data needs manual migration.

---

## Recommended Approach

1. **Backup first** - Export your Firestore data
2. **Test in development** - If you have a test Firebase project, test there first
3. **Migrate regions** - Safer, fewer records
4. **Migrate leads** - More records, but straightforward
5. **Test thoroughly** - Verify all features work
6. **Monitor** - Watch for any issues in production

---

**Need help with migration? Let me know!**
