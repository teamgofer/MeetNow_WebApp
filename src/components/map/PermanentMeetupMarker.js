import { jsx as _jsx } from 'react/jsx-runtime';
import { Marker, Popup } from 'react-leaflet';
import LocationMarkerCard from './LocationMarkerCard';
import { PerformanceMonitor } from '@/utils/PerformanceMonitor';
const PermanentMeetupMarker = ({
  meetup,
  icon,
  isSelected = false,
  showPopup = true,
  onMarkerClick,
  getPopupConfig,
}) => {
  if (!meetup.lat || !meetup.lng) {
    return null;
  }
  const handleMarkerClick = () => {
    const startTime = Date.now();
    if (onMarkerClick) {
      onMarkerClick(meetup);
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('map', 'permanentMeetupMarkerClick', duration, {
        success: true,
        meetupId: meetup.id,
        hasTitle: !!meetup.title,
        hasAddress: !!meetup.address,
      });
    }
  };
  return _jsx(Marker, {
    position: [meetup.lat, meetup.lng],
    icon: icon,
    zIndexOffset: isSelected ? 1000 : 500,
    opacity: isSelected ? 1 : 0.8,
    eventHandlers: {
      click: handleMarkerClick,
    },
    children:
      showPopup &&
      _jsx(Popup, {
        ...getPopupConfig(),
        children: _jsx(LocationMarkerCard, {
          title: meetup.title || 'Unnamed Meetup',
          description: meetup.description || null,
          address: meetup.address,
          coordinates: { lat: meetup.lat, lng: meetup.lng },
          imageUrl: meetup.image_url || null,
        }),
      }),
  });
};
export default PermanentMeetupMarker;
//# sourceMappingURL=PermanentMeetupMarker.js.map
