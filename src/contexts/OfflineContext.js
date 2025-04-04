import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
var EActionType;
(function (EActionType) {
    EActionType["SET_OFFLINE"] = "SET_OFFLINE";
    EActionType["ADD_PENDING_ACTION"] = "ADD_PENDING_ACTION";
    EActionType["REMOVE_PENDING_ACTION"] = "REMOVE_PENDING_ACTION";
    EActionType["ADD_TO_SYNC_QUEUE"] = "ADD_TO_SYNC_QUEUE";
    EActionType["REMOVE_FROM_SYNC_QUEUE"] = "REMOVE_FROM_SYNC_QUEUE";
    EActionType["SET_SYNC_STATUS"] = "SET_SYNC_STATUS";
    EActionType["SET_OFFLINE_DATA"] = "SET_OFFLINE_DATA";
    EActionType["ADD_SYNC_ERROR"] = "ADD_SYNC_ERROR";
    EActionType["CLEAR_SYNC_ERRORS"] = "CLEAR_SYNC_ERRORS";
})(EActionType || (EActionType = {}));
const initialState = {
    isOffline: !navigator.onLine,
    pendingActions: [],
    syncQueue: [],
    lastSync: null,
    syncStatus: 'idle',
    offlineData: {},
    syncErrors: [],
};
const OfflineContext = createContext(undefined);
const offlineReducer = (state, action) => {
    switch (action.type) {
        case EActionType.SET_OFFLINE:
            return {
                ...state,
                isOffline: action.isOffline,
            };
        case EActionType.ADD_PENDING_ACTION:
            return {
                ...state,
                pendingActions: [...state.pendingActions, action.action],
            };
        case EActionType.REMOVE_PENDING_ACTION:
            return {
                ...state,
                pendingActions: state.pendingActions.filter(a => a.id !== action.actionId),
            };
        case EActionType.ADD_TO_SYNC_QUEUE:
            return {
                ...state,
                syncQueue: [...state.syncQueue, action.item],
            };
        case EActionType.REMOVE_FROM_SYNC_QUEUE:
            return {
                ...state,
                syncQueue: state.syncQueue.filter(item => item.id !== action.itemId),
            };
        case EActionType.SET_SYNC_STATUS:
            return {
                ...state,
                syncStatus: action.status,
                lastSync: action.status === 'idle' ? new Date().toISOString() : state.lastSync,
            };
        case EActionType.SET_OFFLINE_DATA:
            return {
                ...state,
                offlineData: {
                    ...state.offlineData,
                    [action.key]: action.data,
                },
            };
        case EActionType.ADD_SYNC_ERROR:
            return {
                ...state,
                syncErrors: [...state.syncErrors, action.error],
            };
        case EActionType.CLEAR_SYNC_ERRORS:
            return {
                ...state,
                syncErrors: [],
            };
        default:
            return state;
    }
};
export const OfflineProvider = ({ children }) => {
    const [state, dispatch] = useReducer(offlineReducer, initialState);
    useEffect(() => {
        const handleOnline = () => {
            dispatch({ type: EActionType.SET_OFFLINE, isOffline: false });
            syncPendingActions();
        };
        const handleOffline = () => {
            dispatch({ type: EActionType.SET_OFFLINE, isOffline: true });
        };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);
    const addPendingAction = useCallback((action) => {
        const actionWithId = {
            ...action,
            id: Date.now(),
            timestamp: new Date().toISOString(),
        };
        dispatch({ type: EActionType.ADD_PENDING_ACTION, action: actionWithId });
        return actionWithId.id;
    }, []);
    const removePendingAction = useCallback((actionId) => {
        dispatch({ type: EActionType.REMOVE_PENDING_ACTION, actionId });
    }, []);
    const addToSyncQueue = useCallback((item) => {
        const itemWithId = {
            ...item,
            id: Date.now(),
            timestamp: new Date().toISOString(),
        };
        dispatch({ type: EActionType.ADD_TO_SYNC_QUEUE, item: itemWithId });
        return itemWithId.id;
    }, []);
    const removeFromSyncQueue = useCallback((itemId) => {
        dispatch({ type: EActionType.REMOVE_FROM_SYNC_QUEUE, itemId });
    }, []);
    const setOfflineData = useCallback((key, data) => {
        dispatch({ type: EActionType.SET_OFFLINE_DATA, key, data });
    }, []);
    const getOfflineData = useCallback((key) => {
        return state.offlineData[key];
    }, [state.offlineData]);
    const syncPendingActions = useCallback(async () => {
        if (state.pendingActions.length === 0 || state.isOffline || state.syncStatus === 'syncing') {
            return;
        }
        dispatch({ type: EActionType.SET_SYNC_STATUS, status: 'syncing' });
        dispatch({ type: EActionType.CLEAR_SYNC_ERRORS });
        try {
            for (const action of [...state.pendingActions]) {
                try {
                    await action.execute();
                    dispatch({ type: EActionType.REMOVE_PENDING_ACTION, actionId: action.id });
                }
                catch (error) {
                    console.error('Error executing pending action:', error);
                    dispatch({
                        type: EActionType.ADD_SYNC_ERROR,
                        error: error instanceof Error ? error : new Error(String(error)),
                    });
                }
            }
            dispatch({ type: EActionType.SET_SYNC_STATUS, status: 'idle' });
        }
        catch (error) {
            console.error('Error during sync process:', error);
            dispatch({
                type: EActionType.ADD_SYNC_ERROR,
                error: error instanceof Error ? error : new Error(String(error)),
            });
            dispatch({ type: EActionType.SET_SYNC_STATUS, status: 'error' });
        }
    }, [state.pendingActions, state.isOffline, state.syncStatus]);
    const contextValue = {
        ...state,
        addPendingAction,
        removePendingAction,
        addToSyncQueue,
        removeFromSyncQueue,
        setOfflineData,
        getOfflineData,
        syncPendingActions,
    };
    return _jsx(OfflineContext.Provider, { value: contextValue, children: children });
};
export const useOffline = () => {
    const context = useContext(OfflineContext);
    if (!context) {
        throw new Error('useOffline must be used within an OfflineProvider');
    }
    return context;
};
export default OfflineContext;
//# sourceMappingURL=OfflineContext.js.map