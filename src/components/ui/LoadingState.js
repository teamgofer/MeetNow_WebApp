import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { FaSpinner } from 'react-icons/fa';
const LoadingState = ({ isLoading, children, className = '', overlay = false, spinner = true, text = 'Loading...', delay = 300, fade = true, }) => {
    const [show, setShow] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        let timeout;
        if (isLoading) {
            timeout = setTimeout(() => {
                setShow(true);
                requestAnimationFrame(() => {
                    setIsVisible(true);
                });
            }, delay);
        }
        else {
            setIsVisible(false);
            timeout = setTimeout(() => {
                setShow(false);
            }, 300);
        }
        return () => clearTimeout(timeout);
    }, [isLoading, delay]);
    if (!show)
        return null;
    const baseClasses = `
    ${fade ? 'transition-opacity duration-300' : ''}
    ${overlay ? 'fixed inset-0 z-50 bg-black bg-opacity-50' : 'relative'}
    ${className}
  `;
    const contentClasses = `
    ${fade ? 'transition-opacity duration-300' : ''}
    ${isVisible ? 'opacity-100' : 'opacity-0'}
    flex flex-col items-center justify-center
    ${overlay ? 'h-screen' : 'h-full'}
  `;
    return (_jsx("div", { className: baseClasses, children: _jsxs("div", { className: contentClasses, children: [spinner && _jsx(FaSpinner, { className: "w-8 h-8 animate-spin text-white mb-4" }), text && _jsx("span", { className: "text-white text-lg font-medium", children: text }), children && _jsx("div", { className: "mt-4", children: children })] }) }));
};
export const LoadingSkeleton = ({ className = '', lines = 1, height = 'h-4', width = 'w-full', rounded = 'rounded', }) => {
    return (_jsx("div", { className: `space-y-2 ${className}`, children: Array.from({ length: lines }).map((_, index) => (_jsx("div", { className: `
            ${height}
            ${width}
            ${rounded}
            bg-gray-200 dark:bg-gray-700
            animate-pulse
          ` }, index))) }));
};
export const LoadingProgress = ({ progress, className = '', height = 'h-2', rounded = 'rounded-full', color = 'bg-blue-500', }) => {
    return (_jsx("div", { className: `w-full bg-gray-200 dark:bg-gray-700 ${height} ${rounded} ${className}`, children: _jsx("div", { className: `
          ${height}
          ${rounded}
          ${color}
          transition-all duration-300 ease-out
        `, style: { width: `${Math.min(100, Math.max(0, progress))}%` } }) }));
};
export default LoadingState;
//# sourceMappingURL=LoadingState.js.map