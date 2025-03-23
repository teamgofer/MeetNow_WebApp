import React, { useState } from 'react';
import { createAccessibleButtonProps } from '../utils/accessibilityUtils';
import { getShortcutForAction } from '../utils/keyboardShortcuts';

/**
 * Component that provides inline accessibility help for the proximity chat
 * This can be placed near complex UI elements to provide extra guidance for assistive tech users
 */
const AccessibilityInlineHelp = ({ 
  featureId,
  title,
  description,
  relatedActions = [],
  placement = 'top',
  children
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const toggleHelp = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Generate accessible button props using our utility
  const buttonProps = createAccessibleButtonProps(
    toggleHelp,
    `${isExpanded ? 'Hide' : 'Show'} help for ${title}`
  );
  
  // Format shortcut text for display
  const formatShortcut = (shortcutKey) => {
    if (!shortcutKey) return null;
    
    return shortcutKey.split('+').map((part, i) => (
      <React.Fragment key={part}>
        {i > 0 && <span className="a11y-shortcut-plus">+</span>}
        <kbd className="a11y-shortcut-key">{part}</kbd>
      </React.Fragment>
    ));
  };
  
  return (
    <div className={`a11y-help-container a11y-help-${placement}`}>
      {children}
      
      <button 
        className="a11y-help-toggle"
        {...buttonProps}
        aria-expanded={isExpanded}
      >
        <span className="sr-only">Help for {title}</span>
        <svg 
          className="a11y-help-icon" 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>
      
      {isExpanded && (
        <div 
          className="a11y-help-content"
          role="tooltip"
          id={`help-${featureId}`}
        >
          <h4 className="a11y-help-title">{title}</h4>
          <p className="a11y-help-description">{description}</p>
          
          {relatedActions.length > 0 && (
            <div className="a11y-help-shortcuts">
              <h5 className="a11y-help-shortcuts-title">Keyboard Shortcuts</h5>
              <ul className="a11y-help-shortcuts-list">
                {relatedActions.map(action => {
                  const shortcutKey = getShortcutForAction(action.id);
                  return (
                    <li key={action.id} className="a11y-help-shortcut-item">
                      <span className="a11y-help-action-name">
                        {action.label}
                      </span>
                      {shortcutKey ? (
                        <span className="a11y-help-shortcut-key">
                          {formatShortcut(shortcutKey)}
                        </span>
                      ) : (
                        <span className="a11y-help-no-shortcut">
                          No shortcut available
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          
          <button 
            className="a11y-help-close"
            onClick={toggleHelp}
            aria-label="Close help"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Example usage:
 * 
 * <AccessibilityInlineHelp
 *   featureId="message-list"
 *   title="Message Navigation"
 *   description="Use keyboard shortcuts to navigate through messages efficiently."
 *   relatedActions={[
 *     { id: 'next-message', label: 'Next message' },
 *     { id: 'previous-message', label: 'Previous message' }
 *   ]}
 *   placement="right"
 * >
 *   <MessageList messages={messages} />
 * </AccessibilityInlineHelp>
 */

export default AccessibilityInlineHelp; 