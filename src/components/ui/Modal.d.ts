import React from 'react';
interface IModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    showCloseButton?: boolean;
    closeOnOverlayClick?: boolean;
    closeOnEsc?: boolean;
}
declare const Modal: React.FC<IModalProps>;
interface IModalSubcomponentProps {
    children: React.ReactNode;
    className?: string;
}
export declare const ModalHeader: React.FC<IModalSubcomponentProps>;
export declare const ModalBody: React.FC<IModalSubcomponentProps>;
export declare const ModalFooter: React.FC<IModalSubcomponentProps>;
export default Modal;
