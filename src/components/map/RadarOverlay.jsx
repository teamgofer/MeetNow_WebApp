import React, { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import PropTypes from 'prop-types';

// Create special styles for the radar animation
const createRadarStyles = () => {
  if (document.getElementById('radar-overlay-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'radar-overlay-styles';
  style.innerHTML = `
    @keyframes radar-sweep {
      0% {
        transform: translate(-50%, -50%) rotate(0deg);
      }
      100% {
        transform: translate(-50%, -50%) rotate(360deg);
      }
    }
    
    .radar-container {
      position: absolute;
      width: 0;
      height: 0;
      overflow: visible;
      pointer-events: none;
      z-index: 400;
    }
    
    .radar-sweep {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 100%;
      height: 100%;
      transform-origin: center;
      animation: radar-sweep 4s infinite linear;
    }
    
    .radar-gradient {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: radial-gradient(
        circle,
        rgba(16, 185, 129, 0.05) 0%,
        rgba(79, 70, 229, 0.05) 50%,
        rgba(236, 72, 153, 0.05) 100%
      );
      filter: blur(4px);
      opacity: 0.7;
    }
  `;
  
  document.head.appendChild(style);
};

// This component creates a radar-like animation effect on the map
const RadarOverlay = ({ 
  isActive, 
  userLocation, 
  radiusMeters = 150 
}) => {
  const map = useMap();
  const [container, setContainer] = useState(null);
  
  // Add styles
  useEffect(() => {
    createRadarStyles();
  }, []);
  
  // Create and update the radar overlay
  useEffect(() => {
    if (!isActive || !userLocation || !userLocation.lat || !userLocation.lng) {
      // Remove existing overlay if not active
      if (container) {
        container.remove();
        setContainer(null);
      }
      return;
    }
    
    // Create container if it doesn't exist
    if (!container) {
      const div = document.createElement('div');
      div.className = 'radar-container';
      setContainer(div);
      map.getPanes().overlayPane.appendChild(div);
    }
    
    // Update position
    const updatePosition = () => {
      if (!container || !map) return;
      
      // Convert geographic coords to pixel coords
      const point = map.latLngToLayerPoint([userLocation.lat, userLocation.lng]);
      
      // Convert radius to pixels
      // Using a much larger divisor to make the radar animation properly sized
      const pixelRadius = map.getZoomScale(map.getZoom(), map.getMaxZoom()) * radiusMeters / 2.5;
      
      // Set container position
      container.style.left = `${point.x}px`;
      container.style.top = `${point.y}px`;
      
      // Update/create content
      container.innerHTML = `
        <div class="radar-gradient" style="width: ${pixelRadius * 2}px; height: ${pixelRadius * 2}px; left: -${pixelRadius}px; top: -${pixelRadius}px;"></div>
        <div class="radar-sweep" style="width: ${pixelRadius}px; height: ${pixelRadius}px;">
          <svg width="${pixelRadius * 2}" height="${pixelRadius * 2}" viewBox="0 0 100 100" style="position: absolute; left: -${pixelRadius}px; top: -${pixelRadius}px;">
            <defs>
              <linearGradient id="sweepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#4F46E5" stop-opacity="0.9" />
                <stop offset="100%" stop-color="#4F46E5" stop-opacity="0" />
              </linearGradient>
            </defs>
            <path d="M 50 50 L 50 0 A 50 50 0 0 1 100 50 Z" fill="url(#sweepGradient)" />
          </svg>
        </div>
      `;
    };
    
    // Update position initially and on zoom/pan
    updatePosition();
    map.on('zoom', updatePosition);
    map.on('move', updatePosition);
    
    // Cleanup
    return () => {
      map.off('zoom', updatePosition);
      map.off('move', updatePosition);
      
      if (container) {
        container.remove();
      }
    };
  }, [isActive, userLocation, map, container, radiusMeters]);
  
  // This component doesn't render anything directly, it manipulates the DOM
  return null;
};

RadarOverlay.propTypes = {
  isActive: PropTypes.bool.isRequired,
  userLocation: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number
  }),
  radiusMeters: PropTypes.number
};

export default RadarOverlay; 