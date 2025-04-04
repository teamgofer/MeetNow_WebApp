import React, { useState, useEffect, useRef } from 'react';
import StopwatchIcon from './StopwatchIcon';

type ColorScheme = 'A' | 'B';
type DisplayMode = 'analog' | 'digital' | 'hybrid';
type UrgencyLevel = 'low' | 'medium' | 'high';

// Simple utility functions to replace the missing timeUtils import
const getUrgency = (expiryTime: Date): UrgencyLevel => {
  const now = new Date();
  const diff = expiryTime.getTime() - now.getTime();
  const totalSeconds = Math.max(0, Math.floor(diff / 1000));
  
  if (totalSeconds < 300) { // Less than 5 minutes
    return 'high';
  } else if (totalSeconds < 900) { // Less than 15 minutes
    return 'medium';
  } else {
    return 'low';
  }
};

const formatTimeRemaining = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${remainingSeconds}s`;
  }
};

interface StopwatchCountdownProps {
  expiryTime: Date;
  size?: number;
  className?: string;
  colorScheme?: ColorScheme;
  showText?: boolean;
  showIcon?: boolean;
  useDigitalFormat?: boolean;
  adaptiveDuration?: boolean;
  forceUrgency?: UrgencyLevel | null;
  displayMode?: DisplayMode;
  pillStyle?: boolean;
}

/**
 * Countdown timer with animated stopwatch icon
 * Combines functionality of CountdownDisplay with visual StopwatchIcon
 */
const StopwatchCountdown: React.FC<StopwatchCountdownProps> = ({
  expiryTime,
  size = 24,
  className = '',
  colorScheme = 'A',
  showText = true,
  showIcon = true,
  useDigitalFormat = false,
  adaptiveDuration = false,
  forceUrgency = null,
  displayMode = 'analog',
  pillStyle = false,
}) => {
  // Ensure expiryTime is a valid Date
  const validExpiryTime = expiryTime instanceof Date && !isNaN(expiryTime.getTime()) 
    ? expiryTime 
    : new Date(Date.now() + 60000); // Default to 1 minute from now if invalid
  
  const [displayText, setDisplayText] = useState('');
  const [digitalDisplay, setDigitalDisplay] = useState('01:00');
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [urgency, setUrgency] = useState<UrgencyLevel>('low');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isExpired = new Date() > validExpiryTime;

  const formatWithLeadingZero = (value: number): string => {
    return value < 10 ? `0${value}` : `${value}`;
  };

  const updateDisplay = () => {
    const now = new Date();
    const timeDiff = Math.max(0, Math.floor((validExpiryTime.getTime() - now.getTime()) / 1000));
    setSecondsRemaining(timeDiff);
    
    // Set urgency based on remaining time or force it if specified
    if (forceUrgency) {
      setUrgency(forceUrgency);
    } else {
      setUrgency(getUrgency(validExpiryTime));
    }

    // Set standard display text
    setDisplayText(formatTimeRemaining(timeDiff));
    
    // Set digital format (MM:SS)
    const minutes = Math.floor(timeDiff / 60);
    const seconds = timeDiff % 60;
    setDigitalDisplay(`${formatWithLeadingZero(minutes)}:${formatWithLeadingZero(seconds)}`);
  };

  useEffect(() => {
    updateDisplay();
    timerRef.current = setInterval(updateDisplay, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [validExpiryTime, forceUrgency]);

  const getDisplayFormat = () => {
    if (isExpired) {
      return "Expired";
    }
    
    // Digital format only
    if (displayMode === 'digital') {
      return digitalDisplay;
    }
    
    // Analog format only
    if (displayMode === 'analog') {
      return useDigitalFormat ? digitalDisplay : displayText;
    }
    
    // Hybrid format (both digital and analog)
    return digitalDisplay;
  };

  // Calculate total seconds for adaptive duration
  const getTotalDuration = () => {
    if (!adaptiveDuration) return undefined;
    
    const now = new Date();
    // If already expired, return a default value
    if (now > validExpiryTime) return 60;
    
    // Calculate total seconds from now to expiry
    return Math.floor((validExpiryTime.getTime() - now.getTime()) / 1000);
  };

  // Container class names based on props
  const containerClasses = [
    'flex items-center',
    pillStyle ? 'rounded-full px-2 py-0.5' : '',
    className
  ].filter(Boolean).join(' ');
  
  // Get appropriate text color based on color scheme and urgency
  const getTextColorClass = () => {
    // If it's expired, always use red
    if (isExpired) return 'text-red-500';
    
    // For high urgency, use red regardless of color scheme
    if (urgency === 'high') return 'text-red-600';
    
    // For other urgency levels, use the color scheme
    return colorScheme === 'A' 
      ? urgency === 'medium' ? 'text-indigo-700' : 'text-indigo-800'
      : urgency === 'medium' ? 'text-emerald-700' : 'text-emerald-800';
  };

  return (
    <div className={containerClasses}>
      {showIcon && (displayMode === 'analog' || displayMode === 'hybrid') && (
        <div className={displayMode === 'hybrid' ? 'mr-1.5' : ''}>
          <StopwatchIcon 
            urgency={urgency} 
            size={size} 
            colorScheme={colorScheme}
            rotationDuration={adaptiveDuration ? getTotalDuration() : undefined}
          />
        </div>
      )}
      {showText && (
        <span className={`${getTextColorClass()} font-medium text-xs transition-colors duration-300`}>
          {getDisplayFormat()}
        </span>
      )}
    </div>
  );
};

export default StopwatchCountdown; 