# MeetNow Troubleshooting Guide

## Common Issues and Solutions

### Map Display Issues

#### Blank Map Screen

**Symptoms:**
- Empty white screen 
- No map tiles loading
- Console errors related to JSX or React components

**Possible Causes and Solutions:**

1. **JSX Structure Issues**
   - **Problem**: Mismatched opening/closing tags in JSX component structure
   - **Solution**: 
     - Check error messages in the browser console for specific line numbers
     - Ensure all JSX tags are properly paired and nested
     - Pay special attention to components with conditional rendering

2. **Map Container Not Rendering**
   - **Problem**: Conditional logic is preventing map from displaying
   - **Solution**:
     - Verify that `location` and `selectedLocation` state variables have valid values
     - Check that `isLocationLoading` is properly set to false after geolocation completes
     - Ensure MapContainer receives valid center coordinates

3. **Leaflet Library Issues**
   - **Problem**: Leaflet scripts or CSS not loading properly
   - **Solution**:
     - Verify that all required dependencies are installed
     - Check that Leaflet CSS is properly imported
     - Try clearing browser cache

### Location Services

#### Geolocation Not Working

**Symptoms:**
- App starts with default location (San Francisco)
- "Use My Location" button has no effect
- Error messages about location access

**Possible Causes and Solutions:**

1. **Browser Permissions**
   - **Problem**: Location access is blocked by browser 
   - **Solution**:
     - Check browser permissions for the site
     - Ensure the site is running in a secure context (HTTPS or localhost)
     - Re-prompt for location permission

2. **Geolocation Timeout**
   - **Problem**: Geolocation request takes too long
   - **Solution**:
     - Increase the timeout duration in the geolocation request
     - Check network connectivity
     - Try a different browser

3. **Mobile Device Issues**
   - **Problem**: Mobile devices may require different permission handling
   - **Solution**:
     - Ensure app is requesting high accuracy
     - Check device location services are enabled
     - Consider implementing a mobile-specific flow

#### Search Not Finding Locations

**Symptoms:**
- Search returns no results
- Error messages in console related to API requests
- Spinner continues indefinitely

**Possible Causes and Solutions:**

1. **API Limits**
   - **Problem**: Exceeding rate limits on geocoding service
   - **Solution**:
     - Implement proper debouncing on search input
     - Add appropriate rate-limiting at the application level
     - Consider using a different geocoding provider or your own proxy

2. **Search Query Formatting**
   - **Problem**: Malformed queries aren't returning expected results
   - **Solution**:
     - Ensure queries are properly trimmed and encoded
     - Add better validation for search input
     - Implement search suggestions for better query formation

### Navigation Mode Problems

#### Map Not Centering Properly

**Symptoms:**
- Map does not center on selected location when expected
- Focus doesn't properly update when selecting locations from search
- Inconsistent behavior when clicking the map

**Possible Causes and Solutions:**

1. **Controller Integration Issues**
   - **Problem**: MapNavigationController not properly integrated with React components
   - **Solution**:
     - Ensure MapClickHandlerWithController is included in the MapContainer
     - Verify that navigationController has been initialized before use
     - Check console logs to track controller initialization

2. **Map Reference Issues**
   - **Problem**: Map reference (mapRef) not properly set or accessed
   - **Solution**:
     - Ensure map reference is correctly captured in whenCreated
     - Verify that mapRef.current exists before trying to use it
     - Use the navigation controller for all map operations

3. **Coordinate Issues**
   - **Problem**: Invalid coordinates passed to map methods
   - **Solution**:
     - Add validation checks before using lat/lng values
     - Ensure coordinates are passed as numbers, not strings
     - Check for NaN or undefined values

### UI and Form Issues

#### Form Submission Problems

**Symptoms:**
- Enter key triggers form submission unexpectedly
- Loading animation appears on wrong elements
- Meetup creation happens when not intended

**Possible Causes and Solutions:**

