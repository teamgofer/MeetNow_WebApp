import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { FaTimes } from 'react-icons/fa';

/**
 * Modal dialog component with animations and accessibility features
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Handle ESC key
  useEffect(() => {
    if (!closeOnEsc) return;

    const handleEscKey = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      // Store the previously focused element
      previousActiveElement.current = document.activeElement;
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      // Restore focus when modal closes
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, closeOnEsc, onClose]);

  // Focus modal when opened
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={closeOnOverlayClick ? onClose : undefined}
        role="presentation"
      />

      {/* Modal panel */}
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div
            ref={modalRef}
            className={`
              relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800
              px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full
              sm:p-6 ${getSizeClasses()} ${className}
            `}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Close button */}
            {showCloseButton && (
              <button
                type="button"
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-500 focus:outline-none"
                onClick={onClose}
                aria-label="Close modal"
              >
                <FaTimes className="h-6 w-6" />
              </button>
            )}

            {/* Title */}
            {title && (
              <div className="mb-4">
                <h3
                  id="modal-title"
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                >
                  {title}
                </h3>
              </div>
            )}

            {/* Content */}
            <div className="mt-2">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', '2xl', 'full']),
  showCloseButton: PropTypes.bool,
  closeOnOverlayClick: PropTypes.bool,
  closeOnEsc: PropTypes.bool
};

/**
 * Modal header component
 */
export const ModalHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);

ModalHeader.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

/**
 * Modal body component
 */
export const ModalBody = ({ children, className = '' }) => (
  <div className={`mt-2 ${className}`}>{children}</div>
);

ModalBody.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

/**
 * Modal footer component
 */
export const ModalFooter = ({ children, className = '' }) => (
  <div className={`mt-4 flex justify-end space-x-3 ${className}`}>{children}</div>
);

ModalFooter.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export default Modal; 