import React from 'react';
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
declare const CountdownDisplay: React.FC<CountdownDisplayProps>;
export default CountdownDisplay;
