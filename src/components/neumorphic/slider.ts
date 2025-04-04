import type { SliderElements, DragEvent, TouchEvent } from './types';

let isDragging = false;
let startX = 0;
let startY = 0;
let startLeft = 0;
let currentSlider: HTMLElement | null = null;
let currentThumb: HTMLElement | null = null;

/**
 * Initialize sliders
 */
export function initSliders(): void {
  const sliders = document.querySelectorAll<HTMLElement>('.neu-slider-container');

  sliders.forEach(slider => {
    const elements = getSliderElements(slider);
    if (!elements) return;

    const { track, trackInner, progress, thumb, valueDisplay } = elements;

    // Generate unique ID for slider for aria-labelled-by
    const sliderId = `slider-${Math.random().toString(36).substring(2, 10)}`;
    slider.id = sliderId;

    // Add ARIA attributes
    thumb.setAttribute('role', 'slider');
    thumb.setAttribute('aria-valuemin', '0');
    thumb.setAttribute('aria-valuemax', '100');
    thumb.setAttribute('aria-valuenow', getSliderValue(thumb).toString());

    // Add event listeners
    thumb.addEventListener('mousedown', handleDrag);
    thumb.addEventListener('touchstart', handleTouchDrag);

    // Initialize slider value
    updateSlider(slider, getSliderValue(thumb));
  });
}

/**
 * Get slider elements
 */
function getSliderElements(slider: HTMLElement): SliderElements | null {
  const track = slider.querySelector<HTMLElement>('.neu-slider-track');
  const trackInner = slider.querySelector<HTMLElement>('.neu-slider-track-inner');
  const progress = slider.querySelector<HTMLElement>('.neu-slider-progress');
  const thumb = slider.querySelector<HTMLElement>('.neu-slider-thumb');
  const valueDisplay = slider.querySelector<HTMLElement>('.neu-slider-value');

  if (!track ?? (!trackInner || !progress || !thumb || !valueDisplay)) {
    return null;
  }

  return { track, trackInner, progress, thumb, valueDisplay };
}

/**
 * Handle mouse drag start
 */
function handleDrag(e: DragEvent): void {
  const thumb = e.currentTarget as HTMLElement;
  isDragging = true;
  currentSlider = thumb.closest('.neu-slider-container');
  currentThumb = thumb;

  if (!currentSlider) return;

  startX = e.clientX;
  startY = e.clientY;
  startLeft = thumb.offsetLeft;

  document.addEventListener('mousemove', handleDragMove);
  document.addEventListener('mouseup', stopDrag);
}

/**
 * Handle touch drag start
 */
function handleTouchDrag(e: TouchEvent): void {
  const thumb = e.currentTarget as HTMLElement;
  isDragging = true;
  currentSlider = thumb.closest('.neu-slider-container');
  currentThumb = thumb;

  if (!currentSlider) return;

  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  startLeft = thumb.offsetLeft;

  document.addEventListener('touchmove', handleTouchMove);
  document.addEventListener('touchend', stopDrag);
}

/**
 * Handle mouse drag move
 */
function handleDragMove(e: MouseEvent): void {
  if (!isDragging ?? (!currentSlider || !currentThumb)) return;

  const deltaX = e.clientX - startX;
  const newLeft = Math.max(
    0,
    Math.min(startLeft + deltaX, currentThumb.parentElement?.offsetWidth ?? 0)
  );
  currentThumb.style.left = `${newLeft}px`;

  const percentage = getSliderValue(currentThumb);
  updateSlider(currentSlider, percentage);
}

/**
 * Handle touch drag move
 */
function handleTouchMove(e: TouchEvent): void {
  if (!isDragging ?? (!currentSlider || !currentThumb)) return;

  const deltaX = e.touches[0].clientX - startX;
  const newLeft = Math.max(
    0,
    Math.min(startLeft + deltaX, currentThumb.parentElement?.offsetWidth ?? 0)
  );
  currentThumb.style.left = `${newLeft}px`;

  const percentage = getSliderValue(currentThumb);
  updateSlider(currentSlider, percentage);
}

/**
 * Stop dragging
 */
function stopDrag(): void {
  isDragging = false;
  document.removeEventListener('mousemove', handleDragMove);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('touchmove', handleTouchMove);
  document.removeEventListener('touchend', stopDrag);

  if (currentSlider && currentThumb) {
    updateSlider(currentSlider, getSliderValue(currentThumb));
  }

  currentSlider = null;
  currentThumb = null;
}

/**
 * Update slider position and value
 */
function updateSlider(slider: HTMLElement, percentage: number): void {
  const elements = getSliderElements(slider);
  if (!elements) return;

  const { track, trackInner, progress, thumb, valueDisplay } = elements;

  // Update thumb position
  const thumbWidth = thumb.offsetWidth;
  const trackWidth = track.offsetWidth;
  const maxLeft = trackWidth - thumbWidth;
  const left = (percentage / 100) * maxLeft;

  thumb.style.left = `${left}px`;
  progress.style.width = `${percentage}%`;

  // Update ARIA value
  thumb.setAttribute('aria-valuenow', percentage.toString());

  // Update value display
  if (valueDisplay) {
    valueDisplay.textContent = percentage.toString();
  }

  // Dispatch change event
  const event = new CustomEvent('change', { detail: { value: percentage } });
  slider.dispatchEvent(event);
}

/**
 * Get current slider value
 */
function getSliderValue(thumb: HTMLElement): number {
  const track = thumb
    .closest('.neu-slider-container')
    ?.querySelector<HTMLElement>('.neu-slider-track');
  if (!track) return 0;

  const thumbWidth = thumb.offsetWidth;
  const trackWidth = track.offsetWidth;
  const maxLeft = trackWidth - thumbWidth;
  const left = thumb.offsetLeft;

  return Math.round((left / maxLeft) * 100);
}
