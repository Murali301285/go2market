# ✅ Firebase Web App - Configuration Complete!

## 🎉 Status: Web App Configured

Your `.env` file has been updated with the correct Firebase web app configuration:

```
Project: distrack-01
Web App ID: 1:588098710440:web:e5ec312184d22c31b08b9d
API Key: AIzaSyBSZz59d4DXxx_RNAZUuVAlRNFCQMCvBTk
```

---

## 🚀 Next Steps to Get Running

### **Step 1: Enable Firebase Services** (10 minutes)

You still need to enable these services in Firebase Console:

#### **1.1 Enable Authentication**
1. Go to [Firebase Console](https://console.firebase.google.com/project/distrack-01)
2. Click **Authentication** → **Get started**
3. Click **Sign-in method** tab
4. Click **Email/Password**
5. Toggle **Enable** → Click **Save**

#### **1.2 Create Firestore Database**
1. Click **Firestore Database** → **Create database**
2. Choose **Start in test mode**
3. Select location: **asia-south1 (Mumbai)** or **us-central1**
4. Click **Enable**

#### **1.3 Set Security Rules**
1. Go to **Firestore Database** → **Rules** tab
2. Replace with these rules:

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

3. Click **Publish**

---

### **Step 2: Create Admin User** (5 minutes)

#### **2.1 Create in Authentication**
1. Go to **Authentication** → **Users** tab
2. Click **Add user**
3. Enter:
   - Email: `admin@distrack.com`
   - Password: `admin123`
4. Click **Add user**
5. **COPY THE UID** (you'll need it next!)

#### **2.2 Create in Firestore**
1. Go to **Firestore Database**
2. Click **Start collection**
   - Collection ID: `users`
   - Click **Next**
3. Add document:
   - **Document ID:** Paste the UID you copied
   - Click **Add field** for each:

| Field Name | Type | Value |
|------------|------|-------|
| `id` | string | `<paste_the_UID>` |
| `email` | string | `admin@distrack.com` |
| `fullName` | string | `Admin User` |
| `role` | string | `admin` |
| `isActive` | boolean | `true` |
| `defaultLockInMonths` | number | `3` |
| `createdAt` | number | `1732267650000` (or current timestamp) |

4. Click **Save**

---

### **Step 3: Start the App** (2 minutes)

```bash
# Install dependencies (if not done)
npm install

# Start development server
npm run dev
```

The app will open at: **http://localhost:5173**

---

### **Step 4: Login and Test** (5 minutes)

1. **Login:**
   - Email: `admin@distrack.com`
   - Password: `admin123`

2. **You should see:**
   - ✅ Admin Dashboard
   - ✅ Menu: Dashboard, Regions, Users, Lead Approvals
   - ✅ No errors in browser console

3. **Create test data:**
   - Go to **Regions** → Add regions (North, South, East, West)
   - Go to **Users** → Create test distributors

---

## 🎯 Quick Test Checklist

After completing the steps above:

- [ ] Firebase Authentication is enabled
- [ ] Firestore Database is created
- [ ] Security rules are published
- [ ] Admin user exists in Authentication
- [ ] Admin user document exists in Firestore
- [ ] `npm run dev` starts without errors
- [ ] Can access http://localhost:5173
- [ ] Can login as admin
- [ ] See admin dashboard
- [ ] No console errors

---

## 🐛 Troubleshooting

### **Error: "Firebase: Error (auth/invalid-api-key)"**
✅ **Fixed!** Your `.env` file is now correct.

### **Error: "Firebase: Error (auth/user-not-found)"**
→ Make sure you created the user in **Step 2.1**

### **Error: "Missing or insufficient permissions"**
→ Make sure you:
1. Published Firestore security rules (**Step 1.3**)
2. Created user document in Firestore (**Step 2.2**)

### **Error: "Cannot read properties of null (reading 'role')"**
→ The user document in Firestore must have the `role` field set to `"admin"`

### **Dev server won't start**
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📊 What Happens Next

Once you complete the steps above:

1. **Web app is fully functional** ✅
2. **You can test all features** (see `TESTING_GUIDE.md`)
3. **Android app can use same backend** (same users, same data)
4. **Both platforms sync in real-time** 🔄

---

## 🎉 You're Almost There!

**Configuration:** ✅ DONE  
**Firebase Services:** ⚠️ Need to enable (10 min)  
**Admin User:** ⚠️ Need to create (5 min)  
**Testing:** ⚠️ Ready after above steps

**Total time to get running: ~20 minutes**

---

## 📞 Quick Links

- **Firebase Console:** https://console.firebase.google.com/project/distrack-01
- **Authentication:** https://console.firebase.google.com/project/distrack-01/authentication
- **Firestore:** https://console.firebase.google.com/project/distrack-01/firestore

---

## 📚 Documentation

- `FIREBASE_SETUP.md` - Detailed setup guide
- `SETUP_CHECKLIST.md` - Step-by-step checklist
- `TESTING_GUIDE.md` - How to test features
- `QUICK_START.md` - Quick start guide

---

**Follow the steps above and you'll be testing the app in 20 minutes!** 🚀
