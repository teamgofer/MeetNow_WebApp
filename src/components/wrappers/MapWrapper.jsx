import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const MapWrapper = ({ 
  children, 
  onMapReady, 
  onLocationChange, 
  onZoomChange,
  onMapClick,
  onMarkerClick,
  onPopupOpen,
  onPopupClose,
  onError,
  className = '',
  style = {}
}) => {
  const map = useMap();
  const mapRef = useRef(null);

  useEffect(() => {
    if (map && !mapRef.current) {
      mapRef.current = map;
      onMapReady?.(map);
    }
  }, [map, onMapReady]);

  useEffect(() => {
    if (!map) return;

    const handleMoveEnd = () => {
      const center = map.getCenter();
      onLocationChange?.({
        lat: center.lat,
        lng: center.lng
      });
    };

    const handleZoomEnd = () => {
      onZoomChange?.(map.getZoom());
    };

    const handleClick = (e) => {
      onMapClick?.(e);
    };

    const handleMarkerClick = (e) => {
      onMarkerClick?.(e);
    };

    const handlePopupOpen = (e) => {
      onPopupOpen?.(e);
    };

    const handlePopupClose = (e) => {
      onPopupClose?.(e);
    };

    const handleError = (e) => {
      onError?.(e);
    };

    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleZoomEnd);
    map.on('click', handleClick);
    map.on('markerclick', handleMarkerClick);
    map.on('popupopen', handlePopupOpen);
    map.on('popupclose', handlePopupClose);
    map.on('error', handleError);

    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('zoomend', handleZoomEnd);
      map.off('click', handleClick);
      map.off('markerclick', handleMarkerClick);
      map.off('popupopen', handlePopupOpen);
      map.off('popupclose', handlePopupClose);
      map.off('error', handleError);
    };
  }, [map, onLocationChange, onZoomChange, onMapClick, onMarkerClick, onPopupOpen, onPopupClose, onError]);

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
};

MapWrapper.propTypes = {
  children: PropTypes.node,
  onMapReady: PropTypes.func,
  onLocationChange: PropTypes.func,
  onZoomChange: PropTypes.func,
  onMapClick: PropTypes.func,
  onMarkerClick: PropTypes.func,
  onPopupOpen: PropTypes.func,
  onPopupClose: PropTypes.func,
  onError: PropTypes.func,
  className: PropTypes.string,
  style: PropTypes.object
};

export default MapWrapper; 
 
 
 
 
 