# Bulk Lead Upload Feature

## Overview
The Bulk Upload feature allows admins to upload multiple leads at once using an Excel file. The system automatically verifies school details with Google Places, checks for duplicates, and assigns leads to users.

## Excel File Format
The Excel file (.xlsx) must have the following columns in order (headers are skipped, data starts from row 2):

| Column | Field Name | Description |
|--------|------------|-------------|
| A | Contact Person | Name of the contact person at the school |
| B | School Name | Name of the school (used for Google Search) |
| C | Designation | Designation of the contact person |
| D | Incharge Person | Full Name or Email of the user to assign the lead to |

**Example:**
| Contact Person | School Name | Designation | Incharge Person |
|----------------|-------------|-------------|-----------------|
| John Doe | ABC International School | Principal | Murali Krishna |
| Jane Smith | XYZ Public School | Vice Principal | admin@example.com |

## Features

### 1. Automatic Verification
- **User Lookup:** Matches "Incharge Person" with existing system users.
- **Google Places:** Searches for the school name on Google Maps to fetch:
  - Validated School Name
  - Full Address
  - Zip Code
  - Landmark (if available)

### 2. Region Assignment Logic
- **Single Region User:** Automatically assigns their region.
- **Multi-Region User:** Defaults to their first assigned region, but marks the row for review.
- **No Region User:** Flags as error.

### 3. Duplicate Detection
- Checks if a lead with the same **School Name** and **Zip Code** already exists.
- **New Leads:** If existing lead is in 'NEW' stage, it will be updated.
- **Processed Leads:** If existing lead is 'LOCKED' or 'CONVERTED', it is skipped.

### 4. Status Indicators
- 🟢 **VERIFIED:** Ready for upload.
- 🔵 **UPLOADED:** Successfully saved to database.
- 🔴 **ERROR / NO MATCH:** Needs attention.
- 🟠 **DUPLICATE:** Lead already exists.
- 🟡 **MULTIPLE MATCHES:** Multiple schools found on Google (manual selection needed - currently defaults to first).

## How to Use
1. **Prepare Excel:** Create an .xlsx file with the required columns.
2. **Upload:** Go to **Bulk Upload** in the admin menu and select your file.
3. **Review:** Wait for processing. Review the table for any errors or warnings.
   - Use the **Edit** (pencil) icon to fix missing data or change regions.
   - Use the **Delete** (trash) icon to remove invalid rows.
4. **Upload All:** Click "Upload All Valid" to save the leads to the system.
5. **Result:** A summary will show how many leads were created/updated and how many failed.

## Technical Details
- **Library:** `xlsx` for parsing, `Google Places API` for verification.
- **Rate Limiting:** Includes artificial delays to prevent hitting Google API rate limits.
- **Audit:** Adds a remark to each lead with upload timestamp and uploader details.
