/**
 * Neumorphic UI Component Library - JavaScript
 * This file provides interactive functionality for the neumorphic UI components
 */

// Initialize all components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initAccordions();
  initSliders();
  initCarousels();
  initColorPickers();
  initThemeToggle();
  enhanceAccessibility();
  initFogOfWar();
});

/**
 * Initialize accordions
 */
function initAccordions() {
  const accordionHeaders = document.querySelectorAll('.neu-accordion-header');
  
  accordionHeaders.forEach(header => {
    // Add ARIA attributes
    header.setAttribute('aria-expanded', header.parentElement.classList.contains('neu-accordion-item-open') ? 'true' : 'false');
    const contentId = `accordion-content-${Math.random().toString(36).substring(2, 10)}`;
    header.setAttribute('aria-controls', contentId);
    header.nextElementSibling.id = contentId;
    header.nextElementSibling.setAttribute('aria-hidden', header.parentElement.classList.contains('neu-accordion-item-open') ? 'false' : 'true');
    
    // Add keyboard support
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    
    // Click event
    header.addEventListener('click', toggleAccordion);
    
    // Keyboard event
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleAccordion.call(header);
      }
    });
    
    // Initialize open accordions
    if (header.parentElement.classList.contains('neu-accordion-item-open')) {
      const content = header.nextElementSibling;
      content.style.height = content.scrollHeight + 'px';
    }
  });
}

/**
 * Toggle accordion state
 */
function toggleAccordion() {
  const item = this.parentElement;
  const content = this.nextElementSibling;
  const arrow = this.querySelector('.neu-accordion-arrow');
  
  // Toggle open state
  const isOpen = item.classList.contains('neu-accordion-item-open');
  
  if (isOpen) {
    item.classList.remove('neu-accordion-item-open');
    arrow.classList.remove('neu-accordion-arrow-open');
    content.style.height = '0px';
    this.setAttribute('aria-expanded', 'false');
    content.setAttribute('aria-hidden', 'true');
  } else {
    item.classList.add('neu-accordion-item-open');
    arrow.classList.add('neu-accordion-arrow-open');
    content.style.height = content.scrollHeight + 'px';
    this.setAttribute('aria-expanded', 'true');
    content.setAttribute('aria-hidden', 'false');
  }
}

/**
 * Initialize sliders
 */
function initSliders() {
  const sliders = document.querySelectorAll('.neu-slider-container');
  
  sliders.forEach(slider => {
    const track = slider.querySelector('.neu-slider-track');
    const trackInner = slider.querySelector('.neu-slider-track-inner');
    const progress = slider.querySelector('.neu-slider-progress');
    const thumb = slider.querySelector('.neu-slider-thumb');
    const valueDisplay = slider.querySelector('.neu-slider-value');
    
    // Generate unique ID for slider for aria-labelled-by
    const sliderId = `slider-${Math.random().toString(36).substring(2, 10)}`;
    slider.id = sliderId;
    
    // Add ARIA attributes
    thumb.setAttribute('role', 'slider');
    thumb.setAttribute('aria-valuemin', '0');
    thumb.setAttribute('aria-valuemax', '100');
    thumb.setAttribute('aria-valuenow', getSliderValue(thumb));
    thumb.setAttribute('aria-labelledby', sliderId);
    thumb.setAttribute('tabindex', '0');
    
    // Make slider interactive
    let isDragging = false;
    
    // Click on track
    track.addEventListener('click', (e) => {
      e.preventDefault();
      const rect = trackInner.getBoundingClientRect();
      const percentage = ((e.clientX - rect.left) / rect.width) * 100;
      updateSlider(slider, percentage);
    });
    
    // Drag thumb
    thumb.addEventListener('mousedown', (e) => {
      e.preventDefault();
      isDragging = true;
      thumb.classList.add('neu-slider-thumb-active');
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', stopDrag);
    });
    
    // Touch events for mobile
    thumb.addEventListener('touchstart', (e) => {
      isDragging = true;
      thumb.classList.add('neu-slider-thumb-active');
      document.addEventListener('touchmove', handleTouchDrag);
      document.addEventListener('touchend', stopDrag);
    });
    
    // Keyboard support
    thumb.addEventListener('keydown', (e) => {
      let percentage = parseFloat(thumb.style.left);
      if (isNaN(percentage)) percentage = 0;
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault();
          percentage = Math.max(0, percentage - 1);
          updateSlider(slider, percentage);
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault();
          percentage = Math.min(100, percentage + 1);
          updateSlider(slider, percentage);
          break;
        case 'Home':
          e.preventDefault();
          updateSlider(slider, 0);
          break;
        case 'End':
          e.preventDefault();
          updateSlider(slider, 100);
          break;
      }
    });
    
    function handleDrag(e) {
      if (!isDragging) return;
      const rect = trackInner.getBoundingClientRect();
      let percentage = ((e.clientX - rect.left) / rect.width) * 100;
      percentage = Math.max(0, Math.min(100, percentage));
      updateSlider(slider, percentage);
    }
    
    function handleTouchDrag(e) {
      if (!isDragging) return;
      const touch = e.touches[0];
      const rect = trackInner.getBoundingClientRect();
      let percentage = ((touch.clientX - rect.left) / rect.width) * 100;
      percentage = Math.max(0, Math.min(100, percentage));
      updateSlider(slider, percentage);
    }
    
    function stopDrag() {
      isDragging = false;
      thumb.classList.remove('neu-slider-thumb-active');
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchmove', handleTouchDrag);
      document.removeEventListener('touchend', stopDrag);
    }
  });
}

/**
 * Update slider position and value
 */
function updateSlider(slider, percentage) {
  percentage = Math.max(0, Math.min(100, percentage));
  
  const progress = slider.querySelector('.neu-slider-progress');
  const thumb = slider.querySelector('.neu-slider-thumb');
  const valueDisplay = slider.querySelector('.neu-slider-value');
  
  // Update visual elements
  progress.style.width = `${percentage}%`;
  thumb.style.left = `${percentage}%`;
  
  // Update value display if it exists
  if (valueDisplay) {
    if (valueDisplay.textContent.includes('%')) {
      valueDisplay.textContent = `${Math.round(percentage)}%`;
    } else {
      valueDisplay.textContent = Math.round(percentage);
    }
  }
  
  // Update ARIA value
  thumb.setAttribute('aria-valuenow', Math.round(percentage));
  
  // Trigger change event
  const event = new CustomEvent('neu-slider-change', {
    bubbles: true,
    detail: { value: percentage }
  });
  slider.dispatchEvent(event);
}

/**
 * Get current slider value
 */
function getSliderValue(thumb) {
  const left = thumb.style.left;
  if (left.endsWith('%')) {
    return parseInt(left);
  }
  return 0;
}

/**
 * Initialize carousels
 */
