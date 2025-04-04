import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
const CountdownTimer = ({ expiryTime, startTime, durationMinutes = 60, targetDate, starts_at, }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [countdown, setCountdown] = useState({
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: false,
    });
    const [spinnerIndex, setSpinnerIndex] = useState(0);
    const [percentLeft, setPercentLeft] = useState(100);
    const spinners = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
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
        else if (targetDate) {
            expiry = targetDate instanceof Date ? targetDate : new Date(targetDate);
        }
        else {
            expiry = new Date();
            expiry.setMinutes(expiry.getMinutes() + durationMinutes);
        }
        const totalDuration = durationMinutes * 60 * 1000;
        const now = new Date();
        const diff = expiry.getTime() - now.getTime();
        const elapsed = now.getTime() - start.getTime();
        const remaining = totalDuration - elapsed;
        setPercentLeft(Math.max(0, Math.min(100, (remaining / totalDuration) * 100)));
        if (diff <= 0) {
            setCountdown({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
            setIsLoading(false);
            return;
        }
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ hours, minutes, seconds, isExpired: false });
        setIsLoading(false);
        const timer = setInterval(() => {
            const now = new Date();
            const diff = expiry.getTime() - now.getTime();
            const elapsed = now.getTime() - start.getTime();
            const remaining = totalDuration - elapsed;
            setPercentLeft(Math.max(0, Math.min(100, (remaining / totalDuration) * 100)));
            if (diff <= 0) {
                setCountdown({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
                clearInterval(timer);
                return;
            }
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setCountdown({ hours, minutes, seconds, isExpired: false });
            setSpinnerIndex(prev => (prev + 1) % spinners.length);
        }, 1000);
        return () => clearInterval(timer);
    }, [expiryTime, startTime, durationMinutes, targetDate, starts_at]);
    const formatTime = (value) => value.toString().padStart(2, '0');
    const spinner = spinners[spinnerIndex];
    if (isLoading) {
        return (_jsx("div", { className: "countdown-timer text-center mt-2 font-mono", children: _jsx("div", { className: "flex items-center justify-center", children: _jsx("span", { className: "text-gray-500", children: "Loading timer..." }) }) }));
    }
    return (_jsx("div", { className: "countdown-timer text-center mt-2 font-mono", children: _jsxs("div", { className: "flex items-center justify-center", children: [_jsx("span", { className: "mr-2", children: spinner }), countdown.isExpired ? (_jsx("span", { className: "text-red-500 font-semibold", children: "Expired" })) : (_jsxs("span", { className: "countdown-text", children: [formatTime(countdown.hours), ":", formatTime(countdown.minutes), ":", formatTime(countdown.seconds)] })), _jsx("span", { className: "ml-2", children: spinner })] }) }));
};
export default CountdownTimer;
//# sourceMappingURL=CountdownTimer.js.map