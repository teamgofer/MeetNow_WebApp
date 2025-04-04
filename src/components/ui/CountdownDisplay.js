import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import StopwatchCountdown from './StopwatchCountdown';
const CountdownDisplay = ({ expiryTime, startTime, durationMinutes = 60, starts_at, showExpired = true, className = '', useStopwatch = false, useDigitalFormat = false, colorScheme = 'A', size = 16, adaptiveDuration = false, displayMode = 'analog', pillStyle = false, }) => {
    const [timeDisplay, setTimeDisplay] = useState('');
    const [isExpired, setIsExpired] = useState(false);
    const [parsedExpiryTime, setParsedExpiryTime] = useState(undefined);
    useEffect(() => {
        if (expiryTime) {
            setParsedExpiryTime(expiryTime instanceof Date ? expiryTime : new Date(expiryTime));
        }
        else {
            setParsedExpiryTime(undefined);
        }
    }, [expiryTime]);
    if (useStopwatch && parsedExpiryTime) {
        return (_jsx(StopwatchCountdown, { expiryTime: parsedExpiryTime, className: className, useDigitalFormat: useDigitalFormat, colorScheme: colorScheme, size: size, adaptiveDuration: adaptiveDuration, displayMode: displayMode, pillStyle: pillStyle }));
    }
    useEffect(() => {
        let expiry;
        let start = new Date();
        if (expiryTime) {
            expiry = expiryTime instanceof Date ? expiryTime : new Date(expiryTime);
        }
        else if (starts_at) {
            start = starts_at instanceof Date ? starts_at : new Date(starts_at);
            expiry = new Date(start);
            expiry.setMinutes(expiry.getMinutes() + durationMinutes);
        }
        else if (startTime) {
            start = startTime instanceof Date ? startTime : new Date(startTime);
            expiry = new Date(start);
            expiry.setMinutes(expiry.getMinutes() + durationMinutes);
        }
        else {
            expiry = new Date();
            expiry.setMinutes(expiry.getMinutes() + durationMinutes);
        }
        updateDisplay(expiry);
        const timer = setInterval(() => {
            updateDisplay(expiry);
        }, 1000);
        return () => clearInterval(timer);
    }, [expiryTime, startTime, durationMinutes, starts_at]);
    const updateDisplay = (expiry) => {
        const now = new Date();
        const diff = expiry.getTime() - now.getTime();
        if (diff <= 0) {
            setIsExpired(true);
            setTimeDisplay('Expired');
            return;
        }
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) {
            setTimeDisplay(`${hours}h ${minutes}m`);
        }
        else if (minutes > 0) {
            setTimeDisplay(`${minutes}m`);
        }
        else {
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeDisplay(`${seconds}s`);
        }
        setIsExpired(false);
    };
    return (_jsx("span", { className: `${className} ${isExpired && showExpired ? 'text-red-500' : ''}`, children: isExpired && showExpired ? 'Expired' : timeDisplay }));
};
export default CountdownDisplay;
//# sourceMappingURL=CountdownDisplay.js.map