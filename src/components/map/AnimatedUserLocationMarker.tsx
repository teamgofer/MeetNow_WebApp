import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngTuple, PointTuple } from 'leaflet';

// Define the props interface
interface AnimatedUserLocationMarkerProps {
  position: LatLngTuple;
  accuracy?: number;
  showPopup?: boolean;
}

/**
 * Enhanced user location marker with 3D animated luminous elements
 */
const AnimatedUserLocationMarker: React.FC<AnimatedUserLocationMarkerProps> = ({ 
  position, 
  accuracy = 0, 
  showPopup = false 
}) => {
  // Use larger size than standard for a more prominent effect
  const size: PointTuple = [64, 64];
  const anchor: PointTuple = [32, 32];
  
  const icon = L.divIcon({
    className: 'animated-user-location-marker',
    html: `
      <div class="user-location-container" style="width: ${size[0]}px; height: ${size[1]}px; position: relative; display: flex; align-items: center; justify-content: center;">
        <!-- Star-shaped luminous background with rotation -->
        <div class="star-background" style="position: absolute; width: 100%; height: 100%; z-index: 1; animation: rotate-star 8s linear infinite;">
          <svg width="${size[0]}" height="${size[1]}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="glow-user" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feFlood flood-color="#4f46e5" flood-opacity="1" result="indigo-flood"/>
                <feComposite in="indigo-flood" in2="coloredBlur" operator="in" result="indigo-glow"/>
                <feFlood flood-color="#f43f5e" flood-opacity="0.9" result="rose-flood"/>
                <feComposite in="rose-flood" in2="coloredBlur" operator="in" result="rose-glow"/>
                <feMerge>
                  <feMergeNode in="indigo-glow"/>
                  <feMergeNode in="rose-glow"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <!-- Six-pointed star path with increased size -->
            <path d="M32 4 L38 22 L56 22 L42 34 L48 54 L32 42 L16 54 L22 34 L8 22 L26 22 Z" 
                  fill="url(#star-gradient)" filter="url(#glow-user)" opacity="1" />
            <!-- Vivid radial gradient for the star -->
            <radialGradient id="star-gradient">
              <stop offset="0%" stop-color="#ffffff" />
              <stop offset="40%" stop-color="#93c5fd" />
              <stop offset="70%" stop-color="#3b82f6" />
              <stop offset="100%" stop-color="#1e40af" />
            </radialGradient>
          </svg>
        </div>
        
        <!-- Pulsing ring with more vibrant colors -->
        <div class="pulse-ring" style="position: absolute; width: 120%; height: 120%; top: -10%; left: -10%; border-radius: 50%; 
             background: radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(99,102,241,0.8) 30%, rgba(244,63,94,0.7) 60%, rgba(79,70,229,0.4) 80%, transparent 100%);
             opacity: 0; z-index: 0; animation: pulse-out-location 3s ease-out infinite;"></div>
             
        <!-- Brighter light rays emanating outward -->
        <div class="light-rays" style="position: absolute; width: 170%; height: 170%; top: -35%; left: -35%; z-index: 0;
             background: conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.95) 10deg, transparent 20deg, 
                                       transparent 60deg, rgba(244,63,94,0.9) 70deg, transparent 80deg,
                                       transparent 120deg, rgba(255,255,255,0.95) 130deg, transparent 140deg,
                                       transparent 180deg, rgba(99,102,241,0.9) 190deg, transparent 200deg,
                                       transparent 240deg, rgba(255,255,255,0.95) 250deg, transparent 260deg,
                                       transparent 300deg, rgba(244,63,94,0.9) 310deg, transparent 320deg);
             opacity: 0.9; animation: rotate-rays 10s linear infinite, pulse-opacity 4s ease-in-out infinite;"></div>

        <!-- Additional pulsing circle with bright highlight -->
        <div class="highlight-pulse" style="position: absolute; width: 140%; height: 140%; top: -20%; left: -20%; border-radius: 50%;
             box-shadow: 0 0 30px 10px rgba(255,255,255,0.7), inset 0 0 20px rgba(255,255,255,0.4);
             opacity: 0; z-index: 1; animation: highlight-pulse 4s ease-in-out infinite;"></div>
             
        <!-- Original smiley earth icon with enhanced glow -->
        <div style="position: relative; width: 75%; height: 75%; z-index: 2; 
             filter: drop-shadow(0 0 8px rgba(255,255,255,1)) drop-shadow(0 0 12px rgba(99,102,241,0.8));
             animation: gentle-bob 3s ease-in-out infinite;">
          <img src="/images/smiley-earth-icon-hd.png" style="width: 100%; height: 100%; object-fit: contain;" alt="User Location" />
        </div>

        <!-- Dancing particles around the icon -->
        <div class="particles" style="position: absolute; width: 100%; height: 100%; z-index: 3;">
          ${Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45) * (Math.PI / 180);
            const delay = i * 0.5;
            const x = 50 + 45 * Math.cos(angle);
            const y = 50 + 45 * Math.sin(angle);
            return `<div style="position: absolute; width: 6px; height: 6px; border-radius: 50%; 
                        background-color: ${i % 2 === 0 ? '#4f46e5' : '#f43f5e'}; 
                        left: ${x}%; top: ${y}%;
                        filter: blur(1px) drop-shadow(0 0 4px ${i % 2 === 0 ? '#4f46e5' : '#f43f5e'});
                        animation: particle-dance 4s ease-in-out ${delay}s infinite;"></div>`;
          }).join('')}
        </div>
      </div>
      
      <!-- Style for animations -->
      <style>
        @keyframes rotate-star {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes rotate-rays {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        
        @keyframes pulse-opacity {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        
        @keyframes pulse-out-location {
          0% { transform: scale(0.7); opacity: 0.9; }
          70% { transform: scale(1.3); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        @keyframes highlight-pulse {
          0%, 100% { opacity: 0; transform: scale(0.8); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }

        @keyframes gentle-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes particle-dance {
          0%, 100% { transform: scale(1) translateY(0); opacity: 0.8; }
          25% { transform: scale(1.5) translateY(-10px) translateX(5px); opacity: 1; }
          75% { transform: scale(1.5) translateY(10px) translateX(-5px); opacity: 1; }
        }
      </style>
    `,
    iconSize: size,
    iconAnchor: anchor,
    popupAnchor: [0, -32]
  });

  return (
    <Marker 
      position={position} 
      icon={icon} 
      zIndexOffset={1000} // Ensure it's above other markers
    >
      {showPopup && (
        <Popup>
          <div>
            <strong>Your Location</strong>
            {accuracy > 0 && (
              <p>Accuracy: ±{Math.round(accuracy)} meters</p>
            )}
          </div>
        </Popup>
      )}
    </Marker>
  );
};

export default AnimatedUserLocationMarker; 