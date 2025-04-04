import type { CarouselElements } from './types';

let currentSlide = 0;
let isAnimating = false;
let autoplayInterval: number | null = null;

/**
 * Initialize carousels
 */
export function initCarousels(): void {
  const carousels = document.querySelectorAll<HTMLElement>('.neu-carousel');

  carousels.forEach(carousel => {
    const elements = getCarouselElements(carousel);
    if (!elements) return;

    const { container, track, slides, prevButton, nextButton, indicators } = elements;

    // Add ARIA attributes
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Carousel');
    track.setAttribute('role', 'list');
    slides.forEach(slide => slide.setAttribute('role', 'listitem'));

    // Add event listeners
    prevButton.addEventListener('click', () => navigateCarousel(carousel, 'prev'));
    nextButton.addEventListener('click', () => navigateCarousel(carousel, 'next'));

    // Add keyboard navigation
    container.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateCarousel(carousel, 'prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateCarousel(carousel, 'next');
      }
    });

    // Add indicator click handlers
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => {
        if (index !== currentSlide) {
          navigateCarousel(carousel, 'to', index);
        }
      });
    });

    // Initialize autoplay
    startAutoplay(carousel);

    // Pause autoplay on hover
    container.addEventListener('mouseenter', () => pauseAutoplay());
    container.addEventListener('mouseleave', () => startAutoplay(carousel));
  });
}

/**
 * Get carousel elements
 */
function getCarouselElements(carousel: HTMLElement): CarouselElements | null {
  const container = carousel;
  const track = carousel.querySelector<HTMLElement>('.neu-carousel-track');
  const slides = Array.from(carousel.querySelectorAll<HTMLElement>('.neu-carousel-slide'));
  const prevButton = carousel.querySelector<HTMLElement>('.neu-carousel-prev');
  const nextButton = carousel.querySelector<HTMLElement>('.neu-carousel-next');
  const indicators = Array.from(carousel.querySelectorAll<HTMLElement>('.neu-carousel-indicator'));

  if (!track ?? (slides.length === 0 || !prevButton || !nextButton || indicators.length === 0)) {
    return null;
  }

  return { container, track, slides, prevButton, nextButton, indicators };
}

/**
 * Navigate carousel
 */
function navigateCarousel(
  carousel: HTMLElement,
  direction: 'prev' | 'next' | 'to',
  targetIndex?: number
): void {
  if (isAnimating) return;

  const elements = getCarouselElements(carousel);
  if (!elements) return;

  const { track, slides, indicators } = elements;
  const slideCount = slides.length;

  let newIndex: number;

  if (direction === 'to' && typeof targetIndex === 'number') {
    newIndex = targetIndex;
  } else {
    newIndex =
      direction === 'prev'
        ? (currentSlide - 1 + slideCount) % slideCount
        : (currentSlide + 1) % slideCount;
  }

  if (newIndex === currentSlide) return;

  isAnimating = true;

  // Update indicators
  indicators[currentSlide].classList.remove('neu-carousel-indicator-active');
  indicators[newIndex].classList.add('neu-carousel-indicator-active');

  // Animate slides
  const slideWidth = slides[0].offsetWidth;
  const offset = -newIndex * slideWidth;

  track.style.transition = 'transform 0.3s ease-in-out';
  track.style.transform = `translateX(${offset}px)`;

  // Update current slide
  currentSlide = newIndex;

  // Reset animation flag
  setTimeout(() => {
    isAnimating = false;
  }, 300);

  // Reset autoplay
  resetAutoplay(carousel);
}

/**
 * Start autoplay
 */
function startAutoplay(carousel: HTMLElement): void {
  if (autoplayInterval) return;

  autoplayInterval = window.setInterval(() => {
    navigateCarousel(carousel, 'next');
  }, 5000);
}

/**
 * Pause autoplay
 */
function pauseAutoplay(): void {
  if (autoplayInterval) {
    clearInterval(autoplayInterval);
    autoplayInterval = null;
  }
}

/**
 * Reset autoplay
 */
function resetAutoplay(carousel: HTMLElement): void {
  pauseAutoplay();
  startAutoplay(carousel);
}
