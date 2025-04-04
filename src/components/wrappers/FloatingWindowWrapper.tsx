import React, { useEffect, useState, useRef } from 'react';
import { useComponentRegistry } from '../ui/ComponentRegistry';

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

const positionClasses = {
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
};

/**
 * Floating window wrapper component that registers with ComponentRegistry
 */
const FloatingWindowWrapper: React.FC<IFloatingWindowWrapperProps> = ({
  id,
  children,
  position = 'top-right',
  isVisible = true,
  className = '',
  style = {},
  draggable = false,
  onClose,
}) => {
  const { registerFloatingWindow, unregisterFloatingWindow } = useComponentRegistry();
  const [isDragging, setIsDragging] = useState(false);
  const [position_, setPosition] = useState({ x: 0, y: 0 });
  const floatingWindowRef = useRef<HTMLDivElement>(null);

  // Register with component registry
  useEffect(() => {
    registerFloatingWindow(id, {
      isVisible,
      position: position_,
      ref: floatingWindowRef,
    });

    return () => {
      unregisterFloatingWindow(id);
    };
  }, [id, isVisible, position_, registerFloatingWindow, unregisterFloatingWindow]);

  // Handle dragging functionality if enabled
  useEffect(() => {
    if (!draggable) return;

    let startPos = { x: 0, y: 0 };
    let startOffset = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      if (!floatingWindowRef.current) return;

      // Only start dragging if clicking the header
      const target = e.target as HTMLElement;
      const isHeader = target.classList.contains('floating-window-header');
      if (!isHeader) return;

      setIsDragging(true);
      startPos = { x: e.clientX, y: e.clientY };

      const rect = floatingWindowRef.current.getBoundingClientRect();
      startOffset = { x: rect.left, y: rect.top };

      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startPos.x;
      const deltaY = e.clientY - startPos.y;

      setPosition({
        x: startOffset.x + deltaX,
        y: startOffset.y + deltaY,
      });

      e.preventDefault();
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggable, isDragging]);

  if (!isVisible) return null;

  // Use draggable position if dragging, otherwise use preset position
  const positionStyle: React.CSSProperties =
    draggable && (position_.x !== 0 || position_.y !== 0)
      ? {
          position: 'fixed' as 'fixed',
          top: position_.y,
          left: position_.x,
          transform: 'none',
        }
      : {};

  return (
    <div
      ref={floatingWindowRef}
      className={`
        floating-window
        fixed ${positionClasses[position]}
        bg-white shadow-lg rounded-lg
        z-50
        ${isDragging ? 'cursor-grabbing' : ''}
        ${className}
      `}
      style={{ ...style, ...positionStyle }}
    >
      {draggable && (
        <div className="floating-window-header p-2 border-b border-gray-200 cursor-grab">
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium">{id}</div>
            {onClose && (
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            )}
          </div>
        </div>
      )}
      <div className="floating-window-content">{children}</div>
    </div>
  );
};

export default FloatingWindowWrapper;
