# ✅ Firebase Setup Checklist - Quick Version

## 🎯 Goal: Enable Firebase & Create Admin User

**Time needed: 15-20 minutes**

---

## 📍 Step 1: Authentication (5 min)

**Link:** https://console.firebase.google.com/project/distrack-01/authentication

- [ ] Click "Authentication" in sidebar
- [ ] Click "Get started" (if shown)
- [ ] Click "Sign-in method" tab
- [ ] Click "Email/Password"
- [ ] Toggle "Enable" to ON
- [ ] Click "Save"
- [ ] ✅ Verify: Shows "Enabled"

---

## 📍 Step 2: Firestore Database (5 min)

**Link:** https://console.firebase.google.com/project/distrack-01/firestore

- [ ] Click "Firestore Database" in sidebar
- [ ] Click "Create database"
- [ ] Select "Test mode"
- [ ] Click "Next"
- [ ] Choose location: `asia-south1` or `us-central1`
- [ ] Click "Enable"
- [ ] Wait for creation (30-60 sec)
- [ ] ✅ Verify: See Firestore dashboard

---

## 📍 Step 3: Security Rules (2 min)

**Still in Firestore:**

- [ ] Click "Rules" tab
- [ ] Delete all existing rules
- [ ] Copy rules from `FIREBASE_SETUP_STEPS.md` (Step 3.4)
- [ ] Paste into editor
- [ ] Click "Publish"
- [ ] Confirm "Publish" again
- [ ] ✅ Verify: Shows "Last updated: just now"

---

## 📍 Step 4: Create Admin in Auth (2 min)

**Link:** https://console.firebase.google.com/project/distrack-01/authentication/users

- [ ] Click "Authentication" → "Users" tab
- [ ] Click "Add user"
- [ ] Email: `admin@distrack.com`
- [ ] Password: `admin123`
- [ ] Click "Add user"
- [ ] **COPY THE UID** (important!)
- [ ] ✅ Verify: See admin@distrack.com in list

---

## 📍 Step 5: Create Admin in Firestore (5 min)

**Link:** https://console.firebase.google.com/project/distrack-01/firestore/data

- [ ] Click "Firestore Database" → "Data" tab
- [ ] Click "Start collection"
- [ ] Collection ID: `users`
- [ ] Click "Next"
- [ ] Document ID: **Paste the UID**
- [ ] Add 7 fields (click "Add field" for each):

```
id               string    <paste_UID>
email            string    admin@distrack.com
fullName         string    Admin User
role             string    admin
isActive         boolean   true
defaultLockInMonths  number    3
createdAt        number    1732267408000
```

- [ ] Click "Save"
- [ ] ✅ Verify: See `users` collection with 1 document

---

## 📍 Step 6: Test Login (1 min)

**Link:** http://localhost:5173

- [ ] Open http://localhost:5173
- [ ] Email: `admin@distrack.com`
- [ ] Password: `admin123`
- [ ] Click "Sign In"
- [ ] ✅ Success: See Admin Dashboard
- [ ] ✅ Success: See menu items (Regions, Users, etc.)
- [ ] ✅ Success: No console errors (F12)

---

## 🎉 Done!

If all checkboxes are ✅, you're ready to use DisTrack!

**Next:**
- Create regions (North, South, East, West)
- Create test distributor users
- Test creating leads
- Follow `TESTING_GUIDE.md`

---

## ⚠️ Common Issues

**Login fails:**
- Check UID matches in Auth and Firestore
- Check `role` field is string "admin"
- Check all 7 fields exist in Firestore

**Blank page after login:**
- Open console (F12) and check for errors
- Verify user document has all required fields

**"Permission denied":**
- Verify security rules are published
- Check user document exists in Firestore

---

## 📞 Quick Links

- **Firebase Console:** https://console.firebase.google.com/project/distrack-01
- **Detailed Guide:** `FIREBASE_SETUP_STEPS.md`
- **App:** http://localhost:5173

---

**Print this checklist and check off items as you complete them!** ✅
