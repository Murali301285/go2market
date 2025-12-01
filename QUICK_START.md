# DisTrack - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Verify Environment Setup

Check that your `.env` file exists and has all Firebase credentials:

```bash
# .env file should contain:
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Step 2: Install Dependencies (if not already done)

```bash
npm install
```

### Step 3: Start Development Server

```bash
npm run dev
```

The app should open at `http://localhost:5173`

---

## 🔐 Create Your First Admin User

Since there's no signup page, you need to create the admin user manually:

### Option 1: Firebase Console (Recommended)

1. **Go to Firebase Console** → Your Project → Authentication
2. **Click "Add User"**
   - Email: `admin@distrack.com`
   - Password: `admin123` (or your choice)
3. **Copy the UID** that gets generated
4. **Go to Firestore Database** → Start Collection
   - Collection ID: `users`
5. **Add Document**
   - Document ID: Paste the UID you copied
   - Fields:
     ```
     id: <paste_UID_here>
     email: "admin@distrack.com"
     fullName: "Admin User"
     role: "admin"
     isActive: true
     defaultLockInMonths: 3
     createdAt: <use_current_timestamp>
     ```

### Option 2: Using Firebase CLI Script

Create a file `scripts/createAdmin.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Download from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function createAdmin() {
  const email = 'admin@distrack.com';
  const password = 'admin123';
  
  try {
    // Create auth user
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
    });
    
    // Create Firestore document
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      email: email,
      fullName: 'Admin User',
      role: 'admin',
      isActive: true,
      defaultLockInMonths: 3,
      createdAt: Date.now()
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('UID:', userRecord.uid);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  }
  
  process.exit();
}

createAdmin();
```

Run it:
```bash
node scripts/createAdmin.js
```

---

## 📝 Initial Setup Checklist

Once you can login as admin, complete these setup steps:

### 1. Create Regions
- [ ] Login as admin
- [ ] Go to "Regions" page
- [ ] Add regions (e.g., North, South, East, West)

### 2. Create Test Users
- [ ] Go to "Users" page
- [ ] Create 2-3 distributor users for testing
  - Email: `dist1@test.com`, Password: `test123`
  - Email: `dist2@test.com`, Password: `test123`

### 3. Test the Flow
- [ ] Logout from admin
- [ ] Login as distributor
- [ ] Create a test lead
- [ ] Logout and login as admin
- [ ] Approve the lead
- [ ] Login as distributor again
- [ ] Verify lead is now LOCKED
- [ ] Add an update to the lead

---

## 🎯 Quick Test Scenarios

### Scenario 1: Complete Lead Lifecycle (5 minutes)

1. **As Distributor:**
   - Create a lead for "ABC School"
   - Status should be "PENDING"

2. **As Admin:**
   - Go to Lead Approvals
   - Review and approve the lead

3. **As Distributor:**
   - Check "My Leads"
   - Lead should now be "LOCKED"
   - Add an update: "Demo scheduled"

4. **As Admin:**
   - Reject a different lead to pool

5. **As Different Distributor:**
   - Go to General Pool
   - Claim the rejected lead

### Scenario 2: User Management (3 minutes)

1. **As Admin:**
   - Create a new distributor user
   - Toggle their active status
   - Logout

2. **As New User:**
   - Try to login
   - Should work if active, fail if inactive

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot read properties of null"
**Fix:** Make sure you created the user document in Firestore with the correct UID

### Issue: "Permission denied" errors
**Fix:** Update Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /leads/{leadId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    
    match /regions/{regionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### Issue: "Firebase app not initialized"
**Fix:** Check that `.env` file is in the root directory and variables start with `VITE_`

### Issue: Development server won't start
**Fix:** 
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📊 What You Should See

### Admin Dashboard
- 4 stat cards showing counts
- Bar chart with leads by region
- Navigation menu with: Dashboard, Regions, Users, Lead Approvals

### Distributor Dashboard
- 4 stat cards (My Leads, Locked, Pending, Pool)
- Funnel chart showing lead progression
- Navigation menu with: Dashboard, Create Lead, My Leads, General Pool

---

## 🔍 Verify Everything Works

Run through this checklist:

- [ ] Can login as admin
- [ ] Can login as distributor
- [ ] Can create regions
- [ ] Can create users
- [ ] Can create leads
- [ ] Can approve/reject leads
- [ ] Can view lead details
- [ ] Can add updates to leads
- [ ] Can claim pool leads
- [ ] Dashboards show data
- [ ] No console errors
- [ ] Logout works

---

## 📱 Next Steps

Once basic testing is complete:

1. **Read `TESTING_GUIDE.md`** for comprehensive testing scenarios
2. **Review `REMAINING_TASKS.md`** for features to implement
3. **Check `FIRESTORE_STRUCTURE.md`** to understand data model
4. **Start implementing priority features** from REMAINING_TASKS.md

---

## 🆘 Need Help?

If you're stuck:

1. **Check browser console** for error messages
2. **Check Firebase Console** → Firestore for data
3. **Verify `.env` file** has correct values
4. **Check network tab** for failed requests
5. **Review the code** in the relevant service file

---

## 🎉 You're Ready!

If you can:
- ✅ Login as admin
- ✅ Create a region
- ✅ Create a user
- ✅ Login as that user
- ✅ Create a lead

**Congratulations! Your DisTrack app is working!** 🚀

Now you can:
- Test all features thoroughly (see TESTING_GUIDE.md)
- Implement remaining features (see REMAINING_TASKS.md)
- Deploy to production (see deployment guide below)

---

## 🌐 Deployment (Optional)

### Deploy to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize hosting
firebase init hosting

# Build the app
npm run build

# Deploy
firebase deploy --only hosting
```

Your app will be live at: `https://your-project.web.app`

---

## 📚 Documentation Files

- `README.md` - Project overview
- `TESTING_GUIDE.md` - Comprehensive testing instructions
- `REMAINING_TASKS.md` - Features to implement
- `QUICK_START.md` - This file (getting started)

---

**Happy coding! 🎨**
