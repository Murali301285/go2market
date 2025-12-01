# 🚀 Firebase Setup - Do This NOW to Enable Login

## ⚠️ Why Login Doesn't Work Yet:

The login page is working perfectly, but you haven't created the admin user in Firebase yet. You need to:
1. Enable Firebase Authentication
2. Create the admin user account
3. Create the user document in Firestore

**This will take 10-15 minutes. Let's do it step by step!**

---

## 📍 Step 1: Enable Firebase Authentication (3 minutes)

1. **Open this link:** https://console.firebase.google.com/project/distrack-01/authentication

2. **Click "Get started"** (if you see it)

3. **Click the "Sign-in method" tab** at the top

4. **Find "Email/Password"** in the list

5. **Click on "Email/Password"**

6. **Toggle "Enable" to ON**

7. **Click "Save"**

✅ **Verify:** You should see "Email/Password" with status "Enabled"

---

## 📍 Step 2: Create Admin User in Authentication (2 minutes)

1. **Click the "Users" tab** at the top

2. **Click "Add user" button**

3. **Fill in:**
   - Email: `admin@distrack.com`
   - Password: `admin123`

4. **Click "Add user"**

5. **IMPORTANT: COPY THE UID!**
   - You'll see a UID in the list (looks like: `abc123xyz789...`)
   - Click on it to copy it
   - **Write it down or keep it in your clipboard!**

✅ **Verify:** You should see `admin@distrack.com` in the users list

---

## 📍 Step 3: Create Firestore Database (3 minutes)

1. **Open this link:** https://console.firebase.google.com/project/distrack-01/firestore

2. **Click "Create database"**

3. **Select "Start in test mode"**

4. **Click "Next"**

5. **Choose location:**
   - For India: Select `asia-south1 (Mumbai)`
   - Or use: `us-central1`

6. **Click "Enable"**

7. **Wait 30-60 seconds** for the database to be created

✅ **Verify:** You should see the Firestore Database dashboard

---

## 📍 Step 4: Create Admin User Document in Firestore (5 minutes)

1. **Click "Start collection"** button

2. **Collection ID:** Type `users`

3. **Click "Next"**

4. **Document ID:** Paste the UID you copied in Step 2

5. **Now add these fields one by one:**

Click "Add field" for each:

| Field Name | Type | Value |
|------------|------|-------|
| `id` | string | Paste the same UID again |
| `email` | string | `admin@distrack.com` |
| `fullName` | string | `Admin User` |
| `role` | string | `admin` |
| `isActive` | boolean | Check the box (true) |
| `defaultLockInMonths` | number | `3` |
| `createdAt` | number | `1732367289000` |

**How to add each field:**
- Click "Add field"
- Type the field name (e.g., `id`)
- Select the type from dropdown (e.g., `string`)
- Enter the value
- Repeat for all 7 fields

6. **Click "Save"**

✅ **Verify:** You should see the `users` collection with 1 document

---

## 📍 Step 5: Set Security Rules (2 minutes)

1. **Still in Firestore, click the "Rules" tab**

2. **Delete everything** in the editor

3. **Copy and paste these rules:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAdmin();
      allow update: if isAuthenticated() && (
        request.auth.uid == userId || isAdmin()
      );
      allow delete: if isAdmin();
    }
    
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
    
    match /regions/{regionId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
  }
}
```

4. **Click "Publish"**

5. **Click "Publish" again** in the confirmation dialog

✅ **Verify:** You should see "Last updated: just now"

---

## 🎉 Step 6: TEST LOGIN! (1 minute)

1. **Go back to your app:** http://localhost:5173

2. **Refresh the page** (Ctrl + Shift + R)

3. **Login with:**
   - Email: `admin@distrack.com`
   - Password: `admin123`

4. **Click "Sign In"**

**Expected Result:**
- ✅ You should be redirected to the Admin Dashboard
- ✅ You should see menu items: Dashboard, Regions, Users, Lead Approvals
- ✅ You should see statistics cards

---

## 🐛 If Login Still Doesn't Work:

### **Check 1: Browser Console**
1. Press F12
2. Look for errors
3. Common issues:
   - "User not found" → User not created in Authentication
   - "Permission denied" → Security rules not published
   - "Cannot read properties of null" → User document missing in Firestore

### **Check 2: Verify Firebase Setup**
1. **Authentication:** https://console.firebase.google.com/project/distrack-01/authentication/users
   - Should see `admin@distrack.com`

2. **Firestore:** https://console.firebase.google.com/project/distrack-01/firestore/data
   - Should see `users` collection
   - Should see 1 document with the admin UID
   - Click on the document and verify all 7 fields are there

### **Check 3: UID Matches**
- The UID in Authentication must EXACTLY match the document ID in Firestore
- The `id` field in the document must also match this UID

---

## 📋 Quick Checklist:

- [ ] Authentication is enabled (Email/Password)
- [ ] Admin user created in Authentication
- [ ] Firestore database created
- [ ] `users` collection created
- [ ] Admin document created with correct UID
- [ ] All 7 fields are in the document
- [ ] `role` field is set to `"admin"` (string)
- [ ] Security rules are published
- [ ] Tried logging in

---

## 🎯 After Successful Login:

Once you can login, you should:

1. **Create Regions:**
   - Go to "Regions" page
   - Add: North Zone, South Zone, East Zone, West Zone

2. **Create Test Users:**
   - Go to "Users" page
   - Create 2-3 distributor users for testing

3. **Test Features:**
   - Follow `TESTING_GUIDE.md` for comprehensive testing

---

## 📞 Need Help?

If you're stuck at any step:
1. Take a screenshot of what you're seeing
2. Check the browser console (F12) for errors
3. Verify each step was completed correctly
4. Make sure the UID matches in both Authentication and Firestore

---

**Follow these steps carefully and you'll be logged in within 15 minutes!** 🚀