1. **Default Form Behavior**
   - **Problem**: Form element submitting by default
   - **Solution**:
     - Add `e.preventDefault()` in submit handlers
     - Set form `onSubmit` handler to return false
     - Add `noValidate` attribute to form element

2. **Button Type Issues**
   - **Problem**: Buttons are submitting forms by default
   - **Solution**:
     - Explicitly set `type="button"` on all buttons that shouldn't submit
     - Use `type="submit"` only on the actual submission button
     - Verify event propagation is properly handled

#### State Management Issues

**Symptoms:**
- UI not updating when expected
- Components showing stale or incorrect data
- Inconsistent behavior between similar actions

**Possible Causes and Solutions:**

1. **State Update Sequencing**
   - **Problem**: State updates not happening in expected order
   - **Solution**:
     - Use useEffect with appropriate dependencies
     - Consider using useReducer for complex state transitions
     - Implement proper loading states

2. **Multiple Loading States**
   - **Problem**: Different loading indicators conflicting
   - **Solution**:
     - Use separate loading state variables for different operations
     - Properly reset loading states in finally blocks
     - Add timeouts to prevent indefinite loading states

### Performance Issues

#### Slow Map Rendering

**Symptoms:**
- Map is sluggish when panning/zooming
- Markers appear delayed
- UI becomes unresponsive

**Possible Causes and Solutions:**

1. **Too Many Markers**
   - **Problem**: Rendering many markers simultaneously
   - **Solution**:
     - Implement clustering for markers
     - Limit the number of visible markers
     - Optimize marker rendering (use simpler icons)

2. **Excessive Re-renders**
   - **Problem**: Components re-rendering too frequently
   - **Solution**:
     - Use React.memo for pure components
     - Implement shouldComponentUpdate carefully
     - Move expensive calculations outside render cycle

3. **Map Tile Loading**
   - **Problem**: Map tiles loading slowly
   - **Solution**:
     - Consider alternative tile providers
     - Implement tile caching
     - Reduce initial zoom level

### Image Storage Issues

#### Image Upload and Display Problems

**Symptoms:**
- Images fail to upload or display
- Broken image icons in meetup cards
- Network errors related to S3 or Wasabi URLs

**Possible Causes and Solutions:**

1. **Wasabi Connectivity Issues**
   - **Problem**: Connection to Wasabi storage failing
   - **Solution**: 
     - Check network connectivity to Wasabi endpoints
     - Verify environment variables are correctly configured
     - See detailed steps in [Wasabi Troubleshooting Guide](./WASABI_TROUBLESHOOTING.md)

2. **Pre-signed URL Problems**
   - **Problem**: Pre-signed URLs expire or are malformed
   - **Solution**:
     - Verify URL generation logic in wasabi-storage.js
     - Check expiration times for URLs
     - Implement URL refresh mechanism for long-lived pages

3. **CORS Configuration**
   - **Problem**: Cross-origin requests being blocked
   - **Solution**:
     - Update Wasabi bucket CORS settings
     - Ensure proper request headers are being sent
     - Configure the application to handle CORS preflight requests

For comprehensive troubleshooting of image storage issues, refer to the [Wasabi Image Storage Troubleshooting Guide](./WASABI_TROUBLESHOOTING.md).

## Debugging Techniques

### Console Logging Strategy

1. **Component Lifecycle**
   ```javascript
   useEffect(() => {
     console.log('Component mounted with location:', location);
     return () => console.log('Component unmounting');
   }, [location]);
   ```

2. **State Changes**
   ```javascript
   useEffect(() => {
     console.log('Navigation mode changed:', currentNavigationMode);
   }, [currentNavigationMode]);
   ```

3. **Event Handlers**
   ```javascript
   const handleClick = (e) => {
     console.log('Map clicked at:', e.latlng);
     // Rest of handler
   };
   ```

### Browser DevTools

1. **React DevTools**
   - Install React Developer Tools extension
   - Use Components tab to inspect component hierarchy
   - Monitor state and props changes

