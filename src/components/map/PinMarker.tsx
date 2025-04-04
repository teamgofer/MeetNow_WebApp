import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { LatLngExpression, Icon, DivIcon } from 'leaflet';
import { createMapIcons } from '../../utils/map-icons';

interface PinMarkerProps {
  id: string;
  position: LatLngExpression;
  title?: string;
  address?: string;
  color?: 'red' | 'blue' | 'green' | 'yellow' | 'purple';
  isTemporary?: boolean;
  onClick?: (id: string) => void;
  selected?: boolean;
  showPopup?: boolean;
  icon?: Icon | DivIcon;
}

/**
 * Custom pin marker component with distinctive styling
 */
const PinMarker: React.FC<PinMarkerProps> = ({
  id,
  position,
  title = 'Pinned Location',
  address,
  color = 'red',
  isTemporary = false,
  onClick,
  selected = false,
  showPopup = false,
  icon,
}) => {
  // Create map icons
  const icons = useMemo(() => createMapIcons(), []);

  // Get the appropriate icon based on color and temporary status
  const pinIcon = useMemo(() => {
    // If a custom icon is provided, use it
    if (icon) return icon;

    // Otherwise use the default icons
    return getPinIconByColor(color, isTemporary);
  }, [color, isTemporary, icon]);

  // Helper function to get pin icon by color
  function getPinIconByColor(color: string, isTemp: boolean) {
    if (isTemp) {
      return icons.temporaryPinIcon;
    }

    switch (color) {
      case 'blue':
        return icons.bluePinIcon;
      case 'green':
        return icons.greenPinIcon;
      case 'purple':
        return icons.purplePinIcon;
      case 'red':
      default:
        return icons.pinIcon;
    }
  }

  // Handle marker click
  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  return (
    <Marker
      position={position}
      icon={pinIcon}
      eventHandlers={{
        click: handleClick,
      }}
      zIndexOffset={selected ? 1000 : 0}
    >
      {showPopup && (
        <Popup className="pin-popup" autoClose={false} closeOnClick={false}>
          <div className="p-3">
            <h3 className="font-medium text-gray-900">{title}</h3>

            {address && <p className="text-xs mt-1 text-gray-500">{address}</p>}

            {isTemporary && (
              <div className="text-xs mt-1 text-blue-500 font-medium">Temporary location</div>
            )}
          </div>
        </Popup>
      )}
    </Marker>
  );
};

export default PinMarker;
