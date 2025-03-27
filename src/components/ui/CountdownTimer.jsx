import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Countdown timer component with ASCII spinners
 * 
 * @param {Object} props
 * @param {Date|string} props.expiryTime - The time when the countdown expires
 * @param {Date|string} props.startTime - The time when the countdown starts
 * @param {number} props.durationMinutes - Duration in minutes (alternative to expiryTime)
 */
const CountdownTimer = ({ expiryTime, startTime, durationMinutes }) => {
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [spinnerIndex, setSpinnerIndex] = useState(0);
  const [percentLeft, setPercentLeft] = useState(100);
  
  // Array of ASCII spinner characters
  const spinners = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

  useEffect(() => {
    // Convert inputs to Date objects if they're not already
    let expiry;
    
    if (expiryTime) {
      expiry = expiryTime instanceof Date ? expiryTime : new Date(expiryTime);
    } else if (startTime && durationMinutes) {
      expiry = startTime instanceof Date ? new Date(startTime) : new Date(startTime);
      expiry.setMinutes(expiry.getMinutes() + durationMinutes);
    } else {
      // Default: 1 hour from now
      expiry = new Date();
      expiry.setHours(expiry.getHours() + 1);
    }
    
    // Update countdown every second
    const timer = setInterval(() => {
      const now = new Date();
      const diff = expiry - now;
      
      // Calculate total duration in ms
      let totalDuration;
      if (startTime && durationMinutes) {
        const start = startTime instanceof Date ? startTime : new Date(startTime);
        totalDuration = durationMinutes * 60 * 1000;
        const elapsed = now - start;
        const remaining = totalDuration - elapsed;
        setPercentLeft(Math.max(0, Math.min(100, (remaining / totalDuration) * 100)));
      } else {
        // Default 1-hour duration if no specific duration is given
        totalDuration = 60 * 60 * 1000;
        setPercentLeft(Math.max(0, Math.min(100, (diff / totalDuration) * 100)));
      }
      
      if (diff <= 0) {
        // Countdown finished
        setCountdown({ hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
        return;
      }
      
      // Calculate hours, minutes, seconds
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setCountdown({ hours, minutes, seconds });
      
      // Update spinner
      setSpinnerIndex((prev) => (prev + 1) % spinners.length);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [expiryTime, startTime, durationMinutes]);
  
  // Format the countdown with padding to ensure consistent width
  const formatTime = (value) => value.toString().padStart(2, '0');
  
  // Current spinner character
  const spinner = spinners[spinnerIndex];
  
  return (
    <div className="countdown-timer text-center mt-2 font-mono">
      <div className="flex items-center justify-center">
        <span className="mr-2">{spinner}</span>
        <span className="countdown-text">
          {formatTime(countdown.hours)}:{formatTime(countdown.minutes)}:{formatTime(countdown.seconds)}
        </span>
        <span className="ml-2">{spinner}</span>
      </div>
    </div>
  );
};

CountdownTimer.propTypes = {
  expiryTime: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  startTime: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  durationMinutes: PropTypes.number
};

export default CountdownTimer; 
 
 