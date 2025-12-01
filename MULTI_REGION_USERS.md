# Multi-Region Assignment for Users

## Overview
Users can now be assigned to multiple regions, controlling their access to leads and data within the system.

## Implementation Details

### 1. **Data Model Changes**

**Updated User Interface:**
```typescript
export interface User {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    defaultLockInMonths: 1 | 3 | 6;
    assignedRegions: string[]; // NEW: Array of region IDs
    isActive: boolean;
    createdAt: number;
}
```

### 2. **Access Control Rules**

#### For All Users:
- ✅ **Must have at least 1 region assigned** (enforced in form validation)
- ✅ **Can only see leads from assigned regions**
- ✅ **Can only create leads in assigned regions**
- ⛔ **No regions assigned = Blocked from viewing/creating leads**

#### Role-Specific Defaults:
- **Admin:** Defaults to **all regions** when created
- **Distributor:** Defaults to **all regions** when created (can be changed)
- **User:** Defaults to **all regions** when created (can be changed)

### 3. **User Management UI**

**Location:** `/admin/users`

**Multi-Select Region Field:**
- Component: Material-UI `Autocomplete` with `multiple` prop
- Displays regions as colored chips
- Required field (minimum 1 region)
- Shows all available active regions

**Table Display:**
- New "Regions" column added
- Shows assigned regions as primary-colored chips
- Shows "No Regions" error chip if none assigned
- Chips wrap to multiple lines if needed

### 4. **Form Behavior**

**Creating New User:**
1. Admin clicks "Add User"
2. Form opens with **all regions pre-selected** by default
3. Admin can remove/change regions as needed
4. At least 1 region must be selected to save

**Editing Existing User:**
1. Admin clicks edit on existing user
2. Form loads with user's current assigned regions
3. Admin can add/remove regions
4. Changes saved on submit

### 5. **Visual Design**

**Region Chips in Form:**
- **Color:** Primary blue
- **Size:** Small
- **Removable:** Yes (click X to remove)
- **Display:** Wrapped chips if multiple

**Region Chips in Table:**
- **Color:** Primary blue (outlined)
- **Size:** Small
- **Layout:** Flex wrap (multiple rows if needed)
- **Error State:** Red "No Regions" chip

## User Workflow Examples

### Example 1: Creating Distributor for North Region
1. Admin creates new distributor
2. All regions are pre-selected
3. Admin deselects all except "North India"
4. User saved
5. Distributor can now:
   - See only North India leads
   - Create leads only in North India
   - Dashboard shows only North India stats

### Example 2: Multi-Region Manager
1. Admin creates user for 3 regions:
   - "North India"
   - "South India"
   - "East India"
2. User can:
   - See leads from all 3 regions
   - Create leads in any of the 3 regions
   - Filter/sort across all 3 regions

### Example 3: Admin with All Regions
1. Admin user created
2. Default: All 5 regions assigned
3. Admin can:
   - See all leads system-wide
   - Manage all regions
   - Access complete analytics

## Backend Integration Points

### Services to Update (Future):

**1. Lead Queries** (To Do):
```typescript
// Filter leads by user's assigned regions
const getLeadsForUser = async (userId: string) => {
    const userProfile = await getUserProfile(userId);
    
    if (userProfile.assignedRegions.length === 0) {
        return []; // Blocked - no leads
    }
    
    // Only fetch leads from assigned regions
    const query = query(
        collection(db, 'leads'),
        where('regionId', 'in', userProfile.assignedRegions)
    );
    // ...
};
```

**2. Create Lead Form** (To Do):
```typescript
// Filter available regions in dropdown
const availableRegions = allRegions.filter(region => 
    userProfile.assignedRegions.includes(region.id)
);
```

**3. Dashboard Stats** (To Do):
```typescript
// Calculate stats only from assigned regions
const getStatsForUser = (leads, userProfile) => {
    const filteredLeads = leads.filter(lead =>
        userProfile.assignedRegions.includes(lead.regionId)
    );
    // Calculate stats from filteredLeads
};
```

## Migration Considerations

### For Existing Users:
Since we've made `assignedRegions` required, existing users in the database will have issues. You need to:

**Option 1: Database Migration Script**
```typescript
// Run once to update existing users
const migrateUsers = async () => {
    const users = await getUsers();
    const allRegionIds = (await getRegions()).map(r => r.id);
    
    for (const user of users) {
        if (!user.assignedRegions) {
            // Assign all regions to existing users
            await updateUser(user.id, {
                assignedRegions: allRegionIds
            });
        }
    }
};
```

**Option 2: Manual Admin Assignment**
- Admin logs in
- Edits each existing user
- Assigns appropriate regions
- Saves changes

## Security Considerations

- ✅ Region validation happens in form (Zod schema)
- ✅ Backend should also validate region IDs exist
- ✅ Prevent users from accessing leads outside their regions
- ⚠️ **TO DO**: Firestore security rules to enforce region access

## Files Modified

1. **`src/types/index.ts`**
   - Added `assignedRegions: string[]` to User interface

2. **`src/pages/admin/Users.tsx`**
   - Added region state and fetching
   - Updated schema with `assignedRegions` validation
   - Added Autocomplete multi-select field
   - Added Regions column to table
   - Updated create/edit handlers  
   - Updated save logic to include regions

## Next Steps

- [ ] Update lead query services to filter by assigned regions
- [ ] Update CreateLead to filter region dropdown
- [ ] Update Dashboard to show stats from assigned regions only
- [ ] Add Firestore security rules for region-based access
- [ ] Migrate existing users to have assigned regions
- [ ] Add "Region Access" section in user profile view
- [ ] Consider region-based role permissions
