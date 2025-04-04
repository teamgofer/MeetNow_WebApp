import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useMap, Marker, Popup } from 'react-leaflet';
import Logger from '../../utils/Logger';
import { PerformanceMonitor } from '../../utils/PerformanceMonitor';
const LocationMarker = ({ onLocationSelect, position, icon, showInfoByDefault = false, zIndexOffset = 1000, pulsate = true, interactive = true, }) => {
    const map = useMap();
    const [isGeocoding, setIsGeocoding] = useState(false);
    const abortControllerRef = useRef(null);
    const renderStartTimeRef = useRef(Date.now());
    const [showInfo, setShowInfo] = useState(showInfoByDefault);
    useEffect(() => {
        abortControllerRef.current = new AbortController();
        const duration = Date.now() - renderStartTimeRef.current;
        PerformanceMonitor.trackOperationTiming('map', 'locationMarkerInit', duration, {
            success: true,
            hasPosition: !!position,
            hasIcon: !!icon,
        });
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);
    useEffect(() => {
        if (position) {
            const startTime = Date.now();
            PerformanceMonitor.trackOperationTiming('map', 'locationMarkerUpdate', 0, {
                success: true,
                lat: position.lat,
                lng: position.lng,
                hasIcon: !!icon,
            });
            Logger.debug('LocationMarker', 'Position updated', {
                lat: position.lat,
                lng: position.lng,
                accuracy: position.accuracy,
            });
        }
    }, [position, icon]);
    const handleMarkerClick = () => {
        const startTime = Date.now();
        setShowInfo(!showInfo);
        if (onLocationSelect) {
            onLocationSelect(position);
            const duration = Date.now() - startTime;
            PerformanceMonitor.trackOperationTiming('map', 'locationMarkerClick', duration, {
                success: true,
                lat: position.lat,
                lng: position.lng,
            });
        }
    };
    return (_jsxs(_Fragment, { children: [position && position.lat && position.lng && (_jsx(Marker, { position: [position.lat, position.lng], icon: icon, zIndexOffset: zIndexOffset, interactive: interactive, eventHandlers: {
                    click: handleMarkerClick,
                }, children: showInfo && (_jsx(Popup, { children: _jsxs("div", { className: "location-info", children: [_jsx("h3", { children: "Your Location" }), position.display_name && _jsx("p", { children: position.display_name }), position.accuracy && _jsxs("p", { children: ["Accuracy: \u00B1", Math.round(position.accuracy), "m"] })] }) })) })), isGeocoding && (_jsx("div", { className: "absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg text-sm text-gray-600", children: "Getting location details..." }))] }));
};
export default LocationMarker;
//# sourceMappingURL=LocationMarker.js.map