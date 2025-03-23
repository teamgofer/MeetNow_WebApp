import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import PropTypes from 'prop-types';

// This component handles all map updates to avoid conflicts and race conditions
const MapUpdater = ({ center, zoom, selectedLocation, navigationMode, onUpdate }) => {
  const map = useMap();

  // Handle center and zoom changes
  useEffect(() => {
    if (!center) return;
    
    console.log('MapUpdater: Processing map update', { 
      lat: center.lat, 
      lng: center.lng, 
      zoom, 
      preserveZoom: center._preserveZoom,
      userInteraction: center._userInteraction
    });

    // Don't update if this was triggered by user interaction
    if (center._userInteraction) {
      console.log('MapUpdater: Skipping update due to user interaction flag');
      return;
    }

    // Skip if map is being dragged
    if (map._isUserCurrentlyDragging) {
      console.log('MapUpdater: Skipping update during user drag');
      return;
    }

    // Skip if explicitly requested
    if (map._skipNextViewUpdate) {
      console.log('MapUpdater: Skipping explicitly flagged update');
      map._skipNextViewUpdate = false;
      return;
    }

    // Remember the current zoom if we need to preserve it
    const currentZoom = map.getZoom();
    const targetZoom = center._preserveZoom ? currentZoom : zoom;

    // Use flyTo for smoother transitions unless immediate update is requested
    const updateMethod = center._immediate ? 'setView' : 'flyTo';
    const updateOptions = { animate: !center._immediate, duration: 0.5 };

    console.log(`MapUpdater: Updating map via ${updateMethod} to [${center.lat}, ${center.lng}], zoom: ${targetZoom}`);
    map[updateMethod]([center.lat, center.lng], targetZoom, updateOptions);

    // Notify parent that update was applied
    if (onUpdate) {
      onUpdate({
        center: { lat: center.lat, lng: center.lng },
        zoom: targetZoom
      });
    }
  }, [center, zoom, map, onUpdate]);

  // Handle any additional updates when selectedLocation changes
  useEffect(() => {
    if (!selectedLocation) return;
    
    // Refresh the map size to ensure it's correctly displayed after any DOM changes
    map.invalidateSize({ animate: false });
    
  }, [selectedLocation, map]);

  // Force a resize check when navigation mode changes
  useEffect(() => {
    if (navigationMode !== undefined) {
      console.log(`MapUpdater: Navigation mode changed to ${navigationMode}, invalidating size`);
      map.invalidateSize({ animate: false });
    }
  }, [navigationMode, map]);

  return null;
};

MapUpdater.propTypes = {
  center: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    _preserveZoom: PropTypes.bool,
    _immediate: PropTypes.bool,
    _userInteraction: PropTypes.bool,
    _explicitUpdate: PropTypes.bool
  }),
  zoom: PropTypes.number,
  selectedLocation: PropTypes.object,
  navigationMode: PropTypes.number,
  onUpdate: PropTypes.func
};

export default MapUpdater; 