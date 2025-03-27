import React, { createContext, useContext, useReducer, useCallback } from 'react';
import PropTypes from 'prop-types';

// Loading context
const LoadingContext = createContext();

// Initial state
const initialState = {
  loadingStates: {},
  globalLoading: false,
  loadingQueue: [],
  activeLoaders: 0
};

// Action types
const ActionTypes = {
  START_LOADING: 'START_LOADING',
  STOP_LOADING: 'STOP_LOADING',
  SET_GLOBAL_LOADING: 'SET_GLOBAL_LOADING',
  ADD_TO_QUEUE: 'ADD_TO_QUEUE',
  REMOVE_FROM_QUEUE: 'REMOVE_FROM_QUEUE'
};

// Loading reducer
const loadingReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.START_LOADING:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [action.loaderId]: true
        },
        activeLoaders: state.activeLoaders + 1
      };
    case ActionTypes.STOP_LOADING:
      return {
        ...state,
        loadingStates: {
          ...state.loadingStates,
          [action.loaderId]: false
        },
        activeLoaders: Math.max(0, state.activeLoaders - 1)
      };
    case ActionTypes.SET_GLOBAL_LOADING:
      return {
        ...state,
        globalLoading: action.isLoading
      };
    case ActionTypes.ADD_TO_QUEUE:
      return {
        ...state,
        loadingQueue: [...state.loadingQueue, action.loaderId]
      };
    case ActionTypes.REMOVE_FROM_QUEUE:
      return {
        ...state,
        loadingQueue: state.loadingQueue.filter(id => id !== action.loaderId)
      };
    default:
      return state;
  }
};

/**
 * Global loading context provider component
 */
export const LoadingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(loadingReducer, initialState);

  // Start loading for a specific loader
  const startLoading = useCallback((loaderId) => {
    dispatch({ type: ActionTypes.START_LOADING, loaderId });
  }, []);

  // Stop loading for a specific loader
  const stopLoading = useCallback((loaderId) => {
    dispatch({ type: ActionTypes.STOP_LOADING, loaderId });
  }, []);

  // Set global loading state
  const setGlobalLoading = useCallback((isLoading) => {
    dispatch({ type: ActionTypes.SET_GLOBAL_LOADING, isLoading });
  }, []);

  // Add loader to queue
  const addToQueue = useCallback((loaderId) => {
    dispatch({ type: ActionTypes.ADD_TO_QUEUE, loaderId });
  }, []);

  // Remove loader from queue
  const removeFromQueue = useCallback((loaderId) => {
    dispatch({ type: ActionTypes.REMOVE_FROM_QUEUE, loaderId });
  }, []);

  // Check if a specific loader is active
  const isLoading = useCallback((loaderId) => {
    return state.loadingStates[loaderId] || false;
  }, [state.loadingStates]);

  // Check if any loader is active
  const isAnyLoading = useCallback(() => {
    return state.activeLoaders > 0;
  }, [state.activeLoaders]);

  const value = {
    ...state,
    startLoading,
    stopLoading,
    setGlobalLoading,
    addToQueue,
    removeFromQueue,
    isLoading,
    isAnyLoading
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

LoadingProvider.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * Custom hook to use the loading context
 */
export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export default LoadingContext; 