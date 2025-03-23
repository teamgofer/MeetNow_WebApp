/**
 * Proximity Chat Feature Module
 * 
 * This is the main entry point for the proximity chat feature.
 * It exports all components and functionality related to proximity-based chat.
 * 
 * IMPORTANT: This module is completely self-contained and has no dependencies
 * on the rest of the application except for explicitly defined integration points.
 */

// Main Components
export { default as ProximityChat } from './components/ProximityChat';
export { default as ChatMessageList } from './components/ChatMessageList';
export { default as ChatInput } from './components/ChatInput';
export { default as NearbyUsersIndicator } from './components/NearbyUsersIndicator';
export { default as ChatBubble } from './components/ChatBubble';

// Hooks
export { useProximityChat } from './hooks/useProximityChat';
export { useNearbyUsers } from './hooks/useNearbyUsers';
export { useProximityChatSettings } from './hooks/useProximityChatSettings';

// Context
export { ProximityChatProvider, useProximityChatContext } from './context/ProximityChatContext';

// Integration Utilities
export { initializeProximityChat } from './utils/integration'; 