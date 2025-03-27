/**
 * Proximity Chat Feature
 * 
 * This module provides components and utilities for implementing
 * location-based real-time chat functionality.
 */

// Main components
export { default as ProximityChatPage } from './pages/ProximityChatPage';
export { default as ProximityChatContainer } from './components/ProximityChatContainer';
export { default as ProximityChat } from './components/ProximityChat';
export { default as ChatMessageList } from './components/ChatMessageList';
export { default as ChatMessageInput } from './components/ChatMessageInput';
export { default as ChatMessage } from './components/ChatMessage';
export { default as NearbyUsersIndicator } from './components/NearbyUsersIndicator';

// Context providers
export { 
  ProximityChatProvider,
  useProximityChatContext
} from './context/ProximityChatContext';

export { 
  BlockedUsersProvider,
  useBlockedUsers
} from './context/BlockedUsersContext';

export { default as ProximityChatProviderWrapper } from './components/ProximityChatProviderWrapper';

// Hooks
export { default as useNearbyUsers } from './hooks/useNearbyUsers';
export { default as useMessageHistory } from './hooks/useMessageHistory';

// Services
export { default as chatSocketService } from './services/chatSocketService';
export { default as proximityChatService } from './services/proximityChatService';
export * from './services/messageHistoryService';

// Utilities
export * from './utils/locationUtils';
export * from './utils/timeUtils';

// Constants
export * from './constants'; 