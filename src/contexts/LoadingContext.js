import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useReducer, useCallback } from 'react';
var EActionType;
(function (EActionType) {
    EActionType["START_LOADING"] = "START_LOADING";
    EActionType["STOP_LOADING"] = "STOP_LOADING";
    EActionType["SET_GLOBAL_LOADING"] = "SET_GLOBAL_LOADING";
    EActionType["ADD_TO_QUEUE"] = "ADD_TO_QUEUE";
    EActionType["REMOVE_FROM_QUEUE"] = "REMOVE_FROM_QUEUE";
})(EActionType || (EActionType = {}));
const initialState = {
    loadingStates: {},
    globalLoading: false,
    loadingQueue: [],
    activeLoaders: 0,
};
const LoadingContext = createContext(undefined);
const loadingReducer = (state, action) => {
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
export const LoadingProvider = ({ children }) => {
    const [state, dispatch] = useReducer(loadingReducer, initialState);
    const startLoading = useCallback((loaderId) => {
        dispatch({ type: ActionType.START_LOADING, loaderId });
    }, []);
    const stopLoading = useCallback((loaderId) => {
        dispatch({ type: ActionType.STOP_LOADING, loaderId });
    }, []);
    const setGlobalLoading = useCallback((isLoading) => {
        dispatch({ type: ActionType.SET_GLOBAL_LOADING, isLoading });
    }, []);
    const addToQueue = useCallback((loaderId) => {
        dispatch({ type: ActionType.ADD_TO_QUEUE, loaderId });
    }, []);
    const removeFromQueue = useCallback((loaderId) => {
        dispatch({ type: ActionType.REMOVE_FROM_QUEUE, loaderId });
    }, []);
    const isLoading = useCallback((loaderId) => {
        return state.loadingStates[loaderId] ?? false;
    }, [state.loadingStates]);
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
        isAnyLoading,
    };
    return _jsx(LoadingContext.Provider, { value: value, children: children });
};
export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
};
export default LoadingContext;
//# sourceMappingURL=LoadingContext.js.map