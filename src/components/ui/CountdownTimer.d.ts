import React from 'react';
interface ICountdownTimerProps {
    expiryTime?: Date | string;
    startTime?: Date | string;
    durationMinutes?: number;
    targetDate?: Date | string;
    starts_at?: Date | string;
}
declare const CountdownTimer: React.FC<ICountdownTimerProps>;
export default CountdownTimer;
