import React, { useState, useEffect } from 'react';
import { useProximityChatContext } from '../context/ProximityChatContext';
import useProximityChatSettings from '../hooks/useProximityChatSettings';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';
import ChatSettings from './ChatSettings';
import NearbyUsersIndicator from './NearbyUsersIndicator';
import { sortMessagesByTime, filterMessagesByDistance } from '../utils/messageUtils';

/**
 * ProximityChat Component
 * 
 * Main component that assembles the proximity chat interface, including:
 * - Chat message list
 * - Input area
 * - Settings panel
 * - Nearby users indicator
 * 
 * @param {Object} props
 * @param {boolean} props.isVisible - Whether the chat interface is visible
 * @param {Function} props.onClose - Function to call when closing the chat
 * @param {boolean} props.showSettingsDefault - Whether to show settings on initial render
 */
const ProximityChat = ({ isVisible = true, onClose, showSettingsDefault = false }) => {
  const [showSettings, setShowSettings] = useState(showSettingsDefault);
  const { messages, nearbyUsers, userLocation, isConnected, isLoading, error } = useProximityChatContext();
  const { radius, anonymousMode } = useProximityChatSettings();
  
  // Derived state
  const nearbyUsersCount = nearbyUsers?.length || 0;
  
  // Filter messages by current radius and sort by time
  const visibleMessages = React.useMemo(() => {
    if (!messages || !userLocation) return [];
    
    const filteredMessages = filterMessagesByDistance(messages, userLocation, radius);
    return sortMessagesByTime(filteredMessages);
  }, [messages, userLocation, radius]);
  
  // Handle escape key to close chat
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showSettings) {
          setShowSettings(false);
        } else if (onClose) {
          onClose();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showSettings]);
  
  // Don't render if not visible
  if (!isVisible) return null;
  
  return (
    <div className="proximity-chat-container">
      {/* Header */}
      <div className="proximity-chat-header">
        <h3>Nearby Chat</h3>
        
        <div className="proximity-chat-header-actions">
          <NearbyUsersIndicator count={nearbyUsersCount} />
          
          <button 
            className="settings-button" 
            onClick={() => setShowSettings(true)} 
            aria-label="Chat Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5zm7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66z" />
            </svg>
          </button>
          
          <button 
            className="close-button" 
            onClick={onClose} 
            aria-label="Close Chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Connection Status */}
      {!isConnected && !isLoading && (
        <div className="connection-status error">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span>Disconnected. Trying to reconnect...</span>
        </div>
      )}
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="connection-status loading">
          <svg className="spinner" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
            <path d="M12 4V2C6.48 2 2 6.48 2 12h2c0-4.42 3.58-8 8-8z" />
          </svg>
          <span>Connecting to chat...</span>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="connection-status error">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {/* Anonymous Mode Indicator */}
      {anonymousMode && (
        <div className="anonymous-indicator">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2a7.2 7.2 0 0 1-6-3.22c.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08a7.2 7.2 0 0 1-6 3.22z" />
          </svg>
          <span>Anonymous Mode: Your identity is hidden</span>
        </div>
      )}
      
      {/* Main Chat Area */}
      <div className="chat-message-container">
        <ChatMessageList messages={visibleMessages} />
      </div>
      
      {/* Input Area */}
      <div className="chat-input-container">
        <ChatInput />
      </div>
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-overlay">
          <ChatSettings onClose={() => setShowSettings(false)} />
        </div>
      )}
    </div>
  );
};

export default ProximityChat; 