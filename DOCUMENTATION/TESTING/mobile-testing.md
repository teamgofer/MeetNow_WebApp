# Mobile Responsiveness Testing Guide

This document outlines strategies and test cases for validating mobile responsiveness in the MeetNow application.

## Testing Environment

### Device Matrix

Test on the following devices or their emulators:

| Device Type | Screen Size | Examples |
|-------------|-------------|----------|
| Small Phone | < 375px     | iPhone SE, Galaxy S10e |
| Medium Phone | 375px-414px | iPhone 13 Mini, Pixel 4a |
| Large Phone | 414px-576px | iPhone 14 Pro Max, Galaxy S23 Ultra |
| Small Tablet | 576px-768px | iPad Mini, Galaxy Tab A |
| Large Tablet | 768px-1024px | iPad Pro, Galaxy Tab S8 |

### Browsers to Test

- Safari on iOS 
- Chrome on Android
- Chrome on iOS
- Firefox on Android
- Samsung Internet

## Test Cases

### Bottom Sheet Component

1. **Dragging Behavior**
   - Drag the bottom sheet up and down
   - Verify it snaps to the defined snap points (60px, 40vh, 70vh)
   - Test resistance when trying to drag beyond limits

2. **Momentum Scrolling**
   - Swipe quickly up and down
   - Verify the sheet uses velocity to determine target snap point
   - Check that fast swipe up goes to higher snap point even if released below halfway

3. **Multi-touch Handling**
   - Begin dragging the sheet with one finger
   - Add a second finger during the drag
   - Verify the sheet handles this correctly without jumps

4. **Double-tap Detection**
   - Double-tap the sheet handle
   - Verify it toggles between collapsed and expanded states

5. **Content Scrolling**
   - When sheet is fully expanded, scroll content inside
   - Verify content scrolls without moving the sheet itself
   - Check scrolling momentum and bouncing

6. **Keyboard Interaction**
   - Tap a text input field inside the sheet
   - Verify the sheet adjusts when keyboard appears
   - Check that the focused input remains visible

### Responsive Layout

1. **Orientation Changes**
   - Rotate device between portrait and landscape
   - Verify layout adapts appropriately
   - Check that content remains accessible

2. **Breakpoint Transitions**
   - Resize browser window across breakpoints
   - Verify UI changes appropriately at each breakpoint
   - Check that touch targets remain adequately sized

3. **Safe Area Compliance**
   - Test on devices with notches and rounded corners
   - Verify content respects safe areas
   - Check that interactive elements are not placed in unsafe zones

### Touch Interactions

1. **Touch Target Size**
   - Verify all buttons and interactive elements are at least 44px × 44px
   - Test precise tapping on small adjacent controls

2. **Gesture Conflicts**
   - Test map panning while sheet is open
   - Verify gestures don't conflict or cause unexpected behavior
   - Check that map controls remain accessible

3. **Fast Interaction**
   - Rapidly tap different elements in sequence
   - Verify the UI keeps up without lag or missed interactions

### Performance

1. **Animation Smoothness**
   - Observe animation frame rate during transitions
   - Check for dropped frames using dev tools
   - Verify smooth scrolling on lower-end devices

2. **Touch Responsiveness**
   - Measure touch response time
   - Verify no perceptible lag between touch and response
   - Test under CPU load

### Accessibility

1. **Reduced Motion**
   - Enable reduced motion in device settings
   - Verify animations are disabled or simplified
   - Check that functionality remains accessible

2. **Screen Readers**
   - Test with VoiceOver (iOS) and TalkBack (Android)
   - Verify all interactive elements are properly announced
   - Check that bottom sheet states are communicated

## Testing Workflow

1. Run through all test cases on at least one device from each size category
2. Focus more detailed testing on the most common devices (iPhone 13/14, Samsung Galaxy S22/S23)
3. For each issue found:
   - Document the exact steps to reproduce
   - Note the device, OS version, and browser
   - Take screenshots or screen recordings
   - Test if the issue is specific to certain devices/browsers

## Common Issues to Watch For

- Touch events not properly cleaned up (memory leaks)
- Z-index conflicts causing elements to be inaccessible
- Layout shifts during orientation changes
- Safe area insets not properly applied
- Poor performance on slower devices
- Momentum/velocity calculations causing unexpected behavior
- Double-tap detection timing issues

## Automated Testing

Supplement manual testing with automated tests:

```javascript
// Example Jest test for useBreakpoint hook
it('returns correct breakpoint values', () => {
  // Mock window.innerWidth
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 400,
  });
  
  const { result } = renderHook(() => useBreakpoint());
  
  expect(result.current.breakpoint).toBe('xs');
  expect(result.current.isMobile).toBe(true);
  expect(result.current.isTablet).toBe(false);
  
  // Test breakpoint transition
  act(() => {
    window.innerWidth = 800;
    window.dispatchEvent(new Event('resize'));
  });
  
  expect(result.current.breakpoint).toBe('lg');
  expect(result.current.isMobile).toBe(false);
  expect(result.current.isTablet).toBe(true);
});
```

## Testing Tools

- Chrome DevTools Device Mode
- Safari Responsive Design Mode
- BrowserStack for real device testing
- React DevTools for component inspection
- Chrome DevTools Performance panel for frame rate analysis 