import React from 'react';
import { LatLngExpression, Icon, DivIcon } from 'leaflet';
interface MeetupMarkerProps {
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
    icon?: Icon | DivIcon;
    imageUrl?: string | null | undefined;
}
declare const _default: React.NamedExoticComponent<MeetupMarkerProps>;
export default _default;
