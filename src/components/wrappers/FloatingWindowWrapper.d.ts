import React from 'react';
interface IFloatingWindowWrapperProps {
    id: string;
    children: React.ReactNode;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    isVisible?: boolean;
    className?: string;
    style?: React.CSSProperties;
    draggable?: boolean;
    onClose?: () => void;
}
declare const FloatingWindowWrapper: React.FC<IFloatingWindowWrapperProps>;
export default FloatingWindowWrapper;
