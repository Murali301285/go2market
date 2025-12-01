# 🚀 DATABASE MIGRATION - STEP BY STEP GUIDE

## ⚠️ IMPORTANT: Read Before Running

This migration will update your existing database records to add new fields.

**What will be added:**
- `zipCode` field to all leads (default: '000000')
- `stage` field to all leads (based on status)
- `isActive` field to all regions (default: true)
- `remarks` field to all regions (default: '')

---

## 📋 STEP-BY-STEP INSTRUCTIONS

### **Step 1: Open Firebase Console**

1. Go to: https://console.firebase.google.com
2. Select your **DisTrack** project
3. Click on **Firestore Database** in the left menu
4. You should see your collections (leads, regions, user, etc.)

### **Step 2: Open Browser Console**

1. Press **F12** (or right-click → Inspect)
2. Click on the **Console** tab
3. You should see a command prompt (>)

### **Step 3: Copy Migration Script**

1. Open the file: `firebase-migration.js`
2. **Copy ALL the code** (Ctrl+A, Ctrl+C)

### **Step 4: Run Migration**

1. **Paste** the code into the Firebase Console (Ctrl+V)
2. Press **Enter**
3. The migration will start automatically

### **Step 5: Watch Progress**

You'll see messages like:
```
🚀 Starting Lead ZIP Code Migration...
📊 Found X leads to migrate
✅ Successfully migrated X leads
```

### **Step 6: Verify Results**

1. In Firestore Database, click on any **lead** document
2. Check that it now has:
   - ✅ `zipCode` field (value: '000000')
   - ✅ `stage` field (value: 'NEW', 'CONVERTED', etc.)

3. Click on any **region** document
4. Check that it now has:
   - ✅ `isActive` field (value: true)
   - ✅ `remarks` field (value: '')

---

## 🎯 EXPECTED OUTPUT

```
🎯 Starting All Migrations...

🚀 Starting Lead ZIP Code Migration...
📊 Found 5 leads to migrate
✅ Successfully migrated 5 leads
⚠️  Please update ZIP codes manually for existing leads

🚀 Starting Lead Stage Migration...
📊 Found 5 leads to migrate
✅ Successfully migrated 5 leads with stage field

🚀 Starting Region Migration...
📊 Found 3 regions to migrate
✅ Successfully migrated 3 regions

🎉 All migrations completed successfully!

📋 Next Steps:
1. Update ZIP codes for existing leads (currently set to 000000)
2. Review and update Firestore security rules
3. Test all features thoroughly
```

---

## ⚠️ TROUBLESHOOTING

### **Error: "firebase is not defined"**
**Solution:** Make sure you're in the Firebase Console, not your local browser console.

### **Error: "Permission denied"**
**Solution:** 
1. Check your Firestore rules allow write access
2. Make sure you're logged in as project owner

### **No leads/regions found**
**Solution:** This is normal if you haven't created any data yet. The app will work fine.

---

## 📝 AFTER MIGRATION

### **1. Update ZIP Codes (Manual)**

For each existing lead:
1. Go to **All Leads** page in your app
2. Click on a lead
3. Edit and add the correct ZIP code
4. Save

### **2. Verify Application**

1. Try creating a new lead
2. Check that ZIP code is required
3. Try creating a duplicate (same school + ZIP)
4. Should show error message

### **3. Test Funnel Chart**

1. Go to Admin Dashboard
2. Check that funnel chart displays
3. Labels should show: "Lead (X)", "Demo (X)", etc.

---

## 🔄 IF SOMETHING GOES WRONG

### **Rollback (if needed):**

```javascript
// Remove zipCode from all leads
const rollbackZipCode = async () => {
    const db = firebase.firestore();
    const snapshot = await db.collection('leads').get();
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { 
            zipCode: firebase.firestore.FieldValue.delete(),
            googlePlaceId: firebase.firestore.FieldValue.delete()
        });
    });
    
    await batch.commit();
    console.log('✅ Rollback complete');
};

rollbackZipCode();
```

---

## ✅ MIGRATION CHECKLIST

- [ ] Opened Firebase Console
- [ ] Opened Browser Console (F12)
- [ ] Copied migration script
- [ ] Pasted and ran script
- [ ] Saw success messages
- [ ] Verified lead has `zipCode` field
- [ ] Verified lead has `stage` field
- [ ] Verified region has `isActive` field
- [ ] Verified region has `remarks` field
- [ ] Tested creating new lead
- [ ] Tested duplicate detection

---

## 🎉 SUCCESS CRITERIA

Migration is successful when:
- ✅ All leads have `zipCode` field
- ✅ All leads have `stage` field
- ✅ All regions have `isActive` field
- ✅ All regions have `remarks` field
- ✅ No errors in console
- ✅ App still works normally

---

**Ready to run? Follow the steps above!**

**Need help? Check the troubleshooting section or ask for assistance.**
