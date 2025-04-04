/**
 * Keyboard shortcuts utility for the Proximity Chat feature
 * Manages keyboard shortcuts and their handlers
 */

import { focusElement } from './accessibilityUtils';

/**
 * Default keyboard shortcuts configuration
 */
const DEFAULT_SHORTCUTS = {
  // Navigation shortcuts
  'Alt+1': { action: 'focus-message-list', description: 'Focus message list' },
  'Alt+2': { action: 'focus-chat-input', description: 'Focus chat input' },
  'Alt+3': { action: 'focus-user-list', description: 'Focus user list' },
  'Alt+4': { action: 'focus-settings', description: 'Focus settings' },

  // Action shortcuts
  'Ctrl+Enter': { action: 'send-message', description: 'Send message' },
  Esc: { action: 'close-dialog', description: 'Close active dialog' },
  'Alt+M': { action: 'toggle-sound', description: 'Toggle sound notifications' },
  'Alt+S': { action: 'open-settings', description: 'Open settings panel' },
  'Alt+U': { action: 'refresh-users', description: 'Refresh nearby users' },
  'Alt+C': { action: 'clear-input', description: 'Clear input field' },
  'Alt+R': { action: 'reload-chat', description: 'Reload chat connection' },

  // Message navigation
  'Alt+ArrowUp': { action: 'previous-message', description: 'Navigate to previous message' },
  'Alt+ArrowDown': { action: 'next-message', description: 'Navigate to next message' },
  'Alt+Home': { action: 'first-message', description: 'Navigate to first message' },
  'Alt+End': { action: 'last-message', description: 'Navigate to last message' },
};

/**
 * Class to manage keyboard shortcuts
 */
class KeyboardShortcutManager {
  constructor(config = {}) {
    this.shortcuts = { ...DEFAULT_SHORTCUTS, ...config };
    this.handlers = {};
    this.enabled = true;
    this.refs = {};
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
  }

  /**
   * Initialize the keyboard shortcut handler
   */
  init() {
    document.addEventListener('keydown', this.boundHandleKeyDown);
    return this;
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    document.removeEventListener('keydown', this.boundHandleKeyDown);
  }

  /**
   * Register element references for focusing
   * @param {Object} refs - Object containing references to DOM elements
   */
  registerRefs(refs) {
    this.refs = { ...this.refs, ...refs };
    return this;
  }

  /**
   * Register a handler for a shortcut action
   * @param {string} action - Action identifier
   * @param {Function} handler - Function to execute
   */
  registerHandler(action, handler) {
    if (typeof handler !== 'function') {
      console.error(`Handler for action "${action}" must be a function`);
      return this;
    }

    this.handlers[action] = handler;
    return this;
  }

  /**
   * Register multiple handlers at once
   * @param {Object} handlers - Object with action:handler pairs
   */
  registerHandlers(handlers) {
    Object.entries(handlers).forEach(([action, handler]) => {
      this.registerHandler(action, handler);
    });
    return this;
  }

  /**
   * Enable or disable the keyboard shortcut manager
   * @param {boolean} isEnabled - Whether shortcuts should be enabled
   */
  setEnabled(isEnabled) {
    this.enabled = Boolean(isEnabled);
    return this;
  }

  /**
   * Handle keydown events
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyDown(event) {
    if (!this.enabled) return;

    // Skip if user is typing in input or textarea
    const activeElement = document.activeElement;
    const isEditing =
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.isContentEditable;

    // Allow certain shortcuts even when editing
    const shortcutKey = this.getShortcutKey(event);
    const shortcut = this.shortcuts[shortcutKey];

    // Skip if no matching shortcut
    if (!shortcut) return;

    // Skip if editing unless it's one of the allowed shortcuts during editing
    if (isEditing && !['Ctrl+Enter', 'Esc', 'Alt+C'].includes(shortcutKey)) {
      return;
    }

    // Handle the shortcut
    const { action } = shortcut;

    // Handle built-in navigation actions
    if (action.startsWith('focus-') && this.refs) {
      const refKey = action.replace('focus-', '');
      const element = this.refs[refKey];

      if (element) {
        event.preventDefault();
        focusElement(element);
        return;
      }
    }

    // Handle custom actions
    const handler = this.handlers[action];
    if (typeof handler === 'function') {
      event.preventDefault();
      handler(event);
    }
  }

  /**
   * Get a normalized shortcut key from a keyboard event
   * @param {KeyboardEvent} event - Keyboard event
   * @returns {string} Normalized shortcut key
   */
  getShortcutKey(event) {
    const parts = [];

    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');

    // Handle special keys
    if (event.key === ' ') {
      parts.push('Space');
    } else if (event.key === 'Escape') {
      return 'Esc'; // Special case for Escape key
    } else if (event.key.length === 1) {
      // Single character keys (letters, numbers, etc.)
      parts.push(event.key.toUpperCase());
    } else {
      // Special keys (Enter, ArrowUp, etc.)
      parts.push(event.key);
    }

    return parts.join('+');
  }

