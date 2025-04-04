import React from 'react';
import { LatLngExpression } from 'leaflet';
interface MemoizedMeetupMarkerProps {
    id: string;
    position: LatLngExpression;
    title: string;
    description?: string;
    address?: string;
    distance?: number;
    expiresAt?: string;
    createdAt?: string;
    status?: 'active' | 'pending' | 'expired';
    onClick?: (id: string, source: string) => void;
    selected?: boolean;
    showPopup?: boolean;
    imageUrl?: string | null | undefined;
}
declare const _default: React.NamedExoticComponent<MemoizedMeetupMarkerProps>;
export default _default;
