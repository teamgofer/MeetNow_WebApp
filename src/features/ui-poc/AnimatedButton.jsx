import React, { useState } from 'react';
import './animated-button.css';

/**
 * Animated button component for MeetNow POC
 * This component is isolated and can be imported later when needed
 */
const AnimatedButton = ({
  text = 'Click Me',
  onClick,
  variant = 'primary',
  size = 'medium',
  animated = true,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = e => {
    if (animated) {
      setIsPressed(true);
      setTimeout(() => setIsPressed(false), 300);
    }
    if (onClick) onClick(e);
  };

  const baseClasses = `meetNow-button meetNow-button-${variant} meetNow-button-${size}`;
  const animationClass = animated ? (isPressed ? 'animate-press' : 'animate-hover') : '';

  return (
    <button className={`${baseClasses} ${animationClass}`} onClick={handleClick}>
      {text}
    </button>
  );
};

export default AnimatedButton;