function initCarousels() {
  const carousels = document.querySelectorAll('.neu-carousel');
  
  carousels.forEach(carousel => {
    const slidesContainer = carousel.querySelector('.neu-carousel-slides');
    const slides = carousel.querySelectorAll('.neu-carousel-slide');
    const prevButton = carousel.querySelector('.neu-carousel-prev');
    const nextButton = carousel.querySelector('.neu-carousel-next');
    const indicators = carousel.querySelectorAll('.neu-carousel-indicator');
    
    if (!slides.length) return;
    
    let currentIndex = 0;
    let autoplayInterval = null;
    const autoplay = carousel.hasAttribute('data-autoplay');
    const autoplaySpeed = carousel.getAttribute('data-autoplay-speed') || 5000;
    
    // Setup ARIA attributes
    carousel.setAttribute('role', 'region');
    carousel.setAttribute('aria-roledescription', 'carousel');
    slidesContainer.setAttribute('aria-live', autoplay ? 'off' : 'polite');
    
    slides.forEach((slide, index) => {
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', `${index + 1} of ${slides.length}`);
      slide.setAttribute('aria-hidden', index === currentIndex ? 'false' : 'true');
    });
    
    // Initialize indicators
    if (indicators.length) {
      indicators.forEach((indicator, index) => {
        indicator.setAttribute('role', 'button');
        indicator.setAttribute('tabindex', '0');
        indicator.setAttribute('aria-label', `Go to slide ${index + 1}`);
        indicator.setAttribute('aria-pressed', index === currentIndex ? 'true' : 'false');
        
        indicator.addEventListener('click', () => {
          goToSlide(index);
        });
        
        indicator.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            goToSlide(index);
          }
        });
      });
    }
    
    // Setup navigation
    if (prevButton) {
      prevButton.setAttribute('aria-label', 'Previous slide');
      prevButton.addEventListener('click', () => {
        goToSlide(currentIndex - 1);
      });
    }
    
    if (nextButton) {
      nextButton.setAttribute('aria-label', 'Next slide');
      nextButton.addEventListener('click', () => {
        goToSlide(currentIndex + 1);
      });
    }
    
    // Keyboard navigation
    carousel.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToSlide(currentIndex - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToSlide(currentIndex + 1);
          break;
      }
    });
    
    // Touch/swipe support
    let touchStartX = 0;
    let touchEndX = 0;
    
    carousel.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    carousel.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
      const threshold = 50;
      if (touchStartX - touchEndX > threshold) {
        goToSlide(currentIndex + 1);
      } else if (touchEndX - touchStartX > threshold) {
        goToSlide(currentIndex - 1);
      }
    }
    
    // Autoplay
    if (autoplay) {
      startAutoplay();
      
      carousel.addEventListener('mouseenter', () => {
        stopAutoplay();
      });
      
      carousel.addEventListener('mouseleave', () => {
        startAutoplay();
      });
      
      carousel.addEventListener('focusin', () => {
        stopAutoplay();
      });
      
      carousel.addEventListener('focusout', () => {
        startAutoplay();
      });
    }
    
    function startAutoplay() {
      if (autoplayInterval) clearInterval(autoplayInterval);
      autoplayInterval = setInterval(() => {
        goToSlide(currentIndex + 1);
      }, autoplaySpeed);
    }
    
    function stopAutoplay() {
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
        autoplayInterval = null;
      }
    }
    
    function goToSlide(index) {
      // Handle wraparound
      if (index < 0) {
        index = slides.length - 1;
      } else if (index >= slides.length) {
        index = 0;
      }
      
      // Update current index
      currentIndex = index;
      
      // Update slide visibility and position
      slidesContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
      
      // Update ARIA attributes
      slides.forEach((slide, i) => {
        slide.setAttribute('aria-hidden', i === currentIndex ? 'false' : 'true');
      });
      
      // Update indicators
      indicators.forEach((indicator, i) => {
        indicator.classList.toggle('neu-carousel-indicator-active', i === currentIndex);
        indicator.setAttribute('aria-pressed', i === currentIndex ? 'true' : 'false');
      });
      
      // Reset autoplay timer
      if (autoplay && autoplayInterval) {
        stopAutoplay();
        startAutoplay();
      }
    }
  });
}

/**
 * Initialize color pickers
 */
function initColorPickers() {
  const colorPickers = document.querySelectorAll('.neu-color-picker-container');
  
  colorPickers.forEach(picker => {
    const swatch = picker.querySelector('.neu-color-picker-swatch');
    const valueDisplay = picker.querySelector('.neu-color-picker-value');
    const dropdown = picker.querySelector('.neu-color-picker-dropdown');
    const presetButtons = picker.querySelectorAll('.neu-color-picker-preset');
    const customColorInput = picker.querySelector('.neu-color-picker-custom-input');
    
    if (!swatch) return;
    
    let isOpen = false;
    let currentColor = swatch.style.backgroundColor || '#3f51b5';
    
    // Add ARIA attributes
    swatch.setAttribute('aria-haspopup', 'true');
    swatch.setAttribute('aria-expanded', 'false');
    
    if (dropdown) {
      const dropdownId = `color-dropdown-${Math.random().toString(36).substring(2, 10)}`;
      dropdown.id = dropdownId;
      swatch.setAttribute('aria-controls', dropdownId);
    }
    
    // Toggle dropdown
    swatch.addEventListener('click', () => {
      if (dropdown) {
        isOpen = !isOpen;
        dropdown.classList.toggle('neu-color-picker-dropdown-open', isOpen);
        swatch.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (isOpen && !picker.contains(e.target)) {
        isOpen = false;
        dropdown.classList.remove('neu-color-picker-dropdown-open');
        swatch.setAttribute('aria-expanded', 'false');
      }
    });
    
    // Handle preset selections
    if (presetButtons) {
      presetButtons.forEach(preset => {
        preset.addEventListener('click', () => {
          const color = preset.getAttribute('data-color');
          updateColor(color);
          if (dropdown) {
            isOpen = false;
            dropdown.classList.remove('neu-color-picker-dropdown-open');
            swatch.setAttribute('aria-expanded', 'false');
          }
        });
      });
    }
    
    // Handle custom color input
    if (customColorInput) {
      customColorInput.addEventListener('change', () => {
        updateColor(customColorInput.value);
      });
    }
    
    function updateColor(color) {
      currentColor = color;
      swatch.style.backgroundColor = color;
      
      if (valueDisplay) {
        valueDisplay.textContent = color;
      }
      
      // Trigger change event
      const event = new CustomEvent('neu-color-change', {
        bubbles: true,
        detail: { color: color }
      });
      picker.dispatchEvent(event);
    }
  });
}

/**
 * Initialize theme toggle
 */
function initThemeToggle() {
  const themeToggles = document.querySelectorAll('.neu-theme-toggle');
  
  // Check for system preference
  const prefersDarkTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Check for saved preference
  let currentTheme = localStorage.getItem('neuTheme') || (prefersDarkTheme ? 'dark' : 'light');
  
  // Apply saved theme
  if (currentTheme === 'dark') {
    document.body.classList.add('neu-dark-theme');
  } else {
    document.body.classList.remove('neu-dark-theme');
  }
  
  // Update toggle state
  themeToggles.forEach(toggle => {
    const input = toggle.querySelector('input');
    if (input) {
      input.checked = currentTheme === 'dark';
    }
    
    // Toggle theme on click
    toggle.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      // Save preference
      localStorage.setItem('neuTheme', currentTheme);
      
      // Apply theme
      if (currentTheme === 'dark') {
        document.body.classList.add('neu-dark-theme');
      } else {
        document.body.classList.remove('neu-dark-theme');
      }
      
      // Update toggles
      themeToggles.forEach(otherToggle => {
        const otherInput = otherToggle.querySelector('input');
        if (otherInput) {
          otherInput.checked = currentTheme === 'dark';
        }
      });
    });
  });
  
  // Listen for system preference changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      // Only change if user hasn't manually set a preference
      if (!localStorage.getItem('neuTheme')) {
        currentTheme = e.matches ? 'dark' : 'light';
        
        if (currentTheme === 'dark') {
          document.body.classList.add('neu-dark-theme');
        } else {
          document.body.classList.remove('neu-dark-theme');
        }
        
        // Update toggles
        themeToggles.forEach(toggle => {
          const input = toggle.querySelector('input');
          if (input) {
            input.checked = currentTheme === 'dark';
          }
        });
      }
    });
  }
}

