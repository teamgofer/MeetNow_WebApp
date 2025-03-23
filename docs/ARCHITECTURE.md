# MeetNow Technical Architecture

## Application Structure

### Core Components

The MeetNow application is built as a React single-page application with the following primary components:

1. **MeetNowApp (src/MeetNowApp.jsx)**
   - Main application container
   - Manages global state
   - Coordinates interactions between sub-components

2. **Map Components**
   - **MapContainer**: Main Leaflet map integration
   - **MapClickHandler**: Manages map click events and reverse geocoding
   - **MapViewControlBar**: Controls navigation modes
   - **MiniMapComponent**: Overview map in corner of screen

3. **UI Components**
   - Form elements for meetup creation
   - Search functionality
   - Navigation controls
   - Modals for user interactions

4. **Service/Utility Layer**
   - Location services
   - Meetup creation/fetching
   - Authentication services

## Data Flow

### State Management

The application uses React's native state management with useState hooks:

```jsx
// Primary state variables
const [location, setLocation] = useState({ lat: 37.7749, lng: -122.4194, display_name: 'San Francisco, CA' });
const [selectedLocation, setSelectedLocation] = useState({ lat: 37.7749, lng: -122.4194, display_name: 'San Francisco, CA' });
const [isLocationLoading, setIsLocationLoading] = useState(true);
const [currentNavigationMode, setCurrentNavigationMode] = useState(1);
```

Key state relationships:
- **Location**: User's physical position (blue marker)
- **SelectedLocation**: Point of interest/meetup location (red marker)
- **NavigationMode**: Controls map behavior and visualization mode

### Component Interaction

1. **Geolocation Flow**
   - Browser geolocation API → MeetNowApp → Location state → Map centering
   
2. **Map Interaction Flow**
   - Map click → MapClickHandler → Reverse geocoding → SelectedLocation state → UI updates
   
3. **Search Flow**
   - User input → searchLocations service → Search results → SelectedLocation update → Map centering

4. **Meetup Creation Flow**
   - Form input → Form submission → Meetup service → Refresh nearby meetups

## Key Technologies

### Frontend

- **React**: UI library
- **Leaflet/React-Leaflet**: Interactive maps
- **TailwindCSS**: Styling and UI components
- **React Icons**: Icon library

### Services

- **Geolocation API**: Browser's native geolocation
- **OpenStreetMap/Nominatim**: Map tiles and geocoding
- **Custom Backend**: Meetup data and user management
- **Supabase**: Database and authentication (see ./supabase directory)

## Map Implementation

### Leaflet Integration

The application extends React-Leaflet with custom behavior:

```jsx
<MapContainer
  key={mapKey.current}
  center={[selectedLocation.lat, selectedLocation.lng]}
  zoom={currentZoom}
  style={{ height: '100%', width: '100%' }}
  zoomControl={false}
  whenCreated={(map) => {
    mapRef.current = map;
    setIsMapReady(true);
  }}
>
  {/* Map layers and components */}
</MapContainer>
```

### Custom Map Behaviors

1. **Navigation Mode 1: Free Navigation**
   - Standard map interaction
   - Preserves zoom level on location change
   
2. **Navigation Mode 2: Bird's Eye View**
   - Shows both user location and selected location
   - Dynamically adjusts zoom to fit both points
   
3. **Navigation Mode 3: Vicinity Mode**
   - Focuses on user's location
   - Maintains high zoom level
   - Shows radius visualization

### Map References and Lifecycle

- **mapRef**: React reference to the Leaflet map instance
- **mapKey**: Forces map recreation when needed
- **isMapReady**: Tracks map initialization state

## Location Services

### Geocoding Functions

The application uses a service layer for location operations:

```javascript
// Search by text query
searchLocations(searchTerm)
  .then(results => {
    setSearchResults(results);
  });

// Reverse geocoding (coordinates to address)
searchLocations(null, { lat, lng })
  .then(results => {
    // Process location details
  });
```

### Data Structures

Location objects follow this pattern:

```javascript
{
  lat: Number,       // Latitude
  lng: Number,       // Longitude
  display_name: String, // Human-readable location name
  address: Object    // Optional detailed address components
}
```

## Error Handling

The application implements several layers of error handling:

1. **Component-level ErrorBoundary**
   - Catches rendering errors
   - Provides fallback UI
   
2. **Service-level try/catch**
   - Graceful handling of API failures
   - User-friendly error messages
   
