import type { ReactNode } from 'react';
import React, { createContext, useContext, useReducer, useCallback } from 'react';

import { ErrorHandlingService } from '../utils/ErrorHandlingService';

// Create an instance of ErrorHandlingService to use
const errorHandlingService = new ErrorHandlingService();

// Define error interface
export interface IAppError {
  id: number;
  message: string;
  code?: string | number | undefined;
  source?: string | undefined;
  timestamp: string;
  retryCallback?: (() => Promise<void>) | undefined;
  details?: Record<string, unknown> | undefined;
}

// Define state interface
interface IErrorState {
  errors: AppError[];
  isOffline: boolean;
  isProcessing: boolean;
  lastError: AppError | null;
  errorCount: number;
}

// Define context interface
interface IErrorContextType extends ErrorState {
  addError: (
    error: Omit<AppError, 'id' | 'timestamp'>,
    retryCallback?: () => Promise<void>
  ) => void;
  removeError: (errorId: number) => void;
  setOffline: (isOffline: boolean) => void;
  setProcessing: (isProcessing: boolean) => void;
  clearErrors: () => void;
  handleErrorWithRetry: (error: AppError, retryCallback: () => Promise<void>) => Promise<void>;
}

// Define action types enum
enum EActionType {
  ADD_ERROR = 'ADD_ERROR',
  REMOVE_ERROR = 'REMOVE_ERROR',
  SET_OFFLINE = 'SET_OFFLINE',
  SET_PROCESSING = 'SET_PROCESSING',
  CLEAR_ERRORS = 'CLEAR_ERRORS',
}

// Define action interfaces
interface IAddErrorAction {
  type: ActionType.ADD_ERROR;
  error: AppError;
}

interface IRemoveErrorAction {
  type: ActionType.REMOVE_ERROR;
  errorId: number;
}

interface ISetOfflineAction {
  type: ActionType.SET_OFFLINE;
  isOffline: boolean;
}

interface ISetProcessingAction {
  type: ActionType.SET_PROCESSING;
  isProcessing: boolean;
}

interface IClearErrorsAction {
  type: ActionType.CLEAR_ERRORS;
}

type TErrorAction =
  | AddErrorAction
  | RemoveErrorAction
  | SetOfflineAction
  | SetProcessingAction
  | ClearErrorsAction;

// Initial state
const initialState: ErrorState = {
  errors: [],
  isOffline: false,
  isProcessing: false,
  lastError: null,
  errorCount: 0,
};

// Create context with a default undefined value that will be set in the provider
const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

// Error reducer
const errorReducer = (state: ErrorState, action: ErrorAction): ErrorState => {
  switch (action.type) {
    case ActionType.ADD_ERROR:
      return {
        ...state,
        errors: [...state.errors, action.error],
        lastError: action.error,
        errorCount: state.errorCount + 1,
      };
    case ActionType.REMOVE_ERROR:
      return {
        ...state,
        errors: state.errors.filter(error => error.id !== action.errorId),
      };
    case ActionType.SET_OFFLINE:
      return {
        ...state,
        isOffline: action.isOffline,
      };
    case ActionType.SET_PROCESSING:
      return {
        ...state,
        isProcessing: action.isProcessing,
      };
    case ActionType.CLEAR_ERRORS:
      return {
        ...state,
        errors: [],
        lastError: null,
        errorCount: 0,
      };
    default:
      return state;
  }
};

interface IErrorProviderProps {
  children: ReactNode;
}

/**
 * Global error context provider component
 */
export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(errorReducer, initialState);

  // Add error with retry logic
  const addError = useCallback(
    (error: Omit<AppError, 'id' | 'timestamp'>, retryCallback?: () => Promise<void>) => {
      const errorWithId: AppError = {
        ...error,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        retryCallback,
      };

      // Log error to ErrorHandlingService
      errorHandlingService.handleError(
        new Error(error.message),
        error.code?.toString() || 'unknown',
        { details: error.details, source: error.source }
      );

      dispatch({ type: ActionType.ADD_ERROR, error: errorWithId });
    },
    []
  );

  // Remove error
  const removeError = useCallback((errorId: number) => {
    dispatch({ type: ActionType.REMOVE_ERROR, errorId });
  }, []);

  // Set offline state
  const setOffline = useCallback((isOffline: boolean) => {
    dispatch({ type: ActionType.SET_OFFLINE, isOffline });
  }, []);

  // Set processing state
  const setProcessing = useCallback((isProcessing: boolean) => {
    dispatch({ type: ActionType.SET_PROCESSING, isProcessing });
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    dispatch({ type: ActionType.CLEAR_ERRORS });
  }, []);

  // Handle error with retry
  const handleErrorWithRetry = useCallback(
    async (error: AppError, retryCallback: () => Promise<void>) => {
      try {
        setProcessing(true);
        await retryCallback();
        removeError(error.id);
      } catch (retryError) {
        if (retryError instanceof Error) {
          addError(
            {
              message: retryError.message,
              code: error.code,
              source: error.source,
              details: error.details,
            },
            retryCallback
          );
        } else {
          addError(
            {
              message: 'Unknown error during retry',
              code: error.code,
              source: error.source,
              details: error.details,
            },
            retryCallback
          );
        }
      } finally {
        setProcessing(false);
      }
    },
    [addError, removeError, setProcessing]
  );

  const value: ErrorContextType = {
    ...state,
    addError,
    removeError,
    setOffline,
    setProcessing,
    clearErrors,
    handleErrorWithRetry,
  };

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
};

/**
 * Custom hook to use the error context
 */
export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

export default ErrorContext;
