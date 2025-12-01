# g2M Branding Update

## Logo Implementation

### New Logo
- **File:** `src/assets/g2m-logo.png`
- **Design:** g2M go2Market with rounded square blue background
- **Colors:** Deep royal blue with gradient and white text

### Usage Locations
1. **Login Page** (`src/pages/auth/Login.tsx`)
   - Large centered logo (100px height)
   - Subtitle: "go2Market - Lead Management System"

2. **Header** (`src/components/layout/Header.tsx`)
   - Small logo in top-left (40px height)
   - App name: "g2M"

## Color Scheme

### Primary Colors (Updated)
```typescript
primary: {
    main: '#2563eb',      // Royal Blue - Primary brand color
    light: '#60a5fa',     // Sky Blue - Hover states
    dark: '#1e40af',      // Navy Blue - Darker elements
    contrastText: '#ffffff' // White text on blue
}
```

### Secondary Colors (Unchanged)
```typescript
secondary: {
    main: '#f59e0b',      // Amber - Warnings/Alerts
    light: '#fbbf24',
    dark: '#d97706',
    contrastText: '#000000'
}
```

## Visual Changes

### Before
- Light teal theme (#95e1d3)
- Old circular school logo
- Generic branding

### After
- Deep royal blue theme (#2563eb) ✨
- Custom g2M square logo
- Professional go2Market branding

### Affected Components
- ✅ AppBar/Header - Blue background with white text
- ✅ Primary buttons - Blue with white text
- ✅ Links & active states - Blue
- ✅ Login page - g2M logo centered

## Brand Identity

**g2M** - go2Market
- **Mission:** Lead Management System for educational institutions
- **Colors:** Royal Blue (trust, professionalism) + Amber (alerts, action)
- **Style:** Modern, clean, professional

## Files Modified
1. `src/config/theme.ts` - Color scheme updated
2. `src/pages/auth/Login.tsx` - Logo and subtitle updated
3. `src/components/layout/Header.tsx` - Logo updated
4. `src/assets/g2m-logo.png` - New logo added

## Next Steps (Optional)
- [ ] Update favicon to g2M logo
- [ ] Add logo to footer
- [ ] Create loading screen with logo
- [ ] Design email templates with branding
