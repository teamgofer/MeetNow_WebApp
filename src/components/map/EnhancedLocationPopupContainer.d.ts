import React from 'react';
import { ILocation } from '@/types/common';
interface IEnhancedLocationPopupContainerProps {
    location: ILocation;
    onSubmit?: (data: {
        title: string;
        description: string;
        maxParticipants: number;
        date: string;
        time: string;
    }) => void;
    className?: string;
}
declare const EnhancedLocationPopupContainer: React.FC<IEnhancedLocationPopupContainerProps>;
export default EnhancedLocationPopupContainer;
