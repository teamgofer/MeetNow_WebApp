import { useState, useEffect } from 'react';
const useBreakpoint = () => {
    const [breakpoint, setBreakpoint] = useState({
        isMobile: false,
        isTablet: false,
        isDesktop: false,
    });
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setBreakpoint({
                isMobile: width < 768,
                isTablet: width >= 768 && width < 1024,
                isDesktop: width >= 1024,
            });
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return breakpoint;
};
export default useBreakpoint;
//# sourceMappingURL=useBreakpoint.js.map