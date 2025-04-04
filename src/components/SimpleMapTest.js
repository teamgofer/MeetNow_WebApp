import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.locatecontrol/dist/L.Control.Locate.css';
const SimpleMapTest = ({ className = '' }) => {
    const mapRef = useRef(null);
    const leafletMapRef = useRef(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const [error, setError] = useState(null);
    const [mapCenter, setMapCenter] = useState([37.7749, -122.4194]);
    useEffect(() => {
        if (!mapRef.current || leafletMapRef.current)
            return;
        try {
            const map = L.map(mapRef.current, {
                center: mapCenter,
                zoom: 13,
                zoomControl: false,
            });
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
            }).addTo(map);
            L.control.zoom({ position: 'topright' }).addTo(map);
            const marker = L.marker(mapCenter).addTo(map);
            marker.bindPopup('Test Marker').openPopup();
            leafletMapRef.current = map;
            setIsMapReady(true);
            console.log('Map initialized successfully');
        }
        catch (error) {
            console.error('Map initialization error:', error);
            setError(error instanceof Error ? error.message : 'Unknown map error');
        }
        return () => {
            if (leafletMapRef.current) {
                leafletMapRef.current.remove();
                leafletMapRef.current = null;
            }
        };
    }, [mapCenter]);
    const handleMapClick = () => {
        if (leafletMapRef.current) {
            const randomLat = mapCenter[0] + (Math.random() - 0.5) * 0.1;
            const randomLng = mapCenter[1] + (Math.random() - 0.5) * 0.1;
            const newMarker = L.marker([randomLat, randomLng]).addTo(leafletMapRef.current);
            newMarker
                .bindPopup(`New marker at ${randomLat.toFixed(4)}, ${randomLng.toFixed(4)}`)
                .openPopup();
        }
    };
    if (error) {
        return (_jsxs("div", { className: "p-4 bg-red-50 border border-red-200 rounded-md", children: [_jsx("h3", { className: "text-lg font-semibold text-red-800", children: "Map Error" }), _jsx("p", { className: "mt-2 text-red-700", children: error })] }));
    }
    return (_jsxs("div", { className: "simple-map-container", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: "Simple Map Test" }), _jsx("p", { className: "mb-4", children: "This is a simple Leaflet map with minimal dependencies to test map functionality. Click the button below to add random markers to the map." }), _jsx("button", { onClick: handleMapClick, className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mb-4", children: "Add Random Marker" }), _jsx("div", { ref: mapRef, className: `map-wrapper ${className}`, style: { width: '100%', height: '500px' } }), !isMapReady && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-70", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" }), _jsx("p", { className: "text-gray-800", children: "Initializing map..." })] }) }))] }));
};
export default SimpleMapTest;
//# sourceMappingURL=SimpleMapTest.js.map