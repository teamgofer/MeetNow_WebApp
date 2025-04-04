let isDragging = false;
let currentSlider = null;
export function initColorPickers() {
    const colorPickers = document.querySelectorAll('.neu-color-picker');
    colorPickers.forEach(picker => {
        const elements = getColorPickerElements(picker);
        if (!elements)
            return;
        const { input, preview, hueSlider, saturationSlider, lightnessSlider } = elements;
        input.setAttribute('role', 'spinbutton');
        input.setAttribute('aria-valuemin', '0');
        input.setAttribute('aria-valuemax', '360');
        input.setAttribute('aria-valuenow', '0');
        input.addEventListener('input', () => updateColor(picker));
        hueSlider.addEventListener('mousedown', e => handleSliderDrag(e, hueSlider));
        saturationSlider.addEventListener('mousedown', e => handleSliderDrag(e, saturationSlider));
        lightnessSlider.addEventListener('mousedown', e => handleSliderDrag(e, lightnessSlider));
        updateColor(picker);
    });
}
function getColorPickerElements(picker) {
    const input = picker.querySelector('.neu-color-input');
    const preview = picker.querySelector('.neu-color-preview');
    const hueSlider = picker.querySelector('.neu-color-hue-slider');
    const saturationSlider = picker.querySelector('.neu-color-saturation-slider');
    const lightnessSlider = picker.querySelector('.neu-color-lightness-slider');
    if (!input ?? (!preview || !hueSlider || !saturationSlider || !lightnessSlider)) {
        return null;
    }
    return { input, preview, hueSlider, saturationSlider, lightnessSlider };
}
function handleSliderDrag(e, slider) {
    isDragging = true;
    currentSlider = slider;
    document.addEventListener('mousemove', handleSliderMove);
    document.addEventListener('mouseup', stopSliderDrag);
    updateSliderValue(e, slider);
}
function handleSliderMove(e) {
    if (!isDragging ?? !currentSlider)
        return;
    updateSliderValue(e, currentSlider);
}
function stopSliderDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', handleSliderMove);
    document.removeEventListener('mouseup', stopSliderDrag);
    currentSlider = null;
}
function updateSliderValue(e, slider) {
    const rect = slider.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const value = Math.max(0, Math.min(100, (x / width) * 100));
    slider.style.setProperty('--value', `${value}%`);
    const picker = slider.closest('.neu-color-picker');
    if (picker) {
        updateColor(picker);
    }
}
function updateColor(picker) {
    const elements = getColorPickerElements(picker);
    if (!elements)
        return;
    const { input, preview, hueSlider, saturationSlider, lightnessSlider } = elements;
    const hue = parseInt(input.value) || 0;
    const saturation = parseInt(hueSlider.style.getPropertyValue('--value') || '100');
    const lightness = parseInt(saturationSlider.style.getPropertyValue('--value') || '50');
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    preview.style.backgroundColor = color;
    input.setAttribute('aria-valuenow', hue.toString());
    const event = new CustomEvent('change', { detail: { color } });
    picker.dispatchEvent(event);
}
//# sourceMappingURL=color-picker.js.map