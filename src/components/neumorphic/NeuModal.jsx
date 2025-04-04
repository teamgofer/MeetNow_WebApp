import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import './neumorphic.css';

/**
 * Neumorphic Modal component
 * A customizable modal/dialog with neumorphic styling
 */
const NeuModal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'medium',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  variant = 'default',
  className = '',
  overlayClassName = '',
  ...props
}) => {
  useEffect(() => {
    const handleEscKey = event => {
      if (isOpen && closeOnEsc && event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = ''; // Restore scrolling when component unmounts
    };
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = e => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'neu-modal-small';
      case 'large':
        return 'neu-modal-large';
      case 'fullscreen':
        return 'neu-modal-fullscreen';
      default:
        return 'neu-modal-medium';
    }
  };

  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'neu-modal-primary';
      case 'luxury':
        return 'neu-modal-luxury';
      case 'playful':
        return 'neu-modal-playful';
      case 'minimal':
        return 'neu-modal-minimal';
      default:
        return 'neu-modal-default';
    }
  };

  return (
    <div className={`neu-modal-overlay ${overlayClassName}`} onClick={handleOverlayClick}>
      <div
        className={`neu-modal ${getSizeClass()} ${getVariantClass()} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        {...props}
      >
        <div className="neu-modal-header">
          <h2 className="neu-modal-title" id="modal-title">
            {title}
          </h2>
          {showCloseButton && (
            <button className="neu-modal-close" onClick={onClose} aria-label="Close modal">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
        <div className="neu-modal-content">{children}</div>
        {footer && <div className="neu-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

NeuModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'fullscreen']),
  closeOnOverlayClick: PropTypes.bool,
  closeOnEsc: PropTypes.bool,
  showCloseButton: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'primary', 'luxury', 'playful', 'minimal']),
  className: PropTypes.string,
  overlayClassName: PropTypes.string,
};

export default NeuModal;
