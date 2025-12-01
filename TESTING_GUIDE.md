# DisTrack Testing Guide

## Prerequisites

Before testing, ensure you have:
1. Firebase project set up with Authentication and Firestore enabled
2. Environment variables configured in `.env` file
3. Dependencies installed (`npm install`)
4. Development server running (`npm run dev`)

## Initial Setup

### 1. Create Admin User (First Time Only)

Since there's no signup page, you need to create the first admin user manually in Firebase:

**Option A: Using Firebase Console**
1. Go to Firebase Console → Authentication
2. Click "Add User"
3. Enter email and password
4. Copy the generated UID
5. Go to Firestore Database
6. Create a collection called `users`
7. Add a document with the UID as the document ID:
```json
{
  "id": "<UID>",
  "email": "admin@distrack.com",
  "fullName": "Admin User",
  "role": "admin",
  "isActive": true,
  "defaultLockInMonths": 3,
  "createdAt": <current_timestamp>
}
```

**Option B: Using Firebase CLI (if installed)**
```bash
# Install Firebase tools if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Use Firebase Admin SDK to create user (requires a Node.js script)
```

### 2. Create Test Regions

Once logged in as admin:
1. Navigate to "Regions" page
2. Add test regions:
   - North Zone
   - South Zone
   - East Zone
   - West Zone

### 3. Create Test Distributor Users

From the "Users" page:
1. Click "Add New User"
2. Create 2-3 test distributors:
   - Email: `distributor1@test.com`
   - Password: `test123`
   - Full Name: `John Distributor`
   - Role: `distributor`
   - Default Lock-in: `3` months

---

## Testing Scenarios

### 🔐 **Authentication Testing**

#### Test 1: Login Flow
1. Open `http://localhost:5173` (or your dev server URL)
2. Try logging in with invalid credentials → Should show error
3. Login with admin credentials → Should redirect to admin dashboard
4. Logout → Should redirect to login page
5. Login with distributor credentials → Should redirect to user dashboard

**Expected Results:**
- ✅ Invalid credentials show error message
- ✅ Admin sees admin dashboard with all menu items
- ✅ Distributor sees user dashboard with limited menu items
- ✅ Logout clears session and redirects to login

---

### 👨‍💼 **Admin Features Testing**

#### Test 2: Admin Dashboard
1. Login as admin
2. Navigate to Dashboard

**Expected Results:**
- ✅ See statistics cards (Total Leads, Pending Approvals, Active Users, Regions)
- ✅ See bar chart showing leads by region
- ✅ All data loads without errors

#### Test 3: Region Management
1. Navigate to "Regions" page
2. Add a new region: "Test Region"
3. Verify it appears in the list
4. Delete the region
5. Verify it's removed

**Expected Results:**
- ✅ New region appears immediately
- ✅ Delete removes region from list
- ✅ Regions appear in dropdown when creating leads

#### Test 4: User Management
1. Navigate to "Users" page
2. Click "Add New User"
3. Fill in all fields and submit
4. Verify new user appears in the list
5. Toggle the user's active status
6. Verify status changes

**Expected Results:**
- ✅ New user created successfully
- ✅ User appears in the list
- ✅ Active/Inactive toggle works
- ✅ New user can login with provided credentials

#### Test 5: Lead Approvals
1. Have a distributor create a lead (see Test 6)
2. Login as admin
3. Navigate to "Lead Approvals"
4. Click "Review" on a pending lead
5. Test both "Approve" and "Reject (To Pool)" actions

**Expected Results:**
- ✅ Pending leads appear in the list
- ✅ Review dialog shows all lead details
- ✅ Approve: Lead status changes to "LOCKED" and assigned to creator
- ✅ Reject: Lead status changes to "POOL" and available to all

---

### 👤 **Distributor Features Testing**

#### Test 6: Create Lead
1. Login as distributor
2. Navigate to "Create Lead"
3. Fill in all required fields:
   - School Name: "ABC International School"
   - Region: Select from dropdown
   - Address: "123 Main Street, City"
   - Contact Person: "Jane Principal"
   - Phone: "1234567890"
   - Email: "jane@abc.school" (optional)
   - Check "Is this a Chain School?" and enter chain name
   - Add remarks
4. Submit the form

**Expected Results:**
- ✅ Form validation works (required fields)
- ✅ Lead created successfully
- ✅ Redirected to "My Leads" page
- ✅ New lead appears with status "PENDING"

#### Test 7: My Leads
1. Navigate to "My Leads"
2. Verify your created leads appear
3. Click on a lead to view details

**Expected Results:**
- ✅ All user's leads are displayed
- ✅ Status chips show correct colors
- ✅ Can click to view lead details

#### Test 8: Lead Detail & Updates
1. From "My Leads", click on a LOCKED lead
2. Add an update:
   - Status: "Demo Scheduled"
   - Remarks: "Meeting set for next week"
3. Submit the update
4. Verify it appears in the Activity History

**Expected Results:**
- ✅ Lead details display correctly
- ✅ Can add updates to LOCKED leads
- ✅ Updates appear in chronological order
- ✅ Cannot edit leads owned by others

