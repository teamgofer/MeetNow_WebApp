import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { LatLngBounds } from 'leaflet';
import MapClickHandler from './MapClickHandler';
import UserLocationMarker from './UserLocationMarker';
import PinMarker from './PinMarker';
import MeetupMarkers from './MeetupMarkers';
import { MAP_CONSTANTS } from '../../lib/map/config';
import MapNavigationController from '../../utils/MapNavigationController';
const DEFAULT_CENTER = [51.505, -0.09];
const DEFAULT_ZOOM = MAP_CONSTANTS.DEFAULT_ZOOM;
function UserLocationDetector({ setUserLocation, centerOnUser = true, }) {
    const map = useMap();
    useEffect(() => {
        map.locate({
            setView: centerOnUser,
            maxZoom: 16,
            enableHighAccuracy: true,
        });
        const handleLocationFound = (e) => {
            console.log('User location found:', e.latlng, 'Accuracy:', e.accuracy);
            const userPos = [e.latlng.lat, e.latlng.lng];
            setUserLocation(userPos, e.accuracy);
            if (centerOnUser) {
                map.setView(userPos, 15);
            }
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
    }, [map, setUserLocation, centerOnUser]);
    return null;
}
function MapController({ bounds, shouldFitBounds, }) {
    const map = useMap();
    useEffect(() => {
        if (bounds && shouldFitBounds) {
            map.fitBounds(bounds, {
                padding: [50, 50],
                maxZoom: 16,
                animate: true,
            });
        }
    }, [map, bounds, shouldFitBounds]);
    return null;
}
const MapView = ({ meetups = [], pins = [], onMapClick, onMeetupClick, onPinClick, selectedMeetupId = null, selectedPinId = null, showUserLocation = true, centerOnUserLocation = true, fitAllMarkers = false, height = '100%', width = '100%', className = '', }) => {
    const [userLocation, setUserLocation] = useState(null);
    const [userAccuracy, setUserAccuracy] = useState(undefined);
    const [controller] = useState(new MapNavigationController({
        defaultZoom: DEFAULT_ZOOM,
        animateTransitions: true,
        enableDebug: true,
    }));
    const [bounds, setBounds] = useState(null);
    useEffect(() => {
        if (!fitAllMarkers)
            return;
        const points = [];
        if (userLocation) {
            points.push(userLocation);
        }
        meetups.forEach(meetup => {
            points.push(meetup.position);
        });
        pins.forEach(pin => {
            points.push(pin.position);
        });
        if (points.length >= 2) {
            const newBounds = new LatLngBounds(points);
            setBounds(newBounds);
        }
        else {
            setBounds(null);
        }
    }, [meetups, pins, userLocation, fitAllMarkers]);
    const handleUserLocationFound = useCallback((location, accuracy) => {
        setUserLocation(location);
        setUserAccuracy(accuracy);
    }, []);
    const handleMapClick = (e) => {
        if (onMapClick) {
            const position = [e.latlng.lat, e.latlng.lng];
            onMapClick(position);
        }
    };
    const handleMapReady = (map) => {
        if (onMapClick) {
            map.on('click', handleMapClick);
        }
        controller.updateMapReference(map);
    };
    return (_jsx("div", { style: { height, width }, className: `map-container ${className}`, children: _jsxs(MapContainer, { center: userLocation || DEFAULT_CENTER, zoom: DEFAULT_ZOOM, style: { height: '100%', width: '100%' }, zoomControl: false, children: [_jsx(TileLayer, { attribution: '\u00A9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" }), showUserLocation && (_jsx(UserLocationDetector, { setUserLocation: handleUserLocationFound, centerOnUser: centerOnUserLocation })), _jsx(MapController, { bounds: bounds, shouldFitBounds: fitAllMarkers }), _jsx(MapClickHandler, { navigationController: controller, onMapReady: handleMapReady }), showUserLocation && userLocation && (_jsx(UserLocationMarker, { position: userLocation, accuracy: userAccuracy, showPopup: false })), _jsx(MeetupMarkers, { meetups: meetups, onMeetupClick: onMeetupClick, selectedMeetupId: selectedMeetupId, showPopups: false }), pins.map(pin => (_jsx(PinMarker, { id: pin.id, position: pin.position, title: pin.title, address: pin.address, color: pin.color, isTemporary: pin.isTemporary, onClick: onPinClick, selected: selectedPinId === pin.id, showPopup: selectedPinId === pin.id }, pin.id)))] }) }));
};
export default MapView;
//# sourceMappingURL=MapView.js.map