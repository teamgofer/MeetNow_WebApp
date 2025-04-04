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
export function initNeumorphic() {
    initAccordions();
    initSliders();
    initCarousels();
    initColorPickers();
    initThemeToggle();
    initAccessibility();
}
//# sourceMappingURL=index.js.map