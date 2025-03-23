import React, { useRef, useEffect, useState } from 'react';
import { useProximityChatContext } from '../context/ProximityChatContext';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import UserList from './UserList';
import StatusBar from './StatusBar';
import SoundNotifications from './SoundNotifications';
import { mapKeyboardActions, getFocusableElements, handleFocusTrap, createAccessibleButtonProps } from '../utils/accessibilityUtils';
import NearbyUsersList from './NearbyUsersList';
import NearbyUsersIndicator from './NearbyUsersIndicator';
import ChatHeader from './ChatHeader';
import ProximityMessageList from './ProximityMessageList';

/**
 * Main container component for the proximity chat feature
 */
const ProximityChatContainer = ({ className, style }) => {
  const { 
    messages, 
    nearbyUsers, 
    isConnected, 
    isLoading, 
    error, 
    connectToChat,
    disconnectFromChat,
    userLocation,
    chatSettings
  } = useProximityChatContext();
  
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const messageListRef = useRef(null);
  const skipLinkTargetRef = useRef(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'settings'
  
  // Handle keyboard navigation within the chat container
  useEffect(() => {
    const containerElement = containerRef.current;
    if (!containerElement) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        // Focus management - move focus to the container when Escape is pressed
        containerElement.focus();
      }
      
      // Handle focus trap for accessibility
      const focusableElements = getFocusableElements(containerElement);
      handleFocusTrap(e, focusableElements);
    };
    
    containerElement.addEventListener('keydown', handleKeyDown);
    return () => {
      containerElement.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Connect to chat service when the component mounts
  useEffect(() => {
    connectToChat();
    
    return () => {
      disconnectFromChat();
    };
  }, [connectToChat, disconnectFromChat]);
  
  // Handle skip link functionality
  const handleSkipLink = (e) => {
    e.preventDefault();
    if (skipLinkTargetRef.current) {
      skipLinkTargetRef.current.focus();
    }
  };
  
  // Handler for sending a new message
  const handleSendMessage = (message) => {
    // This is handled by the ChatInput component which uses the context directly
    console.log('Message sent:', message);
  };
  
  // Handler for selecting a user from the nearby users list
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    // Could focus the chat input or other actions
  };
  
  // Toggle the sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Check if geolocation is enabled
  const isLocationEnabled = !!userLocation;
  
  // Handle error state
  if (error) {
    return (
      <div 
        className="proximity-chat-error"
        role="alert"
        aria-live="assertive"
      >
        <h3>Error connecting to chat</h3>
        <p>{error.message || 'Something went wrong, please try again later.'}</p>
        <button 
          className="retry-button"
          onClick={connectToChat}
          aria-label="Retry connection"
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className={`proximity-chat-container ${className || ''} ${sidebarOpen ? 'sidebar-open' : ''}`} 
      style={style}
      role="region"
      aria-label="Proximity Chat"
      tabIndex="-1"
    >
      {/* Skip navigation link for keyboard users */}
      <a 
        href="#chat-main-content"
        className="skip-link"
        onClick={handleSkipLink}
      >
        Skip to chat content
      </a>
      
      <ChatHeader 
        onMenuToggle={toggleSidebar}
        isSidebarOpen={sidebarOpen}
      />
      
      <div className="proximity-chat-main">
        <div className="proximity-chat-content">
          {!isLocationEnabled ? (
            <div className="location-permission-prompt">
              <div className="permission-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <h3>Location Access Required</h3>
              <p>
                To chat with people nearby, we need access to your location.
                Please enable location access in your browser settings.
              </p>
              <button 
                className="enable-location-button"
                onClick={() => {
                  // This would trigger location permission request
                  navigator.geolocation.getCurrentPosition(() => {}, () => {});
                }}
              >
                Enable Location Access
              </button>
            </div>
          ) : (
            <>
              <ProximityMessageList
                showAvatars={true}
                showTimestamps={chatSettings?.showTimestamps}
                showDistance={chatSettings?.showDistance !== false}
                autoScroll={chatSettings?.autoScroll}
                onMessageAction={(action, message) => {
                  if (action === 'select-user') {
                    setSelectedUser(message.sender);
                  }
                }}
              />
              
              <ChatInput 
                ref={inputRef}
                onSendMessage={handleSendMessage}
                targetUser={selectedUser}
                placeholder={selectedUser ? `Message ${selectedUser.username}...` : "Type a message..."}
                disabled={!isConnected}
              />
              
              {!sidebarOpen && (
                <div className="nearby-users-floating-indicator" onClick={toggleSidebar}>
                  <NearbyUsersIndicator 
                    nearbyUsers={nearbyUsers}
                    maxDistance={chatSettings?.proximityRadius || 100}
                    animateChanges={true}
                    size="medium"
                  />
                </div>
              )}
            </>
          )}
        </div>
        
        {sidebarOpen && (
          <div className="proximity-chat-sidebar">
            <div className="sidebar-tabs">
              <button 
                className={`sidebar-tab ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
                {...createAccessibleButtonProps(
                  () => setActiveTab('users'),
                  'View nearby users'
                )}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                Users
              </button>
              <button 
                className={`sidebar-tab ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
                {...createAccessibleButtonProps(
                  () => setActiveTab('settings'),
                  'View chat settings'
                )}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                Settings
              </button>
            </div>
            
            <div className="sidebar-content">
              {activeTab === 'users' && (
                <NearbyUsersList onUserSelect={handleUserSelect} />
              )}
              
              {activeTab === 'settings' && (
                <div className="proximity-chat-settings-panel">
                  {/* Settings panel content would be here */}
                  <p>Settings panel will be integrated here</p>
                </div>
              )}
            </div>
            
            <button 
              className="close-sidebar-button"
              onClick={toggleSidebar}
              aria-label="Close sidebar"
              {...createAccessibleButtonProps(
                toggleSidebar,
                'Close sidebar'
              )}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {/* Accessibility announcement area for important status updates */}
      <div 
        className="sr-only"
        aria-live="polite"
        id="chat-announcements"
      ></div>
    </div>
  );
};

export default ProximityChatContainer; 