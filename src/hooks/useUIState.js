import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useCallback, useContext, createContext } from 'react';
const UIStateContext = createContext({
    isLocationSearchOpen: false,
    openLocationSearch: () => { },
    closeLocationSearch: () => { },
});
export function UIStateProvider({ children }) {
    const [isLocationSearchOpen, setIsLocationSearchOpen] = useState(false);
    const openLocationSearch = useCallback(() => {
        setIsLocationSearchOpen(true);
    }, []);
    const closeLocationSearch = useCallback(() => {
        setIsLocationSearchOpen(false);
    }, []);
    const value = {
        isLocationSearchOpen,
        openLocationSearch,
        closeLocationSearch,
    };
    return _jsx(UIStateContext.Provider, { value: value, children: children });
}
export function useUIState() {
    const context = useContext(UIStateContext);
    if (!context) {
        throw new Error('useUIState must be used within a UIStateProvider');
    }
    return context;
}
export default useUIState;
//# sourceMappingURL=useUIState.js.map