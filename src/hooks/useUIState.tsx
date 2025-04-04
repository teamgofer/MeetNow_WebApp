import { useState, useCallback, useContext, createContext, ReactNode } from 'react';

/**
 * Interface for UI state context value
 */
export interface IUIStateContext {
  /** Whether the location search is currently open */
  isLocationSearchOpen: boolean;
  /** Function to open the location search */
  openLocationSearch: () => void;
  /** Function to close the location search */
  closeLocationSearch: () => void;
}

/**
 * Interface for UI state provider props
 */
export interface IUIStateProviderProps {
  /** Child components to be wrapped by the provider */
  children: ReactNode;
}

// Create context for UI state with default values
const UIStateContext = createContext<IUIStateContext>({
  isLocationSearchOpen: false,
  openLocationSearch: () => {},
  closeLocationSearch: () => {},
});

/**
 * Provider component for UI state
 * @param props - Provider props containing children
 * @returns Provider component with UI state context
 */
export function UIStateProvider({ children }: IUIStateProviderProps): JSX.Element {
  const [isLocationSearchOpen, setIsLocationSearchOpen] = useState<boolean>(false);

  // Toggle location search visibility
  const openLocationSearch = useCallback((): void => {
    setIsLocationSearchOpen(true);
  }, []);

  const closeLocationSearch = useCallback((): void => {
    setIsLocationSearchOpen(false);
  }, []);

  // Create value object
  const value: IUIStateContext = {
    isLocationSearchOpen,
    openLocationSearch,
    closeLocationSearch,
  };

  return <UIStateContext.Provider value={value}>{children}</UIStateContext.Provider>;
}

/**
 * Hook for accessing UI state
 * Provides methods for controlling UI components like modals, sidebars, etc.
 * @returns UI state context value
 * @throws Error if used outside of UIStateProvider
 */
export function useUIState(): IUIStateContext {
  const context = useContext<IUIStateContext>(UIStateContext);

  if (!context) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }

  return context;
}

export default useUIState;
