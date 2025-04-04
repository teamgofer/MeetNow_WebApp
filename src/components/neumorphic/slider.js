let isDragging = false;
let startX = 0;
let startY = 0;
let startLeft = 0;
let currentSlider = null;
let currentThumb = null;
export function initSliders() {
    const sliders = document.querySelectorAll('.neu-slider-container');
    sliders.forEach(slider => {
        const elements = getSliderElements(slider);
        if (!elements)
            return;
        const { track, trackInner, progress, thumb, valueDisplay } = elements;
        const sliderId = `slider-${Math.random().toString(36).substring(2, 10)}`;
        slider.id = sliderId;
        thumb.setAttribute('role', 'slider');
        thumb.setAttribute('aria-valuemin', '0');
        thumb.setAttribute('aria-valuemax', '100');
        thumb.setAttribute('aria-valuenow', getSliderValue(thumb).toString());
        thumb.addEventListener('mousedown', handleDrag);
        thumb.addEventListener('touchstart', handleTouchDrag);
        updateSlider(slider, getSliderValue(thumb));
    });
}
function getSliderElements(slider) {
    const track = slider.querySelector('.neu-slider-track');
    const trackInner = slider.querySelector('.neu-slider-track-inner');
    const progress = slider.querySelector('.neu-slider-progress');
    const thumb = slider.querySelector('.neu-slider-thumb');
    const valueDisplay = slider.querySelector('.neu-slider-value');
    if (!track ?? (!trackInner || !progress || !thumb || !valueDisplay)) {
        return null;
    }
    return { track, trackInner, progress, thumb, valueDisplay };
}
function handleDrag(e) {
    const thumb = e.currentTarget;
    isDragging = true;
    currentSlider = thumb.closest('.neu-slider-container');
    currentThumb = thumb;
    if (!currentSlider)
        return;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = thumb.offsetLeft;
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', stopDrag);
}
function handleTouchDrag(e) {
    const thumb = e.currentTarget;
    isDragging = true;
    currentSlider = thumb.closest('.neu-slider-container');
    currentThumb = thumb;
    if (!currentSlider)
        return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startLeft = thumb.offsetLeft;
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', stopDrag);
}
function handleDragMove(e) {
    if (!isDragging ?? (!currentSlider || !currentThumb))
        return;
    const deltaX = e.clientX - startX;
    const newLeft = Math.max(0, Math.min(startLeft + deltaX, currentThumb.parentElement?.offsetWidth ?? 0));
    currentThumb.style.left = `${newLeft}px`;
    const percentage = getSliderValue(currentThumb);
    updateSlider(currentSlider, percentage);
}
function handleTouchMove(e) {
    if (!isDragging ?? (!currentSlider || !currentThumb))
        return;
    const deltaX = e.touches[0].clientX - startX;
    const newLeft = Math.max(0, Math.min(startLeft + deltaX, currentThumb.parentElement?.offsetWidth ?? 0));
    currentThumb.style.left = `${newLeft}px`;
    const percentage = getSliderValue(currentThumb);
    updateSlider(currentSlider, percentage);
}
function stopDrag() {
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
function updateSlider(slider, percentage) {
    const elements = getSliderElements(slider);
    if (!elements)
        return;
    const { track, trackInner, progress, thumb, valueDisplay } = elements;
    const thumbWidth = thumb.offsetWidth;
    const trackWidth = track.offsetWidth;
    const maxLeft = trackWidth - thumbWidth;
    const left = (percentage / 100) * maxLeft;
    thumb.style.left = `${left}px`;
    progress.style.width = `${percentage}%`;
    thumb.setAttribute('aria-valuenow', percentage.toString());
    if (valueDisplay) {
        valueDisplay.textContent = percentage.toString();
    }
    const event = new CustomEvent('change', { detail: { value: percentage } });
    slider.dispatchEvent(event);
}
function getSliderValue(thumb) {
    const track = thumb
        .closest('.neu-slider-container')
        ?.querySelector('.neu-slider-track');
    if (!track)
        return 0;
    const thumbWidth = thumb.offsetWidth;
    const trackWidth = track.offsetWidth;
    const maxLeft = trackWidth - thumbWidth;
    const left = thumb.offsetLeft;
    return Math.round((left / maxLeft) * 100);
}
//# sourceMappingURL=slider.js.map