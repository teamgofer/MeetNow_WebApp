import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const StopwatchIcon = ({ secondsRemaining = 0, colorScheme = 'A', size = 20, urgency = 'low', rotationDuration, }) => {
    const getColors = () => {
        if (urgency === 'expired') {
            return {
                primary: 'text-gray-400',
                secondary: 'text-gray-300',
                accent: 'text-gray-500',
                fill: 'fill-gray-400',
            };
        }
        if (urgency === 'high') {
            return {
                primary: 'text-red-600',
                secondary: 'text-red-400',
                accent: 'text-red-700',
                fill: 'fill-red-600',
            };
        }
        if (urgency === 'medium') {
            return {
                primary: colorScheme === 'A' ? 'text-indigo-600' : 'text-emerald-600',
                secondary: colorScheme === 'A' ? 'text-indigo-400' : 'text-emerald-400',
                accent: colorScheme === 'A' ? 'text-indigo-800' : 'text-emerald-800',
                fill: colorScheme === 'A' ? 'fill-indigo-600' : 'fill-emerald-600',
            };
        }
        return colorScheme === 'A'
            ? {
                primary: 'text-indigo-700',
                secondary: 'text-indigo-500',
                accent: 'text-indigo-900',
                fill: 'fill-indigo-700',
            }
            : {
                primary: 'text-emerald-700',
                secondary: 'text-emerald-500',
                accent: 'text-emerald-900',
                fill: 'fill-emerald-700',
            };
    };
    const colors = getColors();
    const getAnimationClass = () => {
        switch (urgency) {
            case 'high':
                return 'animate-pulse-fast';
            case 'medium':
                return 'animate-pulse';
            case 'expired':
                return '';
            default:
                return '';
        }
    };
    const getHandAnimationClass = () => {
        if (urgency === 'expired') {
            return '';
        }
        return 'animate-spin-reverse';
    };
    const getAnimationDuration = () => {
        if (rotationDuration && rotationDuration > 0) {
            return `${rotationDuration}s`;
        }
        switch (urgency) {
            case 'high':
                return '3s';
            case 'medium':
            case 'low':
                return '60s';
            default:
                return '60s';
        }
    };
    return (_jsxs("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", xmlns: "http://www.w3.org/2000/svg", className: `stopwatch-icon ${getAnimationClass()}`, "aria-hidden": "true", role: "img", "aria-label": "Countdown timer", style: { filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.05))' }, children: [_jsx("circle", { cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "1.5", className: colors.primary, strokeLinecap: "round" }), _jsx("circle", { cx: "12", cy: "3", r: "1.5", className: colors.fill, filter: "url(#shadow)" }), _jsx("circle", { cx: "12", cy: "12", r: "1", className: colors.accent + ' ' + colors.fill }), _jsx("line", { x1: "12", y1: "12", x2: "12", y2: "6", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", className: `stopwatch-hand ${colors.accent} ${getHandAnimationClass()}`, style: {
                    transformOrigin: 'center',
                    animationDuration: getAnimationDuration(),
                    animationTimingFunction: 'linear',
                    animationIterationCount: 'infinite'
                } }), [...Array(12)].map((_, i) => (_jsx("line", { x1: "12", y1: "4", x2: "12", y2: "5", stroke: "currentColor", strokeWidth: "0.75", strokeOpacity: "0.6", strokeLinecap: "round", className: colors.secondary, style: {
                    transformOrigin: 'center',
                    transform: `rotate(${i * 30}deg)`
                } }, i))), _jsx("defs", { children: _jsx("filter", { id: "shadow", x: "-50%", y: "-50%", width: "200%", height: "200%", children: _jsx("feDropShadow", { dx: "0", dy: "0.5", stdDeviation: "0.5", floodOpacity: "0.2" }) }) })] }));
};
export default StopwatchIcon;
//# sourceMappingURL=StopwatchIcon.js.map