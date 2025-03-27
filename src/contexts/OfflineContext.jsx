import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';

// Offline context
const OfflineContext = createContext();

// Initial state
const initialState = {
  isOffline: !navigator.onLine,
  pendingActions: [],
  syncQueue: [],
  lastSync: null,
  syncStatus: 'idle', // idle, syncing, error
  offlineData: {},
  syncErrors: []
};

// Action types
const ActionTypes = {
  SET_OFFLINE: 'SET_OFFLINE',
  ADD_PENDING_ACTION: 'ADD_PENDING_ACTION',
  REMOVE_PENDING_ACTION: 'REMOVE_PENDING_ACTION',
  ADD_TO_SYNC_QUEUE: 'ADD_TO_SYNC_QUEUE',
  REMOVE_FROM_SYNC_QUEUE: 'REMOVE_FROM_SYNC_QUEUE',
  SET_SYNC_STATUS: 'SET_SYNC_STATUS',
  SET_OFFLINE_DATA: 'SET_OFFLINE_DATA',
  ADD_SYNC_ERROR: 'ADD_SYNC_ERROR',
  CLEAR_SYNC_ERRORS: 'CLEAR_SYNC_ERRORS'
};

// Offline reducer
const offlineReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_OFFLINE:
      return {
        ...state,
        isOffline: action.isOffline
      };
    case ActionTypes.ADD_PENDING_ACTION:
      return {
        ...state,
        pendingActions: [...state.pendingActions, action.action]
      };
    case ActionTypes.REMOVE_PENDING_ACTION:
      return {
        ...state,
        pendingActions: state.pendingActions.filter(a => a.id !== action.actionId)
      };
    case ActionTypes.ADD_TO_SYNC_QUEUE:
      return {
        ...state,
        syncQueue: [...state.syncQueue, action.item]
      };
    case ActionTypes.REMOVE_FROM_SYNC_QUEUE:
      return {
        ...state,
        syncQueue: state.syncQueue.filter(item => item.id !== action.itemId)
      };
    case ActionTypes.SET_SYNC_STATUS:
      return {
        ...state,
        syncStatus: action.status,
        lastSync: action.status === 'idle' ? new Date().toISOString() : state.lastSync
      };
    case ActionTypes.SET_OFFLINE_DATA:
      return {
        ...state,
        offlineData: {
          ...state.offlineData,
          [action.key]: action.data
        }
      };
    case ActionTypes.ADD_SYNC_ERROR:
      return {
        ...state,
        syncErrors: [...state.syncErrors, action.error]
      };
    case ActionTypes.CLEAR_SYNC_ERRORS:
      return {
        ...state,
        syncErrors: []
      };
    default:
      return state;
  }
};

/**
 * Global offline context provider component
 */
export const OfflineProvider = ({ children }) => {
  const [state, dispatch] = useReducer(offlineReducer, initialState);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: ActionTypes.SET_OFFLINE, isOffline: false });
      // Attempt to sync when coming back online
      syncPendingActions();
    };

    const handleOffline = () => {
      dispatch({ type: ActionTypes.SET_OFFLINE, isOffline: true });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add action to pending queue
  const addPendingAction = useCallback((action) => {
    const actionWithId = {
      ...action,
      id: Date.now(),
      timestamp: new Date().toISOString()
    };
    dispatch({ type: ActionTypes.ADD_PENDING_ACTION, action: actionWithId });
    return actionWithId.id;
  }, []);

  // Remove action from pending queue
  const removePendingAction = useCallback((actionId) => {
    dispatch({ type: ActionTypes.REMOVE_PENDING_ACTION, actionId });
  }, []);

  // Add item to sync queue
  const addToSyncQueue = useCallback((item) => {
    const itemWithId = {
      ...item,
      id: Date.now(),
      timestamp: new Date().toISOString()
    };
    dispatch({ type: ActionTypes.ADD_TO_SYNC_QUEUE, item: itemWithId });
    return itemWithId.id;
  }, []);

  // Remove item from sync queue
  const removeFromSyncQueue = useCallback((itemId) => {
    dispatch({ type: ActionTypes.REMOVE_FROM_SYNC_QUEUE, itemId });
  }, []);

  // Set offline data
  const setOfflineData = useCallback((key, data) => {
    dispatch({ type: ActionTypes.SET_OFFLINE_DATA, key, data });
  }, []);

  // Get offline data
  const getOfflineData = useCallback((key) => {
    return state.offlineData[key];
  }, [state.offlineData]);

  // Sync pending actions
  const syncPendingActions = useCallback(async () => {
    if (state.syncStatus === 'syncing' || state.pendingActions.length === 0) return;

    dispatch({ type: ActionTypes.SET_SYNC_STATUS, status: 'syncing' });

    try {
      for (const action of state.pendingActions) {
        try {
          await action.execute();
          removePendingAction(action.id);
        } catch (error) {
          dispatch({ type: ActionTypes.ADD_SYNC_ERROR, error });
        }
      }
      dispatch({ type: ActionTypes.SET_SYNC_STATUS, status: 'idle' });
    } catch (error) {
      dispatch({ type: ActionTypes.SET_SYNC_STATUS, status: 'error' });
      dispatch({ type: ActionTypes.ADD_SYNC_ERROR, error });
    }
  }, [state.pendingActions, state.syncStatus, removePendingAction]);

  const value = {
    ...state,
    addPendingAction,
    removePendingAction,
    addToSyncQueue,
    removeFromSyncQueue,
    setOfflineData,
    getOfflineData,
    syncPendingActions
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

OfflineProvider.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * Custom hook to use the offline context
 */
export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

export default OfflineContext; 
 
 
 
 
 