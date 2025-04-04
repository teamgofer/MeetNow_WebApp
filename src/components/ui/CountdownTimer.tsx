import React, { useState, useEffect } from 'react';

interface ICountdownTimerProps {
  expiryTime?: Date | string;
  startTime?: Date | string;
  durationMinutes?: number;
  targetDate?: Date | string;
  starts_at?: Date | string; // New prop to match DB column
}

interface ICountdownState {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

/**
 * Countdown timer component that shows remaining time for a meetup
 * Uses starts_at and duration_minutes to calculate expiration time
 */
const CountdownTimer: React.FC<ICountdownTimerProps> = ({
  expiryTime,
  startTime,
  durationMinutes = 60, // Default to 60 minutes if not specified
  targetDate,
  starts_at,
}) => {
  // Add loading state
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState<ICountdownState>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });
  const [spinnerIndex, setSpinnerIndex] = useState(0);
  const [percentLeft, setPercentLeft] = useState(100);

  // Array of ASCII spinner characters
  const spinners = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

  // Calculate initial countdown immediately
  useEffect(() => {
    // Convert inputs to Date objects if they're not already
    let expiry: Date;
    let start: Date = new Date();

    // Priority for determining expiry time:
    // 1. Direct expiryTime if provided
    // 2. starts_at + durationMinutes if starts_at is provided
    // 3. startTime + durationMinutes if startTime is provided
    // 4. targetDate if provided
    // 5. Default: now + 60 minutes

    if (expiryTime) {
      // 1. Direct expiry time provided
      expiry = expiryTime instanceof Date ? expiryTime : new Date(expiryTime);
    } else if (starts_at) {
      // 2. Use starts_at + durationMinutes (DB columns)
      start = starts_at instanceof Date ? starts_at : new Date(starts_at);
      expiry = new Date(start);
      expiry.setMinutes(expiry.getMinutes() + durationMinutes);
    } else if (startTime) {
      // 3. Use legacy startTime + durationMinutes
      start = startTime instanceof Date ? startTime : new Date(startTime);
      expiry = new Date(start);
      expiry.setMinutes(expiry.getMinutes() + durationMinutes);
    } else if (targetDate) {
      // 4. Use targetDate directly
      expiry = targetDate instanceof Date ? targetDate : new Date(targetDate);
    } else {
      // 5. Default: 1 hour (durationMinutes) from now
      expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + durationMinutes);
    }

    // Calculate total duration in ms
    const totalDuration = durationMinutes * 60 * 1000;

    // Calculate initial values immediately
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();

    // Calculate percentage remaining
    const elapsed = now.getTime() - start.getTime();
    const remaining = totalDuration - elapsed;
    setPercentLeft(Math.max(0, Math.min(100, (remaining / totalDuration) * 100)));

    if (diff <= 0) {
      // Already expired
      setCountdown({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
      setIsLoading(false);
      return;
    }

    // Calculate hours, minutes, seconds
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // Set initial values before timer starts
    setCountdown({ hours, minutes, seconds, isExpired: false });
    setIsLoading(false);

    // Update countdown every second
    const timer = setInterval(() => {
      const now = new Date();
      const diff = expiry.getTime() - now.getTime();

      // Calculate percentage remaining
      const elapsed = now.getTime() - start.getTime();
      const remaining = totalDuration - elapsed;
      setPercentLeft(Math.max(0, Math.min(100, (remaining / totalDuration) * 100)));

      if (diff <= 0) {
        // Countdown finished
        setCountdown({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        clearInterval(timer);
        return;
      }

      // Calculate hours, minutes, seconds
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ hours, minutes, seconds, isExpired: false });

      // Update spinner
      setSpinnerIndex(prev => (prev + 1) % spinners.length);
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryTime, startTime, durationMinutes, targetDate, starts_at]);

  // Format the countdown with padding to ensure consistent width
  const formatTime = (value: number): string => value.toString().padStart(2, '0');

  // Current spinner character
  const spinner = spinners[spinnerIndex];

  // Show loading indicator while calculating initial values
  if (isLoading) {
    return (
      <div className="countdown-timer text-center mt-2 font-mono">
        <div className="flex items-center justify-center">
          <span className="text-gray-500">Loading timer...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="countdown-timer text-center mt-2 font-mono">
      <div className="flex items-center justify-center">
        <span className="mr-2">{spinner}</span>
        {countdown.isExpired ? (
          <span className="text-red-500 font-semibold">Expired</span>
        ) : (
          <span className="countdown-text">
            {formatTime(countdown.hours)}:{formatTime(countdown.minutes)}:
            {formatTime(countdown.seconds)}
          </span>
        )}
        <span className="ml-2">{spinner}</span>
      </div>
    </div>
  );
};

export default CountdownTimer;