/**
 * Enhance accessibility for all components
 */
function enhanceAccessibility() {
  // Add focus styles
  document.querySelectorAll('button, a, input, select, [tabindex="0"]').forEach(el => {
    if (!el.classList.contains('neu-no-focus-outline')) {
      el.addEventListener('focus', () => {
        el.classList.add('neu-focus-outline');
      });
      
      el.addEventListener('blur', () => {
        el.classList.remove('neu-focus-outline');
      });
    }
  });
  
  // Skip navigation link for keyboard users
  const skipNavLink = document.createElement('a');
  skipNavLink.textContent = 'Skip to main content';
  skipNavLink.href = '#main';
  skipNavLink.className = 'neu-sr-only neu-sr-only-focusable';
  document.body.insertBefore(skipNavLink, document.body.firstChild);
}

/**
 * Initialize map overlays for the given context
 * @param {HTMLElement|null} context - The context element (container) to initialize within, or null for document
 */
function initMapOverlays(context = null) {
  const ctx = context || document;
  const mapContainers = ctx.querySelectorAll('.neu-map-container');
  
  mapContainers.forEach(container => {
    const overlay = container.querySelector('.neu-map-overlay');
    if (!overlay) return;
    
    const overlayType = overlay.getAttribute('data-overlay-type');
    if (!overlayType) return;
    
    // Check if we should use real data
    const useRealData = container.getAttribute('data-use-real-data') !== 'false';
    
    // Get map coordinates
    const lat = parseFloat(container.getAttribute('data-lat') || '40.7128'); // Default to New York
    const lon = parseFloat(container.getAttribute('data-lon') || '-74.0060');
    
    // Clear previous content
    overlay.innerHTML = '';
    
    // Initialize the correct overlay type
    switch (overlayType) {
      case 'radar':
        initRadarOverlay(overlay);
        break;
      case 'weather':
        if (useRealData) {
          initRealWeatherOverlay(overlay, lat, lon);
        } else {
          initWeatherOverlay(overlay);
        }
        break;
      case 'heat':
        initHeatmapOverlay(overlay, container);
        break;
      case 'traffic':
        if (useRealData) {
          initRealTrafficOverlay(overlay, lat, lon);
        } else {
          initTrafficOverlay(overlay, container);
        }
        break;
      case 'pollution':
        if (useRealData) {
          initRealPollutionOverlay(overlay, lat, lon);
        } else {
          initPollutionOverlay(overlay, container);
        }
        break;
      case 'sunshine':
        if (useRealData) {
          initRealSunshineOverlay(overlay, lat, lon);
        } else {
          initSunshineOverlay(overlay, container);
        }
        break;
      case 'fogOfWar':
        initFogOfWarOverlay(overlay, container);
        break;
    }
  });
}

/**
 * Initialize a radar/sonar overlay
 * @param {HTMLElement} overlay - The overlay element to initialize
 */
function initRadarOverlay(overlay) {
  // Add sonar specific classes
  overlay.classList.add('neu-map-sonar-overlay');
  
  // Add sonar elements
  const sonarCenter = document.createElement('div');
  sonarCenter.className = 'neu-sonar-center';
  sonarCenter.style.left = '50%';
  sonarCenter.style.top = '50%';
  
  const sonarGrid = document.createElement('div');
  sonarGrid.className = 'neu-sonar-grid';
  
  const sonarCircles = document.createElement('div');
  sonarCircles.className = 'neu-sonar-circles';
  
  // Create scan line
  const scanLine = document.createElement('div');
  scanLine.className = 'neu-sonar-scan-line';
  
  // Add elements to overlay
  overlay.appendChild(sonarGrid);
  overlay.appendChild(sonarCircles);
  overlay.appendChild(scanLine);
  overlay.appendChild(sonarCenter);
  
  // Add pulse effect
  setInterval(() => {
    const pulse = document.createElement('div');
    pulse.className = 'neu-sonar-pulse';
    pulse.style.top = '50%';
    pulse.style.left = '50%';
    pulse.style.width = '100%';
    pulse.style.height = '100%';
    pulse.style.transform = 'translate(-50%, -50%) scale(0)';
    
    overlay.appendChild(pulse);
    
    // Remove pulse after animation completes
    setTimeout(() => {
      pulse.remove();
    }, 3000);
  }, 3000);
  
  // Add random blips
  const addRandomBlip = () => {
    const blip = document.createElement('div');
    blip.className = 'neu-sonar-blip';
    
    // Random position within container
    const left = 10 + Math.random() * 80; // 10-90% to keep away from edges
    const top = 10 + Math.random() * 80;
    
    blip.style.left = `${left}%`;
    blip.style.top = `${top}%`;
    
    overlay.appendChild(blip);
    
    // Remove blip after animation completes
    setTimeout(() => {
      blip.remove();
    }, 1000);
    
    // Schedule next blip
    setTimeout(addRandomBlip, 2000 + Math.random() * 4000);
  };
  
  // Start adding blips
  setTimeout(addRandomBlip, 1000);
}

/**
 * Initialize a weather overlay with static demo data
 * @param {HTMLElement} overlay - The overlay element to initialize
 */
