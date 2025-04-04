import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useReducer, useCallback } from 'react';
import { ErrorHandlingService } from '../utils/ErrorHandlingService';
const errorHandlingService = new ErrorHandlingService();
var EActionType;
(function (EActionType) {
    EActionType["ADD_ERROR"] = "ADD_ERROR";
    EActionType["REMOVE_ERROR"] = "REMOVE_ERROR";
    EActionType["SET_OFFLINE"] = "SET_OFFLINE";
    EActionType["SET_PROCESSING"] = "SET_PROCESSING";
    EActionType["CLEAR_ERRORS"] = "CLEAR_ERRORS";
})(EActionType || (EActionType = {}));
const initialState = {
    errors: [],
    isOffline: false,
    isProcessing: false,
    lastError: null,
    errorCount: 0,
};
const ErrorContext = createContext(undefined);
const errorReducer = (state, action) => {
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
export const ErrorProvider = ({ children }) => {
    const [state, dispatch] = useReducer(errorReducer, initialState);
    const addError = useCallback((error, retryCallback) => {
        const errorWithId = {
            ...error,
            id: Date.now(),
            timestamp: new Date().toISOString(),
            retryCallback,
        };
        errorHandlingService.handleError(new Error(error.message), error.code?.toString() || 'unknown', { details: error.details, source: error.source });
        dispatch({ type: ActionType.ADD_ERROR, error: errorWithId });
    }, []);
    const removeError = useCallback((errorId) => {
        dispatch({ type: ActionType.REMOVE_ERROR, errorId });
    }, []);
    const setOffline = useCallback((isOffline) => {
        dispatch({ type: ActionType.SET_OFFLINE, isOffline });
    }, []);
    const setProcessing = useCallback((isProcessing) => {
        dispatch({ type: ActionType.SET_PROCESSING, isProcessing });
    }, []);
    const clearErrors = useCallback(() => {
        dispatch({ type: ActionType.CLEAR_ERRORS });
    }, []);
    const handleErrorWithRetry = useCallback(async (error, retryCallback) => {
        try {
            setProcessing(true);
            await retryCallback();
            removeError(error.id);
        }
        catch (retryError) {
            if (retryError instanceof Error) {
                addError({
                    message: retryError.message,
                    code: error.code,
                    source: error.source,
                    details: error.details,
                }, retryCallback);
            }
            else {
                addError({
                    message: 'Unknown error during retry',
                    code: error.code,
                    source: error.source,
                    details: error.details,
                }, retryCallback);
            }
        }
        finally {
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
        handleErrorWithRetry,
    };
    return _jsx(ErrorContext.Provider, { value: value, children: children });
};
export const useError = () => {
    const context = useContext(ErrorContext);
    if (!context) {
        throw new Error('useError must be used within an ErrorProvider');
    }
    return context;
};
export default ErrorContext;
//# sourceMappingURL=ErrorContext.js.map