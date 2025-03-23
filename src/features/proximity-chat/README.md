# Proximity Chat Feature

## Overview

The Proximity Chat feature allows MeetNow users to engage in real-time chats with other users who are physically nearby. This creates opportunities for spontaneous connections and community building around shared locations.

## Key Features

- **Location-based chat:** Connect with users within a customizable radius around your location
- **Real-time messaging:** Instant message delivery using WebSocket connections
- **User presence:** See how many users are nearby and who is currently typing
- **Privacy controls:** Set your chat radius, toggle anonymous mode, and control notifications
- **Map integration:** View chat bubbles on the map representing active conversation areas

## Component Structure

```
proximity-chat/
├── components/        # UI components
│   ├── ChatBubble.jsx             # Map overlay showing chat activity at a location
│   ├── ChatInput.jsx              # Text input for sending messages
│   ├── ChatMessageItem.jsx        # Individual message display
│   ├── ChatMessageList.jsx        # Container for displaying messages
│   ├── ChatSettings.jsx           # Settings panel for configuring chat preferences
│   ├── NearbyUsersIndicator.jsx   # Shows count of nearby users
│   └── ProximityChat.jsx          # Main container component
├── context/
│   └── ProximityChatContext.jsx   # Context provider for chat state
├── hooks/
│   ├── useGeolocation.js          # Hook for accessing location data
│   ├── useNearbyUsers.js          # Hook for tracking nearby users
│   ├── useProximityChat.js        # Main hook for chat functionality
│   ├── useProximityChatSettings.js # Hook for managing chat settings
│   └── useTypingIndicator.js      # Hook for tracking typing status
├── services/
│   └── proximityChatService.js    # Service for backend communication
└── utils/
    ├── locationUtils.js           # Utilities for location calculations
    └── messageUtils.js            # Utilities for message formatting and filtering
```

## Usage

### Basic Implementation

```jsx
import { ProximityChatProvider } from './features/proximity-chat/context/ProximityChatContext';
import ProximityChat from './features/proximity-chat/components/ProximityChat';

// Wrap your app or the relevant section with the provider
function App() {
  return (
    <ProximityChatProvider>
      <YourAppComponents />
      <ProximityChat isVisible={showChat} onClose={() => setShowChat(false)} />
    </ProximityChatProvider>
  );
}
```

### Using the Hook in Custom Components

```jsx
import { useProximityChat } from './features/proximity-chat/hooks/useProximityChat';

function YourComponent() {
  const { 
    isConnected, 
    messages, 
    sendMessage, 
    nearbyUsers 
  } = useProximityChat({
    autoConnect: true
  });

  return (
    <div>
      <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
      <p>Nearby users: {nearbyUsers.length}</p>
      {/* Your custom UI */}
    </div>
  );
}
```

## Technical Implementation

### State Management

The feature uses React Context for state management, with a carefully designed reducer to handle various chat actions. This approach keeps state updates predictable and allows any component to access the chat state when needed.

### Real-time Communication

WebSocket connections maintain real-time communication with the backend. The system handles reconnection attempts in case of disconnection and includes fallback mechanisms for message delivery.

### Location Services

The feature uses the browser's Geolocation API to track user location. To minimize battery impact, location updates are throttled and optimized based on user activity and movement.

### Privacy Considerations

- User locations are only shared with the server, not directly with other users
- Anonymous mode hides user identity from other chat participants
- Users can control their chat radius to limit interaction range
- Messages are not persistently stored on the client side to respect privacy

## Development

See the [Development Journal](./DEVELOPMENT_JOURNAL.md) for ongoing progress, decisions, and challenges in implementing this feature.

## API Reference

### Context

- `useProximityChatContext()` - Access the chat context from anywhere in the component tree

### Hooks

- `useProximityChat(options)` - Main hook for chat functionality
- `useNearbyUsers(options)` - Hook for tracking users in proximity
- `useGeolocation(options)` - Hook for handling location data
- `useProximityChatSettings()` - Hook for managing chat settings
- `useTypingIndicator(options)` - Hook for tracking typing status

### Utilities

- `locationUtils` - Utilities for location calculations and formatting
- `messageUtils` - Utilities for message handling and formatting

## Contributing

When working on this feature, please follow these guidelines:

1. Update the Development Journal with any significant decisions or challenges
2. Maintain the established component architecture
3. Write tests for new functionality
4. Ensure all privacy controls are preserved in new features
5. Optimize for battery and data usage on mobile devices 