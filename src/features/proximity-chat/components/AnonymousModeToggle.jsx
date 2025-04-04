import React, { useState, useEffect } from 'react';

import { localStorageKeys } from '../constants';
import { useProximityChatContext } from '../context/ProximityChatContext';
import { createAccessibleButtonProps } from '../utils/accessibilityUtils';

/**
 * Toggle switch component for enabling/disabling anonymous mode
 * in the proximity chat feature
 */
const AnonymousModeToggle = () => {
  const { currentUserId } = useProximityChatContext();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load anonymous mode setting from localStorage on mount
  useEffect(() => {
    if (currentUserId) {
      const storageKey = `${localStorageKeys.ANONYMOUS_MODE}_${currentUserId}`;
      const savedSetting = localStorage.getItem(storageKey);

      if (savedSetting !== null) {
        setIsAnonymous(savedSetting === 'true');
      }
    }
  }, [currentUserId]);

  // Save anonymous mode setting to localStorage when it changes
  useEffect(() => {
    if (currentUserId) {
      const storageKey = `${localStorageKeys.ANONYMOUS_MODE}_${currentUserId}`;
      localStorage.setItem(storageKey, isAnonymous.toString());
    }
  }, [isAnonymous, currentUserId]);

  // Toggle anonymous mode
  const toggleAnonymousMode = async () => {
    setIsLoading(true);

    try {
      // Here you would typically call an API to update the user's anonymous mode setting
      // For now, we'll just update the local state

      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 300));

      setIsAnonymous(prevState => !prevState);
    } catch (error) {
      console.error('Error toggling anonymous mode:', error);
      // Handle error if needed
    } finally {
      setIsLoading(false);
    }
  };

  // Create accessible button props
  const buttonProps = createAccessibleButtonProps(
    toggleAnonymousMode,
    `Turn ${isAnonymous ? 'off' : 'on'} anonymous mode`
  );

  return (
    <div className="anonymous-mode-container">
      <div className="anonymous-mode-header">
        <h3 className="anonymous-mode-title">Anonymous Mode</h3>
        <div className="anonymous-mode-status">
          {isAnonymous ? (
            <span className="anonymous-mode-status-on">On</span>
          ) : (
            <span className="anonymous-mode-status-off">Off</span>
          )}
        </div>
      </div>

      <p className="anonymous-mode-description">
        When anonymous mode is on, other users will not see your real username or profile
        information.
      </p>

      <button
        className={`anonymous-mode-toggle ${isAnonymous ? 'anonymous-mode-toggle--on' : 'anonymous-mode-toggle--off'}`}
        onClick={toggleAnonymousMode}
        disabled={isLoading}
        aria-busy={isLoading}
        aria-pressed={isAnonymous}
        {...buttonProps}
      >
        <span className="anonymous-mode-toggle-track">
          <span className="anonymous-mode-toggle-thumb" />
        </span>
        <span className="sr-only">{isAnonymous ? 'Disable' : 'Enable'} anonymous mode</span>
      </button>

      {isAnonymous && (
        <div className="anonymous-mode-note" aria-live="polite">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M17 11h1a3 3 0 0 1 0 6h-1" />
            <path d="M9 12v6" />
            <path d="M13 12v6" />
            <path d="M7 8.03V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1.03" />
            <path d="M5 3L4 7M19 3l1 4" />
          </svg>
          <p>You are currently in anonymous mode. Your real identity is hidden from other users.</p>
        </div>
      )}
    </div>
  );
};

export default AnonymousModeToggle;
