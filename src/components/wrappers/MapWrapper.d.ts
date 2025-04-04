import React from 'react';
interface IMapWrapperProps {
    center?: [number, number];
    zoom?: number;
    className?: string;
    style?: React.CSSProperties;
    onMapReady?: () => void;
    onLocationChange?: (location: [number, number]) => void;
    onZoomChange?: (zoom: number) => void;
    onMapClick?: (e: {
        latlng: {
            lat: number;
            lng: number;
        };
    }) => void;
    onMapMove?: (e: {
        latlng: {
            lat: number;
            lng: number;
        };
    }) => void;
    onMarkerClick?: (markerId: string, data?: any) => void;
    onPopupOpen?: (popupId: string, data?: any) => void;
    onPopupClose?: (popupId: string) => void;
    onError?: (error: Error) => void;
    children?: React.ReactNode;
}
declare const MapWrapper: React.FC<IMapWrapperProps>;
export default MapWrapper;
