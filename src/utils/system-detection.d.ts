export function getSystemInfo(): {
  iOS: boolean;
  android: boolean;
  mobile: boolean;
  tablet: boolean;
  safari: boolean;
  lowRes: boolean;
  touch: boolean;
  deviceType: {
    isIPhoneSE: boolean;
    isIPhone8: boolean;
    isSmallAndroid: boolean;
  };
  width: number;
  height: number;
  platform: string;
};
export function getAdaptiveConfig(): {
  mapOptions: {
    maxZoom: number;
    minZoom: number;
    tap: boolean;
    dragging: boolean;
    touchZoom: boolean;
    scrollWheelZoom: boolean;
    zoomControl: boolean;
    attributionControl: boolean;
    preferCanvas: boolean;
    renderer:
      | {
          antialias: boolean;
        }
      | undefined;
    bounceAtZoomLimits: boolean;
    maxBoundsViscosity: number;
  };
};
