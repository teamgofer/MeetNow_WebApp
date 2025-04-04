import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import StopwatchIcon from './StopwatchIcon';
const getUrgency = (expiryTime) => {
    const now = new Date();
    const diff = expiryTime.getTime() - now.getTime();
    const totalSeconds = Math.max(0, Math.floor(diff / 1000));
    if (totalSeconds < 300) {
        return 'high';
    }
    else if (totalSeconds < 900) {
        return 'medium';
    }
    else {
        return 'low';
    }
};
const formatTimeRemaining = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    else if (minutes > 0) {
        return `${minutes}m`;
    }
    else {
        return `${remainingSeconds}s`;
    }
};
const StopwatchCountdown = ({ expiryTime, size = 24, className = '', colorScheme = 'A', showText = true, showIcon = true, useDigitalFormat = false, adaptiveDuration = false, forceUrgency = null, displayMode = 'analog', pillStyle = false, }) => {
    const validExpiryTime = expiryTime instanceof Date && !isNaN(expiryTime.getTime())
        ? expiryTime
        : new Date(Date.now() + 60000);
    const [displayText, setDisplayText] = useState('');
    const [digitalDisplay, setDigitalDisplay] = useState('01:00');
    const [secondsRemaining, setSecondsRemaining] = useState(0);
    const [urgency, setUrgency] = useState('low');
    const timerRef = useRef(null);
    const isExpired = new Date() > validExpiryTime;
    const formatWithLeadingZero = (value) => {
        return value < 10 ? `0${value}` : `${value}`;
    };
    const updateDisplay = () => {
        const now = new Date();
        const timeDiff = Math.max(0, Math.floor((validExpiryTime.getTime() - now.getTime()) / 1000));
        setSecondsRemaining(timeDiff);
        if (forceUrgency) {
            setUrgency(forceUrgency);
        }
        else {
            setUrgency(getUrgency(validExpiryTime));
        }
        setDisplayText(formatTimeRemaining(timeDiff));
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
        if (displayMode === 'digital') {
            return digitalDisplay;
        }
        if (displayMode === 'analog') {
            return useDigitalFormat ? digitalDisplay : displayText;
        }
        return digitalDisplay;
    };
    const getTotalDuration = () => {
        if (!adaptiveDuration)
            return undefined;
        const now = new Date();
        if (now > validExpiryTime)
            return 60;
        return Math.floor((validExpiryTime.getTime() - now.getTime()) / 1000);
    };
    const containerClasses = [
        'flex items-center',
        pillStyle ? 'rounded-full px-2 py-0.5' : '',
        className
    ].filter(Boolean).join(' ');
    const getTextColorClass = () => {
        if (isExpired)
            return 'text-red-500';
        if (urgency === 'high')
            return 'text-red-600';
        return colorScheme === 'A'
            ? urgency === 'medium' ? 'text-indigo-700' : 'text-indigo-800'
            : urgency === 'medium' ? 'text-emerald-700' : 'text-emerald-800';
    };
    return (_jsxs("div", { className: containerClasses, children: [showIcon && (displayMode === 'analog' || displayMode === 'hybrid') && (_jsx("div", { className: displayMode === 'hybrid' ? 'mr-1.5' : '', children: _jsx(StopwatchIcon, { urgency: urgency, size: size, colorScheme: colorScheme, rotationDuration: adaptiveDuration ? getTotalDuration() : undefined }) })), showText && (_jsx("span", { className: `${getTextColorClass()} font-medium text-xs transition-colors duration-300`, children: getDisplayFormat() }))] }));
};
export default StopwatchCountdown;
//# sourceMappingURL=StopwatchCountdown.js.map