function initWeatherOverlay(overlay) {
  // Create rain container
  const rainContainer = document.createElement('div');
  rainContainer.className = 'neu-rain-container';
  
  // Add rain drops
  const dropCount = 80;
  for (let i = 0; i < dropCount; i++) {
    const drop = document.createElement('div');
    drop.className = 'neu-rain-drop';
    
    // Random position and timing
    const left = Math.random() * 100;
    const delay = Math.random() * 2;
    const duration = 0.5 + Math.random() * 0.7;
    
    drop.style.left = `${left}%`;
    drop.style.animationDelay = `${delay}s`;
    drop.style.animationDuration = `${duration}s`;
    
    rainContainer.appendChild(drop);
  }
  
  // Add cloud cover
  const cloudCover = document.createElement('div');
  cloudCover.className = 'neu-cloud-cover';
  
  overlay.appendChild(cloudCover);
  overlay.appendChild(rainContainer);
}

/**
 * Initialize a weather overlay with real-time data from Open-Meteo API
 * @param {HTMLElement} overlay - The overlay element to initialize
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 */
async function initRealWeatherOverlay(overlay, lat, lon) {
  // Add loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'neu-map-loading';
  loadingIndicator.innerHTML = '<div class="neu-map-loading-spinner"></div>';
  overlay.appendChild(loadingIndicator);
  
  try {
    // Fetch weather data
    const weatherData = await window.mapAPI.weather.fetchData(lat, lon);
    
    if (!weatherData) {
      throw new Error('No weather data available');
    }
    
    // Remove loading indicator
    loadingIndicator.remove();
    
    // Create weather info badge
    const weatherInfo = document.createElement('div');
    weatherInfo.className = 'neu-weather-info';
    
    // Add temperature
    const tempDisplay = document.createElement('div');
    tempDisplay.className = 'neu-weather-temp';
    tempDisplay.textContent = `${Math.round(weatherData.temperature)}${weatherData.temperatureUnit}`;
    weatherInfo.appendChild(tempDisplay);
    
    // Add weather icon based on type
    const weatherIcon = document.createElement('div');
    weatherIcon.className = `neu-weather-icon ${window.mapAPI.weather.getWeatherIconClass(weatherData.weatherType)}`;
    weatherInfo.appendChild(weatherIcon);
    
    // Add extra info (precipitation probability)
    if (weatherData.precipitationProbability > 0) {
      const precipProb = document.createElement('div');
      precipProb.className = 'neu-weather-precip-prob';
      precipProb.textContent = `${weatherData.precipitationProbability}% chance of rain`;
      weatherInfo.appendChild(precipProb);
    }
    
    overlay.appendChild(weatherInfo);
    
    // Create cloud cover based on data
    const cloudCover = document.createElement('div');
    cloudCover.className = 'neu-cloud-cover';
    cloudCover.style.opacity = weatherData.cloudCover / 100 * 0.7; // Scale 0-100% to 0-0.7 opacity
    overlay.appendChild(cloudCover);
    
    // Add rain if needed
    if (weatherData.rainIntensity > 0) {
      const rainContainer = document.createElement('div');
      rainContainer.className = 'neu-rain-container';
      
      // Scale number of drops based on intensity
      const baseDrops = 80;
      const dropCount = Math.round(baseDrops * weatherData.rainIntensity);
      
      for (let i = 0; i < dropCount; i++) {
        const drop = document.createElement('div');
        drop.className = weatherData.weatherType === 'snow' ? 'neu-snow-flake' : 'neu-rain-drop';
        
        // Random position and timing
        const left = Math.random() * 100;
        const delay = Math.random() * 2;
        const duration = (0.5 + Math.random() * 0.7) * (weatherData.weatherType === 'snow' ? 3 : 1);
        
        drop.style.left = `${left}%`;
        drop.style.animationDelay = `${delay}s`;
        drop.style.animationDuration = `${duration}s`;
        
        rainContainer.appendChild(drop);
      }
      
      overlay.appendChild(rainContainer);
    }
    
    // Add data note at the bottom
    const dataNote = document.createElement('div');
    dataNote.className = 'neu-map-data-note';
    dataNote.textContent = 'Data source: Open-Meteo API';
    overlay.appendChild(dataNote);
    
  } catch (error) {
    console.error('Error initializing weather overlay:', error);
    
    // Remove loading indicator
    loadingIndicator.remove();
    
    // Show error message
    const errorMsg = document.createElement('div');
    errorMsg.className = 'neu-map-no-data';
    errorMsg.textContent = 'Weather data unavailable';
    overlay.appendChild(errorMsg);
    
    // Fall back to demo overlay
    initWeatherOverlay(overlay);
  }
}

/**
 * Initialize a heatmap overlay
 * @param {HTMLElement} overlay - The overlay element to initialize
 * @param {HTMLElement} container - The map container element
 */
function initHeatmapOverlay(overlay, container) {
  // ... existing code ...
}

/**
 * Initialize a traffic overlay with static demo data
 * @param {HTMLElement} overlay - The overlay element to initialize
 * @param {HTMLElement} container - The map container element
 */
function initTrafficOverlay(overlay, container) {
  const trafficPaths = container.getAttribute('data-traffic-paths');
  if (!trafficPaths) return;
  
  try {
    const paths = JSON.parse(trafficPaths);
    
    // Create traffic path elements
    paths.forEach(path => {
      const pathElement = document.createElement('div');
      pathElement.className = `neu-traffic-path neu-traffic-${path.congestion}`;
      
      // Calculate path properties
      const dx = path.end.x - path.start.x;
      const dy = path.end.y - path.start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      // Set path position and rotation
      pathElement.style.width = `${length}%`;
      pathElement.style.left = `${path.start.x}%`;
      pathElement.style.top = `${path.start.y}%`;
      pathElement.style.transform = `rotate(${angle}deg)`;
      pathElement.style.transformOrigin = 'left center';
      
      // Add animated traffic cells for higher traffic
      if (path.congestion !== 'low') {
        const cellCount = path.congestion === 'high' ? 5 : 3;
        
        for (let i = 0; i < cellCount; i++) {
          const trafficCell = document.createElement('div');
          trafficCell.className = 'neu-traffic-cell';
          
          // Stagger the cells along the path
          trafficCell.style.left = `${(i * 100) / cellCount}%`;
          trafficCell.style.animationDelay = `${i * 0.5}s`;
          
          pathElement.appendChild(trafficCell);
        }
      }
      
      overlay.appendChild(pathElement);
    });
  } catch (e) {
    console.error('Error parsing traffic paths:', e);
  }
}

