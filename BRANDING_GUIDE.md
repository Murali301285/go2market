# 🎨 Branding Assets Guide

## Logo & Icons

### Current Status:
The application uses Material-UI icons throughout. For custom branding:

### 1. Login Page Icon
**Location:** `src/pages/auth/Login.tsx`

**Recommendation:** Add a company logo above the login form.

**Implementation:**
```tsx
// Add to Login.tsx before the "Sign in to your account" text:
<Box sx={{ textAlign: 'center', mb: 3 }}>
    <BusinessIcon sx={{ fontSize: 60, color: 'primary.main' }} />
    <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold' }}>
        DisTrack
    </Typography>
</Box>
```

### 2. Header Logo
**Location:** `src/components/layout/Header.tsx`

**Recommendation:** Add logo/icon to the left side of the header.

**Implementation:**
```tsx
// Add to Header.tsx in the AppBar:
<BusinessIcon sx={{ mr: 1, fontSize: 28 }} />
<Typography variant="h6" noWrap component="div">
    DisTrack
</Typography>
```

### 3. Custom Logo Image (Optional)
If you have a custom logo image:

1. **Add image to:** `public/logo.png`
2. **Update Login.tsx:**
```tsx
<img src="/logo.png" alt="DisTrack Logo" style={{ width: 120, height: 'auto' }} />
```

3. **Update Header.tsx:**
```tsx
<img src="/logo.png" alt="DisTrack" style={{ height: 32 }} />
```

### 4. Favicon
**Location:** `public/favicon.ico`

Replace the default Vite favicon with your company favicon.

**Steps:**
1. Create a 32x32 or 64x64 icon
2. Save as `public/favicon.ico`
3. Update `index.html` if needed:
```html
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
```

### 5. App Title
**Location:** `index.html`

Update the page title:
```html
<title>DisTrack - Lead Management System</title>
```

---

## Color Scheme

Current theme colors (defined in `src/config/theme.ts`):
- **Primary:** Royal Blue (#2563eb)
- **Secondary:** Amber (#f59e0b)

To customize:
1. Edit `src/config/theme.ts`
2. Update primary/secondary colors
3. Restart dev server

---

## Quick Branding Checklist

- [ ] Add logo to login page
- [ ] Add logo to header
- [ ] Replace favicon
- [ ] Update page title
- [ ] Customize theme colors (optional)
- [ ] Add company name/tagline

---

**Note:** For now, I'll add basic Material-UI icons. You can replace with custom images later.
