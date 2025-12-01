# DisTrack - Remaining Development Tasks

## 🎯 Priority Tasks

### 1. **Contacted Date & Time Field** (Priority: HIGH)
**Location:** `src/pages/user/CreateLead.tsx`

**What to do:**
- Add a date-time picker field to the Create Lead form
- Store the contacted timestamp in the lead document
- Display it in the Lead Detail page

**Implementation:**
```tsx
// Install date picker library
npm install @mui/x-date-pickers dayjs

// Add to CreateLead.tsx
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

// Add to schema
contactedAt: z.date().optional(),

// Add to form
<LocalizationProvider dateAdapter={AdapterDayjs}>
  <Controller
    name="contactedAt"
    control={control}
    render={({ field }) => (
      <DateTimePicker
        label="Contacted Date & Time"
        value={field.value ? dayjs(field.value) : null}
        onChange={(newValue) => field.onChange(newValue?.toDate())}
        slotProps={{
          textField: {
            fullWidth: true,
            error: !!errors.contactedAt,
            helperText: errors.contactedAt?.message
          }
        }}
      />
    )}
  />
</LocalizationProvider>
```

**Update types:**
```typescript
// src/types/index.ts
export interface Lead {
  // ... existing fields
  contactedAt?: number; // Add this
}
```

---

### 2. **Centralized Error Handling** (Priority: HIGH)
**Location:** Create new `src/contexts/ErrorContext.tsx`

**What to do:**
- Create an Error Context to manage global errors
- Create an ErrorModal component to display errors
- Replace all `console.error()` calls with error context

**Implementation:**
```tsx
// src/contexts/ErrorContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

interface ErrorContextType {
  showError: (message: string, details?: string) => void;
}

const ErrorContext = createContext<ErrorContextType>({
  showError: () => {},
});

export const ErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [error, setError] = useState<{ message: string; details?: string } | null>(null);

  const showError = (message: string, details?: string) => {
    setError({ message, details });
  };

  const handleClose = () => {
    setError(null);
  };

  return (
    <ErrorContext.Provider value={{ showError }}>
      {children}
      <Dialog open={!!error} onClose={handleClose}>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <Typography>{error?.message}</Typography>
          {error?.details && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {error.details}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </ErrorContext.Provider>
  );
};

export const useError = () => useContext(ErrorContext);
```

**Usage:**
```tsx
// In any component
import { useError } from '../contexts/ErrorContext';

const { showError } = useError();

try {
  // ... some operation
} catch (err) {
  showError('Failed to create lead', err instanceof Error ? err.message : undefined);
}
```

---

### 3. **Fuzzy Duplicate Matching** (Priority: MEDIUM)
**Location:** `src/pages/admin/LeadApprovals.tsx`

**What to do:**
- When reviewing a lead, check for potential duplicates
- Show similar leads based on school name and address
- Use fuzzy string matching (Levenshtein distance)

**Implementation:**
```bash
# Install fuzzy matching library
npm install fuse.js
```

```tsx
// src/utils/fuzzyMatch.ts
import Fuse from 'fuse.js';
import { Lead } from '../types';

export const findSimilarLeads = (lead: Lead, allLeads: Lead[]): Lead[] => {
  const fuse = new Fuse(allLeads, {
    keys: ['schoolName', 'address'],
    threshold: 0.4, // 0 = exact match, 1 = match anything
  });

  const results = fuse.search(lead.schoolName);
  return results.map(r => r.item).slice(0, 5); // Top 5 matches
};
```

```tsx
// In LeadApprovals.tsx
import { findSimilarLeads } from '../../utils/fuzzyMatch';

const [similarLeads, setSimilarLeads] = useState<Lead[]>([]);

const handleActionClick = async (lead: Lead) => {
  setSelectedLead(lead);
  
  // Find similar leads
  const allLeads = await getAllLeads(); // You'll need to create this function
  const similar = findSimilarLeads(lead, allLeads);
  setSimilarLeads(similar);
  
  setOpen(true);
};

// In the dialog
{similarLeads.length > 0 && (
  <Alert severity="warning" sx={{ mt: 2 }}>
    <Typography variant="subtitle2">Potential Duplicates Found:</Typography>
    {similarLeads.map(sl => (
      <Typography key={sl.id} variant="body2">
        • {sl.schoolName} - {sl.address}
      </Typography>
    ))}
  </Alert>
)}
```

---

### 4. **Auto-Expiration Cloud Functions** (Priority: MEDIUM)
**Location:** Create `functions/` directory

**What to do:**
- Set up Firebase Cloud Functions
- Create a scheduled function to check for expired leads
- Move expired leads from LOCKED to POOL status

**Implementation:**
```bash
# Initialize Firebase Functions
firebase init functions

# Select TypeScript
# Install dependencies
```

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Run every hour
export const checkExpiredLeads = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = Date.now();

    // Find all LOCKED leads where lockedUntil has passed
    const expiredLeadsSnapshot = await db
      .collection('leads')
      .where('status', '==', 'LOCKED')
      .where('lockedUntil', '<=', now)
      .get();

    const batch = db.batch();

    expiredLeadsSnapshot.forEach((doc) => {
      batch.update(doc.ref, {
        status: 'POOL',
        assignedToUserId: null,
        assignedToName: null,
        lockedUntil: null,
        updates: admin.firestore.FieldValue.arrayUnion({
          status: 'Expired - Moved to Pool',
          remarks: 'Lead lock period expired automatically',
          timestamp: now,
          updatedBy: 'system'
        })
      });
    });

    await batch.commit();

    console.log(`Processed ${expiredLeadsSnapshot.size} expired leads`);
    return null;
  });
