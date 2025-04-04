import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';
const Modal = ({ isOpen, onClose, title, children, className = '', size = 'md', showCloseButton = true, closeOnOverlayClick = true, closeOnEsc = true, }) => {
    const modalRef = useRef(null);
    const previousActiveElement = useRef(null);
    useEffect(() => {
        if (!closeOnEsc)
            return;
        const handleEscKey = (event) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
            previousActiveElement.current = document.activeElement;
        }
        return () => {
            document.removeEventListener('keydown', handleEscKey);
            if (previousActiveElement.current) {
                previousActiveElement.current.focus();
            }
        };
    }, [isOpen, closeOnEsc, onClose]);
    useEffect(() => {
        if (isOpen && modalRef.current) {
            modalRef.current.focus();
        }
    }, [isOpen]);
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);
    const getSizeClasses = () => {
        switch (size) {
            case 'sm':
                return 'max-w-sm';
            case 'md':
                return 'max-w-md';
            case 'lg':
                return 'max-w-lg';
            case 'xl':
                return 'max-w-xl';
            case '2xl':
                return 'max-w-2xl';
            case 'full':
                return 'max-w-full m-4';
            default:
                return 'max-w-md';
        }
    };
    if (!isOpen)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-50 overflow-hidden", role: "dialog", "aria-modal": "true", "aria-labelledby": "modal-title", children: [_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 transition-opacity", onClick: closeOnOverlayClick ? onClose : undefined, role: "presentation" }), _jsx("div", { className: "fixed inset-0 z-10 overflow-y-auto", children: _jsx("div", { className: "flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0", children: _jsxs("div", { ref: modalRef, className: `
              relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800
              px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full
              sm:p-6 ${getSizeClasses()} ${className}
            `, tabIndex: -1, role: "dialog", "aria-modal": "true", "aria-labelledby": "modal-title", children: [showCloseButton && (_jsx("button", { type: "button", className: "absolute right-4 top-4 text-gray-400 hover:text-gray-500 focus:outline-none", onClick: onClose, "aria-label": "Close modal", children: _jsx(FaTimes, { className: "h-6 w-6" }) })), title && (_jsx("div", { className: "mb-4", children: _jsx("h3", { id: "modal-title", className: "text-lg font-medium leading-6 text-gray-900 dark:text-white", children: title }) })), _jsx("div", { className: "mt-2", children: children })] }) }) })] }));
};
export const ModalHeader = ({ children, className = '' }) => (_jsx("div", { className: `mb-4 ${className}`, children: children }));
export const ModalBody = ({ children, className = '' }) => (_jsx("div", { className: `mt-2 ${className}`, children: children }));
export const ModalFooter = ({ children, className = '' }) => (_jsx("div", { className: `mt-4 flex justify-end space-x-3 ${className}`, children: children }));
export default Modal;
//# sourceMappingURL=Modal.js.map