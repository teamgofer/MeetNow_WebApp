import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const BottomSheet = ({ children, isOpen, setIsOpen, height = '70vh', className = '', style = {} }) => {
  const sheetRef = useRef(null);
  const contentRef = useRef(null);
  const [activeTab, setActiveTab] = useState('instant');
  const [snapPoints] = useState(['60px', '40vh', '70vh']);
  const [currentSnapPoint, setCurrentSnapPoint] = useState(1);
  const [lastActiveTab, setLastActiveTab] = useState('instant');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const touchRef = useRef({
    startY: 0,
    currentY: 0,
    startHeight: 0,
    isMultiTouch: false,
    lastTouchEnd: 0
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
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 1024 || window.innerHeight < 768;
      if (isMobileView && !isOpen) {
        setIsOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    const handleTouchStart = (e) => {
      if (e.touches.length > 1) {
        touchRef.current.isMultiTouch = true;
        return;
      }
      
      touchRef.current.startY = e.touches[0].clientY;
      touchRef.current.currentY = touchRef.current.startY;
      touchRef.current.startHeight = sheet.getBoundingClientRect().height;
      touchRef.current.isMultiTouch = false;
      
      sheet.style.transition = 'none';
    };

    const handleTouchMove = (e) => {
      if (touchRef.current.isMultiTouch) return;
      
      const touch = e.touches[0];
      const deltaY = touch.clientY - touchRef.current.currentY;
      touchRef.current.currentY = touch.clientY;
      
      const newHeight = touchRef.current.startHeight - deltaY;
      const maxHeight = window.innerHeight * 0.9;
      const minHeight = 60;
      
      if (newHeight > minHeight && newHeight < maxHeight) {
        sheet.style.height = `${newHeight}px`;
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e) => {
      if (touchRef.current.isMultiTouch) {
        touchRef.current.isMultiTouch = false;
        return;
      }

      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }

      const now = Date.now();
      if (now - touchRef.current.lastTouchEnd <= 300) {
        e.preventDefault();
      }
      touchRef.current.lastTouchEnd = now;

      sheet.style.transition = 'height 0.3s ease-out';
      
      const currentHeight = sheet.getBoundingClientRect().height;
      const viewportHeight = window.innerHeight;
      
      const snapPointsPixels = snapPoints.map(point => {
        if (point.endsWith('px')) {
          return parseInt(point);
        } else if (point.endsWith('vh')) {
          return (parseInt(point) / 100) * viewportHeight;
        }
        return 0;
      });

      const closestSnapPoint = snapPointsPixels.reduce((prev, curr) => {
        return Math.abs(curr - currentHeight) < Math.abs(prev - currentHeight) ? curr : prev;
      });

      const snapIndex = snapPointsPixels.indexOf(closestSnapPoint);
      setCurrentSnapPoint(snapIndex);

      if (snapIndex === 0) {
        setIsOpen(false);
      }

      sheet.style.height = snapPoints[snapIndex];
    };

    sheet.addEventListener('touchstart', handleTouchStart, { passive: true });
    sheet.addEventListener('touchmove', handleTouchMove, { passive: false });
    sheet.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      sheet.removeEventListener('touchstart', handleTouchStart);
      sheet.removeEventListener('touchmove', handleTouchMove);
      sheet.removeEventListener('touchend', handleTouchEnd);
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }
    };
  }, [snapPoints]);

  useEffect(() => {
    const handleKeyboardShow = (e) => {
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

  const handleTabChange = (newTab) => {
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
          <button
            onClick={() => setIsOpen(true)}
            className="text-primary-600 text-sm"
          >
            Open
          </button>
        </div>
      );
    }

    const getContentByType = (type) => {
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
          {activeTab === 'instant' && instantContent && 
            React.cloneElement(instantContent, {
              className: `${instantContent.props.className || ''} InstantMeetup-content`
            })
          }
          {activeTab === 'nearby' && nearbyContent && 
            React.cloneElement(nearbyContent, {
              className: `${nearbyContent.props.className || ''} NearbyMeetups-content`
            })
          }
          {!instantContent && !nearbyContent && (
            <div className="text-center py-8 text-gray-500">
              No content available
            </div>
          )}
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
          ...style
        }}
      >
        <div
          className="w-full h-6 flex items-center justify-center cursor-pointer"
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
  style: PropTypes.object
};

export default BottomSheet; 