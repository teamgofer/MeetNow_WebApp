# MeetNow WebApp

A real-time local meetup platform.

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
Clone the repository and install dependencies:

```bash
git clone [repository-url]
cd MeetNow\ Webapp
npm install
```

### Development
Run the development server:

```bash
npm run dev
```

Visit http://localhost:3000 to view the application.

## Testing

### Jest Unit Tests
Run unit tests:

```bash
npm test
```

Run tests with coverage report:

```bash
npm run test:coverage
```

### Cypress End-to-End Tests

The project includes comprehensive Cypress tests for various components and functionalities.

#### Run all tests:
```bash
npm run cypress:run
```

#### Run specific test groups:
```bash
# All tests
npm run test:groups

# Basic application tests
npm run test:basic

# Map functionality tests
npm run test:map

# Debug console tests
npm run test:debug

# UI component tests
npm run test:ui
```

#### Open Cypress Test Runner:
```bash
npm run cypress
```

For detailed information about the Cypress tests, see:
- [Cypress README](./cypress/README.md)
- [Testing Summary](./cypress/TESTING_SUMMARY.md)

## Project Structure

- `/src` - Source code
- `/cypress` - Cypress tests
  - `/e2e` - End-to-end tests
  - `/fixtures` - Test data and fixtures
  - `/screenshots` - Screenshots captured during tests
- `/public` - Static assets

## Features

- Real-time map interaction
- Local meetup discovery
- User location services
- Debug console for development

## License

This project is licensed under the terms specified in the `LICENSE` file.

## Author

Arthur Maslo and Team Gofer

## Legal Notice

This software and all associated assets are proprietary and confidential.
Unauthorized copying, modification, distribution, or use of any files in this repository,
via any medium, is strictly prohibited.

## Branding

"MeetNow" and all associated branding elements are trademarks of Arthur Maslo and Team Gofer.
The use of these trademarks is strictly prohibited without express written permission.

## Ownership

This software is owned and maintained by:
- Arthur Maslo
- Team Gofer

## Contact

For licensing inquiries or permissions, please contact:
[Contact Information]

## Automated Testing

The MeetNow application includes automated tests to validate the functionality of the timezone handling and address geocoding features. These tests help ensure that meetup times are properly displayed in the correct local timezone and that addresses are properly geocoded and stored.

### Running the Tests

You can run the tests using the following commands:

#### Running JavaScript Tests Only

```bash
node test/test_runner.js
```

This will run all JavaScript tests, including:
- Timezone detection and formatting tests
- Address geocoding and handling tests

#### Running SQL Tests (Database Functions)

```bash
psql YOUR_CONNECTION_STRING -f test/db_function_tests.sql
```

This will run tests for database functions, including:
- Timezone function tests 
- Meetup creation and expiry calculation tests
- Credit system tests

#### Running All Tests

For convenience, you can run all tests with a single command:

```bash
./test/run_all_tests.sh
```

This script will:
1. Run JavaScript tests
2. Check if PostgreSQL is available
3. Prompt for database connection details if needed
4. Run SQL tests if requested
5. Display a summary of results

### Test Details

#### Timezone Tests

The timezone tests validate that:
- Coordinates are correctly mapped to IANA timezone strings
- Different regions (US, Mexico) are detected with correct timezones
- Invalid or unknown coordinates default to Pacific Time
- Time formatting functions work correctly
- Expiry time calculation based on duration is accurate

#### Address Geocoding Tests

The address geocoding tests validate that:
- Placeholder addresses are properly geocoded to real addresses
- Missing addresses are handled properly
- Geocoding failures fall back to coordinate-based location strings
- Valid addresses are preserved without modification

#### Database Function Tests

The SQL tests validate that:
- Database timezone functions return correct results
- Meetup creation stores proper timestamps
- Duration is correctly used to calculate expiry times
- Credit system functions work correctly

---

**CONFIDENTIAL AND PROPRIETARY**
This repository contains trade secrets and confidential information of Arthur Maslo and Team Gofer.
Access to and use of this code is strictly limited by the terms of your license agreement.

## Features

MeetNow offers a comprehensive set of features for location-based meetups:

### Map Navigation
- **Three Navigation Modes**: Free Navigation, Bird's Eye View, and Vicinity Mode
- **Distinct Location Markers**: Separate visual indicators for user location and selected points
- **Minimap Overview**: Quick access to spatial context between user and selected locations

### Meetup Creation
- **Instant Meetups**: Create 1-hour meetups that start immediately
- **Location Selection**: Choose meetup locations via map click or search
- **Rich Content**: Add titles, descriptions, and images to meetups

### Location Services
- **Automatic Geolocation**: Application centers on user's position at startup
- **Location Search**: Find places by name or address
- **Reverse Geocoding**: Click anywhere on the map to get the location name and address

### User Experience
- **Real-time Updates**: See nearby meetups as they're created
- **Responsive Design**: Works across desktop and mobile devices
- **Modern UI**: Glass-morphism styled components with dynamic loading indicators

## Documentation

For detailed information about the application architecture, components, and implementation details, please refer to the [handover documentation](./docs/HANDOVER.md).

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Testing Infrastructure

We've implemented a comprehensive testing infrastructure to ensure a stable codebase and easier debugging.

### Running Tests

```bash
# Run unit tests with Jest
npm test

# Run unit tests with watch mode (for development)
npm run test:watch

# Generate test coverage report
npm run test:coverage

# Run end-to-end tests with Cypress
npm run cypress

# Run end-to-end tests headlessly
npm run cypress:run

# Run both unit and E2E tests
npm run test:all
```

### Debugging Tools

The application includes several built-in debugging tools:

1. **Debug Console** - Available in development mode by clicking the "Debug" button in the bottom-left corner. It provides:
   - Real-time logging
   - Map navigation testing
   - State inspection
   - Log export functionality

2. **Logger Utility** - Available for use throughout the codebase:
   ```javascript
   import Logger from './utils/Logger';
   
   // Log levels: DEBUG, INFO, WARN, ERROR
   Logger.debug('ComponentName', 'Debug message', optionalData);
   Logger.info('ComponentName', 'Info message', optionalData);
   Logger.warn('ComponentName', 'Warning message', optionalData);
   Logger.error('ComponentName', 'Error message', optionalData);
   ```

3. **Map Navigation Controller** - Centralizes all map navigation operations:
   ```javascript
   import MapNavigationController from './utils/MapNavigationController';
   
   // Initialize with map reference
   const navigationController = new MapNavigationController(mapRef);
   
   // Navigate to location
   navigationController.navigateTo(location, {
     mode: 1, // 1=Free, 2=BirdEye, 3=Vicinity
     zoom: 15, // Optional
     resetMode: true, // Reset any special mode constraints
     animate: true // Whether to animate the transition
   });
   ```

## Troubleshooting Map Navigation

If experiencing map navigation issues:

1. Open the Debug Console and try the "Test Map Navigation" button
2. Check for errors in the console logs
3. Verify the MapNavigationController is properly initialized
4. If location clicks aren't working, ensure the map click handlers are properly connected
5. Check if the MapNavigationController queue is processing operations

## Contribution Guidelines

1. Write tests for new features
2. Use the Logger for meaningful error and debug information
3. Use the MapNavigationController for all map navigation operations
4. Run tests before submitting pull requests 