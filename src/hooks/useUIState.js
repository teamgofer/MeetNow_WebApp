import { useState, useCallback, useContext, createContext } from 'react';

// Create context for UI state
const UIStateContext = createContext({
  isLocationSearchOpen: false,
  openLocationSearch: () => {},
  closeLocationSearch: () => {},
});

/**
 * Provider component for UI state
 */
export function UIStateProvider({ children }) {
  const [isLocationSearchOpen, setIsLocationSearchOpen] = useState(false);
  
  // Toggle location search visibility
  const openLocationSearch = useCallback(() => {
    setIsLocationSearchOpen(true);
  }, []);
  
  const closeLocationSearch = useCallback(() => {
    setIsLocationSearchOpen(false);
  }, []);
  
  // Create value object
  const value = {
    isLocationSearchOpen,
    openLocationSearch,
    closeLocationSearch,
  };
  
  return (
    <UIStateContext.Provider value={value}>
      {children}
    </UIStateContext.Provider>
  );
}

/**
 * Hook for accessing UI state
 * Provides methods for controlling UI components like modals, sidebars, etc.
 */
export function useUIState() {
  const context = useContext(UIStateContext);
  
  if (!context) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }
  
  return context;
}

export default useUIState; 