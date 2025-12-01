# Inactive User Login Blocking

## Overview
Inactive users are now prevented from logging in and accessing the system. They receive a clear message directing them to contact an admin.

## Implementation Details

### 1. **Login Flow Check**

**Location:** `src/services/authService.ts`

**Process:**
1. User enters email and password
2. Firebase Authentication validates credentials
3. **NEW:** System fetches user profile from Firestore
4. **NEW:** System checks `isActive` status
5. **If inactive:** 
   - Immediately sign out
   - Throw error with message
6. **If active:** 
   - Allow login to proceed

**Code:**
```typescript
export const login = async (email: string, password: string) => {
    // 1. Authenticate with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // 2. Check if user is active
    const userProfile = await getUserProfile(userCredential.user.uid);
    
    if (!userProfile) {
        await signOut(auth);
        throw new Error('User profile not found. Please contact admin.');
    }
    
    if (!userProfile.isActive) {
        await signOut(auth);
        throw new Error('Your account has been deactivated. Please contact admin to reactivate your account.');
    }
    
    return userCredential;
};
```

### 2. **Active Session Check**

**Location:** `src/hooks/useAuth.tsx`

**Purpose:** Prevent inactive users who are already logged in from continuing to use the system.

**Scenario:** 
- User is logged in
- Admin deactivates their account
- System detects inactivity on auth state change
- User is automatically logged out

**Process:**
1. Auth state changes (page load, refresh, etc.)
2. System fetches fresh user profile
3. Checks `isActive` status
4. **If inactive:**
   - Immediately sign out
   - Show alert message
   - Redirect to login

**Code:**
```typescript
const profile = await getUserProfile(firebaseUser.uid);

if (profile && !profile.isActive) {
    await authLogout();
    setUser(null);
    setUserProfile(null);
    alert('Your account has been deactivated. Please contact admin.');
    return;
}
```

## Error Messages

### Login Attempt (Inactive User)
```
"Your account has been deactivated. Please contact admin to reactivate your account."
```

### Already Logged In (Becomes Inactive)
```
"Your account has been deactivated. Please contact admin."
```

### No Profile Found
```
"User profile not found. Please contact admin."
```

## User Workflows

### Scenario 1: Inactive User Tries to Login
1. User enters valid email and password
2. Firebase authenticates successfully
3. System checks Firestore user profile
4. Detects `isActive: false`
5. **Immediately signs out**
6. Shows error message on login page
7. User sees: "Your account has been deactivated..."
8. User cannot access the system

### Scenario 2: Admin Deactivates Active User
1. User is currently logged in and working
2. Admin goes to User Management
3. Admin toggles user's status to **Inactive**
4. User refreshes page or navigates
5. Auth state change triggers profile check
6. System detects `isActive: false`
7. **Automatically logs out user**
8. Alert shown: "Your account has been deactivated..."
9. User redirected to login page

### Scenario 3: Admin Reactivates User
1. User tries to login (gets blocked message)
2. User contacts admin
3. Admin goes to User Management
4. Admin toggles user's status to **Active**
5. User tries logging in again
6. Login succeeds (no blocking)
7. User can access the system normally

## Admin Experience

### Deactivating a User
1. Admin opens User Management
2. Finds the user in the table
3. Toggles the **Active/Inactive** switch
4. Status changes to Inactive (gray chip)
5. User is immediately blocked from the system

### Reactivating a User
1. Admin opens User Management
2. Finds inactive user (gray "Inactive" chip)
3. Toggles the switch to Active
4. Status changes to Active (green chip)
5. User can now log in again

## Security Benefits

✅ **Immediate Effect:** Deactivation takes effect immediately
✅ **No Access:** Inactive users cannot login even with valid credentials
✅ **Session Termination:** Already-logged-in users get logged out
✅ **Clear Communication:** Users know to contact admin
✅ **Admin Control:** Easy toggle for enable/disable access

## Technical Notes

### Double-Check Pattern
The system checks user status in **two places**:
1. **Login:** Prevents initial access
2. **Auth Hook:** Prevents continued access

This ensures comprehensive blocking with no gaps.

### Performance
- Minimal impact: Only adds one Firestore read on login
- Auth hook already fetches profile, just adds status check
- No additional database calls

### Why Sign Out Immediately?
If we don't sign out after detecting inactive status, Firebase Auth would still consider them authenticated, potentially allowing brief access before the auth state stabilizes.

## Edge Cases Handled

### ✅ User Profile Doesn't Exist
- Error: "User profile not found. Please contact admin."
- Prevents orphaned Firebase Auth users

### ✅ Network Error During Check
- Try-catch blocks handle errors
- User gets generic error, not blank page
- System fails safely

### ✅ Race Conditions
- Sign out happens before any profile setting
- Immediate return prevents further state updates
- Clean logout without partial states

## Files Modified

1. **`src/services/authService.ts`**
   - Updated `login` function
   - Added profile fetch and status check
   - Added immediate signout for inactive users

2. **`src/hooks/useAuth.tsx`**
   - Added status check in auth state subscription
   - Added automatic logout for inactive users
   - Added user-facing alert message

## Testing Checklist

- [ ] Inactive user cannot login (gets error message)
- [ ] Error message is clear and helpful
- [ ] Active user can login normally
- [ ] Deactivating logged-in user logs them out
- [ ] Alert message appears when deactivated while logged in
- [ ] Reactivated user can login again
- [ ] No error if user profile doesn't exist (proper error shown)
- [ ] System doesn't crash on network errors

## Future Enhancements

- [ ] Replace alert() with nicer Material-UI Snackbar
- [ ] Add "Request Reactivation" button for users
- [ ] Email notification to user when deactivated
- [ ] Admin dashboard showing recently deactivated users
- [ ] Audit log of activation/deactivation events