/**
 * Initialize a traffic overlay with real-time data
 * @param {HTMLElement} overlay - The overlay element to initialize
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 */
async function initRealTrafficOverlay(overlay, lat, lon) {
  // Add loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'neu-map-loading';
  loadingIndicator.innerHTML = '<div class="neu-map-loading-spinner"></div>';
  overlay.appendChild(loadingIndicator);
  
  try {
    // Fetch traffic data
    const trafficData = await window.mapAPI.traffic.fetchData(lat, lon);
    
    if (!trafficData || !trafficData.roads || trafficData.roads.length === 0) {
      throw new Error('No traffic data available');
    }
    
    // Remove loading indicator
    loadingIndicator.remove();
    
    // Create traffic path elements
    trafficData.roads.forEach(road => {
      const pathElement = document.createElement('div');
      pathElement.className = `neu-traffic-path neu-traffic-${road.congestion}`;
      
      // Calculate path properties
      const dx = road.end.x - road.start.x;
      const dy = road.end.y - road.start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      // Set path position and rotation
      pathElement.style.width = `${length}%`;
      pathElement.style.left = `${road.start.x}%`;
      pathElement.style.top = `${road.start.y}%`;
      pathElement.style.transform = `rotate(${angle}deg)`;
      pathElement.style.transformOrigin = 'left center';
      
      // Add animated traffic cells for higher traffic
      if (road.congestion !== 'low') {
        const cellCount = road.congestion === 'high' ? 5 : 3;
        
        for (let i = 0; i < cellCount; i++) {
          const trafficCell = document.createElement('div');
          trafficCell.className = 'neu-traffic-cell';
          
          // Stagger the cells along the path
          trafficCell.style.left = `${(i * 100) / cellCount}%`;
          trafficCell.style.animationDelay = `${i * 0.5}s`;
          
          pathElement.appendChild(trafficCell);
        }
      }
      
      overlay.appendChild(pathElement);
    });
    
    // Add data note at the bottom
    const dataNote = document.createElement('div');
    dataNote.className = 'neu-map-data-note';
    dataNote.textContent = 'Traffic simulation';
    overlay.appendChild(dataNote);
    
  } catch (error) {
    console.error('Error initializing traffic overlay:', error);
    
    // Remove loading indicator
    loadingIndicator.remove();
    
    // Show error message
    const errorMsg = document.createElement('div');
    errorMsg.className = 'neu-map-no-data';
    errorMsg.textContent = 'Traffic data unavailable';
    overlay.appendChild(errorMsg);
    
    // Get the container element
    const container = overlay.closest('.neu-map-container');
    if (container) {
      // Fall back to demo overlay
      initTrafficOverlay(overlay, container);
    }
  }
}

/**
 * Initialize a pollution overlay with static demo data
 * @param {HTMLElement} overlay - The overlay element to initialize
 * @param {HTMLElement} container - The map container element
 */
function initPollutionOverlay(overlay, container) {
  const pollutionAreas = container.getAttribute('data-pollution-areas');
  if (!pollutionAreas) return;
  
  try {
    const areas = JSON.parse(pollutionAreas);
    
    // Create pollution area elements
    areas.forEach(area => {
      const areaElement = createPollutionArea(area);
      overlay.appendChild(areaElement);
    });
  } catch (e) {
    console.error('Error parsing pollution areas:', e);
  }
}

/**
 * Create a pollution area element
 * @param {Object} area - The pollution area data
 * @returns {HTMLElement} - The created element
 */
function createPollutionArea(area) {
  const areaElement = document.createElement('div');
  areaElement.className = 'neu-pollution-area';
  
  // Set position and size
  areaElement.style.left = `${area.x - area.radius}%`;
  areaElement.style.top = `${area.y - area.radius}%`;
  areaElement.style.width = `${area.radius * 2}%`;
  areaElement.style.height = `${area.radius * 2}%`;
  
  // Set color based on AQI
  let color = '#00e400'; // Default good
  
  if (area.aqi > 300) {
    color = '#7e0023'; // Hazardous
  } else if (area.aqi > 200) {
    color = '#99004c'; // Very Unhealthy
  } else if (area.aqi > 150) {
    color = '#ff0000'; // Unhealthy
  } else if (area.aqi > 100) {
    color = '#ff7e00'; // Unhealthy for Sensitive Groups
  } else if (area.aqi > 50) {
    color = '#ffff00'; // Moderate
  }
  
  areaElement.style.backgroundColor = color;
  
  // AQI label
  const aqiLabel = document.createElement('div');
  aqiLabel.className = 'neu-pollution-aqi';
  aqiLabel.textContent = area.aqi;
  areaElement.appendChild(aqiLabel);
  
  // Add some particle effects for visual interest
  const particleCount = Math.min(Math.floor(area.radius / 2), 10);
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'neu-pollution-particle';
    
    // Random position within the area
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * area.radius * 0.8;
    const x = area.radius + Math.cos(angle) * distance;
    const y = area.radius + Math.sin(angle) * distance;
    
    // Random float direction and duration
    const floatX = (Math.random() - 0.5) * 30;
    const floatY = (Math.random() - 0.5) * 30;
    const duration = 5 + Math.random() * 10;
    
    particle.style.left = `${x}%`;
    particle.style.top = `${y}%`;
    particle.style.setProperty('--float-x', `${floatX}px`);
    particle.style.setProperty('--float-y', `${floatY}px`);
    particle.style.animationDuration = `${duration}s`;
    
    areaElement.appendChild(particle);
  }
  
  return areaElement;
}

/**
 * Initialize a pollution overlay with real-time data from OpenAQ API
 * @param {HTMLElement} overlay - The overlay element to initialize
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 */
async function initRealPollutionOverlay(overlay, lat, lon) {
  // Add loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'neu-map-loading';
  loadingIndicator.innerHTML = '<div class="neu-map-loading-spinner"></div>';
  overlay.appendChild(loadingIndicator);
  
  try {
    // Fetch pollution data
    const pollutionData = await window.mapAPI.pollution.fetchData(lat, lon);
    
    if (!pollutionData || pollutionData.length === 0) {
      throw new Error('No pollution data available');
    }
    
    // Remove loading indicator
    loadingIndicator.remove();
    
    // Create pollution area elements
    pollutionData.forEach((station, index) => {
      if (!station.aqi) return; // Skip stations without AQI
      
      // Convert coordinates to map position
      // In a real app with a real map, you would use the map's projection system
      // For this demo, we'll create somewhat random positions around the center
      const x = 50 + (index - Math.floor(pollutionData.length / 2)) * 15 + (Math.random() - 0.5) * 10;
      const y = 50 + (Math.random() - 0.5) * 40;
      
      // Size based on AQI severity
      const radius = 10 + Math.min(station.aqi / 10, 25);
      
      const area = {
        x: x,
        y: y,
        radius: radius,
        aqi: station.aqi
      };
      
      const areaElement = createPollutionArea(area);
      
      // Add station name tooltip
      if (station.stationName) {
        const tooltip = document.createElement('div');
        tooltip.className = 'neu-pollution-station-name';
        tooltip.textContent = station.stationName;
        areaElement.appendChild(tooltip);
        
        // Show on hover
        areaElement.addEventListener('mouseenter', () => {
          tooltip.style.opacity = '1';
        });
        
        areaElement.addEventListener('mouseleave', () => {
          tooltip.style.opacity = '0';
        });
      }
      
      overlay.appendChild(areaElement);
    });
    
    // Add AQI legend info
    const aqiInfo = document.createElement('div');
    aqiInfo.className = 'neu-aqi-info';
    aqiInfo.innerHTML = `
      <div class="neu-aqi-title">Air Quality Index</div>
      <div class="neu-aqi-scale">
        <span class="neu-aqi-good">Good</span>
        <span class="neu-aqi-moderate">Moderate</span>
        <span class="neu-aqi-unhealthy-sg">USG</span>
        <span class="neu-aqi-unhealthy">Unhealthy</span>
        <span class="neu-aqi-very-unhealthy">Very</span>
        <span class="neu-aqi-hazardous">Hazardous</span>
      </div>
    `;
    overlay.appendChild(aqiInfo);
    
    // Add data note at the bottom
    const dataNote = document.createElement('div');
    dataNote.className = 'neu-map-data-note';
    dataNote.textContent = 'Data source: OpenAQ';
    overlay.appendChild(dataNote);
    
  } catch (error) {
    console.error('Error initializing pollution overlay:', error);
    
    // Remove loading indicator
    loadingIndicator.remove();
    
    // Show error message
    const errorMsg = document.createElement('div');
    errorMsg.className = 'neu-map-no-data';
    errorMsg.textContent = 'Pollution data unavailable';
    overlay.appendChild(errorMsg);
    
    // Get the container element
    const container = overlay.closest('.neu-map-container');
    if (container) {
      // Fall back to demo overlay
      initPollutionOverlay(overlay, container);
    }
  }
}

