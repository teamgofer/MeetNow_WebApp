// Device detection utilities
export const getSystemInfo = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform.toLowerCase();
  const width = window.innerWidth;
  const height = window.innerHeight;

  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  const isMobile = isIOS || isAndroid || /mobile/.test(userAgent);
  const isTablet = /ipad/.test(userAgent) || (isAndroid && Math.min(width, height) > 600);
  const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
  const isLowRes = width < 1024 || height < 768;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Specific device detection
  const deviceType = {
    isIPhoneSE: isIOS && Math.min(width, height) <= 375,
    isIPhone8: isIOS && Math.min(width, height) <= 414 && Math.min(width, height) > 375,
    isSmallAndroid: isAndroid && Math.min(width, height) <= 360,
  };

  return {
    iOS: isIOS,
    android: isAndroid,
    mobile: isMobile,
    tablet: isTablet,
    safari: isSafari,
    lowRes: isLowRes,
    touch: isTouch,
    deviceType,
    width,
    height,
    platform,
  };
};

// Get adaptive configuration based on system info
export const getAdaptiveConfig = () => {
  const system = getSystemInfo();

  return {
    mapOptions: {
      // Adjust zoom levels based on device
      maxZoom: system.mobile ? 16 : 17,
      minZoom: 2,

      // Adjust touch behavior
      tap: system.touch,
      dragging: !system.mobile || system.tablet,
      touchZoom: system.touch,
      scrollWheelZoom: !system.mobile,

      // Adjust controls
      zoomControl: !system.mobile,
      attributionControl: true,

      // Performance settings
      preferCanvas: true,
      renderer: system.mobile ? undefined : { antialias: true },

      // Mobile specific
      bounceAtZoomLimits: !system.mobile,
      maxBoundsViscosity: system.mobile ? 1.0 : 0.8,
    },
  };
};
