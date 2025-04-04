export function initAccessibility() {
    addSkipLink();
    addFocusStyles();
    addKeyboardNavigation();
    addAriaLiveRegions();
}
function addSkipLink() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'neu-skip-link';
    skipLink.textContent = 'Skip to main content';
    document.body.insertBefore(skipLink, document.body.firstChild);
}
function addFocusStyles() {
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
    const interactiveElements = document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    interactiveElements.forEach(element => {
        element.classList.add('neu-focus-visible');
    });
}
function addKeyboardNavigation() {
    const dropdowns = document.querySelectorAll('.neu-dropdown');
    dropdowns.forEach(dropdown => {
        const trigger = dropdown.querySelector('.neu-dropdown-trigger');
        if (!trigger)
            return;
        trigger.setAttribute('role', 'button');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-haspopup', 'true');
        const content = dropdown.querySelector('.neu-dropdown-content');
        if (!content)
            return;
        content.setAttribute('role', 'menu');
        content.setAttribute('aria-hidden', 'true');
        trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleDropdown(dropdown);
            }
            else if (e.key === 'Escape') {
                closeDropdown(dropdown);
            }
            else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                navigateDropdownItems(dropdown, e.key === 'ArrowDown');
            }
        });
    });
    const modals = document.querySelectorAll('.neu-modal');
    modals.forEach(modal => {
        const closeButton = modal.querySelector('.neu-modal-close');
        if (!closeButton)
            return;
        closeButton.setAttribute('role', 'button');
        closeButton.setAttribute('aria-label', 'Close modal');
        closeButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                closeModal(modal);
            }
            else if (e.key === 'Escape') {
                closeModal(modal);
            }
        });
    });
}
function addAriaLiveRegions() {
    const statusRegion = document.createElement('div');
    statusRegion.setAttribute('role', 'status');
    statusRegion.setAttribute('aria-live', 'polite');
    statusRegion.className = 'neu-live-region';
    document.body.appendChild(statusRegion);
    const alertRegion = document.createElement('div');
    alertRegion.setAttribute('role', 'alert');
    alertRegion.setAttribute('aria-live', 'assertive');
    alertRegion.className = 'neu-live-region';
    document.body.appendChild(alertRegion);
}
function toggleDropdown(dropdown) {
    const trigger = dropdown.querySelector('.neu-dropdown-trigger');
    const content = dropdown.querySelector('.neu-dropdown-content');
    if (!trigger ?? !content)
        return;
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
        closeDropdown(dropdown);
    }
    else {
        openDropdown(dropdown);
    }
}
function openDropdown(dropdown) {
    const trigger = dropdown.querySelector('.neu-dropdown-trigger');
    const content = dropdown.querySelector('.neu-dropdown-content');
    if (!trigger ?? !content)
        return;
    trigger.setAttribute('aria-expanded', 'true');
    content.setAttribute('aria-hidden', 'false');
    content.style.display = 'block';
    const firstItem = content.querySelector('[role="menuitem"]');
    if (firstItem) {
        firstItem.focus();
    }
}
function closeDropdown(dropdown) {
    const trigger = dropdown.querySelector('.neu-dropdown-trigger');
    const content = dropdown.querySelector('.neu-dropdown-content');
    if (!trigger ?? !content)
        return;
    trigger.setAttribute('aria-expanded', 'false');
    content.setAttribute('aria-hidden', 'true');
    content.style.display = 'none';
    trigger.focus();
}
function navigateDropdownItems(dropdown, forward) {
    const content = dropdown.querySelector('.neu-dropdown-content');
    if (!content)
        return;
    const items = Array.from(content.querySelectorAll('[role="menuitem"]'));
    const currentIndex = items.findIndex(item => item === document.activeElement);
    let nextIndex;
    if (forward) {
        nextIndex = currentIndex === items.length - 1 ? 0 : currentIndex + 1;
    }
    else {
        nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
    }
    items[nextIndex].focus();
}
function closeModal(modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
    const trigger = document.querySelector(`[data-modal-target="${modal.id}"]`);
    if (trigger) {
        trigger.focus();
    }
}
//# sourceMappingURL=accessibility.js.map