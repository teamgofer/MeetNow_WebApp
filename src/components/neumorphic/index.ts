import { initAccessibility } from './accessibility';
import { initAccordions } from './accordion';
import { initCarousels } from './carousel';
import { initColorPickers } from './color-picker';
import { initSliders } from './slider';
import { initThemeToggle } from './theme';

export * from './types';
export * from './accordion';
export * from './slider';
export * from './carousel';
export * from './color-picker';
export * from './theme';
export * from './accessibility';

/**
 * Initialize all neumorphic components
 */
export function initNeumorphic(): void {
  // Initialize components
  initAccordions();
  initSliders();
  initCarousels();
  initColorPickers();
  initThemeToggle();
  initAccessibility();
}
