import React, { useState, useEffect } from 'react';
import StopwatchCountdown from './StopwatchCountdown';

interface CountdownDisplayProps {
  expiryTime?: Date | string | undefined;
  startTime?: Date | string | undefined;
  durationMinutes?: number | undefined;
  starts_at?: Date | string | undefined;
  showExpired?: boolean;
  className?: string;
  useStopwatch?: boolean;
  useDigitalFormat?: boolean;
  colorScheme?: 'A' | 'B';
  size?: number;
  adaptiveDuration?: boolean;
  displayMode?: 'analog' | 'digital' | 'hybrid';
  pillStyle?: boolean;
}

/**
 * A simple countdown display component for use in list items
 * Shows remaining time in minutes/hours without animation
 * Can optionally use the animated StopwatchCountdown component
 */
const CountdownDisplay: React.FC<CountdownDisplayProps> = ({
  expiryTime,
  startTime,
  durationMinutes = 60,
  starts_at,
  showExpired = true,
  className = '',
  useStopwatch = false,
  useDigitalFormat = false,
  colorScheme = 'A',
  size = 16,
  adaptiveDuration = false,
  displayMode = 'analog',
  pillStyle = false,
}) => {
  const [timeDisplay, setTimeDisplay] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [parsedExpiryTime, setParsedExpiryTime] = useState<Date | undefined>(undefined);

  // Convert string to Date if needed
  useEffect(() => {
    if (expiryTime) {
      setParsedExpiryTime(expiryTime instanceof Date ? expiryTime : new Date(expiryTime));
    } else {
      setParsedExpiryTime(undefined);
    }
  }, [expiryTime]);

  // If using the stopwatch component, delegate to it
  if (useStopwatch && parsedExpiryTime) {
    return (
      <StopwatchCountdown
        expiryTime={parsedExpiryTime}
        className={className}
        useDigitalFormat={useDigitalFormat}
        colorScheme={colorScheme}
        size={size}
        adaptiveDuration={adaptiveDuration}
        displayMode={displayMode}
        pillStyle={pillStyle}
      />
    );
  }

  // Standard countdown logic (no stopwatch animation)
  useEffect(() => {
    // Convert inputs to Date objects
    let expiry: Date;
    let start: Date = new Date();

    // Priority for determining expiry time:
    // 1. Direct expiryTime if provided
    // 2. starts_at + durationMinutes if starts_at is provided
    // 3. startTime + durationMinutes if startTime is provided
    // 4. Default: now + 60 minutes

    if (expiryTime) {
      expiry = expiryTime instanceof Date ? expiryTime : new Date(expiryTime);
    } else if (starts_at) {
      start = starts_at instanceof Date ? starts_at : new Date(starts_at);
      expiry = new Date(start);
      expiry.setMinutes(expiry.getMinutes() + durationMinutes);
    } else if (startTime) {
      start = startTime instanceof Date ? startTime : new Date(startTime);
      expiry = new Date(start);
      expiry.setMinutes(expiry.getMinutes() + durationMinutes);
    } else {
      expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + durationMinutes);
    }

    // Calculate and set initial display
    updateDisplay(expiry);

    // Update time display every second
    const timer = setInterval(() => {
      updateDisplay(expiry);
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryTime, startTime, durationMinutes, starts_at]);

  // Update time display
  const updateDisplay = (expiry: Date) => {
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) {
      setIsExpired(true);
      setTimeDisplay('Expired');
      return;
    }

    // Calculate hours and minutes
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    // Format display based on remaining time
    if (hours > 0) {
      setTimeDisplay(`${hours}h ${minutes}m`);
    } else if (minutes > 0) {
      setTimeDisplay(`${minutes}m`);
    } else {
      // Less than a minute
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeDisplay(`${seconds}s`);
    }

    setIsExpired(false);
  };

  // Simple display without animation
  return (
    <span className={`${className} ${isExpired && showExpired ? 'text-red-500' : ''}`}>
      {isExpired && showExpired ? 'Expired' : timeDisplay}
    </span>
  );
};

export default CountdownDisplay;
