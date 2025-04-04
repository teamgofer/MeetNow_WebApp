import { jsx as _jsx } from "react/jsx-runtime";
import React, { useMemo } from 'react';
import L from 'leaflet';
import MeetupMarker from './MeetupMarker';
const MemoizedMeetupMarker = ({ id, position, title, description = '', address = '', distance = 0, expiresAt = '', createdAt = '', status = 'active', onClick, selected = false, showPopup = false, imageUrl, }) => {
    const imageId = imageUrl ? `marker-img-${id}` : '';
    const handleClick = onClick || ((id, source) => { });
    if (status === 'expired') {
        return null;
    }
    const meetupIcon = useMemo(() => {
        if (imageUrl) {
            const size = selected ? [56, 56] : [44, 44];
            const anchor = selected ? [28, 28] : [22, 22];
            const markerHtml = `<div class="meetup-marker-container" style="width: ${size[0]}px; height: ${size[1]}px; position: relative;">
          <div class="multicolored-glow" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50%; 
            background: conic-gradient(from 0deg, ${selected ? '#ff3d71, #ffa344, #f6ff49, #38f261, #28e7ff, #7b5aff, #e752ff, #ff3d71' : '#ff5f8c, #ffb76b, #f8ff75, #69f587, #59edff, #9c7dff, #ed7bff, #ff5f8c'}); 
            filter: blur(${selected ? 4 : 3}px); opacity: ${selected ? 0.9 : 0.7}; animation: rotate-glow ${selected ? 4 : 6}s linear infinite; z-index: 1;"></div>
          <div class="marker-pulse" style="position: absolute; top: -4px; left: -4px; width: ${size[0] + 8}px; height: ${size[1] + 8}px; border-radius: 50%;
            background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(59,130,246,0.4) 25%, rgba(139,92,246,0.3) 50%, rgba(236,72,153,0.2) 75%, transparent 100%);
            opacity: 0; animation: pulse-out ${selected ? 2.5 : 4}s ease-out infinite; z-index: 0;"></div>
          <div style="position: absolute; top: 3px; left: 3px; width: ${size[0] - 6}px; height: ${size[1] - 6}px; background-color: #ef4444; 
            border: 3px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; 
            overflow: hidden; box-shadow: 0 0 ${selected ? 10 : 7}px rgba(0,0,0,0.5), inset 0 0 5px rgba(255,255,255,0.6); z-index: 2;">
            <img id="${imageId}" src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy" 
              onerror="this.onerror=null; this.src='https://via.placeholder.com/40'; this.style.opacity=0.7;" />
          </div>
          ${selected ? `<div class="highlight" style="position: absolute; top: 10px; left: 18px; width: 20px; height: 10px; 
              background: linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0)); border-radius: 50%; 
              transform: rotate(-35deg); filter: blur(1px); opacity: 0.7; z-index: 3;"></div>` : ''}
        </div>
        <style>
          @keyframes rotate-glow {
            0% { background-size: 400% 400%; background-position: 0% 0%; ${selected ? '' : 'transform: rotate(0deg);'} }
            100% { background-size: 400% 400%; background-position: 100% 100%; ${selected ? '' : 'transform: rotate(360deg);'} }
          }
          @keyframes pulse-out {
            0% { transform: scale(0.5); opacity: ${selected ? 0.8 : 0.6}; }
            70% { transform: scale(1.5); opacity: ${selected ? 0.3 : 0.2}; }
            100% { transform: scale(2); opacity: 0; }
          }
        </style>`;
            return L.divIcon({
                className: selected ? 'meetup-location-marker selected' : 'meetup-location-marker',
                html: markerHtml,
                iconSize: size,
                iconAnchor: anchor,
            });
        }
        const iconUrl = '/images/map marker hi def.png';
        const iconSize = selected ? [56, 56] : [44, 44];
        const iconAnchor = selected ? [28, 56] : [22, 44];
        const popupAnchor = [0, -44];
        const markerHtml = `<div class="map-pin-container" style="width: ${iconSize[0]}px; height: ${iconSize[1]}px; position: relative; display: flex; align-items: center; justify-content: center;">
        <div class="multicolored-glow" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
          background: conic-gradient(from 0deg, ${selected ? '#ff3d71, #ffa344, #f6ff49, #38f261, #28e7ff, #7b5aff, #e752ff, #ff3d71' : '#ff5f8c, #ffb76b, #f8ff75, #69f587, #59edff, #9c7dff, #ed7bff, #ff5f8c'}); 
          filter: blur(${selected ? 8 : 6}px); opacity: ${selected ? 0.8 : 0.6}; animation: rotate-glow ${selected ? 4 : 6}s linear infinite; border-radius: 50%; z-index: 1;"></div>
        <div class="marker-pulse" style="position: absolute; top: -8px; left: -8px; width: ${iconSize[0] + 16}px; height: ${iconSize[1] + 16}px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(59,130,246,0.4) 25%, rgba(139,92,246,0.3) 50%, rgba(236,72,153,0.2) 75%, transparent 100%);
          opacity: 0; animation: pulse-out ${selected ? 2.5 : 4}s ease-out infinite; z-index: 0;"></div>
        <img src="${iconUrl}" style="width: 100%; height: 100%; object-fit: contain; position: relative; z-index: 2; 
          filter: drop-shadow(0 0 ${selected ? 8 : 5}px rgba(255,255,255,0.8));" alt="Map Marker" />
        <style>
          @keyframes rotate-glow {
            0% { background-size: 400% 400%; background-position: 0% 0%; transform: rotate(0deg); }
            100% { background-size: 400% 400%; background-position: 100% 100%; transform: rotate(360deg); }
          }
          @keyframes pulse-out {
            0% { transform: scale(0.5); opacity: ${selected ? 0.8 : 0.6}; }
            70% { transform: scale(1.5); opacity: ${selected ? 0.3 : 0.2}; }
            100% { transform: scale(2); opacity: 0; }
          }
        </style>
      </div>`;
        return L.divIcon({
            className: selected ? 'map-pin-marker selected' : 'map-pin-marker',
            html: markerHtml,
            iconSize: iconSize,
            iconAnchor: iconAnchor,
            popupAnchor: popupAnchor,
        });
    }, [imageUrl, imageId, selected]);
    return (_jsx(MeetupMarker, { id: id, position: position, title: title, description: description, address: address, distance: distance, expiresAt: expiresAt, createdAt: createdAt, status: status, icon: meetupIcon, onClick: handleClick, selected: selected, showPopup: showPopup, imageUrl: imageUrl }));
};
export default React.memo(MemoizedMeetupMarker, (prevProps, nextProps) => {
    return (prevProps.id === nextProps.id &&
        prevProps.selected === nextProps.selected &&
        prevProps.imageUrl === nextProps.imageUrl &&
        JSON.stringify(prevProps.position) === JSON.stringify(nextProps.position));
});
//# sourceMappingURL=MemoizedMeetupMarker.js.map