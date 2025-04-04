import { jsx as _jsx } from "react/jsx-runtime";
import { getFeatureFlag } from '../../utils/feature-flags';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { breakpoints } from '../../hooks/useMediaQuery';
const CardWrapper = ({ children, position = 'top', withAnimation = true, className = '', }) => {
    const shouldAnimate = withAnimation && getFeatureFlag('ENABLE_ANIMATIONS');
    const isMobile = useMediaQuery(breakpoints.mobile);
    const isTablet = useMediaQuery(breakpoints.tablet);
    const getPositionClasses = () => {
        if (isMobile) {
            switch (position) {
                case 'top':
                    return 'top-0 left-0 right-0 max-h-[85vh]';
                case 'bottom':
                    return 'bottom-0 left-0 right-0 max-h-[85vh]';
                case 'left':
                    return 'top-0 left-0 bottom-0 max-w-[85vw]';
                case 'right':
                    return 'top-0 right-0 bottom-0 max-w-[85vw]';
                default:
                    return 'top-0 left-0 right-0 max-h-[85vh]';
            }
        }
        switch (position) {
            case 'top':
                return 'top-4 left-1/2 -translate-x-1/2';
            case 'bottom':
                return 'bottom-4 left-1/2 -translate-x-1/2';
            case 'left':
                return 'left-4 top-1/2 -translate-y-1/2';
            case 'right':
                return 'right-4 top-1/2 -translate-y-1/2';
            default:
                return 'top-4 left-1/2 -translate-x-1/2';
        }
    };
    const getAnimationClasses = () => {
        if (!shouldAnimate)
            return '';
        if (isMobile) {
            switch (position) {
                case 'top':
                    return 'animate-slide-down';
                case 'bottom':
                    return 'animate-slide-up';
                case 'left':
                    return 'animate-slide-right';
                case 'right':
                    return 'animate-slide-left';
                default:
                    return 'animate-slide-down';
            }
        }
        switch (position) {
            case 'top':
                return 'animate-fade-in';
            case 'bottom':
                return 'animate-fade-in';
            case 'left':
                return 'animate-fade-in';
            case 'right':
                return 'animate-fade-in';
            default:
                return 'animate-fade-in';
        }
    };
    return (_jsx("div", { className: `
        fixed z-50 bg-white rounded-lg shadow-lg overflow-hidden
        ${getPositionClasses()}
        ${getAnimationClasses()}
        ${className}
      `, children: children }));
};
export default CardWrapper;
//# sourceMappingURL=CardWrapper.js.map