# Header Logo Update

## Changes Made

### Logo Files
1. **Square Logo** (`src/assets/g2m-logo.png`)
   - Used on: Login page & Mobile header
   - Size: 100px (login), 40px (mobile header)

2. **Horizontal Logo** (`src/assets/g2m-logo-horizontal.png`) ✨ **NEW**
   - Used on: Desktop header only
   - Size: 45px height
   - Includes full "g2M go2Market" branding with arrow

### Header Layout

**Desktop View (≥600px):**
```
[Horizontal g2M Logo]                    [User Name (Role)] [Account Icon]
```

**Mobile View (<600px):**
```
[Menu] [Square g2M Logo]                          [Account Icon]
```

### Removed
- ❌ "go2Market" text Typography removed from header
- Reason: The horizontal logo already contains the full branding

### Technical Details

**Responsive Breakpoints:**
- Desktop (`sm` and up): Shows horizontal logo
- Mobile (`xs`): Shows square logo

**Logo Heights:**
- Horizontal (desktop): 45px
- Square (mobile): 40px
- Square (login): 100px

## Benefits
- ✅ Professional horizontal logo on desktop
- ✅ Compact square logo on mobile (better fit)
- ✅ Cleaner header (no redundant text)
- ✅ Consistent branding across all screen sizes

## Files Modified
1. `src/components/layout/Header.tsx`
   - Imported both logos
   - Added responsive display logic
   - Removed redundant Typography
   - Added flexbox spacer for layout
