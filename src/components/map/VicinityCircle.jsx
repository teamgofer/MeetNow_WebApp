import L from 'leaflet';
import PropTypes from 'prop-types';
import React, { useEffect, useState, useRef } from 'react';
import { Circle, useMap } from 'react-leaflet';

// Create a radial gradient that mimics a radar effect
const createRadialGradient = () => {
  const style = document.createElement('style');
  style.id = 'vicinity-circle-style';
  style.innerHTML = `
    @keyframes pulse {
      0% {
        opacity: 0.7;
        stroke-width: 1;
      }
      50% {
        opacity: 0.9;
        stroke-width: 2;
      }
      100% {
        opacity: 0.7;
        stroke-width: 1;
      }
    }
    
    @keyframes rotate {
      0% {
        stroke-dashoffset: 0;
      }
      100% {
        stroke-dashoffset: 100;
      }
    }
    
    .vicinity-circle {
      animation: pulse 2s infinite ease-in-out;
      filter: drop-shadow(0 0 5px rgba(79, 70, 229, 0.5));
    }
    
    .vicinity-circle-inner {
      animation: rotate 15s infinite linear;
      stroke-dasharray: 10, 15;
    }
  `;

  if (!document.getElementById('vicinity-circle-style')) {
    document.head.appendChild(style);
  }
};

const VicinityCircle = ({ currentMode, userLocation, radiusMeters = 150 }) => {
  const map = useMap();
  const [isVisible, setIsVisible] = useState(false);
  const circleRef = useRef(null);
  const innerCircleRef = useRef(null);

  // Create the styles on mount
  useEffect(() => {
    createRadialGradient();
  }, []);

  // Show the circle only in Vicinity mode (mode 3)
  useEffect(() => {
    setIsVisible(currentMode === 3);
  }, [currentMode]);

  // Add an inner circle for additional visual effect when the component becomes visible
  useEffect(() => {
    if (isVisible && userLocation && circleRef.current) {
      // Clean up any previous inner circle
      if (innerCircleRef.current) {
        innerCircleRef.current.remove();
      }

      // Create an inner circle with different styling
      const innerCircle = L.circle([userLocation.lat, userLocation.lng], {
        radius: radiusMeters * 0.5,
        color: '#10B981', // Green tint
        weight: 1.5,
        fillColor: '#10B981',
        fillOpacity: 0.05,
        opacity: 0.5,
        className: 'vicinity-circle-inner',
      }).addTo(map);

      innerCircleRef.current = innerCircle;
    }

    // Clean up on unmount or when mode changes
    return () => {
      if (innerCircleRef.current) {
        innerCircleRef.current.remove();
        innerCircleRef.current = null;
      }
    };
  }, [isVisible, userLocation, map, radiusMeters]);

  // Don't render if we don't have a user location or aren't in vicinity mode
  if (!isVisible || !userLocation?.lat || !userLocation.lng) {
    return null;
  }

  return (
    <Circle
      ref={circleRef}
      center={[userLocation.lat, userLocation.lng]}
      radius={radiusMeters}
      pathOptions={{
        color: '#4F46E5', // Indigo
        weight: 1.5,
        fillColor: 'url(#vicinity-gradient)',
        fillOpacity: 0.08,
        opacity: 0.8,
        className: 'vicinity-circle',
      }}
    />
  );
};

VicinityCircle.propTypes = {
  currentMode: PropTypes.oneOf([1, 2, 3]).isRequired,
  userLocation: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
  }),
  radiusMeters: PropTypes.number,
};

export default VicinityCircle;