/**
 * Initialize a sunshine overlay with static demo data
 * @param {HTMLElement} overlay - The overlay element to initialize
 * @param {HTMLElement} container - The map container element
 */
function initSunshineOverlay(overlay, container) {
  const sunnyAreas = container.getAttribute('data-sunny-areas');
  if (!sunnyAreas) return;
  
  try {
    const areas = JSON.parse(sunnyAreas);
    
    // Create sunny area elements
    areas.forEach(area => {
      const areaElement = createSunshineArea(area);
      overlay.appendChild(areaElement);
    });
  } catch (e) {
    console.error('Error parsing sunny areas:', e);
  }
}

/**
 * Create a sunshine area element
 * @param {Object} area - The sunshine area data
 * @returns {HTMLElement} - The created element
 */
function createSunshineArea(area) {
  const areaElement = document.createElement('div');
  areaElement.className = 'neu-sunshine-area';
  
  // Set position and size
  areaElement.style.left = `${area.x - area.radius}%`;
  areaElement.style.top = `${area.y - area.radius}%`;
  areaElement.style.width = `${area.radius * 2}%`;
  areaElement.style.height = `${area.radius * 2}%`;
  
  // Apply active state if specified
  if (area.active === false) {
    areaElement.classList.add('inactive');
  }
  
  // Add sun rays
  const rayCount = 8;
  for (let i = 0; i < rayCount; i++) {
    const ray = document.createElement('div');
    ray.className = 'neu-sunshine-ray';
    ray.style.transform = `rotate(${i * (360 / rayCount)}deg)`;
    areaElement.appendChild(ray);
  }
  
  // Area label
  if (area.label) {
    const label = document.createElement('div');
    label.className = 'neu-sunshine-label';
    label.textContent = area.label;
    areaElement.appendChild(label);
  }
  
  return areaElement;
}

/**
 * Initialize a sunshine overlay with real-time data from Sunrise-Sunset API
 * @param {HTMLElement} overlay - The overlay element to initialize
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 */
async function initRealSunshineOverlay(overlay, lat, lon) {
  // Add loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'neu-map-loading';
  loadingIndicator.innerHTML = '<div class="neu-map-loading-spinner"></div>';
  overlay.appendChild(loadingIndicator);
  
  try {
    // Fetch sunshine data
    const sunshineData = await window.mapAPI.sunshine.fetchData(lat, lon);
    
    if (!sunshineData) {
      throw new Error('No sunshine data available');
    }
    
    // Remove loading indicator
    loadingIndicator.remove();
    
    // Create sunshine info badge
    const sunInfo = document.createElement('div');
    sunInfo.className = 'neu-sun-info';
    
    // Create content based on time of day
    const now = new Date();
    let infoContent = '';
    
    if (sunshineData.isDay) {
      infoContent = `
        <div class="neu-sun-status">Daylight</div>
        <div class="neu-sun-time">Sunset: ${sunshineData.formattedTime.sunset}</div>
        <div class="neu-sun-progress-container">
          <div class="neu-sun-progress" style="width: ${sunshineData.sunPosition * 100}%"></div>
        </div>
      `;
    } else {
      // It's night time
      if (now < sunshineData.sunrise) {
        // Before sunrise
        infoContent = `
          <div class="neu-sun-status">Night</div>
          <div class="neu-sun-time">Sunrise: ${sunshineData.formattedTime.sunrise}</div>
        `;
      } else {
        // After sunset
        infoContent = `
          <div class="neu-sun-status">Night</div>
          <div class="neu-sun-time">Sunrise tomorrow</div>
        `;
      }
    }
    
    sunInfo.innerHTML = infoContent;
    overlay.appendChild(sunInfo);
    
    // Create sunshine area elements
    sunshineData.sunAreas.forEach(area => {
      const areaElement = createSunshineArea(area);
      overlay.appendChild(areaElement);
    });
    
    // Add data note at the bottom
    const dataNote = document.createElement('div');
    dataNote.className = 'neu-map-data-note';
    dataNote.textContent = 'Data: Sunrise-Sunset API';
    overlay.appendChild(dataNote);
    
  } catch (error) {
    console.error('Error initializing sunshine overlay:', error);
    
    // Remove loading indicator
    loadingIndicator.remove();
    
    // Show error message
    const errorMsg = document.createElement('div');
    errorMsg.className = 'neu-map-no-data';
    errorMsg.textContent = 'Sunshine data unavailable';
    overlay.appendChild(errorMsg);
    
    // Get the container element
    const container = overlay.closest('.neu-map-container');
    if (container) {
      // Fall back to demo overlay
      initSunshineOverlay(overlay, container);
    }
  }
}

/**
 * Initialize fog of war visibility overlay
 * This overlay hides map pins outside a specified radius from the user's location
 */
function initFogOfWar() {
  // Find maps with fog of war enabled
  const maps = document.querySelectorAll('[data-fog-of-war="true"]');
  
  maps.forEach(map => {
    // Get default visibility radius (in meters)
    const defaultRadius = parseInt(map.getAttribute('data-fog-radius') || '1000');
    
    // Create fog of war container if it doesn't exist
    let fogContainer = map.querySelector('.neu-fog-container');
    if (!fogContainer) {
      fogContainer = document.createElement('div');
      fogContainer.className = 'neu-fog-container';
      map.appendChild(fogContainer);
    }
    
    // Create visibility circle
    const visibilityCircle = document.createElement('div');
    visibilityCircle.className = 'neu-fog-visibility-circle';
    fogContainer.appendChild(visibilityCircle);
    
    // Create fog overlay (covers the entire map except for the circle)
    const fogOverlay = document.createElement('div');
    fogOverlay.className = 'neu-fog-overlay';
    fogContainer.appendChild(fogOverlay);
    
    // Create radius control if premium toggle is enabled
    if (map.getAttribute('data-premium-toggle') === 'true') {
      createRadiusControl(map, fogContainer, defaultRadius);
    }
    
    // Initialize with default radius
    updateFogOfWar(map, defaultRadius);
    
    // Update fog when user moves
    // In a real app, this would use geolocation and map events
    document.addEventListener('userlocationchange', (e) => {
      if (e.detail && e.detail.mapId === map.id) {
        updateUserLocation(map, e.detail.lat, e.detail.lng);
      }
    });
  });
}

