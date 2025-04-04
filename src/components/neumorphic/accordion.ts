import type { AccordionHeader } from './types';

/**
 * Initialize accordions
 */
export function initAccordions(): void {
  const accordionHeaders = document.querySelectorAll<AccordionHeader>('.neu-accordion-header');

  accordionHeaders.forEach(header => {
    // Add ARIA attributes
    header.setAttribute(
      'aria-expanded',
      header.parentElement.classList.contains('neu-accordion-item-open') ? 'true' : 'false'
    );
    const contentId = `accordion-content-${Math.random().toString(36).substring(2, 10)}`;
    header.setAttribute('aria-controls', contentId);
    header.nextElementSibling.id = contentId;
    header.nextElementSibling.setAttribute(
      'aria-hidden',
      header.parentElement.classList.contains('neu-accordion-item-open') ? 'false' : 'true'
    );

    // Add keyboard support
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');

    // Click event
    header.addEventListener('click', toggleAccordion);

    // Keyboard event
    header.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleAccordion.call(header);
      }
    });

    // Initialize open accordions
    if (header.parentElement.classList.contains('neu-accordion-item-open')) {
      const content = header.nextElementSibling;
      content.style.height = `${content.scrollHeight}px`;
    }
  });
}

/**
 * Toggle accordion state
 */
function toggleAccordion(this: AccordionHeader): void {
  const item = this.parentElement;
  const content = this.nextElementSibling;
  const arrow = this.querySelector('.neu-accordion-arrow');

  // Toggle open state
  const isOpen = item.classList.contains('neu-accordion-item-open');

  if (isOpen) {
    item.classList.remove('neu-accordion-item-open');
    arrow?.classList.remove('neu-accordion-arrow-open');
    content.style.height = '0px';
    this.setAttribute('aria-expanded', 'false');
    content.setAttribute('aria-hidden', 'true');
  } else {
    item.classList.add('neu-accordion-item-open');
    arrow?.classList.add('neu-accordion-arrow-open');
    content.style.height = `${content.scrollHeight}px`;
    this.setAttribute('aria-expanded', 'true');
    content.setAttribute('aria-hidden', 'false');
  }
}