  /**
   * Get all registered shortcuts
   * @returns {Object} All shortcuts
   */
  getShortcuts() {
    return { ...this.shortcuts };
  }

  /**
   * Get shortcuts organized by category
   * @returns {Object} Shortcuts organized by category
   */
  getShortcutsByCategory() {
    const categories = {
      navigation: {},
      actions: {},
      messageNavigation: {},
    };

    Object.entries(this.shortcuts).forEach(([key, data]) => {
      if (key.includes('Arrow') || key.includes('Home') || key.includes('End')) {
        categories.messageNavigation[key] = data;
      } else if (
        key.includes('focus') ||
        (key.startsWith('Alt+') && !isNaN(parseInt(key.slice(-1))))
      ) {
        categories.navigation[key] = data;
      } else {
        categories.actions[key] = data;
      }
    });

    return categories;
  }

  /**
   * Handle the help dialog for keyboard shortcuts
   * @param {boolean} show - Whether to show or hide the help dialog
   */
  showHelp(show = true) {
    if (this.handlers['show-help']) {
      this.handlers['show-help'](show);
    }

    // If no custom handler, create a simple dialog
    if (!this.handlers['show-help'] && show) {
      const shortcuts = this.getShortcutsByCategory();

      // Create dialog content
      let content = '<h2>Keyboard Shortcuts</h2>';

      Object.entries(shortcuts).forEach(([category, shortcutMap]) => {
        content += `<h3>${category.charAt(0).toUpperCase() + category.slice(1)}</h3>`;
        content += '<ul>';

        Object.entries(shortcutMap).forEach(([key, { description }]) => {
          content += `<li><kbd>${key}</kbd>: ${description}</li>`;
        });

        content += '</ul>';
      });

      // Create dialog element
      const dialog = document.createElement('div');
      dialog.className = 'keyboard-shortcuts-help';
      dialog.innerHTML = content;
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-label', 'Keyboard Shortcuts Help');
      dialog.setAttribute('tabindex', '-1');

      // Add close button
      const closeButton = document.createElement('button');
      closeButton.textContent = 'Close';
      closeButton.onclick = () => dialog.remove();
      dialog.appendChild(closeButton);

      // Add to DOM
      document.body.appendChild(dialog);
      dialog.focus();

      // Add event listener to close on escape
      const handleEscape = e => {
        if (e.key === 'Escape') {
          dialog.remove();
          document.removeEventListener('keydown', handleEscape);
        }
      };

      document.addEventListener('keydown', handleEscape);
    }
  }
}

/**
 * Create and initialize a keyboard shortcut manager
 * @param {Object} config - Configuration options
 * @returns {KeyboardShortcutManager} Initialized manager
 */
export const createKeyboardShortcuts = config => {
  return new KeyboardShortcutManager(config).init();
};

/**
 * Get shortcut help text for a specific action
 * @param {string} action - Action identifier
 * @returns {string} Shortcut key or empty string if not found
 */
export const getShortcutForAction = action => {
  const entry = Object.entries(DEFAULT_SHORTCUTS).find(([_, data]) => data.action === action);
  return entry ? entry[0] : '';
};

export default {
  createKeyboardShortcuts,
  getShortcutForAction,
  DEFAULT_SHORTCUTS,
};
