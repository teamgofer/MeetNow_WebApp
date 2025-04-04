import { jsx as _jsx } from "react/jsx-runtime";
import L from 'leaflet';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { useComponentRegistry } from './ComponentRegistry';
const PersistentPinMarker = ({ id, position, icon, popupContent, isVisible = true, zIndexOffset = 0, eventHandlers = {}, className = '', }) => {
    const markerRef = useRef(null);
    const isRegisteredRef = useRef(false);
    const { registerPinMarker, unregisterPinMarker } = useComponentRegistry();
    useEffect(() => {
        if (markerRef.current && !isRegisteredRef.current) {
            registerPinMarker(id, markerRef.current);
            isRegisteredRef.current = true;
        }
        return () => {
            if (isRegisteredRef.current) {
                unregisterPinMarker(id);
                isRegisteredRef.current = false;
            }
        };
    }, [id]);
    let markerPosition;
    if (Array.isArray(position)) {
        markerPosition = position;
    }
    else if (position &&
        typeof position === 'object' &&
        position.lat !== undefined &&
        position.lng !== undefined) {
        markerPosition = [position.lat, position.lng];
    }
    else {
        return null;
    }
    if (!isVisible)
        return null;
    const defaultIcon = L.divIcon({
        className: `persistent-pin-marker ${className}`,
        html: '<div style="width: 24px; height: 24px; background-color: #ef4444; border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" style="width: 12px; height: 12px;"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });
    return (_jsx(Marker, { ref: markerRef, position: markerPosition, icon: icon || defaultIcon, zIndexOffset: zIndexOffset, eventHandlers: eventHandlers, className: className, children: popupContent && (_jsx(Popup, { children: _jsx("div", { className: "p-2", children: popupContent }) })) }));
};
PersistentPinMarker.propTypes = {
    id: PropTypes.string.isRequired,
    position: PropTypes.oneOfType([
        PropTypes.shape({
            lat: PropTypes.number.isRequired,
            lng: PropTypes.number.isRequired,
        }),
        PropTypes.arrayOf(PropTypes.number),
    ]).isRequired,
    icon: PropTypes.object,
    popupContent: PropTypes.node,
    isVisible: PropTypes.bool,
    zIndexOffset: PropTypes.number,
    eventHandlers: PropTypes.object,
    className: PropTypes.string,
};
export default PersistentPinMarker;
//# sourceMappingURL=PersistentPinMarker.js.map