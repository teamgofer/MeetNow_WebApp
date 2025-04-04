import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useRef } from 'react';
const ProgressiveImage = ({ src, alt, className = '', width = '100%', height = 'auto', placeholderColor = '#f0f0f0', fallbackSrc, objectFit = 'cover', loading = 'lazy', onLoad, onError, id, }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(loading === 'eager');
    const imgRef = useRef(null);
    const observerRef = useRef(null);
    useEffect(() => {
        if (!window.IntersectionObserver || loading === 'eager') {
            setIsInView(true);
            return;
        }
        observerRef.current = new IntersectionObserver(entries => {
            if (entries.length === 0)
                return;
            const entry = entries[0];
            if (entry && entry.isIntersecting) {
                setIsInView(true);
                if (observerRef.current) {
                    observerRef.current.disconnect();
                }
            }
        }, { threshold: 0.1 });
        if (imgRef.current) {
            observerRef.current.observe(imgRef.current);
        }
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [loading]);
    const handleLoad = () => {
        setIsLoaded(true);
        if (onLoad)
            onLoad();
    };
    const handleError = (e) => {
        setHasError(true);
        if (fallbackSrc && e.currentTarget) {
            e.currentTarget.src = fallbackSrc;
        }
        if (onError)
            onError(e);
    };
    return (_jsxs("div", { ref: imgRef, className: `progressive-image-container relative overflow-hidden ${className}`, style: {
            width,
            height,
            backgroundColor: placeholderColor,
            position: 'relative',
        }, children: [!isLoaded && (_jsx("div", { className: "absolute inset-0 animate-pulse", style: { backgroundColor: placeholderColor } })), isInView && (_jsx("img", { src: src, alt: alt, className: "w-full h-full transition-opacity duration-500", style: {
                    opacity: isLoaded ? 1 : 0,
                    objectFit,
                }, onLoad: handleLoad, onError: handleError, loading: loading, id: id })), hasError && !fallbackSrc && (_jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50", children: _jsxs("div", { className: "text-gray-500 text-sm text-center p-2", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6 mx-auto mb-1", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }) }), "Failed to load image"] }) }))] }));
};
const arePropsEqual = (prevProps, nextProps) => {
    if (prevProps.src !== nextProps.src)
        return false;
    if (prevProps.id !== nextProps.id)
        return false;
    if (prevProps.alt !== nextProps.alt)
        return false;
    if (prevProps.loading !== nextProps.loading)
        return false;
    if (prevProps.width !== nextProps.width)
        return false;
    if (prevProps.height !== nextProps.height)
        return false;
    if (prevProps.objectFit !== nextProps.objectFit)
        return false;
    if (prevProps.className !== nextProps.className)
        return false;
    if (prevProps.placeholderColor !== nextProps.placeholderColor)
        return false;
    return true;
};
export default React.memo(ProgressiveImage, arePropsEqual);
//# sourceMappingURL=ProgressiveImage.js.map