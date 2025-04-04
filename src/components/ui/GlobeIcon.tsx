import React, { useState, useRef, useEffect } from 'react';
import WelcomeCard from './WelcomeCard';

interface GlobeIconProps {
  onClick?: () => void;
  className?: string;
}

const GlobeIcon: React.FC<GlobeIconProps> = ({ onClick, className = '' }) => {
  const [showWelcomeCard, setShowWelcomeCard] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const touchStartTime = useRef<number>(0);

  const handleMouseEnter = () => {
    setShowWelcomeCard(true);
  };

  const handleMouseLeave = () => {
    setShowWelcomeCard(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartTime.current = Date.now();
    longPressTimer.current = setTimeout(() => {
      setShowWelcomeCard(true);
    }, 500);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      const touchDuration = Date.now() - touchStartTime.current;
      if (touchDuration < 500) {
        setShowWelcomeCard(false);
      }
    }
  };

  const handleTouchMove = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      setShowWelcomeCard(false);
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return (
    <>
      <div
        className={`fixed top-4 left-4 z-50 cursor-pointer transition-all duration-300 hover:scale-125 ${className}`}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        style={{ width: '72px', height: '72px' }}
      >
        <div className="relative w-full h-full">
          <img
            src="/globe-icon.png"
            alt="Menu"
            className="w-full h-full object-contain drop-shadow-lg transition-all duration-300 hover:scale-110"
            style={{
              filter: 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.7))',
            }}
          />
          {/* Enhanced glow effect */}
          <div
            className="absolute inset-0 rounded-full animate-pulse"
            style={{
              background:
                'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)',
              transform: 'scale(1.2)',
            }}
          />
          {/* Additional hover glow effect */}
          <div
            className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 hover:opacity-100"
            style={{
              background:
                'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%)',
              transform: 'scale(1.4)',
            }}
          />
        </div>
      </div>
      <WelcomeCard isVisible={showWelcomeCard} onClose={() => setShowWelcomeCard(false)} />
    </>
  );
};

export default GlobeIcon;
