import React from 'react';
interface StopwatchIconProps {
    secondsRemaining?: number;
    colorScheme?: 'A' | 'B';
    size?: number;
    urgency?: 'low' | 'medium' | 'high' | 'expired';
    rotationDuration?: number | undefined;
}
declare const StopwatchIcon: React.FC<StopwatchIconProps>;
export default StopwatchIcon;
