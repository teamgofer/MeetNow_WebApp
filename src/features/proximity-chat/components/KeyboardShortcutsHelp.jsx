import React, { useEffect, useRef } from 'react';
import { DEFAULT_SHORTCUTS } from '../utils/keyboardShortcuts';
import { handleFocusTrap, getFocusableElements } from '../utils/accessibilityUtils';

/**
 * Component that displays keyboard shortcuts help information
 * This is shown when the user presses ? or through the help button
 */
const KeyboardShortcutsHelp = ({ isOpen, onClose }) => {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  
  // Store the previously focused element when opening
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
    }
  }, [isOpen]);
  
  // Focus the dialog when it opens and restore focus when it closes
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    } else if (!isOpen && previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isOpen]);
  
  // Handle escape key to close the dialog
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      
      // Handle focus trap for accessibility
      if (isOpen && dialogRef.current) {
        const focusableElements = getFocusableElements(dialogRef.current);
        handleFocusTrap(e, focusableElements);
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
  
  // Group shortcuts by category
  const groupedShortcuts = {
    navigation: {},
    actions: {},
    messageNavigation: {}
  };
  
  Object.entries(DEFAULT_SHORTCUTS).forEach(([key, data]) => {
    if (key.includes('Arrow') || key.includes('Home') || key.includes('End')) {
      groupedShortcuts.messageNavigation[key] = data;
    } else if (data.action.startsWith('focus-') || (key.startsWith('Alt+') && !isNaN(parseInt(key.slice(-1))))) {
      groupedShortcuts.navigation[key] = data;
    } else {
      groupedShortcuts.actions[key] = data;
    }
  });
  
  // Format the shortcut key for display
  const formatShortcutKey = (key) => {
    return key.split('+').map(part => (
      <kbd key={part} className="shortcut-key">
        {part}
      </kbd>
    )).reduce((prev, curr) => [prev, <span key={`+${curr}`} className="shortcut-plus">+</span>, curr]);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="keyboard-shortcuts-overlay">
      <div 
        ref={dialogRef}
        className="keyboard-shortcuts-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-shortcuts-title"
        tabIndex="-1"
      >
        <h2 id="keyboard-shortcuts-title" className="shortcuts-dialog-title">
          Keyboard Shortcuts
        </h2>
        
        <div className="shortcuts-dialog-content">
          <section className="shortcuts-section">
            <h3 id="navigation-shortcuts">Navigation Shortcuts</h3>
            <ul aria-labelledby="navigation-shortcuts" className="shortcuts-list">
              {Object.entries(groupedShortcuts.navigation).map(([key, { description }]) => (
                <li key={key} className="shortcut-item">
                  <div className="shortcut-keys">
                    {formatShortcutKey(key)}
                  </div>
                  <div className="shortcut-description">
                    {description}
                  </div>
                </li>
              ))}
            </ul>
          </section>
          
          <section className="shortcuts-section">
            <h3 id="action-shortcuts">Action Shortcuts</h3>
            <ul aria-labelledby="action-shortcuts" className="shortcuts-list">
              {Object.entries(groupedShortcuts.actions).map(([key, { description }]) => (
                <li key={key} className="shortcut-item">
                  <div className="shortcut-keys">
                    {formatShortcutKey(key)}
                  </div>
                  <div className="shortcut-description">
                    {description}
                  </div>
                </li>
              ))}
            </ul>
          </section>
          
          <section className="shortcuts-section">
            <h3 id="message-nav-shortcuts">Message Navigation Shortcuts</h3>
            <ul aria-labelledby="message-nav-shortcuts" className="shortcuts-list">
              {Object.entries(groupedShortcuts.messageNavigation).map(([key, { description }]) => (
                <li key={key} className="shortcut-item">
                  <div className="shortcut-keys">
                    {formatShortcutKey(key)}
                  </div>
                  <div className="shortcut-description">
                    {description}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
        
        <div className="shortcuts-dialog-footer">
          <p className="shortcuts-tip">
            Press <kbd>?</kbd> at any time to show or hide this help.
          </p>
          <button 
            className="shortcuts-close-button"
            onClick={onClose}
            aria-label="Close keyboard shortcuts help"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp; 