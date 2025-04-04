let currentSlide = 0;
let isAnimating = false;
let autoplayInterval = null;
export function initCarousels() {
    const carousels = document.querySelectorAll('.neu-carousel');
    carousels.forEach(carousel => {
        const elements = getCarouselElements(carousel);
        if (!elements)
            return;
        const { container, track, slides, prevButton, nextButton, indicators } = elements;
        container.setAttribute('role', 'region');
        container.setAttribute('aria-label', 'Carousel');
        track.setAttribute('role', 'list');
        slides.forEach(slide => slide.setAttribute('role', 'listitem'));
        prevButton.addEventListener('click', () => navigateCarousel(carousel, 'prev'));
        nextButton.addEventListener('click', () => navigateCarousel(carousel, 'next'));
        container.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                navigateCarousel(carousel, 'prev');
            }
            else if (e.key === 'ArrowRight') {
                e.preventDefault();
                navigateCarousel(carousel, 'next');
            }
        });
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                if (index !== currentSlide) {
                    navigateCarousel(carousel, 'to', index);
                }
            });
        });
        startAutoplay(carousel);
        container.addEventListener('mouseenter', () => pauseAutoplay());
        container.addEventListener('mouseleave', () => startAutoplay(carousel));
    });
}
function getCarouselElements(carousel) {
    const container = carousel;
    const track = carousel.querySelector('.neu-carousel-track');
    const slides = Array.from(carousel.querySelectorAll('.neu-carousel-slide'));
    const prevButton = carousel.querySelector('.neu-carousel-prev');
    const nextButton = carousel.querySelector('.neu-carousel-next');
    const indicators = Array.from(carousel.querySelectorAll('.neu-carousel-indicator'));
    if (!track ?? (slides.length === 0 || !prevButton || !nextButton || indicators.length === 0)) {
        return null;
    }
    return { container, track, slides, prevButton, nextButton, indicators };
}
function navigateCarousel(carousel, direction, targetIndex) {
    if (isAnimating)
        return;
    const elements = getCarouselElements(carousel);
    if (!elements)
        return;
    const { track, slides, indicators } = elements;
    const slideCount = slides.length;
    let newIndex;
    if (direction === 'to' && typeof targetIndex === 'number') {
        newIndex = targetIndex;
    }
    else {
        newIndex =
            direction === 'prev'
                ? (currentSlide - 1 + slideCount) % slideCount
                : (currentSlide + 1) % slideCount;
    }
    if (newIndex === currentSlide)
        return;
    isAnimating = true;
    indicators[currentSlide].classList.remove('neu-carousel-indicator-active');
    indicators[newIndex].classList.add('neu-carousel-indicator-active');
    const slideWidth = slides[0].offsetWidth;
    const offset = -newIndex * slideWidth;
    track.style.transition = 'transform 0.3s ease-in-out';
    track.style.transform = `translateX(${offset}px)`;
    currentSlide = newIndex;
    setTimeout(() => {
        isAnimating = false;
    }, 300);
    resetAutoplay(carousel);
}
function startAutoplay(carousel) {
    if (autoplayInterval)
        return;
    autoplayInterval = window.setInterval(() => {
        navigateCarousel(carousel, 'next');
    }, 5000);
}
function pauseAutoplay() {
    if (autoplayInterval) {
        clearInterval(autoplayInterval);
        autoplayInterval = null;
    }
}
function resetAutoplay(carousel) {
    pauseAutoplay();
    startAutoplay(carousel);
}
//# sourceMappingURL=carousel.js.map