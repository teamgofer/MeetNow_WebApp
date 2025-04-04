import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import CountdownTimer from '../ui/CountdownTimer';
import { createMapIcons } from '../../utils/map-icons';
import { ProgressiveImage } from '../common';
const MeetupMarker = ({ id, position, title, description, address, distance, expiresAt, createdAt, status = 'active', onClick, selected = false, showPopup = false, icon, imageUrl }) => {
    const icons = useMemo(() => createMapIcons(), []);
    const meetupIcon = useMemo(() => {
        if (icon)
            return icon;
        if (status === 'expired') {
            return icons.expiredMeetupIcon;
        }
        if (selected) {
            return icons.selectedMeetupIcon;
        }
        return icons.meetupIcon;
    }, [icons, status, selected, icon]);
    const formatDistance = (dist) => {
        if (!dist)
            return '';
        return dist < 1
            ? `${Math.round(dist * 1000)}m away`
            : `${dist.toFixed(1)}km away`;
    };
    const handleClick = () => {
        if (onClick) {
            onClick(id, 'map');
        }
    };
    const handleImageError = (e) => {
        e.currentTarget.src = 'https://via.placeholder.com/150';
        e.currentTarget.style.opacity = '0.6';
    };
    const imageElementId = imageUrl ? `marker-img-${id}` : '';
    return (_jsx(Marker, { position: position, icon: meetupIcon, eventHandlers: {
            click: handleClick
        }, zIndexOffset: selected ? 1000 : 500, pane: "markerPane", children: showPopup && (_jsx(Popup, { className: "meetup-popup", autoClose: false, closeOnClick: false, children: _jsxs("div", { className: "p-3", children: [imageUrl && (_jsx("div", { className: "meetup-popup-image mb-2 overflow-hidden rounded", children: _jsx(ProgressiveImage, { src: imageUrl, alt: title, className: "w-full h-32 rounded", objectFit: "cover", fallbackSrc: "https://via.placeholder.com/150", onError: handleImageError, placeholderColor: "#f3f4f6", loading: "lazy", width: "100%", height: "100%", id: imageElementId }) })), _jsxs("div", { className: "flex justify-between items-start", children: [_jsx("h3", { className: "font-medium text-gray-900", children: title || 'Meetup' }), distance !== undefined && (_jsx("span", { className: "text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full", children: formatDistance(distance) }))] }), description && (_jsx("p", { className: "text-sm mt-1 text-gray-600", children: description })), address && (_jsx("p", { className: "text-xs mt-1 text-gray-500", children: address })), expiresAt && (_jsx("div", { className: "countdown-timer mt-2", children: _jsx(CountdownTimer, { targetDate: new Date(expiresAt) }) })), status === 'expired' && (_jsx("div", { className: "text-xs mt-1 text-red-500 font-medium", children: "This meetup has expired" }))] }) })) }));
};
const arePropsEqual = (prevProps, nextProps) => {
    if (prevProps.id !== nextProps.id)
        return false;
    if (prevProps.title !== nextProps.title)
        return false;
    if (prevProps.description !== nextProps.description)
        return false;
    if (prevProps.selected !== nextProps.selected)
        return false;
    if (prevProps.showPopup !== nextProps.showPopup)
        return false;
    if (prevProps.status !== nextProps.status)
        return false;
    const prevPos = prevProps.position;
    const nextPos = nextProps.position;
    if (Array.isArray(prevPos) && Array.isArray(nextPos)) {
        if (prevPos[0] !== nextPos[0] || prevPos[1] !== nextPos[1])
            return false;
    }
    else if (typeof prevPos === 'object' &&
        typeof nextPos === 'object' &&
        prevPos !== null &&
        nextPos !== null) {
        if (prevPos.lat !== nextPos.lat ||
            prevPos.lng !== nextPos.lng)
            return false;
    }
    else if (prevPos !== nextPos) {
        return false;
    }
    if (prevProps.imageUrl !== nextProps.imageUrl)
        return false;
    return true;
};
export default React.memo(MeetupMarker, arePropsEqual);
//# sourceMappingURL=MeetupMarker.js.map