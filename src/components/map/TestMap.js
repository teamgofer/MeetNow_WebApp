import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import MapClickHandler from './MapClickHandler';
import MapMarkers from './MapMarkers';
import { MAP_CONSTANTS } from '../../lib/map/config';
import MapNavigationController from '../../utils/MapNavigationController';
const defaultIcon = new Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});
const userLocationIcon = new DivIcon({
    className: 'user-location-marker',
    html: `
    <div class="user-location-dot">
      <div class="user-location-pulse"></div>
    </div>
  `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});
const DEFAULT_CENTER = [51.505, -0.09];
const DEFAULT_ZOOM = MAP_CONSTANTS.DEFAULT_ZOOM;
const convertToILocation = (position) => {
    if (Array.isArray(position)) {
        return {
            lat: position[0],
            lng: position[1],
        };
    }
    else if (typeof position === 'object' && 'lat' in position && 'lng' in position) {
        return {
            lat: position.lat,
            lng: position.lng,
        };
    }
    return {
        lat: DEFAULT_CENTER[0],
        lng: DEFAULT_CENTER[1],
    };
};
function UserLocationController({ setUserLocation, }) {
    const map = useMap();
    useEffect(() => {
        map.locate({
            setView: true,
            maxZoom: 16,
            enableHighAccuracy: true,
        });
        const handleLocationFound = (e) => {
            console.log('User location found:', e.latlng);
            const userPos = [e.latlng.lat, e.latlng.lng];
            setUserLocation(userPos);
            map.setView(userPos, 15);
        };
        const handleLocationError = (e) => {
            console.warn('Location error:', e.message);
        };
        map.on('locationfound', handleLocationFound);
        map.on('locationerror', handleLocationError);
        return () => {
            map.off('locationfound', handleLocationFound);
            map.off('locationerror', handleLocationError);
        };
    }, [map, setUserLocation]);
    return null;
}
const TestMap = ({ center = DEFAULT_CENTER, zoom = DEFAULT_ZOOM, height = '500px', width = '100%', }) => {
    const [markers, setMarkers] = useState([]);
    const [controller] = useState(new MapNavigationController({
        defaultZoom: zoom,
        animateTransitions: true,
        defaultLocation: convertToILocation(center),
        enableDebug: true,
    }));
    const [selectedMarkerId, setSelectedMarkerId] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    useEffect(() => {
        if (userLocation) {
            const existingUserMarker = markers.find(m => m.id === 'user-location');
            if (existingUserMarker) {
                setMarkers(prev => prev.map(m => m.id === 'user-location'
                    ? {
                        ...m,
                        position: userLocation,
                        popupContent: _jsx("div", { className: "p-2", children: "Your Location" }),
                    }
                    : m));
            }
            else {
                setMarkers(prev => [
                    ...prev,
                    {
                        id: 'user-location',
                        position: userLocation,
                        popupContent: _jsx("div", { className: "p-2", children: "Your Location" }),
                        icon: userLocationIcon,
                    },
                ]);
            }
        }
    }, [userLocation, markers]);
    const handleMapReady = (map) => {
        console.log('Map is ready!', map);
        map.on('click', handleMapClick);
    };
    const handleMapClick = (e) => {
        const newId = `marker-${Date.now()}`;
        const newPosition = [e.latlng.lat, e.latlng.lng];
        setMarkers(prev => [
            ...prev.filter(m => m.id !== 'default'),
            ...prev.filter(m => m.id === 'user-location'),
            {
                id: newId,
                position: newPosition,
                popupContent: (_jsxs("div", { className: "p-2", children: [_jsx("strong", { children: "New Location" }), _jsxs("p", { className: "text-sm", children: [e.latlng.lat.toFixed(5), ", ", e.latlng.lng.toFixed(5)] }), _jsx("button", { className: "px-2 py-1 mt-2 bg-red-500 text-white rounded text-sm", onClick: () => {
                                setMarkers(prev => prev.filter(m => m.id !== newId));
                            }, children: "Remove" })] })),
            },
        ]);
        setSelectedMarkerId(newId);
    };
    const handleMarkerClick = (markerId) => {
        setSelectedMarkerId(markerId);
        console.log(`Marker clicked: ${markerId}`);
    };
    return (_jsxs("div", { style: { height, width }, children: [_jsxs(MapContainer, { center: center, zoom: zoom, style: { height: '100%', width: '100%' }, children: [_jsx(TileLayer, { attribution: '\u00A9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" }), _jsx(UserLocationController, { setUserLocation: setUserLocation }), _jsx(MapClickHandler, { navigationController: controller, onMapReady: handleMapReady }), _jsx(MapMarkers, { markers: markers.map(m => ({
                            ...m,
                            icon: m.icon || defaultIcon,
                        })), onMarkerClick: handleMarkerClick, selectedMarkerId: selectedMarkerId })] }), _jsxs("div", { className: "mt-4 p-4 bg-gray-100 rounded", children: [_jsx("h3", { className: "font-semibold mb-2", children: "Map Instructions:" }), _jsx("p", { className: "text-sm", children: "Click anywhere on the map to add a new marker. Click on markers to select them." }), _jsxs("p", { className: "text-sm mt-2", children: ["Total markers: ", markers.length] }), userLocation && (_jsxs("p", { className: "text-sm mt-1 text-blue-600", children: ["Your location detected at: ", userLocation[0].toFixed(5), ", ", userLocation[1].toFixed(5)] }))] })] }));
};
export default TestMap;
//# sourceMappingURL=TestMap.js.map