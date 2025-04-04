import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';

import { useComponentRegistry } from './ComponentRegistry';

const PersistentFloatingWindow = ({
  id,
  children,
  className = '',
  style = {},
  isVisible = true,
  onClose,
  position = 'top-right',
  zIndex = 700,
}) => {
  const windowRef = useRef(null);
  const { registerFloatingWindow, unregisterFloatingWindow, activeFloatingWindows } =
    useComponentRegistry();

  useEffect(() => {
    if (windowRef.current && !activeFloatingWindows.includes(id)) {
      registerFloatingWindow(id, windowRef.current);
    }

    return () => {
      if (activeFloatingWindows.includes(id)) {
        unregisterFloatingWindow(id);
      }
    };
  }, [id, activeFloatingWindows]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-5 right-5';
      case 'top-left':
        return 'top-5 left-5';
      case 'bottom-right':
        return 'bottom-5 right-5';
      case 'bottom-left':
        return 'bottom-5 left-5';
      default:
        return 'top-5 right-5';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      ref={windowRef}
      className={`persistent-floating-window ${getPositionClasses()} ${className}`}
      style={{
        position: 'absolute',
        zIndex,
        maxWidth: '400px',
        maxHeight: 'calc(100vh - 40px)',
        overflow: 'visible',
        opacity: 1,
        transform: 'translateX(0)',
        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

PersistentFloatingWindow.propTypes = {
  id: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  style: PropTypes.object,
  isVisible: PropTypes.bool,
  onClose: PropTypes.func,
  position: PropTypes.oneOf(['top-right', 'top-left', 'bottom-right', 'bottom-left']),
  zIndex: PropTypes.number,
};

export default PersistentFloatingWindow;
