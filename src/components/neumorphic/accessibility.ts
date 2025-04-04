/**
 * Initialize accessibility enhancements
 */
export function initAccessibility(): void {
  // Add skip link
  addSkipLink();

  // Add focus styles
  addFocusStyles();

  // Add keyboard navigation
  addKeyboardNavigation();

  // Add ARIA live regions
  addAriaLiveRegions();
}

/**
 * Add skip link
 */
function addSkipLink(): void {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'neu-skip-link';
  skipLink.textContent = 'Skip to main content';

  document.body.insertBefore(skipLink, document.body.firstChild);
}

/**
 * Add focus styles
 */
function addFocusStyles(): void {
  const style = document.createElement('style');
  style.textContent = `
    .neu-focus-visible:focus {
      outline: 2px solid var(--neu-primary-color);
      outline-offset: 2px;
    }
    
    .neu-focus-visible:focus:not(:focus-visible) {
      outline: none;
    }
  `;

  document.head.appendChild(style);

  // Add focus-visible class to interactive elements
  const interactiveElements = document.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  interactiveElements.forEach(element => {
    element.classList.add('neu-focus-visible');
  });
}

/**
 * Add keyboard navigation
 */
function addKeyboardNavigation(): void {
  // Add keyboard navigation to dropdowns
  const dropdowns = document.querySelectorAll<HTMLElement>('.neu-dropdown');

  dropdowns.forEach(dropdown => {
    const trigger = dropdown.querySelector<HTMLElement>('.neu-dropdown-trigger');
    if (!trigger) return;

    trigger.setAttribute('role', 'button');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-haspopup', 'true');

    const content = dropdown.querySelector<HTMLElement>('.neu-dropdown-content');
    if (!content) return;

    content.setAttribute('role', 'menu');
    content.setAttribute('aria-hidden', 'true');

    // Add keyboard event listeners
    trigger.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleDropdown(dropdown);
      } else if (e.key === 'Escape') {
        closeDropdown(dropdown);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        navigateDropdownItems(dropdown, e.key === 'ArrowDown');
      }
    });
  });

  // Add keyboard navigation to modals
  const modals = document.querySelectorAll<HTMLElement>('.neu-modal');

  modals.forEach(modal => {
    const closeButton = modal.querySelector<HTMLElement>('.neu-modal-close');
    if (!closeButton) return;

    closeButton.setAttribute('role', 'button');
    closeButton.setAttribute('aria-label', 'Close modal');

    // Add keyboard event listeners
    closeButton.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        closeModal(modal);
      } else if (e.key === 'Escape') {
        closeModal(modal);
      }
    });
  });
}

/**
 * Add ARIA live regions
 */
function addAriaLiveRegions(): void {
  // Add status live region
  const statusRegion = document.createElement('div');
  statusRegion.setAttribute('role', 'status');
  statusRegion.setAttribute('aria-live', 'polite');
  statusRegion.className = 'neu-live-region';
  document.body.appendChild(statusRegion);

  // Add alert live region
  const alertRegion = document.createElement('div');
  alertRegion.setAttribute('role', 'alert');
  alertRegion.setAttribute('aria-live', 'assertive');
  alertRegion.className = 'neu-live-region';
  document.body.appendChild(alertRegion);
}

/**
 * Toggle dropdown
 */
function toggleDropdown(dropdown: HTMLElement): void {
  const trigger = dropdown.querySelector<HTMLElement>('.neu-dropdown-trigger');
  const content = dropdown.querySelector<HTMLElement>('.neu-dropdown-content');

  if (!trigger ?? !content) return;

  const isOpen = trigger.getAttribute('aria-expanded') === 'true';

  if (isOpen) {
    closeDropdown(dropdown);
  } else {
    openDropdown(dropdown);
  }
}

/**
 * Open dropdown
 */
function openDropdown(dropdown: HTMLElement): void {
  const trigger = dropdown.querySelector<HTMLElement>('.neu-dropdown-trigger');
  const content = dropdown.querySelector<HTMLElement>('.neu-dropdown-content');

  if (!trigger ?? !content) return;

  trigger.setAttribute('aria-expanded', 'true');
  content.setAttribute('aria-hidden', 'false');
  content.style.display = 'block';

  // Focus first item
  const firstItem = content.querySelector<HTMLElement>('[role="menuitem"]');
  if (firstItem) {
    firstItem.focus();
  }
}

/**
 * Close dropdown
 */
function closeDropdown(dropdown: HTMLElement): void {
  const trigger = dropdown.querySelector<HTMLElement>('.neu-dropdown-trigger');
  const content = dropdown.querySelector<HTMLElement>('.neu-dropdown-content');

  if (!trigger ?? !content) return;

  trigger.setAttribute('aria-expanded', 'false');
  content.setAttribute('aria-hidden', 'true');
  content.style.display = 'none';

  // Return focus to trigger
  trigger.focus();
}

/**
 * Navigate dropdown items
 */
function navigateDropdownItems(dropdown: HTMLElement, forward: boolean): void {
  const content = dropdown.querySelector<HTMLElement>('.neu-dropdown-content');
  if (!content) return;

  const items = Array.from(content.querySelectorAll<HTMLElement>('[role="menuitem"]'));
  const currentIndex = items.findIndex(item => item === document.activeElement);

  let nextIndex: number;
  if (forward) {
    nextIndex = currentIndex === items.length - 1 ? 0 : currentIndex + 1;
  } else {
    nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
  }

  items[nextIndex].focus();
}

/**
 * Close modal
 */
function closeModal(modal: HTMLElement): void {
  modal.style.display = 'none';
  document.body.style.overflow = '';

  // Return focus to trigger
  const trigger = document.querySelector<HTMLElement>(`[data-modal-target="${modal.id}"]`);
  if (trigger) {
    trigger.focus();
  }
}
