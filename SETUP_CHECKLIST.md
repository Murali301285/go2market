# 🚀 DisTrack - Complete Setup Checklist

## ✅ Step-by-Step Setup Guide

### **Phase 1: Firebase Configuration** (15 minutes)

- [ ] **1.1** Go to [Firebase Console](https://console.firebase.google.com)
- [ ] **1.2** Select project: **distrack-01**
- [ ] **1.3** Add Web App:
  - Click ⚙️ → Project settings
  - Scroll to "Your apps"
  - Click `</>` (Web icon)
  - Nickname: `DisTrack Web`
  - Click "Register app"
  - **COPY the firebaseConfig object!**
- [ ] **1.4** Update `.env` file with web app ID
  - Replace `VITE_FIREBASE_APP_ID` with the web app ID from config
  - Should look like: `1:588098710440:web:XXXXXXXXXX`

---

### **Phase 2: Enable Services** (10 minutes)

- [ ] **2.1** Enable Authentication:
  - Go to Authentication → Get started
  - Click "Sign-in method" tab
  - Enable "Email/Password"
  - Click Save

- [ ] **2.2** Create Firestore Database:
  - Go to Firestore Database → Create database
  - Start in **test mode**
  - Location: `asia-south1` (Mumbai) or `us-central1`
  - Click Enable

- [ ] **2.3** Set Security Rules:
  - Go to Firestore → Rules tab
  - Copy rules from `FIREBASE_SETUP.md` (section 5)
  - Click Publish

---

### **Phase 3: Create Admin User** (5 minutes)

- [ ] **3.1** Create Auth User:
  - Go to Authentication → Users
  - Click "Add user"
  - Email: `admin@distrack.com`
  - Password: `admin123`
  - Click "Add user"
  - **COPY the UID!**

- [ ] **3.2** Create Firestore Document:
  - Go to Firestore Database
  - Click "Start collection"
  - Collection ID: `users`
  - Document ID: **Paste the UID**
  - Add fields:
    ```
    id: <paste_UID>
    email: admin@distrack.com
    fullName: Admin User
    role: admin
    isActive: true
    defaultLockInMonths: 3
    createdAt: <current_timestamp_in_milliseconds>
    ```
  - Click Save

---

### **Phase 4: Test the App** (5 minutes)

- [ ] **4.1** Start development server:
  ```bash
  npm run dev
  ```

- [ ] **4.2** Open browser: `http://localhost:5173`

- [ ] **4.3** Login:
  - Email: `admin@distrack.com`
  - Password: `admin123`

- [ ] **4.4** Verify:
  - ✅ Login successful
  - ✅ See Admin Dashboard
  - ✅ Menu shows: Dashboard, Regions, Users, Lead Approvals
  - ✅ No errors in browser console

---

### **Phase 5: Initial Data Setup** (10 minutes)

- [ ] **5.1** Create Regions:
  - Go to "Regions" page
  - Add regions:
    - [ ] North Zone
    - [ ] South Zone
    - [ ] East Zone
    - [ ] West Zone

- [ ] **5.2** Create Test Users:
  - Go to "Users" page
  - Create 2 test distributors:
    - [ ] Email: `dist1@test.com`, Password: `test123`, Name: `Distributor One`
    - [ ] Email: `dist2@test.com`, Password: `test123`, Name: `Distributor Two`

- [ ] **5.3** Verify Users Can Login:
  - [ ] Logout from admin
  - [ ] Login as `dist1@test.com`
  - [ ] Should see User Dashboard
  - [ ] Menu shows: Dashboard, Create Lead, My Leads, General Pool

---

### **Phase 6: Test Core Features** (15 minutes)

#### **Test 1: Create Lead Flow**
- [ ] Login as distributor (`dist1@test.com`)
- [ ] Go to "Create Lead"
- [ ] Fill form:
  - School: `ABC International School`
  - Region: `North Zone`
  - Address: `123 Main Street`
  - Contact: `Jane Principal`
  - Phone: `1234567890`
- [ ] Submit
- [ ] Verify lead appears in "My Leads" with status "PENDING"

#### **Test 2: Admin Approval Flow**
- [ ] Logout and login as admin
- [ ] Go to "Lead Approvals"
- [ ] Click "Review" on the pending lead
- [ ] Click "Approve"
- [ ] Verify lead disappears from approvals

#### **Test 3: Lead Update Flow**
- [ ] Logout and login as distributor
- [ ] Go to "My Leads"
- [ ] Click on the approved lead
- [ ] Verify status is "LOCKED"
- [ ] Add update:
  - Status: `Demo Scheduled`
  - Remarks: `Meeting set for next week`
- [ ] Submit
- [ ] Verify update appears in Activity History

#### **Test 4: General Pool Flow**
- [ ] Login as admin
- [ ] Create a new lead or reject one to pool
- [ ] Logout and login as different distributor (`dist2@test.com`)
- [ ] Go to "General Pool"
- [ ] Click "Claim" on a pool lead
- [ ] Verify lead moves to "My Leads" with status "LOCKED"

---

## 🎯 Success Criteria

Your setup is complete when:

✅ **Firebase is configured:**
- Web app is registered
- Authentication is enabled
- Firestore is created with security rules
- Admin user exists in both Auth and Firestore

✅ **App is running:**
- Dev server starts without errors
- Can access `http://localhost:5173`
- No console errors

✅ **Admin features work:**
- Can login as admin
- Can create regions
- Can create users
- Can approve/reject leads
- Dashboard shows data

✅ **User features work:**
- Can login as distributor
- Can create leads
- Can view "My Leads"
- Can add updates to leads
- Can claim pool leads

---

## 📋 Quick Reference

### **Firebase Project Details**
- Project ID: `distrack-01`
- Project Number: `588098710440`
- Storage Bucket: `distrack-01.firebasestorage.app`

### **Default Credentials**
- **Admin:** `admin@distrack.com` / `admin123`
- **Test User 1:** `dist1@test.com` / `test123`
- **Test User 2:** `dist2@test.com` / `test123`

### **Important Files**
- `.env` - Firebase configuration (don't commit!)
- `FIREBASE_SETUP.md` - Detailed setup instructions
- `TESTING_GUIDE.md` - Comprehensive testing scenarios
- `QUICK_START.md` - Quick start guide

---

## 🐛 Common Issues

### ❌ "Invalid API key"
**Fix:** Check `.env` file has correct `VITE_FIREBASE_API_KEY`

### ❌ "User not found"
**Fix:** Create user in Firebase Authentication first

### ❌ "Permission denied"
**Fix:** 
1. Publish Firestore security rules
2. Verify user document exists in `users` collection

### ❌ "Cannot read properties of null"
**Fix:** User document must have `role` field set to "admin" or "distributor"

### ❌ Wrong app ID
**Fix:** Use web app ID (`:web:...`), not Android app ID (`:android:...`)

---

## 📞 Need Help?

1. **Check browser console** for error messages
2. **Review `FIREBASE_SETUP.md`** for detailed instructions
3. **Follow `TESTING_GUIDE.md`** for testing scenarios
4. **Check Firebase Console** for data integrity

---

## 🎉 You're Done!

Once all checkboxes are ✅, you have:
- ✅ Fully configured Firebase
- ✅ Working admin account
- ✅ Test data created
- ✅ All features tested
- ✅ Ready for development!

**Next:** Read `REMAINING_TASKS.md` to see what features to build next! 🚀

---

*Last Updated: 2025-11-22*
