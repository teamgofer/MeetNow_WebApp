export function initAccordions() {
    const accordionHeaders = document.querySelectorAll('.neu-accordion-header');
    accordionHeaders.forEach(header => {
        header.setAttribute('aria-expanded', header.parentElement.classList.contains('neu-accordion-item-open') ? 'true' : 'false');
        const contentId = `accordion-content-${Math.random().toString(36).substring(2, 10)}`;
        header.setAttribute('aria-controls', contentId);
        header.nextElementSibling.id = contentId;
        header.nextElementSibling.setAttribute('aria-hidden', header.parentElement.classList.contains('neu-accordion-item-open') ? 'false' : 'true');
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        header.addEventListener('click', toggleAccordion);
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleAccordion.call(header);
            }
        });
        if (header.parentElement.classList.contains('neu-accordion-item-open')) {
            const content = header.nextElementSibling;
            content.style.height = `${content.scrollHeight}px`;
        }
    });
}
function toggleAccordion() {
    const item = this.parentElement;
    const content = this.nextElementSibling;
    const arrow = this.querySelector('.neu-accordion-arrow');
    const isOpen = item.classList.contains('neu-accordion-item-open');
    if (isOpen) {
        item.classList.remove('neu-accordion-item-open');
        arrow?.classList.remove('neu-accordion-arrow-open');
        content.style.height = '0px';
        this.setAttribute('aria-expanded', 'false');
        content.setAttribute('aria-hidden', 'true');
    }
    else {
        item.classList.add('neu-accordion-item-open');
        arrow?.classList.add('neu-accordion-arrow-open');
        content.style.height = `${content.scrollHeight}px`;
        this.setAttribute('aria-expanded', 'true');
        content.setAttribute('aria-hidden', 'false');
    }
}
//# sourceMappingURL=accordion.js.map