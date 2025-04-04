import type { ReactNode } from 'react';
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

// Define action types enum
enum EActionType {
  SET_OFFLINE = 'SET_OFFLINE',
  ADD_PENDING_ACTION = 'ADD_PENDING_ACTION',
  REMOVE_PENDING_ACTION = 'REMOVE_PENDING_ACTION',
  ADD_TO_SYNC_QUEUE = 'ADD_TO_SYNC_QUEUE',
  REMOVE_FROM_SYNC_QUEUE = 'REMOVE_FROM_SYNC_QUEUE',
  SET_SYNC_STATUS = 'SET_SYNC_STATUS',
  SET_OFFLINE_DATA = 'SET_OFFLINE_DATA',
  ADD_SYNC_ERROR = 'ADD_SYNC_ERROR',
  CLEAR_SYNC_ERRORS = 'CLEAR_SYNC_ERRORS',
}

// Define sync status type
type TSyncStatus = 'idle' | 'syncing' | 'error';

// Define pending action and action parameter interfaces
interface IPendingActionBase {
  execute: () => Promise<void>;
  [key: string]: any;
}

interface IPendingAction extends IPendingActionBase {
  id: number;
  timestamp: string;
}

// Define sync queue item interfaces
interface ISyncQueueItemBase {
  [key: string]: any;
}

interface ISyncQueueItem extends ISyncQueueItemBase {
  id: number;
  timestamp: string;
}

// Define actions interfaces
interface ISetOfflineAction {
  type: EActionType.SET_OFFLINE;
  isOffline: boolean;
}

interface IAddPendingActionAction {
  type: EActionType.ADD_PENDING_ACTION;
  action: IPendingAction;
}

interface IRemovePendingActionAction {
  type: EActionType.REMOVE_PENDING_ACTION;
  actionId: number;
}

interface IAddToSyncQueueAction {
  type: EActionType.ADD_TO_SYNC_QUEUE;
  item: ISyncQueueItem;
}

interface IRemoveFromSyncQueueAction {
  type: EActionType.REMOVE_FROM_SYNC_QUEUE;
  itemId: number;
}

interface ISetSyncStatusAction {
  type: EActionType.SET_SYNC_STATUS;
  status: TSyncStatus;
}

interface ISetOfflineDataAction {
  type: EActionType.SET_OFFLINE_DATA;
  key: string;
  data: any;
}

interface IAddSyncErrorAction {
  type: EActionType.ADD_SYNC_ERROR;
  error: Error;
}

interface IClearSyncErrorsAction {
  type: EActionType.CLEAR_SYNC_ERRORS;
}

type TOfflineAction =
  | ISetOfflineAction
  | IAddPendingActionAction
  | IRemovePendingActionAction
  | IAddToSyncQueueAction
  | IRemoveFromSyncQueueAction
  | ISetSyncStatusAction
  | ISetOfflineDataAction
  | IAddSyncErrorAction
  | IClearSyncErrorsAction;

// Define state interface
interface IOfflineState {
  isOffline: boolean;
  pendingActions: IPendingAction[];
  syncQueue: ISyncQueueItem[];
  lastSync: string | null;
  syncStatus: TSyncStatus;
  offlineData: Record<string, any>;
  syncErrors: Error[];
}

// Define context interface
interface IOfflineContextType extends IOfflineState {
  addPendingAction: (action: IPendingActionBase) => number;
  removePendingAction: (actionId: number) => void;
  addToSyncQueue: (item: ISyncQueueItemBase) => number;
  removeFromSyncQueue: (itemId: number) => void;
  setOfflineData: (key: string, data: any) => void;
  getOfflineData: (key: string) => any;
  syncPendingActions: () => Promise<void>;
}

// Initial state
const initialState: IOfflineState = {
  isOffline: !navigator.onLine,
  pendingActions: [],
  syncQueue: [],
  lastSync: null,
  syncStatus: 'idle',
  offlineData: {},
  syncErrors: [],
};

// Create context with a default undefined value that will be set in the provider
const OfflineContext = createContext<IOfflineContextType | undefined>(undefined);

// Offline reducer
const offlineReducer = (state: IOfflineState, action: TOfflineAction): IOfflineState => {
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

interface IOfflineProviderProps {
  children: ReactNode;
}

/**
 * Global offline context provider component
 */
export const OfflineProvider: React.FC<IOfflineProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(offlineReducer, initialState);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: EActionType.SET_OFFLINE, isOffline: false });
      // Attempt to sync when coming back online
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

  // Add action to pending queue
  const addPendingAction = useCallback((action: IPendingActionBase) => {
    const actionWithId: IPendingAction = {
      ...action,
      id: Date.now(),
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: EActionType.ADD_PENDING_ACTION, action: actionWithId });
    return actionWithId.id;
  }, []);

  // Remove action from pending queue
  const removePendingAction = useCallback((actionId: number) => {
    dispatch({ type: EActionType.REMOVE_PENDING_ACTION, actionId });
  }, []);

  // Add item to sync queue
  const addToSyncQueue = useCallback((item: ISyncQueueItemBase) => {
    const itemWithId: ISyncQueueItem = {
      ...item,
      id: Date.now(),
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: EActionType.ADD_TO_SYNC_QUEUE, item: itemWithId });
    return itemWithId.id;
  }, []);

  // Remove item from sync queue
  const removeFromSyncQueue = useCallback((itemId: number) => {
    dispatch({ type: EActionType.REMOVE_FROM_SYNC_QUEUE, itemId });
  }, []);

  // Set offline data
  const setOfflineData = useCallback((key: string, data: any) => {
    dispatch({ type: EActionType.SET_OFFLINE_DATA, key, data });
  }, []);

  // Get offline data
  const getOfflineData = useCallback(
    (key: string) => {
      return state.offlineData[key];
    },
    [state.offlineData]
  );

  // Synchronize pending actions
  const syncPendingActions = useCallback(async () => {
    if (state.pendingActions.length === 0 || state.isOffline || state.syncStatus === 'syncing') {
      return;
    }

    dispatch({ type: EActionType.SET_SYNC_STATUS, status: 'syncing' });
    dispatch({ type: EActionType.CLEAR_SYNC_ERRORS });

    try {
      // Process each pending action in order
      for (const action of [...state.pendingActions]) {
        try {
          await action.execute();
          dispatch({ type: EActionType.REMOVE_PENDING_ACTION, actionId: action.id });
        } catch (error) {
          console.error('Error executing pending action:', error);
          dispatch({
            type: EActionType.ADD_SYNC_ERROR,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      }

      dispatch({ type: EActionType.SET_SYNC_STATUS, status: 'idle' });
    } catch (error) {
      console.error('Error during sync process:', error);
      dispatch({
        type: EActionType.ADD_SYNC_ERROR,
        error: error instanceof Error ? error : new Error(String(error)),
      });
      dispatch({ type: EActionType.SET_SYNC_STATUS, status: 'error' });
    }
  }, [state.pendingActions, state.isOffline, state.syncStatus]);

  const contextValue: IOfflineContextType = {
    ...state,
    addPendingAction,
    removePendingAction,
    addToSyncQueue,
    removeFromSyncQueue,
    setOfflineData,
    getOfflineData,
    syncPendingActions,
  };

  return <OfflineContext.Provider value={contextValue}>{children}</OfflineContext.Provider>;
};

/**
 * Custom hook to use the offline context
 */
export const useOffline = (): IOfflineContextType => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

export default OfflineContext;
