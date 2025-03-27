import { useState, useCallback } from 'react';

/**
 * Custom hook for managing modal state and animations
 * @param {Object} options - Modal options
 * @param {boolean} [options.initialState=false] - Initial open state
 * @param {number} [options.animationDuration=300] - Animation duration in ms
 * @returns {Object} Modal state and control functions
 */
const useModal = ({ initialState = false, animationDuration = 300 } = {}) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const [isAnimating, setIsAnimating] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
    setIsAnimating(true);
  }, []);

  const close = useCallback(() => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsOpen(false);
    }, animationDuration);
  }, [animationDuration]);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  return {
    isOpen,
    isAnimating,
    open,
    close,
    toggle,
    animationDuration
  };
};

export default useModal; 