import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from 'react/jsx-runtime';
import { Marker } from 'react-leaflet';
import TemporaryLocationMarkerCard from './TemporaryLocationMarkerCard';
import { PerformanceMonitor } from '@/utils/PerformanceMonitor';
const TemporaryLocationMarker = ({
  location,
  icon,
  showPopup = true,
  onPopupOpen,
  onCreateMeetup,
  onClose,
}) => {
  if (!location.lat || !location.lng) {
    return null;
  }
  const handlePopupOpen = () => {
    const startTime = Date.now();
    if (onPopupOpen) {
      onPopupOpen('temporary');
      const duration = Date.now() - startTime;
      PerformanceMonitor.trackOperationTiming('map', 'temporaryLocationMarkerPopupOpen', duration, {
        success: true,
        hasTitle: !!location.display_name,
      });
    }
  };
  const locationWithStats = {
    ...location,
    stats: {
      totalMeetups: 0,
      activeMeetups: 0,
      popularTimes: [],
      lastMeetup: new Date(),
      averageRating: 0,
    },
    nearbyPlaces: [],
  };
  return _jsxs(_Fragment, {
    children: [
      _jsx(Marker, { position: [location.lat, location.lng], icon: icon, zIndexOffset: 500 }),
      showPopup &&
        _jsx('div', {
          className: 'absolute',
          style: { top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' },
          children: _jsx('div', {
            style: {
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'auto',
            },
            children: _jsx(TemporaryLocationMarkerCard, {
              location: locationWithStats,
              onCreateMeetup: onCreateMeetup || (() => {}),
              onClose: onClose || (() => {}),
            }),
          }),
        }),
    ],
  });
};
export default TemporaryLocationMarker;
//# sourceMappingURL=TemporaryLocationMarker.js.map
