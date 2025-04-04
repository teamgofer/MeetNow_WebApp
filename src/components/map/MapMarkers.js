import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import MapMarker from './MapMarker';
const MapMarkers = ({ markers, onMarkerClick, selectedMarkerId = null, }) => {
    const handleMarkerClick = (markerId) => (e) => {
        if (onMarkerClick) {
            onMarkerClick(markerId, e);
        }
    };
    return (_jsx(_Fragment, { children: markers.map(marker => {
            const isSelected = selectedMarkerId === marker.id;
            const markerProps = {
                key: marker.id,
                markerId: marker.id,
                position: marker.position,
                showPopup: isSelected || !!marker.showPopup,
            };
            if (marker.popupContent)
                markerProps.popupContent = marker.popupContent;
            if (marker.icon)
                markerProps.icon = marker.icon;
            if (marker.title)
                markerProps.title = marker.title;
            if (marker.zIndexOffset !== undefined)
                markerProps.zIndexOffset = marker.zIndexOffset;
            if (marker.opacity !== undefined)
                markerProps.opacity = marker.opacity;
            if (onMarkerClick)
                markerProps.onClick = handleMarkerClick(marker.id);
            return _jsx(MapMarker, { ...markerProps });
        }) }));
};
export default MapMarkers;
import { useRef, useEffect, useMemo, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import Logger from '../../utils/Logger';
import { PerformanceMonitor } from '../../utils/PerformanceMonitor';
const MapMarkers = ({ currentCenter, activeMeetups = [], icons, getPopupConfig, handlePopupOpen, onMarkerClick, selectedMeetupId, highlightSelected = true, showPopups = true, }) => {
    const renderStartTimeRef = useRef(Date.now());
    const lastMeetupsRef = useRef([]);
    const [selectedId, setSelectedId] = useState(selectedMeetupId);
    useEffect(() => {
        const duration = Date.now() - renderStartTimeRef.current;
        PerformanceMonitor.trackOperationTiming('map', 'mapMarkersInit', duration, {
            success: true,
            hasCurrentCenter: !!currentCenter,
            meetupCount: activeMeetups.length ?? 0,
            hasIcons: !!icons,
        });
        return () => {
            Logger.debug('MapMarkers', 'Component unmounted');
        };
    }, []);
    useEffect(() => {
        if (selectedMeetupId !== selectedId) {
            setSelectedId(selectedMeetupId);
        }
    }, [selectedMeetupId]);
    useEffect(() => {
        if (activeMeetups) {
            const startTime = Date.now();
            const meetupCount = activeMeetups.length;
            const addedMeetups = activeMeetups.filter(meetup => !lastMeetupsRef.current.find(m => m.id === meetup.id));
            const removedMeetups = lastMeetupsRef.current.filter(meetup => !activeMeetups.find(m => m.id === meetup.id));
            PerformanceMonitor.trackOperationTiming('map', 'mapMarkersUpdate', Date.now() - startTime, {
                success: true,
                meetupCount,
                addedCount: addedMeetups.length,
                removedCount: removedMeetups.length,
                hasCurrentCenter: !!currentCenter,
            });
            lastMeetupsRef.current = activeMeetups;
        }
    }, [activeMeetups, currentCenter]);
    const handleMarkerClick = (meetup) => {
        const startTime = Date.now();
        setSelectedId(meetup.id);
        if (!onMarkerClick) {
            PerformanceMonitor.trackOperationTiming('map', 'mapMarkerClick', 0, {
                success: false,
                reason: 'noClickHandler',
                meetupId: meetup.id,
            });
            return;
        }
        const locationData = {
            ...meetup.location,
            isUserSelected: true,
            display_name: meetup.title ?? (meetup.location.display_name || 'Selected Location'),
            meetupId: meetup.id,
        };
        onMarkerClick(locationData);
        const duration = Date.now() - startTime;
        PerformanceMonitor.trackOperationTiming('map', 'mapMarkerClick', duration, {
            success: true,
            meetupId: meetup.id,
            hasTitle: !!meetup.title,
            hasAddress: !!meetup.location.address,
        });
    };
    const userMarker = useMemo(() => {
        if (!currentCenter?.lat ?? !currentCenter.lng)
            return null;
        return (_jsx(Marker, { position: [currentCenter.lat, currentCenter.lng], icon: icons.userIcon, eventHandlers: {
                popupopen: () => {
                    const startTime = Date.now();
                    if (handlePopupOpen) {
                        handlePopupOpen();
                        const duration = Date.now() - startTime;
                        PerformanceMonitor.trackOperationTiming('map', 'mapMarkerPopupOpen', duration, {
                            success: true,
                            type: 'userLocation',
                            lat: currentCenter.lat,
                            lng: currentCenter.lng,
                        });
                    }
                },
            }, children: showPopups && (_jsx(Popup, { ...getPopupConfig(), children: _jsx("div", { className: "meetup-card text-base p-2", children: "Your Location" }) })) }));
    }, [currentCenter, icons.userIcon, handlePopupOpen, getPopupConfig, showPopups]);
    return (_jsxs(_Fragment, { children: [userMarker, Array.isArray(activeMeetups) &&
                activeMeetups.map(meetup => {
                    if (!meetup.location.lat ?? !meetup.location.lng) {
                        Logger.warn('MapMarkers', 'Invalid meetup location', { meetupId: meetup.id });
                        return null;
                    }
                    const isSelected = highlightSelected && selectedId === meetup.id;
                    return (_jsx(Marker, { position: [meetup.location.lat, meetup.location.lng], icon: icons.meetupIcon, zIndexOffset: isSelected ? 1000 : 500, opacity: isSelected ? 1 : 0.8, eventHandlers: {
                            click: () => handleMarkerClick(meetup),
                            popupopen: () => {
                                const startTime = Date.now();
                                if (handlePopupOpen) {
                                    handlePopupOpen();
                                    const duration = Date.now() - startTime;
                                    PerformanceMonitor.trackOperationTiming('map', 'mapMarkerPopupOpen', duration, {
                                        success: true,
                                        type: 'meetup',
                                        meetupId: meetup.id,
                                        lat: meetup.location.lat,
                                        lng: meetup.location.lng,
                                    });
                                }
                            },
                        }, children: showPopups && (_jsx(Popup, { ...getPopupConfig(), children: _jsxs("div", { className: "meetup-card text-base p-2", children: [_jsx("h3", { className: "font-semibold", children: meetup.title ?? 'Unnamed Meetup' }), meetup.description && _jsx("p", { className: "text-sm", children: meetup.description }), meetup.date && (_jsxs("p", { className: "text-xs mt-2", children: [meetup.date, " ", meetup.time || ''] })), meetup.distance !== undefined && (_jsx("p", { className: "text-xs text-gray-500", children: meetup.distance < 1000
                                            ? `${Math.round(meetup.distance)}m away`
                                            : `${(meetup.distance / 1000).toFixed(1)}km away` }))] }) })) }, meetup.id ?? `meetup-${Math.random()}`));
                })] }));
};
export default MapMarkers;
//# sourceMappingURL=MapMarkers.js.map