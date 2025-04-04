import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import WelcomeCard from './WelcomeCard';
const GlobeIcon = ({ onClick, className = '' }) => {
    const [showWelcomeCard, setShowWelcomeCard] = useState(false);
    const longPressTimer = useRef();
    const touchStartTime = useRef(0);
    const handleMouseEnter = () => {
        setShowWelcomeCard(true);
    };
    const handleMouseLeave = () => {
        setShowWelcomeCard(false);
    };
    const handleTouchStart = (e) => {
        touchStartTime.current = Date.now();
        longPressTimer.current = setTimeout(() => {
            setShowWelcomeCard(true);
        }, 500);
    };
    const handleTouchEnd = (e) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            const touchDuration = Date.now() - touchStartTime.current;
            if (touchDuration < 500) {
                setShowWelcomeCard(false);
            }
        }
    };
    const handleTouchMove = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            setShowWelcomeCard(false);
        }
    };
    useEffect(() => {
        return () => {
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
            }
        };
    }, []);
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: `fixed top-4 left-4 z-50 cursor-pointer transition-all duration-300 hover:scale-125 ${className}`, onClick: onClick, onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave, onTouchStart: handleTouchStart, onTouchEnd: handleTouchEnd, onTouchMove: handleTouchMove, style: { width: '72px', height: '72px' }, children: _jsxs("div", { className: "relative w-full h-full", children: [_jsx("img", { src: "/globe-icon.png", alt: "Menu", className: "w-full h-full object-contain drop-shadow-lg transition-all duration-300 hover:scale-110", style: {
                                filter: 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.7))',
                            } }), _jsx("div", { className: "absolute inset-0 rounded-full animate-pulse", style: {
                                background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)',
                                transform: 'scale(1.2)',
                            } }), _jsx("div", { className: "absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 hover:opacity-100", style: {
                                background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%)',
                                transform: 'scale(1.4)',
                            } })] }) }), _jsx(WelcomeCard, { isVisible: showWelcomeCard, onClose: () => setShowWelcomeCard(false) })] }));
};
export default GlobeIcon;
//# sourceMappingURL=GlobeIcon.js.map