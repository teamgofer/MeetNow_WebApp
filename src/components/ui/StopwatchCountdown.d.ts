import React from 'react';
type ColorScheme = 'A' | 'B';
type DisplayMode = 'analog' | 'digital' | 'hybrid';
type UrgencyLevel = 'low' | 'medium' | 'high';
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
declare const StopwatchCountdown: React.FC<StopwatchCountdownProps>;
export default StopwatchCountdown;
