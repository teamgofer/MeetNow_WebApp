# Proximity Chat Testing Plan

This document outlines the comprehensive testing strategy for the proximity-based chat feature of the MeetNow application. It provides a structured approach to ensure that all feature requirements are met and that the implementation is robust, scalable, and user-friendly.

## Testing Objectives

1. Verify that all functional requirements of the proximity chat feature are met
2. Ensure the feature works reliably across different devices and network conditions
3. Validate that privacy controls function as expected
4. Confirm real-time performance meets acceptable thresholds
5. Test integration with other MeetNow features
6. Verify security mechanisms protect user data

## Testing Environments

### Development Environment
- Local development servers
- Mocked WebSocket service
- Simulated geolocation data
- Local database instances

### Testing Environment
- Staging servers with full backend integration
- Test user accounts
- Controlled geographic test areas
- Various device profiles

### Production-Like Environment
- Pre-production servers with production configuration
- Load testing infrastructure
- Real device testing
- Multiple geographic regions

## Testing Methodology

### 1. Unit Testing

Unit tests will focus on individual components and services to ensure they function correctly in isolation.

#### LocationService Tests
- Test distance calculation accuracy
- Verify location update detection thresholds
- Test error handling for geolocation permissions
- Validate coordinate transformation methods

#### WebSocketService Tests
- Test connection establishment and authentication
- Verify reconnection logic with exponential backoff
- Test message queuing during disconnection periods
- Validate event handler registration/deregistration

#### MessageService Tests
- Test API endpoint interactions
- Verify message formatting and validation
- Test error handling for network failures
- Validate message history retrieval and pagination

#### ProximityChatContext Tests
- Test state updates with reducer
- Verify context value propagation
- Test effect cleanup on unmount
- Validate integration with services

### 2. Integration Testing

Integration tests will verify the correct interaction between components and services.

#### Service Integration
- Test WebSocket and Location services working together
- Verify context updates when services emit events
- Test UI component updates based on context changes
- Validate end-to-end message flow

#### API Integration
- Test authentication token acquisition
- Verify WebSocket connection with valid tokens
- Test message persistence and retrieval
- Validate user presence and status updates

### 3. End-to-End Testing

E2E tests will validate the complete user journey and feature functionality.

#### User Discovery Scenarios
- Users can see others within specified radius
- User count updates when people enter/leave proximity
- Radius setting changes affect visible users
- Anonymous mode hides appropriate user details

#### Messaging Scenarios
- Messages reach only users in proximity
- Messages persist when returning to an area
- Read receipts function correctly
- Typing indicators appear and disappear appropriately

#### Privacy Scenarios
- Blocked users cannot see messages
- Location precision settings work correctly
- Anonymous mode masks identity properly
- Users can opt out of location sharing

#### Performance Scenarios
- Feature performs well with many nearby users
- Message delivery maintains low latency
- Battery usage remains reasonable
- Application handles network transitions gracefully

### 4. Mock Server Testing

A dedicated mock server will be used to simulate various scenarios without requiring physical location changes.

```javascript
// Example mock server setup
const mockProximityChatServer = {
  start() {
    // Initialize WebSocket server
    this.wss = new WebSocket.Server({ port: 8080 });
    
    // Set up connection handler
    this.wss.on('connection', this.handleConnection.bind(this));
    
    // Initialize in-memory storage
    this.connectedUsers = new Map();
    this.messages = [];
    
    console.log('Mock proximity chat server running on port 8080');
  },
  
  handleConnection(ws, req) {
    // Process connection and set up message handlers
    // ...
  },
  
  // Other methods for handling messages, user locations, etc.
};
```

### 5. Manual Testing

A structured manual testing approach will complement automated tests to verify user experience aspects.

#### Test Scripts

Each tester will follow detailed test scripts covering:

1. User onboarding and permission granting
2. Discovering nearby users
3. Sending and receiving messages
4. Changing proximity settings
5. Testing privacy controls
6. Background/foreground app transitions
7. Network condition variations

#### Exploratory Testing

Guided exploratory testing sessions will help identify edge cases and usability issues not covered by scripted tests.

### 6. Performance Testing

Dedicated performance testing will ensure the feature scales appropriately.

#### Load Testing
- Simulate high user density in specific regions
- Test message throughput capacity
- Measure database query performance
- Evaluate WebSocket connection limits

#### Battery Usage Analysis
- Measure impact of location tracking
- Compare different location precision settings
- Benchmark against industry standards
- Optimize refresh intervals

## Test Data

### User Profiles
- Standard users with full permissions
- Users with partial permissions (location only when in use)
- Users with no location permissions
- Users with varying privacy settings

### Location Data
- Urban dense environments (many nearby users)
- Suburban environments (fewer users, larger distances)
- Rural environments (sparse user distribution)
- Edge cases (international date line, poles, etc.)