```

**Deploy:**
```bash
firebase deploy --only functions
```

---

### 5. **User Profile Editing** (Priority: LOW)
**Location:** Create `src/pages/user/Profile.tsx`

**What to do:**
- Create a profile page where users can edit their information
- Use the existing `updateUser` function from `userService.ts`
- Allow editing: Full Name, Email, Default Lock-in Period

**Implementation:**
```tsx
// src/pages/user/Profile.tsx
import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Grid } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { updateUser } from '../../services/userService';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  defaultLockInMonths: z.number().min(1).max(12),
});

type ProfileFormInputs = z.infer<typeof profileSchema>;

const Profile: React.FC = () => {
  const { userProfile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormInputs>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: userProfile?.fullName || '',
      defaultLockInMonths: userProfile?.defaultLockInMonths || 3,
    }
  });

  const onSubmit = async (data: ProfileFormInputs) => {
    if (!user) return;
    setLoading(true);
    try {
      await updateUser(user.uid, data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update profile', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>My Profile</Typography>
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Profile updated successfully!
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Email"
                fullWidth
                value={userProfile?.email}
                disabled
                helperText="Email cannot be changed"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Full Name"
                fullWidth
                {...register('fullName')}
                error={!!errors.fullName}
                helperText={errors.fullName?.message}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Default Lock-in Period (Months)"
                type="number"
                fullWidth
                {...register('defaultLockInMonths', { valueAsNumber: true })}
                error={!!errors.defaultLockInMonths}
                helperText={errors.defaultLockInMonths?.message}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Role"
                fullWidth
                value={userProfile?.role}
                disabled
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default Profile;
```

**Add route:**
```tsx
// In App.tsx
import Profile from './pages/user/Profile';

// Add to routes
<Route path="/user/profile" element={<Profile />} />
```

**Add to Sidebar:**
```tsx
// In Sidebar.tsx, add to user menu items
{ text: 'My Profile', icon: <PersonIcon />, path: '/user/profile' },
```

---

## 📋 Task Priority Summary

| Task | Priority | Estimated Time | Dependencies |
|------|----------|----------------|--------------|
| Contacted Date & Time | HIGH | 1-2 hours | MUI Date Pickers |
| Centralized Error Handling | HIGH | 2-3 hours | None |
| Fuzzy Duplicate Matching | MEDIUM | 2-3 hours | Fuse.js |
| Auto-Expiration Functions | MEDIUM | 3-4 hours | Firebase Functions |
| User Profile Editing | LOW | 1-2 hours | None |

---

## 🚀 Recommended Implementation Order

1. **Centralized Error Handling** - This will improve debugging for all other features
2. **Contacted Date & Time** - Quick win, important for lead tracking
3. **User Profile Editing** - Allows users to manage their settings
4. **Fuzzy Duplicate Matching** - Prevents duplicate leads
5. **Auto-Expiration Functions** - Requires Firebase Functions setup

---

## 📝 Additional Enhancements (Optional)

### Nice-to-Have Features:
- **Search & Filters** - Add search functionality to lead lists
- **Export to CSV** - Allow admins to export lead data
- **Email Notifications** - Notify users when leads expire or are approved
- **Lead Notes** - Add private notes to leads (visible only to owner)
- **Activity Dashboard** - Show recent activity across all users
- **Mobile App** - React Native version for field sales
- **Bulk Operations** - Approve/reject multiple leads at once
- **Advanced Analytics** - Conversion rates, time-to-close metrics
- **File Attachments** - Upload documents/images to leads
- **Lead Assignment** - Admin can manually assign leads to users

---

## 🔧 Code Quality Improvements

- [ ] Add unit tests (Jest + React Testing Library)
- [ ] Add integration tests for Firebase operations
- [ ] Implement proper error boundaries
- [ ] Add loading skeletons instead of spinners
- [ ] Optimize Firestore queries with indexes
- [ ] Add data caching with TanStack Query
- [ ] Implement optimistic UI updates
- [ ] Add accessibility (ARIA labels, keyboard navigation)
- [ ] Improve TypeScript strict mode compliance
- [ ] Add Storybook for component documentation

---

## 📚 Documentation Needed

- [ ] API documentation for services
- [ ] Component documentation
- [ ] Deployment guide
- [ ] User manual
- [ ] Admin guide
- [ ] Firestore security rules documentation
- [ ] Environment setup guide
- [ ] Contributing guidelines

---

## 🎓 Learning Resources

If you want to implement these features yourself:

**Date Pickers:**
- [MUI Date Pickers Docs](https://mui.com/x/react-date-pickers/getting-started/)

**Fuzzy Matching:**
- [Fuse.js Documentation](https://fusejs.io/)

**Firebase Functions:**
- [Firebase Functions Guide](https://firebase.google.com/docs/functions)
- [Scheduled Functions](https://firebase.google.com/docs/functions/schedule-functions)

**Error Handling:**
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Global Error Handling Patterns](https://kentcdodds.com/blog/use-react-error-boundary-to-handle-errors-in-react)