/**
 * Create radius control for premium users
 * @param {HTMLElement} map - The map element
 * @param {HTMLElement} fogContainer - The fog container element
 * @param {number} defaultRadius - The default radius in meters
 */
function createRadiusControl(map, fogContainer, defaultRadius) {
  // Create premium control container
  const controlContainer = document.createElement('div');
  controlContainer.className = 'neu-fog-control-container';
  
  // Create slider for radius control
  const radiusSlider = document.createElement('div');
  radiusSlider.className = 'neu-slider-container neu-slider-sm neu-fog-radius-slider';
  
  // Create slider track
  const sliderTrack = document.createElement('div');
  sliderTrack.className = 'neu-slider-track';
  
  const sliderTrackInner = document.createElement('div');
  sliderTrackInner.className = 'neu-slider-track-inner';
  sliderTrack.appendChild(sliderTrackInner);
  
  const sliderProgress = document.createElement('div');
  sliderProgress.className = 'neu-slider-progress';
  sliderTrackInner.appendChild(sliderProgress);
  
  // Create slider thumb
  const sliderThumb = document.createElement('div');
  sliderThumb.className = 'neu-slider-thumb';
  radiusSlider.appendChild(sliderTrack);
  radiusSlider.appendChild(sliderThumb);
  
  // Create value display
  const valueDisplay = document.createElement('div');
  valueDisplay.className = 'neu-slider-value neu-fog-radius-value';
  valueDisplay.textContent = `${defaultRadius}m`;
  
  // Create premium badge
  const premiumBadge = document.createElement('div');
  premiumBadge.className = 'neu-premium-badge';
  premiumBadge.innerHTML = '<span class="neu-premium-icon">⭐</span> Premium';
  
  // Add elements to container
  controlContainer.appendChild(premiumBadge);
  controlContainer.appendChild(radiusSlider);
  controlContainer.appendChild(valueDisplay);
  
  // Add container to map
  fogContainer.appendChild(controlContainer);
  
  // Initialize slider
  const maxRadius = parseInt(map.getAttribute('data-max-radius') || '5000');
  const defaultPercentage = (defaultRadius / maxRadius) * 100;
  
  // Set initial position
  sliderProgress.style.width = `${defaultPercentage}%`;
  sliderThumb.style.left = `${defaultPercentage}%`;
  
  // Make slider interactive
  sliderTrack.addEventListener('click', (e) => {
    e.preventDefault();
    const rect = sliderTrackInner.getBoundingClientRect();
    const percentage = ((e.clientX - rect.left) / rect.width) * 100;
    updateRadiusFromSlider(map, percentage, maxRadius, sliderProgress, sliderThumb, valueDisplay);
  });
  
  // Drag thumb
  let isDragging = false;
  
  sliderThumb.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isDragging = true;
    sliderThumb.classList.add('neu-slider-thumb-active');
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
  });
  
  function handleDrag(e) {
    if (!isDragging) return;
    const rect = sliderTrackInner.getBoundingClientRect();
    let percentage = ((e.clientX - rect.left) / rect.width) * 100;
    percentage = Math.max(0, Math.min(100, percentage));
    updateRadiusFromSlider(map, percentage, maxRadius, sliderProgress, sliderThumb, valueDisplay);
  }
  
  function stopDrag() {
    isDragging = false;
    sliderThumb.classList.remove('neu-slider-thumb-active');
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', stopDrag);
  }
}

/**
 * Update radius based on slider position
 * @param {HTMLElement} map - The map element
 * @param {number} percentage - The slider percentage (0-100)
 * @param {number} maxRadius - The maximum radius in meters
 * @param {HTMLElement} sliderProgress - The slider progress element
 * @param {HTMLElement} sliderThumb - The slider thumb element
 * @param {HTMLElement} valueDisplay - The value display element
 */
function updateRadiusFromSlider(map, percentage, maxRadius, sliderProgress, sliderThumb, valueDisplay) {
  // Update slider position
  sliderProgress.style.width = `${percentage}%`;
  sliderThumb.style.left = `${percentage}%`;
  
  // Calculate radius in meters
  const radius = Math.round((percentage / 100) * maxRadius);
  
  // Update value display
  valueDisplay.textContent = `${radius}m`;
  
  // Update fog of war
  updateFogOfWar(map, radius);
}

/**
 * Update fog of war visibility based on user location and radius
 * @param {HTMLElement} map - The map element
 * @param {number} radius - The visibility radius in meters
 */
function updateFogOfWar(map, radius) {
  // Store current radius as data attribute
  map.setAttribute('data-current-radius', radius);
  
  // Get map pins/markers
  const pins = map.querySelectorAll('.map-pin, .map-marker');
  if (!pins.length) return;
  
  // Get user location (in a real app, this would be geolocation coordinates)
  const userLat = parseFloat(map.getAttribute('data-user-lat') || map.getAttribute('data-lat') || '0');
  const userLng = parseFloat(map.getAttribute('data-user-lng') || map.getAttribute('data-lon') || '0');
  
  // Update visual elements
  const visibilityCircle = map.querySelector('.neu-fog-visibility-circle');
  if (visibilityCircle) {
    // Calculate pixel radius based on map scale
    const scale = parseFloat(map.getAttribute('data-map-scale') || '10'); // pixels per meter
    const pixelRadius = radius / scale;
    
    // Position circle at user location
    const userX = parseFloat(map.getAttribute('data-user-x') || '50'); // Default to center
    const userY = parseFloat(map.getAttribute('data-user-y') || '50');
    
    visibilityCircle.style.width = `${pixelRadius * 2}px`;
    visibilityCircle.style.height = `${pixelRadius * 2}px`;
    visibilityCircle.style.left = `calc(${userX}% - ${pixelRadius}px)`;
    visibilityCircle.style.top = `calc(${userY}% - ${pixelRadius}px)`;
  }
  
  // Update pin visibility based on distance from user
  pins.forEach(pin => {
    const pinLat = parseFloat(pin.getAttribute('data-lat') || '0');
    const pinLng = parseFloat(pin.getAttribute('data-lng') || '0');
    
    // Calculate distance between user and pin
    const distance = calculateDistance(userLat, userLng, pinLat, pinLng);
    
    // Set visibility based on distance
    if (distance <= radius) {
      pin.classList.remove('neu-fog-hidden');
    } else {
      pin.classList.add('neu-fog-hidden');
    }
  });
  
  // Trigger update event
  const event = new CustomEvent('fogofwarupdate', {
    bubbles: true,
    detail: { radius: radius }
  });
  map.dispatchEvent(event);
}

