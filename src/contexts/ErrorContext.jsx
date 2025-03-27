import React, { createContext, useContext, useReducer, useCallback } from 'react';
import PropTypes from 'prop-types';
import ErrorHandlingService from '../utils/ErrorHandlingService';

// Error context
const ErrorContext = createContext();

// Initial state
const initialState = {
  errors: [],
  isOffline: false,
  isProcessing: false,
  lastError: null,
  errorCount: 0
};

// Action types
const ActionTypes = {
  ADD_ERROR: 'ADD_ERROR',
  REMOVE_ERROR: 'REMOVE_ERROR',
  SET_OFFLINE: 'SET_OFFLINE',
  SET_PROCESSING: 'SET_PROCESSING',
  CLEAR_ERRORS: 'CLEAR_ERRORS'
};

// Error reducer
const errorReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.ADD_ERROR:
      return {
        ...state,
        errors: [...state.errors, action.error],
        lastError: action.error,
        errorCount: state.errorCount + 1
      };
    case ActionTypes.REMOVE_ERROR:
      return {
        ...state,
        errors: state.errors.filter(error => error.id !== action.errorId)
      };
    case ActionTypes.SET_OFFLINE:
      return {
        ...state,
        isOffline: action.isOffline
      };
    case ActionTypes.SET_PROCESSING:
      return {
        ...state,
        isProcessing: action.isProcessing
      };
    case ActionTypes.CLEAR_ERRORS:
      return {
        ...state,
        errors: [],
        lastError: null,
        errorCount: 0
      };
    default:
      return state;
  }
};

/**
 * Global error context provider component
 */
export const ErrorProvider = ({ children }) => {
  const [state, dispatch] = useReducer(errorReducer, initialState);

  // Add error with retry logic
  const addError = useCallback((error, retryCallback = null) => {
    const errorWithId = {
      ...error,
      id: Date.now(),
      timestamp: new Date().toISOString(),
      retryCallback
    };

    // Log error to ErrorHandlingService
    ErrorHandlingService.handleError(error);

    dispatch({ type: ActionTypes.ADD_ERROR, error: errorWithId });
  }, []);

  // Remove error
  const removeError = useCallback((errorId) => {
    dispatch({ type: ActionTypes.REMOVE_ERROR, errorId });
  }, []);

  // Set offline state
  const setOffline = useCallback((isOffline) => {
    dispatch({ type: ActionTypes.SET_OFFLINE, isOffline });
  }, []);

  // Set processing state
  const setProcessing = useCallback((isProcessing) => {
    dispatch({ type: ActionTypes.SET_PROCESSING, isProcessing });
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ERRORS });
  }, []);

  // Handle error with retry
  const handleErrorWithRetry = useCallback(async (error, retryCallback) => {
    try {
      setProcessing(true);
      await retryCallback();
      removeError(error.id);
    } catch (retryError) {
      addError(retryError, retryCallback);
    } finally {
      setProcessing(false);
    }
  }, [addError, removeError, setProcessing]);

  const value = {
    ...state,
    addError,
    removeError,
    setOffline,
    setProcessing,
    clearErrors,
    handleErrorWithRetry
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
};

ErrorProvider.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * Custom hook to use the error context
 */
export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

export default ErrorContext; 