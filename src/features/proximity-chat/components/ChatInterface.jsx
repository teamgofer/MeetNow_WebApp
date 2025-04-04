import PropTypes from 'prop-types';
import React, { useState, useEffect, useCallback } from 'react';

import PerformanceMonitor from '../../../utils/PerformanceMonitor';
import { useProximityChatContext } from '../context/ProximityChatContext';
import { isMessageExpired } from '../utils/timeUtils';

import ChatMessageHistory from './ChatMessageHistory';
import ChatMessageInput from './ChatMessageInput';
import ChatRegionEntryNotice from './ChatRegionEntryNotice';

/**
 * Main chat interface component that integrates message history,
 * entry notices, and message input
 */
const ChatInterface = ({ regionId, regionName, className = '', style = {} }) => {
  const {
    messages,
    sendMessage,
    isConnected,
    trackRegionEntry,
    getRegionEntryTime,
    loadMessagesBeforeArrival,
    nearbyUsers,
  } = useProximityChatContext();

  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const [showingPreviousMessages, setShowingPreviousMessages] = useState(false);
  const renderStartTimeRef = React.useRef(Date.now());

  // Track component initialization
  useEffect(() => {
    const duration = Date.now() - renderStartTimeRef.current;
    PerformanceMonitor.trackOperationTiming('chat_interface_init', duration, {
      hasRegionId: !!regionId,
      hasRegionName: !!regionName,
      isConnected,
      messageCount: messages.length,
      nearbyUsersCount: nearbyUsers.length,
    });
  }, []);

  // Track region entry
  useEffect(() => {
    if (regionId && isConnected) {
      const startTime = Date.now();
      trackRegionEntry(regionId);
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('region_entry_tracking', duration, {
        regionId,
        isConnected,
      });
    }
  }, [regionId, isConnected, trackRegionEntry]);

  // Get region entry time
  const enteredAt = getRegionEntryTime(regionId);

  // Filter messages for this region
  const filteredMessages = messages.filter(
    msg => msg.regionId === regionId && !isMessageExpired(msg.timestamp)
  );

  // Count messages that were sent before user entered
  useEffect(() => {
    if (regionId && enteredAt) {
      const startTime = Date.now();
      const count = filteredMessages.filter(
        msg => new Date(msg.timestamp) < new Date(enteredAt)
      ).length;

      setPreviousMessageCount(count);

      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('previous_messages_count', duration, {
        regionId,
        hasEnteredAt: !!enteredAt,
        previousMessageCount: count,
        totalFilteredMessages: filteredMessages.length,
      });
    }
  }, [regionId, enteredAt, filteredMessages]);

  // Handle loading previous messages
  const handleLoadPreviousMessages = useCallback(async () => {
    if (regionId && enteredAt) {
      const startTime = Date.now();
      try {
        const previousMessages = await loadMessagesBeforeArrival(regionId);
        setShowingPreviousMessages(previousMessages.length > 0);

        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('load_previous_messages', duration, {
          regionId,
          hasEnteredAt: !!enteredAt,
          loadedMessageCount: previousMessages.length,
          success: true,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('load_previous_messages', duration, {
          regionId,
          hasEnteredAt: !!enteredAt,
          error: error.message,
          success: false,
        });
        console.error('Failed to load previous messages:', error);
      }
    }
  }, [regionId, enteredAt, loadMessagesBeforeArrival]);

  // Handle sending a message
  const handleSendMessage = useCallback(
    text => {
      if (text.trim() && regionId) {
        const startTime = Date.now();
        sendMessage({
          text,
          regionId,
        });
        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('message_send', duration, {
          regionId,
          messageLength: text.length,
          hasRegionName: !!regionName,
        });
      }
    },
    [regionId, sendMessage, regionName]
  );

  return (
    <div className={`chat-interface ${className}`} style={style}>
      {/* Show region entry notice if there are previous messages */}
      {enteredAt && previousMessageCount > 0 && !showingPreviousMessages && (
        <ChatRegionEntryNotice
          regionId={regionId}
          regionName={regionName}
          enteredAt={enteredAt}
          messageCount={previousMessageCount}
          onLoadPreviousMessages={handleLoadPreviousMessages}
        />
      )}

      {/* Message history with scrollback loading */}
      <ChatMessageHistory
        regionId={regionId}
        enteredAt={enteredAt}
        className="message-history-container"
      />

      {/* Message input */}
      <div className="message-input-container">
        <ChatMessageInput
          onSendMessage={handleSendMessage}
          placeholder={`Message ${regionName || regionId}`}
          disabled={!isConnected}
        />

        {/* User presence indicator */}
        {nearbyUsers.length > 0 && (
          <div className="nearby-users-indicator">
            {nearbyUsers.length} {nearbyUsers.length === 1 ? 'person' : 'people'} nearby
          </div>
        )}
      </div>
    </div>
  );
};

ChatInterface.propTypes = {
  regionId: PropTypes.string.isRequired,
  regionName: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default ChatInterface;
