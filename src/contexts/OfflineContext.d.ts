import type { ReactNode } from 'react';
import React from 'react';
type TSyncStatus = 'idle' | 'syncing' | 'error';
interface IPendingActionBase {
    execute: () => Promise<void>;
    [key: string]: any;
}
interface IPendingAction extends IPendingActionBase {
    id: number;
    timestamp: string;
}
interface ISyncQueueItemBase {
    [key: string]: any;
}
interface ISyncQueueItem extends ISyncQueueItemBase {
    id: number;
    timestamp: string;
}
interface IOfflineState {
    isOffline: boolean;
    pendingActions: IPendingAction[];
    syncQueue: ISyncQueueItem[];
    lastSync: string | null;
    syncStatus: TSyncStatus;
    offlineData: Record<string, any>;
    syncErrors: Error[];
}
interface IOfflineContextType extends IOfflineState {
    addPendingAction: (action: IPendingActionBase) => number;
    removePendingAction: (actionId: number) => void;
    addToSyncQueue: (item: ISyncQueueItemBase) => number;
    removeFromSyncQueue: (itemId: number) => void;
    setOfflineData: (key: string, data: any) => void;
    getOfflineData: (key: string) => any;
    syncPendingActions: () => Promise<void>;
}
declare const OfflineContext: React.Context<IOfflineContextType | undefined>;
interface IOfflineProviderProps {
    children: ReactNode;
}
export declare const OfflineProvider: React.FC<IOfflineProviderProps>;
export declare const useOffline: () => IOfflineContextType;
export default OfflineContext;