### Network Conditions
- Strong WiFi connection
- 4G/5G cellular connection
- Weak/intermittent connection
- Transition between connection types

## Requirements Traceability Matrix

| Requirement | Unit Tests | Integration Tests | E2E Tests | Manual Tests |
|-------------|------------|-------------------|-----------|--------------|
| Real-time messaging | MessageService.sendMessage | WebSocket message broadcast | Message delivery between users | Chat functionality |
| Location-based discovery | LocationService.calculateDistance | getNearbyUsers integration | Proximity detection | Radius setting tests |
| Privacy controls | ChatSettings validation | Anonymous mode integration | Privacy settings flow | Identity masking |
| Typing indicators | Typing status methods | Typing broadcast integration | Multi-user typing scenarios | Typing indicator UI |
| Message persistence | Message storage tests | History retrieval integration | Message history reload | Region revisit tests |
| User blocking | Block/unblock methods | Blocked message filtering | Block user flow | Blocked user visibility |
| WebSocket reliability | Reconnection logic | Connection state management | Network transition handling | Connection loss tests |
| Battery optimization | Location update thresholds | Background mode integration | Extended usage patterns | Battery consumption |

## Test Cases

### Unit Test Examples

```javascript
// LocationService test cases
describe('LocationService', () => {
  test('calculateDistance returns correct distance between two points', () => {
    const service = new LocationService();
    const distance = service.calculateDistance(
      34.052235, -118.243683, // Los Angeles
      37.773972, -122.431297  // San Francisco
    );
    expect(distance).toBeCloseTo(559280, -2); // ~559km with 100m precision
  });
  
  test('_shouldUpdateLocation returns true when distance exceeds threshold', () => {
    const service = new LocationService();
    service.lastLocation = { latitude: 34.052235, longitude: -118.243683 };
    service.minDistanceThreshold = 10; // 10 meters
    
    // Location ~15 meters away
    const newLocation = { latitude: 34.052370, longitude: -118.243683 };
    
    expect(service._shouldUpdateLocation(newLocation)).toBe(true);
  });
});
```

### Integration Test Examples

```javascript
// WebSocketService and LocationService integration
describe('WebSocketService with LocationService', () => {
  let webSocketService;
  let locationService;
  
  beforeEach(() => {
    webSocketService = new WebSocketService();
    locationService = new LocationService();
    
    // Mock WebSocket implementation
    global.WebSocket = MockWebSocket;
  });
  
  test('should update location via WebSocket when location changes', async () => {
    // Setup spy to track WebSocket messages
    const sendSpy = jest.spyOn(webSocketService, '_sendPayload');
    
    // Connect to WebSocket
    await webSocketService.connect(
      { latitude: 34.052235, longitude: -118.243683 },
      { sessionId: 'test_session' }
    );
    
    // Update location
    await locationService.getCurrentLocation();
    
    // Verify location update was sent
    expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'location_update',
      data: expect.objectContaining({
        latitude: expect.any(Number),
        longitude: expect.any(Number)
      })
    }));
  });
});
```

### E2E Test Examples

```javascript
// Proximity message delivery
describe('Proximity Chat E2E', () => {
  let userA;
  let userB;
  let userC;
  
  beforeAll(async () => {
    // Setup test users with simulated locations
    userA = await setupTestUser({
      location: { latitude: 34.052235, longitude: -118.243683 },
      sessionId: 'user_a'
    });
    
    userB = await setupTestUser({
      location: { latitude: 34.052240, longitude: -118.243690 }, // ~10m from A
      sessionId: 'user_b'
    });
    
    userC = await setupTestUser({
      location: { latitude: 34.053235, longitude: -118.244683 }, // ~150m from A
      sessionId: 'user_c'
    });
    
    // Connect all users
    await Promise.all([
      userA.connect(),
      userB.connect(),
      userC.connect()
    ]);
  });
  
  test('message should be received by users within radius but not outside', async () => {
    // User A sends a message
    const message = "Hello nearby!";
    await userA.sendMessage(message);
    
    // Wait for message propagation
    await sleep(500);
    
    // User B (nearby) should receive the message
    expect(userB.receivedMessages).toContainEqual(
      expect.objectContaining({
        content: message,
        sessionId: 'user_a'
      })
    );
    
    // User C (far away) should not receive the message
    expect(userC.receivedMessages).not.toContainEqual(
      expect.objectContaining({
        content: message,
        sessionId: 'user_a'
      })
    );
  });
});
```

## Manual Testing Checklist

### Location-Based Discovery
- [ ] App accurately detects and displays user's current location
- [ ] Nearby users appear on the interface within specified radius
- [ ] Users outside the radius are not visible
- [ ] User count updates in real-time as users enter/leave radius
- [ ] Changing radius setting updates visible users correctly
- [ ] Location permission denial is handled gracefully with clear messaging

