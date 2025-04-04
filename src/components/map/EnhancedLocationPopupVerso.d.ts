import React from 'react';
import { ILocation } from '@/types/common';
interface IEnhancedLocationPopupVersoProps {
    location: ILocation;
    onFlip?: () => void;
    onSubmit?: (data: {
        title: string;
        description: string;
        maxParticipants: number;
        date: string;
        time: string;
    }) => void;
    className?: string;
}
declare const EnhancedLocationPopupVerso: React.FC<IEnhancedLocationPopupVersoProps>;
export default EnhancedLocationPopupVerso;
