import type { ColorPickerElements } from './types';

let isDragging = false;
let currentSlider: HTMLElement | null = null;

/**
 * Initialize color pickers
 */
export function initColorPickers(): void {
  const colorPickers = document.querySelectorAll<HTMLElement>('.neu-color-picker');

  colorPickers.forEach(picker => {
    const elements = getColorPickerElements(picker);
    if (!elements) return;

    const { input, preview, hueSlider, saturationSlider, lightnessSlider } = elements;

    // Add ARIA attributes
    input.setAttribute('role', 'spinbutton');
    input.setAttribute('aria-valuemin', '0');
    input.setAttribute('aria-valuemax', '360');
    input.setAttribute('aria-valuenow', '0');

    // Add event listeners
    input.addEventListener('input', () => updateColor(picker));
    hueSlider.addEventListener('mousedown', e => handleSliderDrag(e, hueSlider));
    saturationSlider.addEventListener('mousedown', e => handleSliderDrag(e, saturationSlider));
    lightnessSlider.addEventListener('mousedown', e => handleSliderDrag(e, lightnessSlider));

    // Initialize color
    updateColor(picker);
  });
}

/**
 * Get color picker elements
 */
function getColorPickerElements(picker: HTMLElement): ColorPickerElements | null {
  const input = picker.querySelector<HTMLInputElement>('.neu-color-input');
  const preview = picker.querySelector<HTMLElement>('.neu-color-preview');
  const hueSlider = picker.querySelector<HTMLElement>('.neu-color-hue-slider');
  const saturationSlider = picker.querySelector<HTMLElement>('.neu-color-saturation-slider');
  const lightnessSlider = picker.querySelector<HTMLElement>('.neu-color-lightness-slider');

  if (!input ?? (!preview || !hueSlider || !saturationSlider || !lightnessSlider)) {
    return null;
  }

  return { input, preview, hueSlider, saturationSlider, lightnessSlider };
}

/**
 * Handle slider drag
 */
function handleSliderDrag(e: MouseEvent, slider: HTMLElement): void {
  isDragging = true;
  currentSlider = slider;

  document.addEventListener('mousemove', handleSliderMove);
  document.addEventListener('mouseup', stopSliderDrag);

  updateSliderValue(e, slider);
}

/**
 * Handle slider move
 */
function handleSliderMove(e: MouseEvent): void {
  if (!isDragging ?? !currentSlider) return;
  updateSliderValue(e, currentSlider);
}

/**
 * Stop slider drag
 */
function stopSliderDrag(): void {
  isDragging = false;
  document.removeEventListener('mousemove', handleSliderMove);
  document.removeEventListener('mouseup', stopSliderDrag);
  currentSlider = null;
}

/**
 * Update slider value
 */
function updateSliderValue(e: MouseEvent, slider: HTMLElement): void {
  const rect = slider.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const width = rect.width;
  const value = Math.max(0, Math.min(100, (x / width) * 100));

  slider.style.setProperty('--value', `${value}%`);

  const picker = slider.closest('.neu-color-picker') as HTMLElement;
  if (picker) {
    updateColor(picker);
  }
}

/**
 * Update color
 */
function updateColor(picker: HTMLElement): void {
  const elements = getColorPickerElements(picker);
  if (!elements) return;

  const { input, preview, hueSlider, saturationSlider, lightnessSlider } = elements;

  const hue = parseInt(input.value) || 0;
  const saturation = parseInt(hueSlider.style.getPropertyValue('--value') || '100');
  const lightness = parseInt(saturationSlider.style.getPropertyValue('--value') || '50');

  const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  preview.style.backgroundColor = color;

  // Update ARIA value
  input.setAttribute('aria-valuenow', hue.toString());

  // Dispatch change event
  const event = new CustomEvent('change', { detail: { color } });
  picker.dispatchEvent(event);
}
