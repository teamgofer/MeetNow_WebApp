import { useState, useEffect, useCallback, useRef } from 'react';
import { useProximityChatContext } from '../context/ProximityChatContext';

/**
 * Custom hook for managing typing indicators in the proximity chat
 * 
 * This hook tracks the current user's typing status and handles
 * updating the server when the user starts or stops typing.
 * It also tracks other users who are currently typing.
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.typingTimeoutMs - Time in ms after which typing status is reset (default: 2000)
 * @param {boolean} options.enabled - Whether to enable typing indicators (default: true)
 * @returns {Object} Typing indicator state and methods
 */
const useTypingIndicator = ({ 
  typingTimeoutMs = 2000,
  enabled = true
} = {}) => {
  const [isTyping, setIsTyping] = useState(false);
  const { typingUsers, startTyping: contextStartTyping, stopTyping: contextStopTyping } = useProximityChatContext();
  const typingTimeoutRef = useRef(null);
  
  /**
   * Clears any existing typing timeout
   */
  const clearTypingTimeout = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);
  
  /**
   * Notifies that the user has started typing
   */
  const startTyping = useCallback(() => {
    if (!enabled) return;
    
    // Only trigger if we weren't already typing
    if (!isTyping) {
      setIsTyping(true);
      contextStartTyping();
    }
    
    // Clear any existing timeout
    clearTypingTimeout();
    
    // Set timeout to auto-reset typing status
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      contextStopTyping();
      typingTimeoutRef.current = null;
    }, typingTimeoutMs);
  }, [enabled, isTyping, contextStartTyping, contextStopTyping, clearTypingTimeout, typingTimeoutMs]);
  
  /**
   * Notifies that the user has stopped typing
   */
  const stopTyping = useCallback(() => {
    if (!enabled || !isTyping) return;
    
    setIsTyping(false);
    contextStopTyping();
    clearTypingTimeout();
  }, [enabled, isTyping, contextStopTyping, clearTypingTimeout]);
  
  /**
   * Handle input changes to trigger typing status
   * 
   * @param {Event} event - Input change event
   */
  const handleInputChange = useCallback((event) => {
    const value = event.target.value;
    
    if (value.trim().length > 0) {
      startTyping();
    } else {
      stopTyping();
    }
  }, [startTyping, stopTyping]);
  
  /**
   * Handle when the input is submitted
   */
  const handleSubmit = useCallback(() => {
    stopTyping();
  }, [stopTyping]);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (isTyping) {
        contextStopTyping();
      }
      clearTypingTimeout();
    };
  }, [isTyping, contextStopTyping, clearTypingTimeout]);
  
  return {
    isTyping,
    typingUsers,
    hasTypingUsers: typingUsers.length > 0,
    typingUsersCount: typingUsers.length,
    handleInputChange,
    handleSubmit,
    startTyping,
    stopTyping
  };
};

export default useTypingIndicator; 