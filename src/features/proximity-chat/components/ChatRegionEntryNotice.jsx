import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { formatRelativeTime } from '../utils/timeUtils';

/**
 * Displays a notification when a user enters a chat region
 * Shows information about the region and provides an option to load previous messages
 */
const ChatRegionEntryNotice = ({
  regionId,
  regionName,
  enteredAt,
  onLoadPreviousMessages,
  messageCount = 0,
  className = '',
  style = {},
  autoHide = true,
  hideAfter = 10000 // 10 seconds
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Automatically hide the notice after a delay if autoHide is true
  useEffect(() => {
    if (autoHide && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, hideAfter);
      
      return () => clearTimeout(timer);
    }
  }, [autoHide, hideAfter, isVisible]);
  
  // Format the entered time to be human-readable
  const formattedTime = formatRelativeTime(enteredAt);
  
  // Handle loading previous messages
  const handleLoadPrevious = async () => {
    if (isLoading || messageCount === 0) return;
    
    setIsLoading(true);
    
    try {
      await onLoadPreviousMessages();
    } catch (error) {
      console.error('Error loading previous messages:', error);
    } finally {
      setIsLoading(false);
      setIsVisible(false);
    }
  };
  
  // Hide the notice
  const handleClose = () => {
    setIsVisible(false);
  };
  
  if (!isVisible) {
    return null;
  }
  
  return (
    <div 
      className={`chat-region-entry-notice ${className}`}
      style={style}
    >
      <div className="notice-content">
        <div className="notice-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
          </svg>
        </div>
        
        <div className="notice-text">
          <div className="notice-title">
            You've entered {regionName || `the ${regionId} area`}
          </div>
          
          {messageCount > 0 && (
            <div className="notice-message-count">
              There {messageCount === 1 ? 'is' : 'are'} {messageCount} {messageCount === 1 ? 'message' : 'messages'} from before you arrived
            </div>
          )}
        </div>
        
        <div className="notice-actions">
          {messageCount > 0 && (
            <button 
              className="load-previous-button"
              onClick={handleLoadPrevious}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Load Previous'}
            </button>
          )}
          
          <button 
            className="close-notice-button"
            onClick={handleClose}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

ChatRegionEntryNotice.propTypes = {
  regionId: PropTypes.string.isRequired,
  regionName: PropTypes.string,
  enteredAt: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date)
  ]).isRequired,
  onLoadPreviousMessages: PropTypes.func.isRequired,
  messageCount: PropTypes.number,
  className: PropTypes.string,
  style: PropTypes.object,
  autoHide: PropTypes.bool,
  hideAfter: PropTypes.number
};

export default ChatRegionEntryNotice; 