2. **Network Tab**
   - Monitor API requests to location services
   - Check for failed requests or rate limiting
   - Verify request/response payloads

3. **Application Tab**
   - Check local storage for persistence issues
   - Verify geolocation permissions
   - Clear site data for fresh testing

## Recovery Procedures

### Emergency Fixes

1. **Map Fails to Load**
   - Implement a reload button for users
   - Add a fallback static map view
   - Provide clear error messages

2. **Geolocation Denied**
   - Offer manual location entry
   - Provide default popular locations
   - Show clear instructions for enabling location

3. **API Service Outage**
   - Implement local caching of frequent queries
   - Provide offline mode with limited functionality
   - Add retry mechanisms with exponential backoff 

### Map Navigation and Debugging

#### Map Navigation Issues

**Symptoms:**
- Inconsistent map movements
- Multiple navigation operations conflicting
- Map jumping unpredictably when clicking multiple locations

**Possible Causes and Solutions:**

1. **Race Conditions in Navigation**
   - **Problem**: Multiple navigation requests executing simultaneously
   - **Solution**:
     - Use the MapNavigationController for all map navigation operations
     - Ensure operations are queued properly using controller methods
     ```javascript
     // Instead of directly calling map methods:
     // map.setView(center, zoom);  // Avoid this
     
     // Use the controller:
     navigationController.current.navigateTo({
       lat: center[0],
       lng: center[1]
     }, {
       zoom: zoom,
       animate: true
     });
     ```

2. **Map Instance References**
   - **Problem**: Different components using different map references
   - **Solution**:
     - Ensure map instance is consistently accessed
     - Check that MapNavigationController is initialized with the correct map instance
     - Use the debug console to verify active map operations

3. **Click Handling Issues**
   - **Problem**: Map clicks not properly processed by the controller
   - **Solution**:
     - Verify MapClickHandlerWithController is properly mounted in MapContainer
     - Check that the controller has onLocationSelect callback set
     - Use the DebugConsole to test click handling

#### Using Debug Tools

**Symptoms:**
- Difficulty identifying root cause of issues
- Unclear sequence of operations
- Inconsistent behavior between environments

**Solutions:**

1. **Enable Debug Console**
   - Access the debug console by adding `?debug=true` to the URL in development mode
   - Use the console to monitor state changes and map operations
   - Test navigation operations directly through the console interface

2. **Check Logger Output**
   - Review log history in the Debug Console
   - Filter logs by severity to focus on errors or warnings
   - Export logs when reporting issues
   ```javascript
   // To export logs programmatically:
   import Logger from './utils/Logger';
   const logs = Logger.getHistory();
   console.log(JSON.stringify(logs, null, 2));
   ```

3. **Run Tests to Isolate Issues**
   - Execute relevant test suites to identify regression issues:
   ```bash
   # Run all tests
   npm test
   
   # Run specific test file
   npm test -- MapNavigationController.test.js
   
   # Run end-to-end tests
   npm run cypress:open
   ```

### Testing Issues

#### Unit Tests Failing

**Symptoms:**
- CI pipeline failures
- Local test failures after new changes

**Possible Causes and Solutions:**

1. **Mock Configuration Issues**
   - **Problem**: Tests using incorrect mock implementations
   - **Solution**:
     - Verify mock setup in test files
     - Check that mock implementations match updated interfaces
     - Update snapshots if UI components have changed intentionally
     ```bash
     # Update snapshots
     npm test -- -u
     ```

2. **Async Test Timing**
   - **Problem**: Tests not properly waiting for async operations
   - **Solution**:
     - Use proper async/await patterns in tests
     - Add appropriate waits for component updates
     - Check for state updates before assertions

#### Cypress Tests Failing

**Symptoms:**
- End-to-end tests passing locally but failing in CI
- Inconsistent test results

**Possible Causes and Solutions:**

