import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useProximityChatContext } from '../context/ProximityChatContext';
import { useBlockedUsers } from '../context/BlockedUsersContext';
import MessageItem from './MessageItem';
import { 
  filterMessagesByProximity, 
  enhanceMessagesWithProximityData,
  getNewProximityMessages,
  getDepartedProximityMessages,
  calculateMessageFadeOpacity
} from '../utils/proximityMessageUtils';
import { formatDistance } from '../utils/locationUtils';
import { createAccessibleButtonProps } from '../utils/accessibilityUtils';
import PerformanceMonitor from '../../../utils/PerformanceMonitor';

/**
 * Component for displaying messages filtered by proximity
 * with dynamic transitions and distance indicators
 */
const ProximityMessageList = ({
  showTimestamps = true,
  showAvatars = true,
  showDistance = true,
  autoScroll = true,
  className = '',
  onMessageAction
}) => {
  const { 
    messages, 
    userLocation, 
    currentUserId, 
    chatSettings 
  } = useProximityChatContext();
  const { isUserBlocked } = useBlockedUsers();
  
  const containerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [enteredMessages, setEnteredMessages] = useState([]);
  const [departedMessages, setDepartedMessages] = useState([]);
  const prevMessagesRef = useRef([]);
  const renderStartTimeRef = useRef(Date.now());
  
  // Get the proximity radius from settings
  const proximityRadius = chatSettings?.proximityRadius || 100;
  
  // Track component initialization
  useEffect(() => {
    const duration = Date.now() - renderStartTimeRef.current;
    PerformanceMonitor.trackOperationTiming('proximity_message_list_init', duration, {
      hasUserLocation: !!userLocation,
      messageCount: messages.length,
      proximityRadius,
      hasCurrentUserId: !!currentUserId
    });
  }, []);

  // Filter and enhance messages based on proximity
  useEffect(() => {
    if (!userLocation) {
      setVisibleMessages([]);
      return;
    }
    
    const startTime = Date.now();
    
    // Filter messages by proximity
    const filteredMessages = filterMessagesByProximity(
      messages,
      userLocation,
      {
        proximityRadius,
        currentUserId,
        isUserBlocked
      }
    );
    
    // Add proximity data to each message
    const enhancedMessages = enhanceMessagesWithProximityData(
      filteredMessages,
      userLocation
    );
    
    // Track which messages are entering/leaving proximity
    const newMessages = getNewProximityMessages(
      enhancedMessages, 
      prevMessagesRef.current
    );
    
    const departingMessages = getDepartedProximityMessages(
      enhancedMessages,
      prevMessagesRef.current
    );
    
    // Update state with the calculations
    setVisibleMessages(enhancedMessages);
    setEnteredMessages(newMessages);
    setDepartedMessages(departingMessages);
    
    // Clear entered/departed message arrays after animation time
    const transitionTimer = setTimeout(() => {
      setEnteredMessages([]);
      setDepartedMessages([]);
    }, 1000); // Match CSS transition duration
    
    // Update previous messages reference
    prevMessagesRef.current = enhancedMessages;
    
    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('message_filtering_and_enhancement', duration, {
      totalMessages: messages.length,
      filteredCount: filteredMessages.length,
      newMessagesCount: newMessages.length,
      departingMessagesCount: departingMessages.length
    });
    
    return () => clearTimeout(transitionTimer);
  }, [messages, userLocation, proximityRadius, currentUserId, isUserBlocked]);
  
  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (autoScroll && messagesEndRef.current && visibleMessages.length > 0) {
      const startTime = Date.now();
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('message_list_auto_scroll', duration, {
        messageCount: visibleMessages.length,
        isSmooth: true
      });
    }
  }, [visibleMessages, autoScroll]);
  
  // Render a message with proximity effects
  const renderMessage = (message) => {
    const startTime = Date.now();
    const isEntering = enteredMessages.some(m => m.id === message.id);
    const isLeaving = departedMessages.some(m => m.id === message.id);
    
    // Calculate opacity based on distance from user
    const opacity = calculateMessageFadeOpacity(message.distance, proximityRadius);

    // Get the transtion class name
    const getTransitionClass = () => {
      if (isEntering) return 'entering';
      if (isLeaving) return 'leaving';
      return '';
    };
    
    const duration = Date.now() - startTime;
    PerformanceMonitor.trackOperationTiming('message_render', duration, {
      messageId: message.id,
      isEntering,
      isLeaving,
      hasDistance: !!message.distance,
      isCurrentUser: message.senderId === currentUserId
    });
    
    return (
      <div 
        key={message.id}
        className={`proximity-message-wrapper ${getTransitionClass()}`}
        style={{ opacity }}
      >
        <MessageItem
          message={message}
          currentUserId={currentUserId}
          showAvatar={showAvatars}
          showTimestamp={showTimestamps}
          onMessageAction={onMessageAction}
        />
        
        {showDistance && message.senderId !== currentUserId && message.distance && (
          <div className="message-distance-indicator">
            <svg 
              viewBox="0 0 24 24" 
              width="12" 
              height="12" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 8v4l2 2"></path>
            </svg>
            <span>{formatDistance(message.distance)}</span>
          </div>
        )}
      </div>
    );
  };
  
  // Render proximity zone dividers
  const renderProximityZoneDivider = (zone, distance) => (
    <div className={`proximity-zone-divider ${zone}`}>
      <div className="zone-line" />
      <div className="zone-label">
        {zone === 'near' && 'Nearby'}
        {zone === 'medium' && 'Medium distance'}
        {zone === 'far' && 'Far away'}
        <span className="zone-distance">within {distance}m</span>
      </div>
      <div className="zone-line" />
    </div>
  );
  
  // Group and render messages by proximity zones
  const renderMessagesByZones = () => {
    let hasNearMessages = false;
    let hasMediumMessages = false;
    let hasFarMessages = false;
    
    // Pre-check if we have messages in each zone
    visibleMessages.forEach(message => {
      if (!message.distance) return;
      
      if (message.distance <= 30) hasNearMessages = true;
      else if (message.distance <= 70) hasMediumMessages = true;
      else hasFarMessages = true;
    });
    
    return (
      <>
        {hasNearMessages && renderProximityZoneDivider('near', 30)}
        {visibleMessages
          .filter(message => message.distance && message.distance <= 30)
          .map(renderMessage)}
          
        {hasMediumMessages && renderProximityZoneDivider('medium', 70)}
        {visibleMessages
          .filter(message => message.distance && message.distance > 30 && message.distance <= 70)
          .map(renderMessage)}
          
        {hasFarMessages && renderProximityZoneDivider('far', proximityRadius)}
        {visibleMessages
          .filter(message => message.distance && message.distance > 70)
          .map(renderMessage)}
          
        {!hasNearMessages && !hasMediumMessages && !hasFarMessages && (
          <div className="empty-proximity-messages">
            <div className="empty-messages-icon">
              <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            </div>
            <p className="empty-messages-text">
              No messages in your proximity yet. Start a conversation!
            </p>
          </div>
        )}
      </>
    );
  };
  
  if (!userLocation) {
    return (
      <div className="proximity-message-list location-required">
        <div className="location-required-message">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <p>
            Please enable location to see messages from nearby users.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`proximity-message-list ${className}`}
      ref={containerRef}
      role="log"
      aria-live="polite"
      aria-atomic="false"
    >
      <div className="proximity-messages-container">
        {renderMessagesByZones()}
        <div ref={messagesEndRef} className="messages-end-marker" />
      </div>
    </div>
  );
};

ProximityMessageList.propTypes = {
  showTimestamps: PropTypes.bool,
  showAvatars: PropTypes.bool,
  showDistance: PropTypes.bool,
  autoScroll: PropTypes.bool,
  className: PropTypes.string,
  onMessageAction: PropTypes.func
};

export default ProximityMessageList; 