#### Test 9: General Pool
1. Have admin reject a lead to pool (Test 5)
2. Login as different distributor
3. Navigate to "General Pool"
4. Click "Claim" on an available lead
5. Verify lead moves to "My Leads"

**Expected Results:**
- ✅ Pool leads are visible to all distributors
- ✅ Claim button works
- ✅ Lead moves to claimer's "My Leads" with LOCKED status
- ✅ Lead disappears from General Pool

#### Test 10: User Dashboard
1. Navigate to Dashboard
2. Verify statistics are accurate
3. Check funnel chart displays correctly

**Expected Results:**
- ✅ Statistics match actual lead counts
- ✅ Funnel chart shows lead progression
- ✅ Data updates when leads change

---

## 🐛 **Edge Cases & Error Testing**

### Test 11: Permissions & Access Control
1. Login as distributor
2. Try to access admin routes directly:
   - `/admin/regions`
   - `/admin/users`
   - `/admin/approvals`

**Expected Results:**
- ✅ Redirected to user dashboard or access denied
- ✅ Admin menu items not visible to distributors

### Test 12: Lead Ownership
1. Login as Distributor A
2. Create a lead and get it approved
3. Login as Distributor B
4. Try to view Distributor A's lead detail page

**Expected Results:**
- ✅ Can view lead details
- ✅ Cannot add updates (no update form shown)
- ✅ Message indicates lead is owned by someone else

### Test 13: Form Validation
1. Try to create a lead with:
   - Empty school name
   - Invalid email format
   - Phone number less than 10 digits
   - No region selected

**Expected Results:**
- ✅ Form shows validation errors
- ✅ Cannot submit until all required fields are valid
- ✅ Error messages are clear and helpful

### Test 14: Expired Leads (Manual Test)
Since auto-expiration isn't implemented yet:
1. Create a lead and get it approved
2. Manually check Firestore
3. Verify `lockedUntil` timestamp is set correctly (3 months from approval)

**Expected Results:**
- ✅ `lockedUntil` field exists and is correct
- ⚠️ Lead doesn't auto-expire (feature pending)

---

## 📊 **Data Verification**

### Check Firestore Collections

After testing, verify data in Firebase Console:

**`users` collection:**
- Documents have correct structure
- Roles are set properly
- Active status is boolean

**`leads` collection:**
- All required fields are present
- Status values are valid: "PENDING", "LOCKED", "POOL"
- `updates` array contains update objects
- Timestamps are correct

**`regions` collection:**
- Region names are unique
- No orphaned regions

---

## 🔍 **Browser Console Checks**

While testing, monitor the browser console for:
- ❌ No error messages
- ❌ No failed network requests
- ❌ No warning messages (except expected ones)
- ✅ Successful Firebase operations logged

---

## 📱 **Responsive Testing**

Test the application on different screen sizes:
1. Desktop (1920x1080)
2. Tablet (768x1024)
3. Mobile (375x667)

**Expected Results:**
- ✅ Sidebar collapses to drawer on mobile
- ✅ Tables are scrollable on small screens
- ✅ Forms are usable on all devices
- ✅ No horizontal scrolling

---

## 🚀 **Performance Testing**

1. Create 50+ leads
2. Navigate between pages
3. Check load times

**Expected Results:**
- ✅ Pages load within 2 seconds
- ✅ No lag when switching routes
- ✅ Tables handle large datasets

---

## 📝 **Test Checklist**

Use this checklist to track your testing progress:

- [ ] Admin login works
- [ ] Distributor login works
- [ ] Admin can create regions
- [ ] Admin can create users
- [ ] Admin can approve leads
- [ ] Admin can reject leads to pool
- [ ] Distributor can create leads
- [ ] Distributor can view their leads
- [ ] Distributor can add updates to locked leads
- [ ] Distributor can claim pool leads
- [ ] Dashboards display correct data
- [ ] Form validations work
- [ ] Role-based access control works
- [ ] Logout works correctly
- [ ] Responsive design works on mobile
- [ ] No console errors during normal use

---

## 🆘 **Troubleshooting**

### Issue: "Cannot connect to Firebase"
- Check `.env` file has correct Firebase config
- Verify Firebase project is active
- Check browser console for specific errors

### Issue: "User not found after login"
- Verify user document exists in Firestore `users` collection
- Check document ID matches Firebase Auth UID
- Ensure `role` field is set correctly

### Issue: "Leads not appearing"
- Check Firestore security rules allow read/write
- Verify `createdBy` field matches user UID
- Check browser console for query errors

### Issue: "Cannot create user"
- Verify Firebase Authentication is enabled
- Check email format is valid
- Ensure password meets Firebase requirements (min 6 chars)

---

## 🎯 **Next Steps After Testing**

Once basic testing is complete, prioritize implementing:
1. **Contacted Date & Time field** in Create Lead form
2. **Centralized error handling** with modal dialogs
3. **Fuzzy duplicate matching** in lead approvals
4. **Auto-expiration Cloud Functions**
5. **User profile editing** UI

---

## 📞 **Support**

If you encounter issues during testing:
1. Check browser console for errors
2. Verify Firebase Console for data integrity
3. Review network tab for failed requests
4. Check this guide's troubleshooting section
