# Proximity Chat Tests

This directory contains comprehensive test coverage for the Proximity Chat feature. The testing strategy follows a layered approach, starting from the foundational utilities and services up to the complex UI components.

## Test Structure

Tests are organized mirroring the structure of the feature:

```
tests/
├── utils/            - Tests for utility functions
├── services/         - Tests for services (API, WebSocket)
├── hooks/            - Tests for custom React hooks
├── components/       - Tests for UI components
└── context/          - Tests for React context providers
```

## Testing Approach

### 1. Unit Tests for Core Utilities

We start by testing the foundational code:

- **`locationUtils.test.js`**: Tests for geolocation functions including distance calculation, location validation, and region detection
- **`chatHistoryUtils.test.js`**: Tests for message history management and formatting

### 2. Service Layer Tests

Services that handle external communication are tested with mocks:

- **`chatSocketService.test.js`**: Tests WebSocket connection handling, message serialization, and reconnection logic
- **`messageHistoryService.test.js`**: Tests API interactions for message history

### 3. Hook Tests

Custom hooks are tested using React Testing Library's `renderHook`:

- **`useNearbyUsers.test.jsx`**: Tests proximity-based user filtering
- **`useMessageHistory.test.jsx`**: Tests message history loading and pagination

### 4. Component Tests

UI components are tested with React Testing Library:

- **`ChatMessageInput.test.jsx`**: Tests message composition and sending
- **`ChatMessageHistory.test.jsx`**: Tests message history display
- **`MessageHistoryHeader.test.jsx`**: Tests history header rendering
- **`ChatRegionEntryNotice.test.jsx`**: Tests region entry notifications

### 5. Context Provider Tests

The central state container is tested thoroughly:

- **`ProximityChatContext.test.jsx`**: Tests state management, event handling, and API integration

## Testing Considerations

Our tests cover various scenarios important to proximity chat:

1. **Proximity Detection**: Proper filtering of users based on location
2. **Real-time Communication**: WebSocket handling for messages and status updates
3. **Error Handling**: Graceful behavior when connections fail
4. **Message History**: Loading and displaying historical messages
5. **User Experience**: Typing indicators and presence notifications

## Running Tests

Run all tests with:

```bash
npm test
```

Run a specific test file with:

```bash
npm test -- src/features/proximity-chat/tests/utils/locationUtils.test.js
```

## Coverage

Our test suite aims for high code coverage with an emphasis on critical paths:

- Location-based features: 95%+
- Message handling: 90%+
- WebSocket connection: 85%+
- UI components: 80%+

## Mocking Strategy

We use several mocking approaches:

1. **Service Mocks**: WebSocket and API services are mocked to test without real connections
2. **Context Mocks**: Chat context is mocked for testing components in isolation
3. **Geolocation Mocks**: Location utilities are mocked for predictable testing

## Future Improvements

Planned improvements to the test suite:

1. End-to-end tests with Cypress for key user flows
2. Performance tests for message rendering with large history
3. Mobile-specific tests for location updates while moving 