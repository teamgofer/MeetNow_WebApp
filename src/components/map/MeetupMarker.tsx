import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { LatLngExpression, Icon, DivIcon } from 'leaflet';
import CountdownTimer from '../ui/CountdownTimer';
import { createMapIcons } from '../../utils/map-icons';
import { ProgressiveImage } from '../common';

interface MeetupMarkerProps {
  id: string;
  position: LatLngExpression;
  title: string;
  description?: string;
  address?: string;
  distance?: number;
  expiresAt?: string;
  createdAt?: string;
  status?: 'active' | 'pending' | 'expired';
  onClick?: (id: string, source: string) => void;
  selected?: boolean;
  showPopup?: boolean;
  icon?: Icon | DivIcon;
  imageUrl?: string | null | undefined;
}

/**
 * Custom meetup marker component with distinctive styling
 */
const MeetupMarker: React.FC<MeetupMarkerProps> = ({
  id,
  position,
  title,
  description,
  address,
  distance,
  expiresAt,
  createdAt,
  status = 'active',
  onClick,
  selected = false,
  showPopup = false,
  icon,
  imageUrl
}) => {
  // Create map icons
  const icons = useMemo(() => createMapIcons(), []);
  
  // Get the appropriate icon based on status and selected state
  const meetupIcon = useMemo(() => {
    if (icon) return icon;
    
    if (status === 'expired') {
      return icons.expiredMeetupIcon;
    }
    if (selected) {
      return icons.selectedMeetupIcon;
    }
    return icons.meetupIcon;
  }, [icons, status, selected, icon]);

  // Format distance for display
  const formatDistance = (dist?: number): string => {
    if (!dist) return '';
    return dist < 1 
      ? `${Math.round(dist * 1000)}m away` 
      : `${dist.toFixed(1)}km away`;
  };

  // Handle marker click
  const handleClick = () => {
    if (onClick) {
      onClick(id, 'map');
    }
  };

  // Handle image load error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = 'https://via.placeholder.com/150';
    e.currentTarget.style.opacity = '0.6';
  };

  // Generate stable ID for image
  const imageElementId = imageUrl ? `marker-img-${id}` : '';

  return (
    <Marker 
      position={position} 
      icon={meetupIcon}
      eventHandlers={{
        click: handleClick
      }}
      zIndexOffset={selected ? 1000 : 500}
      pane="markerPane"
    >
      {showPopup && (
        <Popup 
          className="meetup-popup"
          autoClose={false}
          closeOnClick={false}
        >
          <div className="p-3">
            {/* Show image if available */}
            {imageUrl && (
              <div className="meetup-popup-image mb-2 overflow-hidden rounded">
                <ProgressiveImage 
                  src={imageUrl} 
                  alt={title} 
                  className="w-full h-32 rounded"
                  objectFit="cover"
                  fallbackSrc="https://via.placeholder.com/150"
                  onError={handleImageError}
                  placeholderColor="#f3f4f6"
                  loading="lazy"
                  width="100%"
                  height="100%"
                  id={imageElementId}
                />
              </div>
            )}
            
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-gray-900">{title || 'Meetup'}</h3>
              {distance !== undefined && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {formatDistance(distance)}
                </span>
              )}
            </div>
            
            {description && (
              <p className="text-sm mt-1 text-gray-600">{description}</p>
            )}
            
            {address && (
              <p className="text-xs mt-1 text-gray-500">{address}</p>
            )}
            
            {expiresAt && (
              <div className="countdown-timer mt-2">
                <CountdownTimer targetDate={new Date(expiresAt)} />
              </div>
            )}
            
            {status === 'expired' && (
              <div className="text-xs mt-1 text-red-500 font-medium">
                This meetup has expired
              </div>
            )}
          </div>
        </Popup>
      )}
    </Marker>
  );
};

// Custom comparison function to prevent unnecessary re-renders
const arePropsEqual = (prevProps: MeetupMarkerProps, nextProps: MeetupMarkerProps) => {
  // Compare basic properties
  if (prevProps.id !== nextProps.id) return false;
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.description !== nextProps.description) return false;
  if (prevProps.selected !== nextProps.selected) return false;
  if (prevProps.showPopup !== nextProps.showPopup) return false;
  if (prevProps.status !== nextProps.status) return false;

  // Compare position (could be array or object)
  const prevPos = prevProps.position;
  const nextPos = nextProps.position;

  // Handle different position formats
  if (Array.isArray(prevPos) && Array.isArray(nextPos)) {
    if (prevPos[0] !== nextPos[0] || prevPos[1] !== nextPos[1]) return false;
  } else if (
    typeof prevPos === 'object' &&
    typeof nextPos === 'object' &&
    prevPos !== null &&
    nextPos !== null
  ) {
    if (
      (prevPos as any).lat !== (nextPos as any).lat ||
      (prevPos as any).lng !== (nextPos as any).lng
    )
      return false;
  } else if (prevPos !== nextPos) {
    return false;
  }

  // Special deep comparison for images
  if (prevProps.imageUrl !== nextProps.imageUrl) return false;

  // If we get here, the props are considered equal
  return true;
};

export default React.memo(MeetupMarker, arePropsEqual); 
 