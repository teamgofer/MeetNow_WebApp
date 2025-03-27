# MeetNow Component Dependencies

This document outlines the component dependencies and relationships within the MeetNow application, with a focus on the components that have been updated during the restoration process.

## Core Components

### Updated Components

| Component | Path | Dependencies | Status |
|-----------|------|--------------|--------|
| `BottomSheet` | `src/components/BottomSheet.jsx` | None | ✅ Enhanced |
| `useBreakpoint` | `src/hooks/useBreakpoint.js` | None | ✅ Enhanced |
| `MobileContext` | `src/contexts/MobileContext.jsx` | None | ✅ Maintained |
| `withMobileResponsive` | `src/hocs/withMobileResponsive.jsx` | `MobileContext` | ✅ Maintained |

### Component Relationships

```
MobileContext (Provider)
    ↓
useBreakpoint (Hook)
    ↓
withMobileResponsive (HOC)
    ↓
MobileResponsiveComponent
```

## Mobile Responsiveness System

The mobile responsiveness system has been enhanced with a new standardized approach:

### Breakpoint System

The new standardized breakpoint system is implemented in both CSS and JavaScript:

```
xxs: < 375px (Small phones)
xs: 375px - 414px (iPhone SE to iPhone 8 Plus)
sm: 414px - 576px (Large phones)
md: 576px - 768px (Small tablets)
lg: 768px - 1024px (Tablets)
xl: 1024px - 1536px (Small laptops)
2xl: ≥ 1536px (Large screens)
```

### CSS Integration

```css
:root {
  --breakpoint-xs: 375px;
  --breakpoint-sm: 414px;
  --breakpoint-md: 576px;
  --breakpoint-lg: 768px;
  --breakpoint-xl: 1024px;
  --breakpoint-2xl: 1536px;
}
```

### JavaScript Integration

```javascript
// In useBreakpoint.js
const BREAKPOINTS = {
  xs: 375,  // iPhone SE
  sm: 414,  // iPhone 8 Plus
  md: 576,  // Small tablets
  lg: 768,  // Tablets
  xl: 1024, // Small laptops
  '2xl': 1536 // Large screens
};
```

## Component Enhancements

### Bottom Sheet Component

The `BottomSheet` component has been significantly enhanced with improved touch handling capabilities:

**New Features:**
- Momentum-based scrolling with velocity tracking
- Multi-touch detection and handling
- Double-tap gesture support
- Improved snap points with dynamic positioning
- Keyboard visibility adjustments
- Animation frame optimization

**Dependencies:**
- Uses React hooks only (`useState`, `useRef`, `useEffect`, `useCallback`)
- No external libraries required

### useBreakpoint Hook

The `useBreakpoint` hook has been enhanced to provide comprehensive responsive information:

**New Features:**
- Standardized breakpoint detection
- Device orientation detection
- Touch capability detection
- Safe area insets for notched devices
- Reduced motion preference detection
- Responsive value calculation

**Usage Pattern:**
```jsx
const {
  breakpoint,
  isMobile,
  isTablet,
  isDesktop,
  orientation,
  isTouchDevice,
  isAboveBreakpoint,
  isBelowBreakpoint,
  getResponsiveValue,
  safeAreaInsets,
  prefersReducedMotion
} = useBreakpoint();
```

## Deprecated Components and Functions

The following components and functions have been deprecated or replaced:

| Old Component/Function | Replacement | Notes |
|------------------------|-------------|-------|
| `MobileResponsive.jsx` | `useBreakpoint` hook | Use the hook directly for more control |
| Old breakpoint values in CSS | New standardized values | Update all breakpoint references to use the new system |
| Manual touch event handling | `BottomSheet` implementation | Reference the BottomSheet component for best practices |

## Integration Patterns

### Responsive Component Pattern

```jsx
import { useBreakpoint } from '../hooks/useBreakpoint';

function ResponsiveComponent() {
  const { isMobile, orientation, getResponsiveValue } = useBreakpoint();
  
  // Use responsive values based on breakpoint
  const padding = getResponsiveValue({
    xs: '8px',
    md: '16px',
    lg: '24px'
  });
  
  return (
    <div style={{ padding }}>
      {isMobile ? 'Mobile Layout' : 'Desktop Layout'}
      {orientation === 'portrait' ? 'Portrait Mode' : 'Landscape Mode'}
    </div>
  );
}
```

### Higher Order Component Pattern

```jsx
import { withMobileResponsive } from '../hocs/withMobileResponsive';

function MyComponent({ isMobile, isTablet }) {
  return (
    <div>
      {isMobile ? 'Mobile View' : isTablet ? 'Tablet View' : 'Desktop View'}
    </div>
  );
}

export default withMobileResponsive(MyComponent);
```

## Best Practices

1. Always use the `useBreakpoint` hook for breakpoint detection
2. Use CSS variables for consistent styling across components
3. Implement proper touch event handling with passive listeners when possible
4. Ensure adequate touch targets (44px minimum) for all interactive elements
5. Use the Bottom Sheet component as a reference for touch handling implementations
6. Test on actual devices (not just browser emulation) 