import React, { useRef, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useBreakpoint } from '../hooks/useBreakpoint';

const BottomSheet = ({
  children,
  isOpen,
  setIsOpen,
  height = '70vh',
  className = '',
  style = {},
}) => {
  const sheetRef = useRef(null);
  const contentRef = useRef(null);
  const animationRef = useRef(null);
  const [activeTab, setActiveTab] = useState('instant');
  const [snapPoints] = useState(['60px', '40vh', '70vh']);
  const [currentSnapPoint, setCurrentSnapPoint] = useState(1);
  const [lastActiveTab, setLastActiveTab] = useState('instant');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { isMobile } = useBreakpoint();

  // Enhanced touch tracking with velocity
  const touchRef = useRef({
    startY: 0,
    currentY: 0,
    startHeight: 0,
    isMultiTouch: false,
    lastTouchEnd: 0,
    velocity: 0,
    lastTime: 0,
    timestamps: [],
    positions: [],
  });

  const touchTimeoutRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setLastActiveTab(activeTab);
    } else {
      setActiveTab(lastActiveTab);
    }
  }, [isOpen, activeTab, lastActiveTab]);

  useEffect(() => {
    if (isMobile && !isOpen) {
      setIsOpen(true);
    }
  }, [isMobile, isOpen, setIsOpen]);

  // Define touch handlers with useCallback to ensure stable references
  const handleTouchStart = useCallback(
    e => {
      // Prevent handling during animation
      if (isAnimating && animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        setIsAnimating(false);
      }

      // Handle multi-touch more gracefully
      if (e.touches.length > 1) {
        touchRef.current.isMultiTouch = true;
        return;
      }

      const sheet = sheetRef.current;
      if (!sheet) return;

      // Reset tracking arrays
      touchRef.current.timestamps = [Date.now()];
      touchRef.current.positions = [e.touches[0].clientY];

      touchRef.current.startY = e.touches[0].clientY;
      touchRef.current.currentY = touchRef.current.startY;
      touchRef.current.startHeight = sheet.getBoundingClientRect().height;
      touchRef.current.isMultiTouch = false;
      touchRef.current.velocity = 0;
      touchRef.current.lastTime = Date.now();

      // Remove transition during drag for snappier response
      sheet.style.transition = 'none';
    },
    [isAnimating]
  );

  const handleTouchMove = useCallback(e => {
    if (touchRef.current.isMultiTouch) return;

    const sheet = sheetRef.current;
    if (!sheet) return;

    const touch = e.touches[0];
    const currentY = touch.clientY;
    const deltaY = currentY - touchRef.current.currentY;

    // Record position and timestamp for velocity calculation
    const now = Date.now();
    touchRef.current.timestamps.push(now);
    touchRef.current.positions.push(currentY);

    // Keep only the last 5 points for smoother calculation
    if (touchRef.current.timestamps.length > 5) {
      touchRef.current.timestamps.shift();
      touchRef.current.positions.shift();
    }

    // Calculate velocity for momentum scrolling
    const elapsed = now - touchRef.current.lastTime;
    if (elapsed > 0) {
      touchRef.current.velocity = deltaY / elapsed;
      touchRef.current.lastTime = now;
    }

    touchRef.current.currentY = currentY;

    const newHeight = touchRef.current.startHeight - deltaY;
    const maxHeight = window.innerHeight * 0.95;
    const minHeight = 60;

    // Apply resistance at edges for better feel
    if (newHeight > maxHeight) {
      const overscroll = newHeight - maxHeight;
      const dampenedHeight = maxHeight + overscroll * 0.2;
      sheet.style.height = `${dampenedHeight}px`;
    } else if (newHeight < minHeight) {
      const underscroll = minHeight - newHeight;
      const dampenedHeight = minHeight - underscroll * 0.2;
      sheet.style.height = `${dampenedHeight}px`;
    } else {
      sheet.style.height = `${newHeight}px`;
    }

    e.preventDefault();
  }, []);

  const calculateVelocity = useCallback(() => {
    const timestamps = touchRef.current.timestamps;
    const positions = touchRef.current.positions;

    if (timestamps.length < 2 || positions.length < 2) {
      return 0;
    }

    // Calculate velocity based on multiple points for smoother experience
    const firstIndex = 0;
    const lastIndex = timestamps.length - 1;

    const deltaTime = timestamps[lastIndex] - timestamps[firstIndex];
    const deltaPosition = positions[lastIndex] - positions[firstIndex];

    if (deltaTime === 0) return 0;

    // Return velocity in pixels per millisecond
    return deltaPosition / deltaTime;
  }, []);

  const handleTouchEnd = useCallback(
    e => {
      // Better handling of multi-touch gestures
      if (touchRef.current.isMultiTouch) {
        touchRef.current.isMultiTouch = false;
        return;
      }

      const sheet = sheetRef.current;
      if (!sheet) return;

      // Clear previous double-tap detection timeouts
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }

      // Improved double-tap detection with longer threshold
      const now = Date.now();
      const isDoubleTap = now - touchRef.current.lastTouchEnd <= 500;
      touchRef.current.lastTouchEnd = now;

      // Toggle between snappoints on double tap
      if (isDoubleTap) {
        // Toggle between collapsed and expanded
        const nextSnapIndex = currentSnapPoint === 0 || currentSnapPoint === 1 ? 2 : 1;
        setCurrentSnapPoint(nextSnapIndex);
        sheet.style.transition = 'height 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
        sheet.style.height = snapPoints[nextSnapIndex];
        return;
      }

      // Add momentum scrolling based on velocity
      sheet.style.transition = 'height 0.35s cubic-bezier(0.4, 0, 0.2, 1)';

      // Calculate final velocity using multiple data points
      const velocity = calculateVelocity();
      const significantVelocity = Math.abs(velocity) > 0.2; // pixels/ms

      const currentHeight = sheet.getBoundingClientRect().height;
      const viewportHeight = window.innerHeight;

      // Convert snapPoints to pixels for comparison
      const snapPointsPixels = snapPoints.map(point => {
        if (point.endsWith('px')) {
          return parseInt(point);
        } else if (point.endsWith('vh')) {
          return (parseInt(point) / 100) * viewportHeight;
        }
        return 0;
      });

      // Find nearest snap point
      const closestSnapPoint = snapPointsPixels.reduce((prev, curr) => {
        return Math.abs(curr - currentHeight) < Math.abs(prev - currentHeight) ? curr : prev;
      });

      let snapIndex = snapPointsPixels.indexOf(closestSnapPoint);

      // Apply velocity-based decision for more natural feel
      if (significantVelocity) {
        if (velocity < -0.2) {
          // Swiping up fast (negative velocity), go to next higher snap point
          snapIndex = Math.min(snapIndex + 1, snapPoints.length - 1);
        } else if (velocity > 0.2) {
          // Swiping down fast (positive velocity), go to next lower snap point
          snapIndex = Math.max(snapIndex - 1, 0);
        }
      }

      setCurrentSnapPoint(snapIndex);

      if (snapIndex === 0) {
        setIsOpen(false);
      }

      sheet.style.height = snapPoints[snapIndex];
    },
    [calculateVelocity, currentSnapPoint, setIsOpen, snapPoints]
  );

  // Attach touch event handlers
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    // Proper event attachment with functions defined safely before use
    sheet.addEventListener('touchstart', handleTouchStart, { passive: true });
    sheet.addEventListener('touchmove', handleTouchMove, { passive: false });
    sheet.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      // Proper cleanup
      sheet.removeEventListener('touchstart', handleTouchStart);
      sheet.removeEventListener('touchmove', handleTouchMove);
      sheet.removeEventListener('touchend', handleTouchEnd);

      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  useEffect(() => {
    const handleKeyboardShow = e => {
      setKeyboardHeight(e.keyboardHeight);
    };

    const handleKeyboardHide = () => {
      setKeyboardHeight(0);
    };

    window.addEventListener('keyboardWillShow', handleKeyboardShow);
    window.addEventListener('keyboardWillHide', handleKeyboardHide);

    return () => {
      window.removeEventListener('keyboardWillShow', handleKeyboardShow);
      window.removeEventListener('keyboardWillHide', handleKeyboardHide);
    };
  }, []);

  const handleTabChange = newTab => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveTab(newTab);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const renderContent = () => {
    if (!isOpen) {
      return (
        <div className="flex items-center justify-between px-4">
          <span className="text-sm font-medium">Meetups</span>
          <button onClick={() => setIsOpen(true)} className="text-primary-600 text-sm">
            Open
          </button>
        </div>
      );
    }

    const getContentByType = type => {
      return React.Children.toArray(children).find(child => {
        const displayName = child?.type?.displayName;
        const name = child?.type?.name;
        const componentName = child?.props?.['data-component'];

        return displayName === type || name === type || componentName === type;
      });
    };

    const instantContent = getContentByType('InstantMeetup');
    const nearbyContent = getContentByType('NearbyMeetups');

    return (
      <>
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium text-center ${
              activeTab === 'instant'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            onClick={() => handleTabChange('instant')}
            disabled={!instantContent || isTransitioning}
          >
            Instant Meetup
          </button>
          <button
            className={`flex-1 py-3 px-4 text-sm font-medium text-center ${
              activeTab === 'nearby'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            onClick={() => handleTabChange('nearby')}
            disabled={!nearbyContent || isTransitioning}
          >
            Nearby Meetups
          </button>
        </div>
        <div className="bottom-sheet-inner-content">
          <div
            className={`transition-opacity ${
              activeTab === 'instant' ? 'opacity-100' : 'opacity-0 hidden'
            }`}
          >
            {instantContent}
          </div>
          <div
            className={`transition-opacity ${
              activeTab === 'nearby' ? 'opacity-100' : 'opacity-0 hidden'
            }`}
          >
            {nearbyContent}
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <div
        className={`bottom-sheet-backdrop ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(false)}
      />
      <div
        ref={sheetRef}
        className={`bottom-sheet ${isOpen ? 'active' : ''} ${className}`}
        style={{
          height: isOpen ? height : '60px',
          transform: `translateY(${isOpen ? '0' : 'calc(100% - 60px)'})`,
          bottom: keyboardHeight,
          ...style,
        }}
      >
        <div
          className="w-full h-6 flex items-center justify-center cursor-pointer touch-target"
          onClick={() => {
            if (!isOpen) {
              setIsOpen(true);
            } else {
              const nextIndex = (currentSnapPoint + 1) % snapPoints.length;
              setCurrentSnapPoint(nextIndex);
              if (nextIndex === 0) {
                setIsOpen(false);
              }
            }
          }}
        >
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        <div ref={contentRef} className="bottom-sheet-content">
          {renderContent()}
        </div>
      </div>
    </>
  );
};

BottomSheet.propTypes = {
  children: PropTypes.node,
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  height: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default BottomSheet;
