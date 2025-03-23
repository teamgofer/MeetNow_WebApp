/**
 * Accessibility utilities for the proximity chat feature
 * Provides helper functions for creating accessible components and handling keyboard interactions
 */

/**
 * Generates a unique ID for accessibility attributes
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Unique ID
 */
export const generateAccessibleId = (prefix = 'acc') => {
  return `${prefix}_${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Creates props for an element that needs to be announced to screen readers
 * @param {boolean} [live=false] - Whether the element has changing content that should be announced
 * @param {string} [assertiveness='polite'] - How aggressively changes should be announced
 * @returns {Object} Props to spread onto the element
 */
export const createLiveRegionProps = (live = false, assertiveness = 'polite') => {
  if (!live) {
    return {};
  }
  
  return {
    'aria-live': assertiveness,
    'aria-atomic': true,
  };
};

/**
 * Creates props for an accessible button that can be triggered by keyboard
 * @param {Function} onClick - Function to call when activated
 * @param {string} label - Accessible label for the button
 * @returns {Object} Props to spread onto the element
 */
export const createAccessibleButtonProps = (onClick, label) => {
  return {
    role: 'button',
    tabIndex: 0,
    'aria-label': label,
    onClick,
    onKeyDown: (e) => {
      // Trigger on Space or Enter key
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onClick(e);
      }
    },
  };
};

/**
 * Creates props for keyboard navigable list items
 * @param {number} index - Current item index
 * @param {number} totalItems - Total number of items
 * @param {Function} onSelect - Function to call when item is selected
 * @param {Function} onNavigate - Function to call when navigation occurs
 * @returns {Object} Props to spread onto the list item
 */
export const createNavigableListItemProps = (index, totalItems, onSelect, onNavigate) => {
  return {
    tabIndex: index === 0 ? 0 : -1, // First item is focusable by default
    role: 'listitem',
    'aria-posinset': index + 1,
    'aria-setsize': totalItems,
    onClick: () => onSelect(index),
    onKeyDown: (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          onNavigate(Math.min(index + 1, totalItems - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          onNavigate(Math.max(index - 1, 0));
          break;
        case 'Home':
          e.preventDefault();
          onNavigate(0);
          break;
        case 'End':
          e.preventDefault();
          onNavigate(totalItems - 1);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect(index);
          break;
        default:
          break;
      }
    },
  };
};

/**
 * Creates props for an element with a tooltip or description
 * @param {string} description - Description text
 * @returns {Object} Props to spread onto the element
 */
export const createDescribedByProps = (description) => {
  if (!description) {
    return {};
  }
  
  const id = generateAccessibleId('desc');
  
  return {
    'aria-describedby': id,
    description,
    descriptionId: id,
  };
};

/**
 * Creates a hidden element for screen readers
 * @param {string} text - Text to be read by screen readers
 * @returns {JSX.Element} A visually hidden element
 */
export const ScreenReaderText = ({ text, id }) => {
  return (
    <span 
      id={id}
      className="sr-only" 
      aria-hidden="false"
    >
      {text}
    </span>
  );
};

/**
 * Checks if an element is currently focused
 * @param {React.RefObject} elementRef - Reference to the element
 * @returns {boolean} Whether the element has focus
 */
export const hasElementFocus = (elementRef) => {
  return elementRef.current === document.activeElement;
};

/**
 * Focus management for keyboard navigation
 * @param {HTMLElement} element - Element to focus
 * @param {Object} options - Focus options
 */
export const focusElement = (element, options = { preventScroll: false }) => {
  if (element && typeof element.focus === 'function') {
    element.focus(options);
  }
};

/**
 * Handles focus trap within a modal or dialog
 * @param {KeyboardEvent} event - The keyboard event
 * @param {Array<HTMLElement>} focusableElements - Array of focusable elements
 * @returns {void}
 */
export const handleFocusTrap = (event, focusableElements) => {
  if (!focusableElements || focusableElements.length === 0) return;
  
  // If tab key is pressed
  if (event.key === 'Tab') {
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Shift + Tab
    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } 
    // Tab
    else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
};

/**
 * Get all focusable elements within a container
 * @param {HTMLElement} container - The container element
 * @returns {Array<HTMLElement>} Array of focusable elements
 */
export const getFocusableElements = (container) => {
  if (!container) return [];
  
  return Array.from(
    container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  ).filter(
    el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden')
  );
};

/**
 * Maps common keyboard actions for an interactive component
 * @param {Object} actions - Object with action functions
 * @returns {Function} Keyboard event handler
 */
export const mapKeyboardActions = (actions) => {
  return (event) => {
    const keyMap = {
      Enter: actions.select,
      ' ': actions.select, // Space
      ArrowUp: actions.up,
      ArrowDown: actions.down,
      ArrowLeft: actions.left,
      ArrowRight: actions.right,
      Escape: actions.escape,
      Home: actions.first,
      End: actions.last,
      Tab: actions.tab,
    };
    
    const handler = keyMap[event.key];
    
    if (handler) {
      if (event.key !== 'Tab') {
        event.preventDefault();
      }
      handler(event);
    }
  };
};

export default {
  generateAccessibleId,
  createLiveRegionProps,
  createAccessibleButtonProps,
  createNavigableListItemProps,
  createDescribedByProps,
  ScreenReaderText,
  hasElementFocus,
  focusElement,
  handleFocusTrap,
  getFocusableElements,
  mapKeyboardActions,
}; 