import type { ReactNode } from 'react';
import React, { createContext, useContext, useReducer, useCallback, Dispatch } from 'react';

// Define action types enum
enum EActionType {
  START_LOADING = 'START_LOADING',
  STOP_LOADING = 'STOP_LOADING',
  SET_GLOBAL_LOADING = 'SET_GLOBAL_LOADING',
  ADD_TO_QUEUE = 'ADD_TO_QUEUE',
  REMOVE_FROM_QUEUE = 'REMOVE_FROM_QUEUE',
}

// Define actions interfaces
interface IStartLoadingAction {
  type: ActionType.START_LOADING;
  loaderId: string;
}

interface IStopLoadingAction {
  type: ActionType.STOP_LOADING;
  loaderId: string;
}

interface ISetGlobalLoadingAction {
  type: ActionType.SET_GLOBAL_LOADING;
  isLoading: boolean;
}

interface IAddToQueueAction {
  type: ActionType.ADD_TO_QUEUE;
  loaderId: string;
}

interface IRemoveFromQueueAction {
  type: ActionType.REMOVE_FROM_QUEUE;
  loaderId: string;
}

type TLoadingAction =
  | StartLoadingAction
  | StopLoadingAction
  | SetGlobalLoadingAction
  | AddToQueueAction
  | RemoveFromQueueAction;

// Define state interface
interface ILoadingState {
  loadingStates: Record<string, boolean>;
  globalLoading: boolean;
  loadingQueue: string[];
  activeLoaders: number;
}

// Define context interface
interface ILoadingContextType extends LoadingState {
  startLoading: (loaderId: string) => void;
  stopLoading: (loaderId: string) => void;
  setGlobalLoading: (isLoading: boolean) => void;
  addToQueue: (loaderId: string) => void;
  removeFromQueue: (loaderId: string) => void;
  isLoading: (loaderId: string) => boolean;
  isAnyLoading: () => boolean;
}

// Initial state
const initialState: LoadingState = {
  loadingStates: {},
  globalLoading: false,
  loadingQueue: [],
  activeLoaders: 0,
};

// Create context with a default undefined value that will be set in the provider
const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// Loading reducer
const loadingReducer = (state: LoadingState, action: LoadingAction): LoadingState => {
  switch (action.type) {
    case ActionType.START_LOADING:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [action.loaderId]: true,
        },
        activeLoaders: state.activeLoaders + 1,
      };
    case ActionType.STOP_LOADING:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [action.loaderId]: false,
        },
        activeLoaders: Math.max(0, state.activeLoaders - 1),
      };
    case ActionType.SET_GLOBAL_LOADING:
      return {
        ...state,
        globalLoading: action.isLoading,
      };
    case ActionType.ADD_TO_QUEUE:
      return {
        ...state,
        loadingQueue: [...state.loadingQueue, action.loaderId],
      };
    case ActionType.REMOVE_FROM_QUEUE:
      return {
        ...state,
        loadingQueue: state.loadingQueue.filter(id => id !== action.loaderId),
      };
    default:
      return state;
  }
};

interface ILoadingProviderProps {
  children: ReactNode;
}

/**
 * Global loading context provider component
 */
export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(loadingReducer, initialState);

  // Start loading for a specific loader
  const startLoading = useCallback((loaderId: string) => {
    dispatch({ type: ActionType.START_LOADING, loaderId });
  }, []);

  // Stop loading for a specific loader
  const stopLoading = useCallback((loaderId: string) => {
    dispatch({ type: ActionType.STOP_LOADING, loaderId });
  }, []);

  // Set global loading state
  const setGlobalLoading = useCallback((isLoading: boolean) => {
    dispatch({ type: ActionType.SET_GLOBAL_LOADING, isLoading });
  }, []);

  // Add loader to queue
  const addToQueue = useCallback((loaderId: string) => {
    dispatch({ type: ActionType.ADD_TO_QUEUE, loaderId });
  }, []);

  // Remove loader from queue
  const removeFromQueue = useCallback((loaderId: string) => {
    dispatch({ type: ActionType.REMOVE_FROM_QUEUE, loaderId });
  }, []);

  // Check if a specific loader is active
  const isLoading = useCallback(
    (loaderId: string): boolean => {
      return state.loadingStates[loaderId] ?? false;
    },
    [state.loadingStates]
  );

  // Check if any loader is active
  const isAnyLoading = useCallback((): boolean => {
    return state.activeLoaders > 0;
  }, [state.activeLoaders]);

  const value: LoadingContextType = {
    ...state,
    startLoading,
    stopLoading,
    setGlobalLoading,
    addToQueue,
    removeFromQueue,
    isLoading,
    isAnyLoading,
  };

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
};

/**
 * Custom hook to use the loading context
 */
export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export default LoadingContext;
