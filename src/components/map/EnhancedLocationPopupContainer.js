import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { cn } from '@/lib/utils';
import EnhancedLocationPopup from './EnhancedLocationPopup';
import EnhancedLocationPopupVerso from './EnhancedLocationPopupVerso';
const EnhancedLocationPopupContainer = ({ location, onSubmit, className, }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const handleSubmit = (data) => {
        onSubmit?.(data);
    };
    return (_jsx("div", { className: cn('relative w-[400px] h-[500px] perspective-1000', className), children: _jsxs("div", { className: cn('relative w-full h-full transition-transform duration-500 transform-style-3d', isFlipped && 'rotate-y-180'), children: [_jsx("div", { className: "absolute w-full h-full backface-hidden", children: _jsx(EnhancedLocationPopup, { location: location, onFlip: () => setIsFlipped(true) }) }), _jsx("div", { className: "absolute w-full h-full backface-hidden rotate-y-180", children: _jsx(EnhancedLocationPopupVerso, { location: location, onFlip: () => setIsFlipped(false), onSubmit: handleSubmit }) })] }) }));
};
export default EnhancedLocationPopupContainer;
//# sourceMappingURL=EnhancedLocationPopupContainer.js.map