# Color Palette Update Summary

## New Brand Colors

- **Text**: `#1d283a` (dark blue-gray)
- **Background**: `#f8fafc` (light gray-blue)
- **Primary**: `#384252` (medium gray)
- **Secondary**: `#066046` (dark green)
- **Accent**: `#267a54` (medium green)

## Files Updated

### 1. Global Theme (`src/app/globals.css`)

- Updated CSS variables for light and dark themes
- Mapped hex colors to HSL values for Tailwind compatibility

### 2. Layout Backgrounds

- `src/app/(main)/layout.tsx` - Changed from gray gradient to `bg-background`
- `src/app/public/layout.tsx` - Updated to use `bg-background`

### 3. Dashboard (`src/app/(main)/page.tsx`)

- Hero gradient: `from-primary to-accent`
- Stats cards: Updated text colors to `text-foreground` and `text-foreground/70`
- Icons/badges: `primary/10`, `secondary/10`, `accent/10` backgrounds
- CTAs: `bg-primary hover:bg-accent`, `bg-secondary hover:bg-accent`

### 4. Sidebar (`src/components/HiringSidebar.tsx`)

- Active items: `bg-primary/10 text-primary border-l-4 border-primary`
- Hover: `hover:bg-gray-100` (light grey)
- Logo: `bg-primary` with `text-primary`
- Quick Actions: Updated gradients and button styles

### 5. Settings Navigation (`src/components/settings/SettingsNavigation.tsx`)

- Active tabs: `bg-primary/10 text-primary border-l-4 border-primary`
- Hover: `hover:bg-primary/5 hover:text-primary`

### 6. User Avatar (`src/components/auth/UserDropdown.tsx`)

- Avatar background: `bg-[#066046]` (exact dark green)
- Focus ring: `focus:ring-secondary`

### 7. Dashboard Button (`src/app/(main)/dashboard/page.tsx`)

- Create Job button: `bg-[#066046] hover:bg-accent`

## Key Changes

- Replaced multi-hue accent system with focused green/teal brand palette
- Maintained semantic color roles (primary, secondary, accent)
- Updated hover states for consistency
- Preserved accessibility with proper contrast ratios
- All changes compile cleanly with no new lint errors
