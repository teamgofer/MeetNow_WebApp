import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import withPerformanceTracking from '../../hocs/withPerformanceTracking';
const OptimizedImage = ({ src, alt, width, height, className = '', placeholderColor = '#f0f0f0', blurhash = null, fallbackSrc = null, objectFit = 'cover', loading = 'lazy', threshold = 0.01, onLoad = () => { }, onError = () => { }, }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef(null);
    const observerRef = useRef(null);
    useEffect(() => {
        if (!imgRef.current || !loading || loading === 'eager')
            return;
        observerRef.current = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (imgRef.current) {
                        imgRef.current.src = src;
                    }
                    if (observerRef.current) {
                        observerRef.current.disconnect();
                    }
                }
            });
        }, { threshold });
        if (imgRef.current) {
            observerRef.current.observe(imgRef.current);
        }
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [src, loading, threshold]);
    const handleLoad = (e) => {
        setIsLoaded(true);
        onLoad();
    };
    const handleError = (e) => {
        setHasError(true);
        if (fallbackSrc) {
            e.target.src = fallbackSrc;
        }
        onError();
    };
    return (_jsxs("div", { className: `optimized-image-container relative overflow-hidden ${className}`, style: {
            width,
            height,
            backgroundColor: placeholderColor,
        }, children: [blurhash && !isLoaded && (_jsx("div", { className: "absolute inset-0", style: {
                    backgroundImage: `url(${blurhash})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(20px)',
                    transform: 'scale(1.2)',
                } })), _jsx("img", { ref: imgRef, className: `w-full h-full transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`, alt: alt, width: width, height: height, src: loading === 'eager' ? src : '', style: {
                    objectFit: objectFit,
                }, loading: loading, onLoad: handleLoad, onError: handleError })] }));
};
export default withPerformanceTracking(OptimizedImage, {
    componentId: 'OptimizedImage',
    trackMounts: false,
    logToConsole: false,
});
//# sourceMappingURL=OptimizedImage.js.map