/**
 * Update user location on the map
 * @param {HTMLElement} map - The map element
 * @param {number} lat - The user latitude
 * @param {number} lng - The user longitude
 */
function updateUserLocation(map, lat, lng) {
  // Update user location data attributes
  map.setAttribute('data-user-lat', lat);
  map.setAttribute('data-user-lng', lng);
  
  // Convert lat/lng to x/y percentage position (this would be map-specific in a real app)
  // This is a simplified example
  const mapMinLat = parseFloat(map.getAttribute('data-min-lat') || '0');
  const mapMaxLat = parseFloat(map.getAttribute('data-max-lat') || '90');
  const mapMinLng = parseFloat(map.getAttribute('data-min-lng') || '-180');
  const mapMaxLng = parseFloat(map.getAttribute('data-max-lng') || '180');
  
  const userX = ((lng - mapMinLng) / (mapMaxLng - mapMinLng)) * 100;
  const userY = ((mapMaxLat - lat) / (mapMaxLat - mapMinLat)) * 100;
  
  map.setAttribute('data-user-x', userX);
  map.setAttribute('data-user-y', userY);
  
  // Update fog based on current radius
  const currentRadius = parseInt(map.getAttribute('data-current-radius') || '1000');
  updateFogOfWar(map, currentRadius);
  
  // Update user marker position (if it exists)
  const userMarker = map.querySelector('.map-user-marker');
  if (userMarker) {
    userMarker.style.left = `${userX}%`;
    userMarker.style.top = `${userY}%`;
  }
}

/**
 * Calculate distance between two points in meters using the Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} - Distance in meters
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  // Radius of the Earth in meters
  const R = 6371000;
  
  // Convert degrees to radians
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

/**
 * Initialize a fog of war overlay
 * @param {HTMLElement} overlay - The overlay element to initialize
 * @param {HTMLElement} container - The map container element
 */
function initFogOfWarOverlay(overlay, container) {
  // Apply fog of war specific class
  overlay.classList.add('neu-fogofwar-overlay');
  
  // Get settings from container attributes
  const defaultRadius = parseInt(container.getAttribute('data-fog-radius') || '1000');
  const isPremium = container.getAttribute('data-premium-user') === 'true';
  
  // Create fog of war effect
  const fogEffect = document.createElement('div');
  fogEffect.className = 'neu-fogofwar-effect';
  overlay.appendChild(fogEffect);
  
  // Create visibility circle
  const visibilityCircle = document.createElement('div');
  visibilityCircle.className = 'neu-fogofwar-visibility';
  overlay.appendChild(visibilityCircle);
  
  // Add premium control if user is premium
  if (isPremium) {
    const premiumControl = document.createElement('div');
    premiumControl.className = 'neu-fogofwar-control';
    
    const label = document.createElement('div');
    label.className = 'neu-fogofwar-label';
    label.textContent = 'Visibility Range';
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'neu-fogofwar-slider';
    slider.min = container.getAttribute('data-min-radius') || '500';
    slider.max = container.getAttribute('data-max-radius') || '5000';
    slider.value = defaultRadius;
    slider.step = '100';
    
    const value = document.createElement('div');
    value.className = 'neu-fogofwar-value';
    value.textContent = `${defaultRadius}m`;
    
    // Handle slider change
    slider.addEventListener('input', () => {
      const radius = parseInt(slider.value);
      value.textContent = `${radius}m`;
      
      // Update visibility circle size
      updateFogOfWarOverlay(overlay, container, radius);
      
      // Dispatch event for other components to handle
      const event = new CustomEvent('fogofwarchange', {
        bubbles: true,
        detail: { radius: radius }
      });
      container.dispatchEvent(event);
    });
    
    premiumControl.appendChild(label);
    premiumControl.appendChild(slider);
    premiumControl.appendChild(value);
    overlay.appendChild(premiumControl);
  } else {
    // Add upgrade button for non-premium users
    const upgradeBtn = document.createElement('button');
    upgradeBtn.className = 'neu-btn neu-btn-sm neu-btn-premium neu-fogofwar-upgrade';
    upgradeBtn.innerHTML = '⭐ Upgrade for Extended Range';
    
    upgradeBtn.addEventListener('click', () => {
      // Dispatch event for premium upgrade
      const event = new CustomEvent('premiumupgrade', {
        bubbles: true,
        detail: { feature: 'fogofwar' }
      });
      container.dispatchEvent(event);
    });
    
    overlay.appendChild(upgradeBtn);
  }
  
  // Initialize with default radius
  updateFogOfWarOverlay(overlay, container, defaultRadius);
}

/**
 * Update the fog of war overlay based on radius
 * @param {HTMLElement} overlay - The overlay element
 * @param {HTMLElement} container - The map container element
 * @param {number} radius - The visibility radius
 */
function updateFogOfWarOverlay(overlay, container, radius) {
  const visibilityCircle = overlay.querySelector('.neu-fogofwar-visibility');
  if (!visibilityCircle) return;
  
  // Get map dimensions
  const mapWidth = container.offsetWidth;
  const mapHeight = container.offsetHeight;
  
  // Calculate relative size of visibility circle
  // This is a simplified calculation for demo purposes
  // In a real app with a real map, you would use the map's scale and projection
  
  // Get map scale (pixels per meter)
  const mapScale = parseFloat(container.getAttribute('data-map-scale') || '0.2');
  
  // Calculate the circle size (diameter)
  const circleSize = radius * mapScale * 2;
  
  // Update circle size
  visibilityCircle.style.width = `${circleSize}px`;
  visibilityCircle.style.height = `${circleSize}px`;
  
  // Position at user location (default to center if not specified)
  const userX = parseFloat(container.getAttribute('data-user-x') || '50');
  const userY = parseFloat(container.getAttribute('data-user-y') || '50');
  
  // Convert percentage to pixels and center
  const leftPos = (mapWidth * (userX / 100)) - (circleSize / 2);
  const topPos = (mapHeight * (userY / 100)) - (circleSize / 2);
  
  visibilityCircle.style.left = `${leftPos}px`;
  visibilityCircle.style.top = `${topPos}px`;
}

// Update the window.neumorphicUI object
window.neumorphicUI = {
  initAccordions,
  initSliders,
  initCarousels,
  initColorPickers,
  initThemeToggle,
  enhanceAccessibility,
  initMapOverlays,
  initFogOfWar,
  
  // Initialize all components
  init() {
    initAccordions();
    initSliders();
    initCarousels();
    initColorPickers();
    initThemeToggle();
    enhanceAccessibility();
    initMapOverlays();
    initFogOfWar();
  }
}; 