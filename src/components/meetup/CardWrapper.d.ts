import React, { ReactNode } from 'react';
export type CardPosition = 'top' | 'bottom' | 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left' | 'right';
export interface CardWrapperProps {
    children: ReactNode;
    position?: CardPosition;
    isVisible?: boolean;
    className?: string;
    zIndex?: number;
    withAnimation?: boolean;
    animationType?: 'slide-down' | 'slide-up' | 'fade-in' | 'zoom-in';
    maxWidth?: string;
}
declare const CardWrapper: React.FC<CardWrapperProps>;
export default CardWrapper;
