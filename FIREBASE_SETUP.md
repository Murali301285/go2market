# Firebase Setup for Multi-Platform DisTrack (Web + Android)

## 🎯 Overview

DisTrack will run on **two platforms** sharing the same Firebase backend:
- 🌐 **Web App** - React (this codebase)
- 📱 **Android App** - Already registered in Firebase

Both apps will share:
- ✅ Same user accounts (Authentication)
- ✅ Same database (Firestore)
- ✅ Same data (leads, regions, users)

---

## 📋 Your Current Firebase Setup

**Project:** distrack-01  
**Project Number:** 588098710440

**Already Registered:**
- ✅ Android app: `com.distrack`
- ✅ Android API Key: `AIzaSyBSTP2TMTnVVBUY5-ntsK74aOzdN2zVbow`

**Still Need:**
- ⚠️ Web app registration
- ⚠️ Firebase services enabled (Auth, Firestore)

---

## 🔧 Step-by-Step Setup

### **Step 1: Register Web App** (2 minutes)

The Android app is already registered. Now add the web app:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **distrack-01**
3. Click **⚙️** → **Project settings**
4. Scroll to **"Your apps"** section
5. You should see:
   - ✅ Android app: `com.distrack` (already there)
6. Click **`</>`** (Web icon) to add web app
7. Register:
   - **App nickname:** `DisTrack Web`
   - ✅ **Also set up Firebase Hosting** (recommended)
8. Click **Register app**
9. **Copy the config** - you'll get something like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBSTP2TMTnVVBUY5-ntsK74aOzdN2zVbow",  // Same as Android
  authDomain: "distrack-01.firebaseapp.com",
  projectId: "distrack-01",
  storageBucket: "distrack-01.firebasestorage.app",
  messagingSenderId: "588098710440",
  appId: "1:588098710440:web:XXXXXXXXXX"  // ← Different from Android
};
```

---

### **Step 2: Update Web App `.env` File**

Update your `.env` file with the **web app ID**:

```env
# Firebase Configuration for DisTrack Web App
VITE_FIREBASE_API_KEY=AIzaSyBSTP2TMTnVVBUY5-ntsK74aOzdN2zVbow
VITE_FIREBASE_AUTH_DOMAIN=distrack-01.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=distrack-01
VITE_FIREBASE_STORAGE_BUCKET=distrack-01.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=588098710440
VITE_FIREBASE_APP_ID=1:588098710440:web:XXXXXXXXXX  # ← Replace with your web app ID
```

⚠️ **Note:** The API key is the same for both platforms, but the `appId` is different.

---

### **Step 3: Enable Firebase Services** (10 minutes)

These services are shared by both web and Android:

#### **3.1 Enable Authentication**
1. Go to **Authentication** → **Get started**
2. Click **Sign-in method** tab
3. Enable **Email/Password**:
   - Toggle **Enable**
   - Click **Save**

#### **3.2 Create Firestore Database**
1. Go to **Firestore Database** → **Create database**
2. **Start in test mode** (we'll add security rules next)
3. **Location:** Choose based on your users:
   - India: `asia-south1` (Mumbai)
   - US: `us-central1`
4. Click **Enable**

#### **3.3 Set Firestore Security Rules**

Go to **Firestore** → **Rules** tab and replace with:

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

Click **Publish**

---

### **Step 4: Create Admin User** (5 minutes)

Create one admin user that works on **both platforms**:

1. **Firebase Console** → **Authentication** → **Users**
2. Click **Add user**
3. Enter:
   - Email: `admin@distrack.com`
   - Password: `admin123`
4. Click **Add user**
5. **Copy the UID**

6. Go to **Firestore Database**
7. Click **Start collection**
   - Collection ID: `users`
8. Add document:
   - **Document ID:** Paste the UID
   - **Fields:**
     ```
     id: <UID>
     email: admin@distrack.com
     fullName: Admin User
     role: admin
     isActive: true
     defaultLockInMonths: 3
     createdAt: <timestamp>
     ```
9. Click **Save**

✅ This admin can now login from **both web and Android**!

---

## 📱 Platform-Specific Configuration

### **Web App (React)**

**Location:** This codebase (`DisTrackAG/`)

**Configuration:** `.env` file (already created)

**Start:**
```bash
npm install
npm run dev
```

**Access:** `http://localhost:5173`

**Deploy:**
```bash
npm run build
firebase deploy --only hosting
```

---

### **Android App**

**Configuration:** `google-services.json`

You already have the Android app registered. Make sure your Android project has:

1. **`google-services.json`** in `app/` directory
2. **Firebase SDK** in `build.gradle`:
   ```gradle
   dependencies {
       implementation platform('com.google.firebase:firebase-bom:32.7.0')
       implementation 'com.google.firebase:firebase-auth'
       implementation 'com.google.firebase:firebase-firestore'
   }
   ```

3. **Same authentication logic** as web app
4. **Same Firestore queries** as web app

---

## 🔄 Data Synchronization

Since both apps share the same Firebase backend:

✅ **User creates lead on Android** → Appears on web immediately  
✅ **Admin approves lead on web** → Android user sees it instantly  
✅ **User updates lead on web** → Syncs to Android in real-time  
✅ **Same login works on both platforms**

