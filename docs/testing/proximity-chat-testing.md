# Proximity Chat Feature Testing Documentation

## Overview

This document outlines the testing approach, test scenarios, and tools for ensuring the quality and reliability of the proximity-based chat feature in the MeetNow application. The proximity chat feature allows users to discover and communicate with other users who are physically nearby, creating spontaneous social interactions.

## Test Environments

### Local Development Environment
- **Mock Server**: Use the provided WebSocket mock server (`src/features/proximity-chat/services/mock-server.js`)
- **Mock Location Service**: For simulating various user locations without requiring physical movement
- **Browser DevTools**: For testing responsive design and mobile functionality

### Testing Environments
- **Development Environment**: Initial feature testing with mock data
- **Staging Environment**: Testing with real backend services
- **Production-like Environment**: Performance and load testing

### Real-world Testing
- **Field Tests**: Testing with actual devices in various physical locations
- **Beta Testing Group**: Limited user group testing in real-world scenarios

## Test Categories

### Unit Tests

Unit tests focus on testing individual components and services in isolation:

- **Location Service Tests** (`src/features/proximity-chat/tests/LocationService.test.js`)
  - Verify distance calculation algorithm accuracy
  - Test location caching functionality
  - Validate error handling for geolocation access
  - Test periodic location update mechanisms

- **Proximity Chat Context Tests**
  - Verify state management functionality
  - Test reducer actions and state transitions
  - Validate initialization and cleanup procedures

- **Service Layer Tests**
  - Test WebSocket connection handling
  - Verify message formatting and parsing
  - Test authentication token handling
  - Validate reconnection logic

### Integration Tests

Integration tests verify that components work correctly together:

- **Context Provider with UI Components**
  - Test data flow from context to components
  - Verify component re-rendering on state changes
  - Test event handling between components

- **WebSocket Service with Backend**
  - Verify correct message transmission
  - Test connection establishment and maintenance
  - Validate reconnection after disconnection
  - Test handling of server errors

### End-to-End Tests

End-to-end tests verify the complete user journey:

- **User Discovery Scenarios**
  - Verify users can see others within proximity radius
  - Test that users outside radius are not visible
  - Verify user list updates when new users enter radius
  - Test that users are removed when they leave radius

- **Messaging Functionality**
  - Verify message sending and receiving
  - Test message formatting and rendering
  - Verify typing indicators
  - Test message persistence within session

- **Location Change Scenarios**
  - Verify chat list updates when user changes location
  - Test distance calculation and updates
  - Verify graceful handling of rapid location changes

### Performance Tests

Performance tests ensure the feature works efficiently:

- **Connection Handling**
  - Measure connection establishment time
  - Test reconnection performance
  - Verify handling of network fluctuations

- **Message Throughput**
  - Test handling of high message volume
  - Measure message delivery latency
  - Verify performance with multiple active chats

- **Battery and Data Usage**
  - Measure battery impact of location tracking
  - Verify efficient data usage
  - Test background vs. foreground performance

### Security Tests

Security tests verify the protection of user data:

- **Location Privacy**
  - Verify location data is handled securely
  - Test privacy controls functionality
  - Verify location precision controls

- **Message Security**
  - Test message encryption
  - Verify message expiry functionality
  - Test against unauthorized access

- **Authentication**
  - Verify token-based authentication
  - Test against session hijacking
  - Verify proper session management

## Test Scenarios

### Basic Functionality

1. **User Discovery**
   - **Scenario**: User opens proximity chat feature
   - **Expected Result**: Nearby users (within defined radius) appear in the list
   - **Test Data**: Multiple test users at varying distances

2. **Sending Messages**
   - **Scenario**: User selects a nearby user and sends a message
   - **Expected Result**: Message is delivered to recipient
   - **Variations**: Text messages, media sharing (if supported)

3. **Receiving Messages**
   - **Scenario**: Another user sends a message
   - **Expected Result**: Message is received and displayed properly
   - **Variations**: Background app state, locked device

### Edge Cases

1. **Intermittent Connectivity**
   - **Scenario**: User loses internet connection temporarily
   - **Expected Result**: Reconnection attempt, message queue management
   - **Test Method**: Network throttling, connection interruption

2. **Geolocation Permission Denied**
   - **Scenario**: User denies location access
   - **Expected Result**: Appropriate error message, alternative options
   - **Test Method**: Simulated permission denial

3. **High User Density**
   - **Scenario**: Many users in close proximity
   - **Expected Result**: Efficient handling of many connections, clear UI presentation
   - **Test Method**: Simulated user density in mock environment

## Test Data

### Sample User Profiles
- **Regular Users**: Standard user accounts with various profile completeness
- **Anonymous Users**: Users with privacy settings enabled
- **Premium Users**: Accounts with enhanced features

