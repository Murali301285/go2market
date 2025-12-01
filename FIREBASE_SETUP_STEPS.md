# 🔥 Firebase Setup - Step-by-Step Visual Guide

## 📋 Overview

Follow these steps **in order** to enable Firebase services and create your admin user.

**Estimated time: 15-20 minutes**

---

## 🔐 Step 1: Sign In to Firebase Console

1. **Open this link:** https://console.firebase.google.com/project/distrack-01
2. **Sign in** with your Google account
3. You should see the **Firebase Console** for project `distrack-01`

---

## 🔑 Step 2: Enable Authentication (5 minutes)

### **2.1 Navigate to Authentication**
1. In the left sidebar, click **"Authentication"**
2. If you see a **"Get started"** button, click it
3. You'll see the Authentication dashboard

### **2.2 Enable Email/Password Sign-in**
1. Click the **"Sign-in method"** tab at the top
2. You'll see a list of sign-in providers
3. Find **"Email/Password"** in the list
4. Click on **"Email/Password"** row
5. A panel will slide in from the right
6. Toggle the **"Enable"** switch to ON
7. Click **"Save"** button

✅ **Verification:** You should see "Email/Password" with status "Enabled"

---

## 🗄️ Step 3: Create Firestore Database (5 minutes)

### **3.1 Navigate to Firestore**
1. In the left sidebar, click **"Firestore Database"**
2. Click **"Create database"** button

### **3.2 Choose Security Mode**
1. You'll see two options:
   - Production mode
   - **Test mode** ← Select this one
2. Click **"Next"**

### **3.3 Choose Location**
1. Select a location from dropdown:
   - For India: **"asia-south1 (Mumbai)"**
   - Or use: **"us-central1"**
2. Click **"Enable"**
3. Wait for database to be created (30-60 seconds)

✅ **Verification:** You should see the Firestore Database dashboard with "Data", "Rules", "Indexes" tabs

### **3.4 Set Security Rules**
1. Click the **"Rules"** tab
2. You'll see a code editor with default rules
3. **Delete all the existing rules**
4. **Copy and paste** these rules:

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

5. Click **"Publish"** button
6. Confirm by clicking **"Publish"** again in the dialog

✅ **Verification:** You should see "Last updated: just now" under the rules

---

## 👤 Step 4: Create Admin User (5 minutes)

### **4.1 Create User in Authentication**

1. Click **"Authentication"** in the left sidebar
2. Click the **"Users"** tab
3. Click **"Add user"** button
4. Fill in the form:
   - **Email:** `admin@distrack.com`
   - **Password:** `admin123`
5. Click **"Add user"**
6. **IMPORTANT:** You'll see the new user in the list
7. **COPY THE UID** - it's in the "User UID" column (looks like: `abc123xyz789...`)
   - Click on the UID to copy it
   - Or write it down somewhere

✅ **Verification:** You should see `admin@distrack.com` in the users list

---

### **4.2 Create User Document in Firestore**

1. Click **"Firestore Database"** in the left sidebar
2. Click the **"Data"** tab
3. Click **"Start collection"** button
4. In the "Collection ID" field, type: `users`
5. Click **"Next"**

6. **Add the first document:**
   - **Document ID:** Paste the UID you copied (or click "Auto-ID" if you lost it)
   - Now add fields one by one:

**Click "Add field" for each field below:**

| Field name | Type | Value |
|------------|------|-------|
| `id` | string | Paste the same UID |
| `email` | string | `admin@distrack.com` |
| `fullName` | string | `Admin User` |
| `role` | string | `admin` |
| `isActive` | boolean | `true` (check the box) |
| `defaultLockInMonths` | number | `3` |
| `createdAt` | number | `1732267408000` |

**How to add each field:**
- Click **"Add field"**
- Enter the **field name** (e.g., `id`)
- Select the **type** from dropdown (e.g., `string`)
- Enter the **value** (e.g., the UID)
- Repeat for all 7 fields

7. Click **"Save"**

✅ **Verification:** You should see the `users` collection with 1 document

---

## ✅ Step 5: Verify Everything Works

### **5.1 Check Your Setup**

Go through this checklist in Firebase Console:

**Authentication:**
- [ ] Go to Authentication → Sign-in method
- [ ] Email/Password shows "Enabled"
- [ ] Go to Authentication → Users
- [ ] See `admin@distrack.com` in the list

**Firestore:**
- [ ] Go to Firestore Database → Data
- [ ] See `users` collection
- [ ] Click on `users` collection
- [ ] See 1 document (the admin user)
- [ ] Click on the document
- [ ] Verify all 7 fields are present and correct

**Security Rules:**
- [ ] Go to Firestore Database → Rules
- [ ] See the rules you pasted
- [ ] Status shows "Published"

---

### **5.2 Test Login**

1. **Open your browser:** http://localhost:5173
2. You should see the **DisTrack login page**
3. **Login with:**
   - Email: `admin@distrack.com`
   - Password: `admin123`
4. Click **"Sign In"**

**Expected result:**
- ✅ Login successful
- ✅ Redirected to Admin Dashboard
- ✅ See menu: Dashboard, Regions, Users, Lead Approvals
- ✅ See statistics cards
- ✅ No errors in browser console (press F12 to check)

**If login fails:**
- Check browser console for errors (F12)
- Verify the UID in Firestore matches the UID in Authentication
- Verify the `role` field is set to `"admin"` (string, not boolean)
- Verify all fields are spelled correctly

---

## 🎉 Success!

If you can login and see the admin dashboard, you're done! 🎊

**Next steps:**
1. Create some regions (North, South, East, West)
2. Create test distributor users
3. Test creating leads
4. Follow `TESTING_GUIDE.md` for comprehensive testing

---

## 🐛 Troubleshooting

### **"Firebase: Error (auth/user-not-found)"**
→ User was created in Authentication but you're using wrong email/password

### **"Firebase: Error (auth/wrong-password)"**
→ Password is incorrect, try resetting it in Firebase Console

### **"Missing or insufficient permissions"**
→ Security rules not published OR user document doesn't exist in Firestore

### **"Cannot read properties of null (reading 'role')"**
→ User document in Firestore is missing the `role` field

### **Login works but shows blank page**
→ Check browser console (F12) for errors
→ User document might be missing required fields

### **Can't see admin menu items**
→ The `role` field in Firestore must be exactly `"admin"` (lowercase, string type)

---

## 📞 Need Help?

If you get stuck:
1. **Check browser console** (F12) for error messages
2. **Verify in Firebase Console:**
   - Authentication → Users → admin exists
   - Firestore → users collection → admin document exists
   - Firestore → Rules → rules are published
3. **Compare your setup** with the steps above
4. **Check the UID** - it must match in both Authentication and Firestore

---

## 🎯 Quick Reference

**Firebase Console:** https://console.firebase.google.com/project/distrack-01

**Admin Credentials:**
- Email: `admin@distrack.com`
- Password: `admin123`

**App URL:**
- Local: http://localhost:5173

**Collections to create:**
1. `users` - User accounts (created in Step 4)
2. `regions` - Geographic regions (create via app)
3. `leads` - School leads (create via app)

---

**Follow the steps above carefully and you'll be up and running in 15-20 minutes!** 🚀