1. **Element Selection Issues**
   - **Problem**: Elements not found or timing issues
   - **Solution**:
     - Use more reliable selectors (data-testid attributes preferred)
     - Add proper waiting conditions
     ```javascript
     // Instead of:
     cy.get('.meetup-item').click();
     
     // Use:
     cy.get('[data-testid="meetup-item"]').should('be.visible').click();
     ```

2. **Map Interaction Flakiness**
   - **Problem**: Map tests inconsistent due to rendering or timing
   - **Solution**:
     - Mock map interactions when possible
     - Add explicit waits for map rendering
     - Use the MapNavigationController's completion callbacks
     ```javascript
     // In application code
     mapNavigationController.flyTo(location, zoom)
       .then(() => {
         // Operation completed successfully
       })
       .catch(error => {
         // Handle error
       });
     ```

### Navigation Controller Issues

#### Undefined Listeners or Callback Errors

**Symptoms:**
- Console errors like "undefined is not an object (evaluating 'callback')"
- Map not responding to location changes
- Map clicks not working properly
- Components not receiving notifications from navigation controller

**Possible Causes and Solutions:**

1. **Callback API Mismatches**
   - **Problem**: Missing or incorrect callback properties when initializing the controller
   - **Solution**:
     - Ensure all required callbacks are provided when initializing the controller
     - Use consistent callback naming following the controller's API
     - Check for typos in callback property names

2. **Component Integration Pattern Issues**
   - **Problem**: Components breaking the callback chain when multiple components subscribe to the same events
   - **Solution**:
     - Use the callback chaining pattern (store original callback, call it after your handler)
     - Always restore original callbacks during component cleanup
     - Avoid direct mutation of controller properties without proper chaining

3. **Map Reference Management**
   - **Problem**: Null or undefined map references causing navigation operations to fail
   - **Solution**:
     - Check if map is ready before attempting operations with `isReadyToNavigate()`
     - Use proper error handling for navigation operations
     - Add retry mechanisms for map registration if initially unsuccessful

#### Invalid Map Reference Warnings

**Symptoms:**
- Console warnings: `Invalid map reference, not a Leaflet map`
- Console warnings: `Could not extract valid map instance`
- Map works partially but navigation features fail
- Multiple initialization messages in console

**Possible Causes and Solutions:**

1. **Incorrect Map Reference Handling**
   - **Problem**: Passing React ref object instead of actual map instance
   - **Solution**:
     ```javascript
     // INCORRECT: Passing the React ref object
     navigationController.current.updateMapReference(mapRef);
     
     // CORRECT: Passing the actual map instance from whenReady callback
     navigationController.current.updateMapReference(mapInstance.target);
     ```
     - Ensure you're passing the actual Leaflet map instance to `updateMapReference`
     - Check that `whenCreated` and `handleMapReady` functions are using the right reference

2. **Multiple Initialization Attempts**
   - **Problem**: Map initialization happening from multiple sources
   - **Solution**:
     ```javascript
     // Track initialization state
     const mapInitialized = useRef(false);
     
     const handleMapReady = useCallback((map) => {
       // Guard against multiple initializations
       if (mapInitialized.current) {
         console.log('Map already initialized, skipping redundant initialization');
         return;
       }
       
       mapRef.current = map;
       setIsMapReady(true);
       mapInitialized.current = true;
       
       // Rest of initialization...
     }, [/* dependencies */]);
     ```
     - Add a guard flag to prevent multiple initializations
     - Consolidate initialization to a single source
     - Check duplicate event listeners that might trigger initialization

3. **Race Conditions During Initialization**
   - **Problem**: Map reference updates happening before controller is ready
   - **Solution**:
     - Initialize controller before trying to use it
     - Check that controller exists before updating references
     - Add sequential checks to ensure components initialize in the right order
     - Add guards for location updates when map is not initialized
See the dedicated [Navigation Controller documentation](NAVIGATION_CONTROLLER.md) for detailed implementation guidance. 