### Real-Time Messaging
- [ ] Messages appear instantly for users within proximity
- [ ] Messages show correct sender information
- [ ] Message timestamps are accurate
- [ ] Long messages display correctly
- [ ] Empty messages are prevented or handled appropriately
- [ ] Message delivery failures are communicated to the user
- [ ] Messages persist when revisiting an area

### Privacy Controls
- [ ] Anonymous mode correctly hides user identity
- [ ] Blocking a user prevents message exchange
- [ ] Location precision settings affect location sharing granularity
- [ ] Users can disable location sharing temporarily
- [ ] Settings changes apply immediately
- [ ] Privacy status indicators are clear and accurate

### User Experience
- [ ] Typing indicators appear and disappear appropriately
- [ ] UI elements adjust correctly for different screen sizes
- [ ] Transition animations are smooth
- [ ] Notifications work for new messages when app is in background
- [ ] UI provides clear feedback for user actions
- [ ] Error states display helpful information

### Performance and Reliability
- [ ] Feature works consistently across different network conditions
- [ ] Connection status is clearly communicated
- [ ] Reconnection attempts work after connection loss
- [ ] Battery usage is reasonable during extended use
- [ ] App remains responsive with many nearby users
- [ ] Large message history loads efficiently

## Testing Tools

1. **Jest** - Primary testing framework for unit and integration tests
2. **React Testing Library** - Component testing
3. **Mock Service Worker** - API mocking
4. **WebSocket Mock** - WebSocket service simulation
5. **Geolocation Simulator** - Tool for simulating different locations
6. **Cypress** - End-to-end testing
7. **Lighthouse** - Performance testing
8. **Battery Stats** - Battery usage measurement

## Testing Schedule

| Phase | Duration | Focus |
|-------|----------|-------|
| Initial Unit Testing | 2 weeks | Core service functionality |
| Integration Testing | 2 weeks | Component interactions |
| E2E Test Development | 1 week | Automated user journeys |
| Manual Testing Round 1 | 1 week | Functionality verification |
| Performance Testing | 1 week | Optimization and scaling |
| Bug Fixes & Regression | 1 week | Address identified issues |
| Manual Testing Round 2 | 1 week | Validation of fixes |
| Security & Privacy Audit | 1 week | Compliance verification |

## Bug Reporting and Tracking

All issues identified during testing will be documented with:

1. Clear description of the issue
2. Steps to reproduce
3. Expected vs. actual behavior
4. Environmental factors (device, OS, network)
5. Screenshot or video evidence
6. Severity classification

Issues will be tracked in the project management system and prioritized based on impact and frequency.

## Exit Criteria

Testing will be considered complete when:

1. All test cases pass or have documented acceptable workarounds
2. No critical or high-severity bugs remain unresolved
3. Performance metrics meet or exceed targets
4. Battery usage is within acceptable limits
5. All privacy controls function as specified
6. Real-time messaging meets latency requirements (< 500ms)

## Testing Team

- Frontend Developer (Unit & Integration Testing)
- QA Engineer (E2E & Manual Testing)
- Backend Developer (Mock Server & API Testing)
- UX Designer (Usability Testing)
- Security Engineer (Privacy & Security Review)

## Getting Started with Testing

To begin testing the proximity chat feature:

1. Clone the testing repository: `git clone https://github.com/meetnow/proximity-chat-testing.git`
2. Install dependencies: `npm install`
3. Start the mock server: `npm run mock-server`
4. Run unit tests: `npm test`
5. Run integration tests: `npm run test:integration`
6. Run E2E tests: `npm run test:e2e`
7. For manual testing, use the test app: `npm run start:test-app`

## Simulating Locations

For manual testing that requires location simulation:

```javascript
// In browser console during testing session
window.simulateLocation = function(latitude, longitude) {
  const mockPosition = {
    coords: {
      latitude,
      longitude,
      accuracy: 10
    },
    timestamp: Date.now()
  };
  
  // Override getCurrentPosition
  const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition;
  navigator.geolocation.getCurrentPosition = (success) => {
    success(mockPosition);
  };
  
  console.log(`Location simulated: ${latitude}, ${longitude}`);
  return function restore() {
    navigator.geolocation.getCurrentPosition = originalGetCurrentPosition;
    console.log('Original geolocation restored');
  };
};

// Example usage:
const restore = simulateLocation(34.052235, -118.243683); // Los Angeles
// Test proximity chat...
restore(); // Return to actual location
```

---

This testing plan is a living document and will be updated as the proximity chat feature evolves. All team members are encouraged to contribute improvements to the testing process.

Last updated: [Current Date] 