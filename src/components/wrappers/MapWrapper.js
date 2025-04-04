import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
const MapWrapper = ({ center = [0, 0], zoom = 13, className = '', style = {}, onMapReady, onLocationChange, onZoomChange, onMapClick, onMapMove, onMarkerClick, onPopupOpen, onPopupClose, onError, children, }) => {
    const mapRef = useRef(null);
    const leafletMapRef = useRef(null);
    const [isMapReady, setIsMapReady] = useState(false);
    useEffect(() => {
        if (!mapRef.current || leafletMapRef.current)
            return;
        try {
            const map = L.map(mapRef.current, {
                center: center,
                zoom: zoom,
                zoomControl: false,
            });
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
            }).addTo(map);
            L.control.zoom({ position: 'topright' }).addTo(map);
            if (onMapClick) {
                map.on('click', e => {
                    onMapClick(e);
                });
            }
            if (onMapMove) {
                map.on('move', () => {
                    const center = map.getCenter();
                    onMapMove({ latlng: { lat: center.lat, lng: center.lng } });
                });
            }
            if (onZoomChange) {
                map.on('zoomend', () => {
                    onZoomChange(map.getZoom());
                });
            }
            leafletMapRef.current = map;
            setIsMapReady(true);
            onMapReady?.();
        }
        catch (error) {
            console.error('Map initialization error:', error);
            onError?.(error instanceof Error ? error : new Error('Unknown map error'));
        }
        return () => {
            if (leafletMapRef.current) {
                leafletMapRef.current.remove();
                leafletMapRef.current = null;
            }
        };
    }, [center, zoom, onMapReady, onMapClick, onMapMove, onZoomChange, onError]);
    useEffect(() => {
        if (!isMapReady || !leafletMapRef.current)
            return;
        leafletMapRef.current.setView(center, leafletMapRef.current.getZoom(), {
            animate: true,
        });
        onLocationChange?.(center);
    }, [center, isMapReady, onLocationChange]);
    useEffect(() => {
        if (!isMapReady || !leafletMapRef.current)
            return;
        if (leafletMapRef.current.getZoom() !== zoom) {
            leafletMapRef.current.setZoom(zoom);
        }
        onZoomChange?.(zoom);
    }, [zoom, isMapReady, onZoomChange]);
    return (_jsx("div", { ref: mapRef, className: `map-wrapper ${className}`, style: { width: '100%', height: '100%', ...style }, children: isMapReady && children }));
};
export default MapWrapper;
//# sourceMappingURL=MapWrapper.js.map