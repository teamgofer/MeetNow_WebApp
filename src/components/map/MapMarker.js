import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
const MapMarker = ({ position, popupContent, icon, title = '', onClick, zIndexOffset = 0, opacity = 1, markerId, showPopup = false, markerClass = '', }) => {
    const [isPopupOpen, setIsPopupOpen] = useState(showPopup);
    useEffect(() => {
        setIsPopupOpen(showPopup);
    }, [showPopup]);
    const handleMarkerClick = (e) => {
        setIsPopupOpen(true);
        if (onClick) {
            onClick(e);
        }
    };
    return (_jsx(Marker, { position: position, icon: icon, title: title, eventHandlers: {
            click: handleMarkerClick,
        }, zIndexOffset: zIndexOffset, opacity: opacity, children: popupContent && (_jsx(Popup, { autoPan: true, closeButton: true, className: "marker-popup", children: popupContent })) }, `marker-${markerId || position.toString()}`));
};
export default MapMarker;
//# sourceMappingURL=MapMarker.js.map