3. **Fallback mechanisms**
   - Default locations when geolocation fails
   - Timeout handling for slow operations

## Performance Considerations

1. **Map Rendering**
   - Map recreation only when necessary (controlled by mapKey)
   - Conditional rendering of components
   
2. **Geocoding Operations**
   - Debounced search input
   - Loading indicators during operations
   
3. **Meetup Data**
   - Periodic refresh interval
   - Conditional fetching based on map state

## Security

1. **Authentication**
   - User management via Auth component
   - Role-based access (admin vs. regular users)
   
2. **Form Validation**
   - Input sanitization
   - Size limits on uploads
   
3. **Geolocation**
   - Requires user permission
   - Graceful fallbacks for denied access

## Future Architecture Considerations

1. **State Management Evolution**
   - Consider migration to Context API or Redux for more complex state
   - Extract key logic into custom hooks
   
2. **Performance Optimizations**
   - Implement virtualization for meetup lists
   - Optimize marker rendering for large datasets
   
3. **Code Organization**
   - Further component extraction
   - Enhanced separation of concerns
   - Comprehensive test coverage 

## Testing and Debugging Infrastructure

### MapNavigationController

The MapNavigationController provides a centralized solution for managing map navigation operations:

```javascript
// Sample usage of MapNavigationController
import MapNavigationController from './utils/MapNavigationController';

// Initialize with options including callback handlers
const controller = new MapNavigationController({
  onModeChange: (newMode, previousMode) => {
    Logger.info('Navigation mode changed:', newMode);
  },
  onReady: () => {
    Logger.info('Controller is ready for navigation');
  }
});

// Register map reference
controller.updateMapReference(mapRef);

// Use navigation methods
controller.navigateTo(latitude, longitude, zoom);
controller.showBirdsEyeView(userLocation, selectedLocation);
controller.showVicinityView(userLocation);
```

Key architectural benefits:
- **Operation Sequencing**: Ensures navigation operations execute in order
- **Error Resilience**: Provides graceful failure and recovery for map operations
- **Mode Compatibility**: Adapts navigation behavior based on current mode
- **Conflict Prevention**: Resolves race conditions between competing navigation requests
- **Callback Architecture**: Uses property-based callbacks with backward compatibility for listener arrays

The controller follows a publisher-subscriber pattern with these primary event types:
- `onModeChange`: Called when navigation mode changes
- `onLocationChange`: Called when user location is updated
- `onSelectedLocationChange`: Called when selected location is updated
- `onZoomChange`: Called when zoom level changes
- `onReady`: Called when the controller is ready for navigation operations

For detailed implementation and integration guidance, see the [Navigation Controller documentation](NAVIGATION_CONTROLLER.md).

### Logger Utility

The Logger utility offers structured logging capabilities:

```javascript
// Sample usage of Logger
import Logger from './utils/Logger';

// Log at different severity levels
Logger.debug('Initializing map component');
Logger.info('User location detected', { lat, lng });
Logger.warn('Slow network response detected');
Logger.error('Failed to load meetup data', error);

// Subscribe to log events
const unsubscribe = Logger.subscribe(logEvent => {
  console.log('New log:', logEvent);
});
```

Key features:
- **Severity Levels**: DEBUG, INFO, WARN, ERROR classifications
- **History Tracking**: Records recent operation history
- **Subscription API**: Allows real-time log event notifications
- **Export Capability**: Facilitates log sharing for troubleshooting

### Debug Console Component

The DebugConsole provides a real-time interface for application monitoring:

```jsx
// Sample implementation in main app
import DebugConsole from './components/DebugConsole';

function App() {
  // ... existing code ...
  
  return (
    <>
      {/* Main app components */}
      {process.env.NODE_ENV === 'development' && <DebugConsole />}
    </>
  );
}
```

Features:
- **App State Monitoring**: Shows current state values
- **Map Testing**: Provides shortcuts for navigation testing
- **Log Display**: Shows filtered log information
- **Toggle Control**: Can be hidden/shown during development

### Testing Architecture

The testing infrastructure is built on two primary frameworks:

1. **Unit Testing (Jest)**
   - Component-level tests focusing on isolated functionality
   - Mock implementation of external dependencies
   - Snapshot testing for UI components

2. **End-to-End Testing (Cypress)**
   - User flow simulation
   - API interaction verification
   - Visual testing of rendered components

Test organization follows the component structure with a parallel hierarchy in the `__tests__` directories. 