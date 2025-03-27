# MeetNow Mobile Responsiveness Guide

This guide covers the mobile responsiveness features implemented in the MeetNow application, including component behavior, touch event handling, and responsive design principles.

## Table of Contents

1. [Overview](#overview)
2. [Responsive Component System](#responsive-component-system)
3. [Bottom Sheet Component](#bottom-sheet-component)
4. [Breakpoint System](#breakpoint-system)
5. [Touch Event Handling](#touch-event-handling)
6. [CSS Variables and Safe Areas](#css-variables-and-safe-areas)
7. [Best Practices](#best-practices)

## Overview

The MeetNow application has been optimized for mobile devices with a comprehensive approach to responsiveness that includes:

- Enhanced touch event handling
- Standardized breakpoint system
- UI components with mobile-first behavior
- Safe area handling for notched devices
- Improved performance on resource-constrained devices

## Responsive Component System

### Key Features

- Components adapt to screen size and orientation automatically
- Touch targets meet accessibility guidelines (44px minimum)
- Improved scrolling and interaction on touch devices
- Reduced motion support for accessibility

### Example Usage

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

## Bottom Sheet Component

The `BottomSheet` component provides a mobile-optimized interface for displaying content from the bottom of the screen.

### Features

- Smooth touch-based interactions
- Momentum-based scrolling
- Snap points for defined positions
- Multi-touch gesture handling
- Double-tap detection
- Keyboard visibility adjustments

### Usage

```jsx
import BottomSheet from '../components/BottomSheet';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(true);
  
  return (
    <BottomSheet 
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      height="70vh"
    >
      <div data-component="InstantMeetup">
        {/* Instant meetup content */}
      </div>
      <div data-component="NearbyMeetups">
        {/* Nearby meetups content */}
      </div>
    </BottomSheet>
  );
}
```

### Snap Points

The Bottom Sheet supports snap points that determine where the sheet stops when dragged:

- Default: `['60px', '40vh', '70vh']` 
- These represent collapsed, mid-height, and full-height states

### Touch Interactions

- **Drag**: Pull up or down to resize the sheet
- **Swipe**: Fast swipe will use momentum to determine the target snap point
- **Double-tap**: Toggle between collapsed and expanded states

## Breakpoint System

We use a standardized breakpoint system implemented in CSS variables and JavaScript.

### Breakpoint Values

```
xxs: < 375px (Small phones)
xs: 375px - 414px (iPhone SE to iPhone 8 Plus)
sm: 414px - 576px (Large phones)
md: 576px - 768px (Small tablets)
lg: 768px - 1024px (Tablets)
xl: 1024px - 1536px (Small laptops)
2xl: ≥ 1536px (Large screens)
```

### Using the `useBreakpoint` Hook

The `useBreakpoint` hook provides access to responsive information:

```jsx
const {
  breakpoint,        // Current breakpoint (xxs, xs, sm, md, lg, xl, 2xl)
  isMobile,          // True if on mobile device (xxs, xs, or sm)
  isTablet,          // True if on tablet device (md or lg)
  isDesktop,         // True if on desktop device (xl or 2xl)
  orientation,       // 'portrait' or 'landscape'
  isTouchDevice,     // True if device has touch capability
  isAboveBreakpoint, // Function to check if above a given breakpoint
  isBelowBreakpoint, // Function to check if below a given breakpoint
  getResponsiveValue, // Function to get value based on breakpoint
  safeAreaInsets,    // Access to safe area insets
  prefersReducedMotion, // True if user prefers reduced motion
  breakpoints        // Actual pixel values of breakpoints
} = useBreakpoint();
```

## Touch Event Handling

Touch events are handled with attention to:

- Passive event listeners for better scrolling performance
- Velocity calculation for momentum effects
- Proper multi-touch detection
- Animation frame optimization
- Handling edge cases (multi-touch, keyboard appearance)

### Best Practices

```javascript
// Example of proper touch event handling
element.addEventListener('touchstart', handleTouchStart, { passive: true });
element.addEventListener('touchmove', handleTouchMove, { passive: false });
element.addEventListener('touchend', handleTouchEnd);

// Clean up properly
return () => {
  element.removeEventListener('touchstart', handleTouchStart);
  element.removeEventListener('touchmove', handleTouchMove);
  element.removeEventListener('touchend', handleTouchEnd);
};
```

## CSS Variables and Safe Areas

We use CSS variables for consistent styling and safe areas:

```css
:root {
  --safe-area-top: env(safe-area-inset-top, 0px);
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-left: env(safe-area-inset-left, 0px);
  --safe-area-right: env(safe-area-inset-right, 0px);
  --touch-target-size: 44px;
  --touch-target-size-small: 40px;
}
```

### Touch Targets

All interactive elements should use the touch target classes:

```html
<button class="touch-target">Click Me</button>
```

The `touch-target` class ensures elements are at least 44px × 44px (Apple's recommended minimum).

## Best Practices

When developing mobile-responsive features:

1. **Use the useBreakpoint hook** for responsive logic
2. **Utilize CSS variables** for consistent styling
3. **Test on actual devices** (not just browser emulation)
4. **Consider different orientations** (portrait and landscape)
5. **Optimize touch interactions** for better UX
6. **Respect safe areas** for notched devices
7. **Consider reduced motion** for accessibility
8. **Use proper touch event handling** with passive listeners when possible
9. **Test with different interaction methods** (touch, mouse, keyboard)
10. **Ensure adequate touch targets** (44px minimum) 