**No additional sync needed** - Firebase handles it automatically!

---

## 🎯 Testing Multi-Platform Setup

### **Test 1: Cross-Platform Login**
1. Create user on web (admin panel)
2. Login with same credentials on Android
3. ✅ Should work on both

### **Test 2: Real-Time Sync**
1. Create lead on Android
2. Open web app
3. ✅ Lead should appear immediately

### **Test 3: Admin Approval**
1. Create lead on Android (status: PENDING)
2. Approve on web (admin)
3. Check Android
4. ✅ Status should change to LOCKED

### **Test 4: Updates Sync**
1. Add update to lead on web
2. Check Android
3. ✅ Update should appear in activity history

---

## 📊 Firestore Structure (Shared by Both)

Both web and Android use the same collections:

```
distrack-01 (Firestore)
├── users/
│   ├── <uid1> { email, fullName, role, ... }
│   └── <uid2> { email, fullName, role, ... }
├── leads/
│   ├── <leadId1> { schoolName, status, assignedToUserId, ... }
│   └── <leadId2> { schoolName, status, assignedToUserId, ... }
└── regions/
    ├── <regionId1> { name, createdAt }
    └── <regionId2> { name, createdAt }
```

**See `FIRESTORE_STRUCTURE.md` for complete schema.**

---

## 🔐 Security Considerations

### **Authentication**
- ✅ Same user accounts work on both platforms
- ✅ Tokens are platform-specific but validate the same user
- ✅ Role-based access works the same way

### **Firestore Rules**
- ✅ Same security rules apply to both web and Android
- ✅ Rules check user authentication, not platform
- ✅ Admin permissions work on both platforms

### **API Keys**
- ✅ API key is the same for both platforms
- ✅ App IDs are different (web vs Android)
- ✅ Both are safe to expose in client code

---

## 📱 Android App Development Notes

If you're building the Android app:

### **Recommended Architecture**
- **Language:** Kotlin (modern Android development)
- **UI:** Jetpack Compose (matches React's component model)
- **Architecture:** MVVM with Repository pattern
- **Firebase:** Firebase Android SDK

### **Key Components to Build**
1. **Authentication Screen** - Login/logout
2. **Dashboard** - Stats and charts
3. **Create Lead Form** - Same fields as web
4. **My Leads List** - RecyclerView/LazyColumn
5. **Lead Detail** - View and update leads
6. **General Pool** - Claim available leads

### **Shared Logic**
Both platforms should:
- Use same Firestore queries
- Follow same lead lifecycle (PENDING → LOCKED → POOL)
- Implement same validation rules
- Show same data structure

---

## 🚀 Deployment

### **Web App**
```bash
# Build
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Access at: https://distrack-01.web.app
```

### **Android App**
```bash
# Build APK
./gradlew assembleRelease

# Or upload to Google Play Store
```

---

## ✅ Setup Checklist

### **Firebase Backend (Shared)**
- [ ] Web app registered in Firebase Console
- [ ] Android app registered (already done ✅)
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Security rules published
- [ ] Admin user created
- [ ] Test regions created
- [ ] Test distributor users created

### **Web App**
- [ ] `.env` file configured with web app ID
- [ ] Dependencies installed (`npm install`)
- [ ] Dev server runs (`npm run dev`)
- [ ] Can login as admin
- [ ] All features tested

### **Android App**
- [ ] `google-services.json` in project
- [ ] Firebase SDK added to build.gradle
- [ ] Authentication implemented
- [ ] Firestore queries implemented
- [ ] Can login with same credentials as web
- [ ] Data syncs with web app

---

## 🎯 Development Workflow

### **Recommended Approach**

1. **Start with Web** (current status):
   - ✅ Web app is complete
   - ✅ All features implemented
   - Test thoroughly on web first

2. **Build Android** (next step):
   - Use web app as reference
   - Implement same features
   - Test cross-platform sync
   - Ensure data consistency

3. **Test Together**:
   - Create leads on both platforms
   - Verify real-time sync
   - Test admin approvals
   - Check user permissions

---

## 📞 Platform-Specific Resources

### **Web Development**
- This codebase (React + TypeScript)
- `TESTING_GUIDE.md` for web testing
- `REMAINING_TASKS.md` for features to add

### **Android Development**
- [Firebase Android Setup](https://firebase.google.com/docs/android/setup)
- [Firestore Android Guide](https://firebase.google.com/docs/firestore/quickstart#android)
- [Firebase Auth Android](https://firebase.google.com/docs/auth/android/start)
- [Jetpack Compose](https://developer.android.com/jetpack/compose) (recommended UI)

---

## 🎉 Summary

**What you have:**
- ✅ Android app registered in Firebase
- ✅ Complete web app codebase
- ✅ Shared Firebase backend ready to configure

**What you need to do:**
1. Register web app in Firebase Console (2 min)
2. Update `.env` with web app ID (1 min)
3. Enable Firebase services (10 min)
4. Create admin user (5 min)
5. Test web app (15 min)
6. Build Android app to match web features
7. Test cross-platform sync

**Both platforms will share the same data and users!** 🚀

---

*Last Updated: 2025-11-22*  
*Platforms: Web (React) + Android*