### Location Sets
- **Urban Setting**: Closely spaced users in city environment
- **Suburban Setting**: Moderately spaced users
- **Rural Setting**: Widely spaced users
- **Event Setting**: Many users in very close proximity

## Test Tools and Utilities

### Mock WebSocket Server
The mock server (`src/features/proximity-chat/services/mock-server.js`) provides a controlled environment for testing WebSocket functionality without requiring a full backend deployment.

**Features**:
- Simulates user proximity and message relay based on location
- Configurable proximity radius and message expiry
- Supports all WebSocket message types used in the app
- Simulates network conditions and edge cases

**Usage**:
```javascript
// Starting the mock server
const mockServer = new ProximityChatMockServer({ 
  port: 8080, 
  proximityRadius: 200, // meters
  verbose: true 
});
mockServer.start();

// Generating a test auth token
const token = mockServer.generateAuthToken(
  { latitude: 34.052235, longitude: -118.243683 },
  'test-user-123'
);
```

### Location Simulator
For testing without requiring physical movement, use the location simulator:

```javascript
// Simulating user movement
import { LocationSimulator } from '../test-utils/LocationSimulator';

const simulator = new LocationSimulator({
  startPosition: { latitude: 34.052235, longitude: -118.243683 },
  movementPattern: 'random', // or 'linear', 'circular'
  speed: 5 // meters per second
});

simulator.start();
simulator.onLocationChange(location => {
  // Use simulated location in the app
});
```

## Testing Guidelines

### Location Testing
- Test with various precision levels (high accuracy GPS vs. approximate network-based)
- Verify behavior when location updates are infrequent
- Test behavior when location services are temporarily unavailable

### Performance Testing
- Test with simulated network throttling to verify behavior on slow connections
- Test battery usage in various scenarios (continuous chat, background mode)
- Verify memory usage remains stable during extended use

### UI/UX Testing
- Verify appropriate loading states are shown during location acquisition
- Test accessibility features (screen readers, keyboard navigation)
- Verify error messages are clear and actionable

## Test Automation

### Unit Test Automation
Unit tests should be automated using Jest and run on every code commit:

```bash
# Run all proximity chat unit tests
npm test -- --testPathPattern=src/features/proximity-chat

# Run specific test file
npm test -- LocationService.test.js
```

### Integration Test Automation
Integration tests should verify component interaction:

```javascript
// Example integration test for ProximityChatProvider with ProximityUserList
import { render, act } from '@testing-library/react';
import { ProximityChatProvider } from '../context/ProximityChatContext';
import ProximityUserList from '../components/ProximityUserList';

test('ProximityUserList should render users from context', async () => {
  // Implementation details...
});
```

### E2E Testing
End-to-end tests should be implemented using Cypress or a similar framework to test complete user flows.

## Test Reporting

All test results should be documented with:
- Test case executed
- Pass/fail status
- Environment details
- Any observed anomalies
- Performance metrics where applicable

For failed tests, include:
- Detailed error description
- Steps to reproduce
- Logs and screenshots
- Severity assessment

## Continuous Integration

Test automation should be integrated into the CI/CD pipeline:
- All unit and integration tests must pass before merging to main branches
- Performance benchmarks should be tracked over time
- Code coverage for the proximity chat feature should be maintained above 80%

## Test Schedule

- **Unit Tests**: Run on every commit
- **Integration Tests**: Run on every pull request
- **End-to-End Tests**: Run nightly
- **Performance Tests**: Run weekly
- **Manual Testing**: Before each significant release

## Bug Reporting Template

When reporting bugs in the proximity chat feature, use this template:

```
## Bug Description
[Clear description of the issue]

## Steps to Reproduce
1. [First step]
2. [Second step]
3. [...]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- Device: [e.g., iPhone 12, Samsung Galaxy S21]
- OS: [e.g., iOS 15.1, Android 12]
- Browser/App Version: [e.g., Chrome 96, App v2.3.1]
- Network conditions: [e.g., WiFi, 4G]
- Location accuracy: [e.g., GPS, network-based]

## Additional Information
[Logs, screenshots, videos, etc.]
```

## Test Completion Criteria

The proximity chat feature testing is considered complete when:

1. All unit tests pass with ≥90% code coverage
2. All integration tests pass
3. End-to-end tests verify all critical user journeys
4. Performance tests show acceptable results:
   - Connection establishment: <2 seconds
   - Message delivery: <500ms
   - Battery impact: <5% per hour of active use
5. No critical or high-severity bugs remain open
6. All security requirements are verified

## Responsible Team

- **Feature Lead**: [TBD]
- **QA Lead**: [TBD]
- **Developers**: [TBD]
- **UX Testers**: [TBD]

## References

- Proximity Chat Feature Requirements Document
- WebSocket API Documentation
- Location Services Documentation
- MeetNow General Testing Standards 