import React from 'react';
import { Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngTuple, PointTuple } from 'leaflet';

// Define the props interface
interface UserLocationMarkerProps {
  position: LatLngTuple;
  accuracy?: number;
  showPopup?: boolean;
}

/**
 * Specialized marker for showing user's current location
 */
const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ 
  position, 
  accuracy = 0, 
  showPopup = false 
}) => {
  // Use divIcon instead of icon for better control over sizing
  const size: PointTuple = [44, 44];
  const anchor: PointTuple = [22, 22];
  
  const icon = L.divIcon({
    className: 'smiley-earth-marker',
    html: `
      <div style="width: ${size[0]}px; height: ${size[1]}px; display: flex; align-items: center; justify-content: center;">
        <img src="/images/smiley-earth-icon-hd.png" style="width: 100%; height: 100%; object-fit: contain;" alt="User Location" />
      </div>
    `,
    iconSize: size,
    iconAnchor: anchor
  });

  return (
    <>
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
      
      {/* Show accuracy circle if accuracy is provided */}
      {accuracy > 0 && (
        <Circle 
          center={position}
          radius={accuracy}
          pathOptions={{ 
            color: '#3388ff',
            fillColor: '#3388ff',
            fillOpacity: 0.1,
            weight: 1
          }}
        />
      )}
    </>
  );
};

export default UserLocationMarker; 