# Auto-Approval Feature for Leads

## Overview
Leads with **no duplicate matches** are now automatically approved and assigned to the creator, eliminating the need for admin approval in clean cases.

## How It Works

### 1. **Duplicate Check**
When a user creates a lead, the system checks for duplicates based on:
- School Name + ZIP Code (exact match)
- Phone Number (exact match)
- School Name only (similar match)

### 2. **Auto-Approval Logic**

**✅ Auto-Approved (No Duplicates)**
- **Match Type:** `none`
- **Status:** `LOCKED` (instead of `PENDING`)
- **Assigned To:** Creator (automatically)
- **Lock Period:** Based on creator's `defaultLockInMonths` (1, 3, or 6 months)
- **Locked Until:** Calculated timestamp (current date + lock months)

**⚠️ Requires Admin Approval (Similar Match)**
- **Match Type:** `similar`
- **Status:** `PENDING`
- **Behavior:** Shows warning dialog, user can proceed, but lead still requires admin approval

**🚫 Blocked (Exact/Phone Duplicate)**
- **Match Type:** `exact`
- **Behavior:** Creation blocked with error message

## Code Changes

### `src/services/leadService.ts`
- Added `CreateLeadOptions` interface with:
  - `autoApprove?: boolean`
  - `userFullName?: string`
  - `defaultLockInMonths?: 1 | 3 | 6`
- Updated `createLead` to accept options parameter
- Added logic to set status to `LOCKED` and auto-assign when `autoApprove` is true
- Calculate `lockedUntil` timestamp

### `src/pages/user/CreateLead.tsx`
- Added `userProfile` from `useAuth` hook
- Updated `createLeadWithData` to accept `autoApprove` parameter
- Pass auto-approval options when no duplicates are found
- Leads with no duplicates: `createLeadWithData(data, true)`
- Leads with similar matches (user confirms): `createLeadWithData(data, false)` (still requires admin approval)

## Benefits
- **⚡ Faster Workflow:** Clean leads are immediately available to work on
- **✅ Reduced Admin Load:** Admins only review potentially problematic leads
- **📊 Better User Experience:** Creators can start working immediately
- **🔒 Maintains Security:** Duplicate detection still prevents conflicts

## Example Flow

### Scenario 1: Clean Lead (No Duplicates)
1. User fills form and submits
2. System checks for duplicates → **none found**
3. Lead created with:
   - Status: `LOCKED`
   - Assigned to: Creator
   - Locked until: Current date + 3 months (example)
4. User immediately sees lead in "My Leads"

### Scenario 2: Similar Lead Found
1. User fills form and submits
2. System checks for duplicates → **similar match** (same school, different ZIP)
3. Warning dialog shown
4. User clicks "Proceed Anyway"
5. Lead created with:
   - Status: `PENDING`
   - Not assigned
   - Requires admin approval

### Scenario 3: Exact Duplicate
1. User fills form and submits
2. System checks for duplicates → **exact match**
3. Error shown: "A lead for 'ABC School' in ZIP code '123456' already exists!"
4. Lead creation blocked
