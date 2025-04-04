import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import { FaCloud, FaCloudSlash, FaSync } from 'react-icons/fa';

import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { handleNetworkError } from '../../utils/error-handler';

/**
 * Component to handle offline mode and data persistence
 */
const OfflineManager = ({ onSync, onOffline, onOnline, className = '', children }) => {
  const { isOnline, getNetworkQualityScore } = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Handle online/offline transitions
  useEffect(() => {
    if (isOnline) {
      onOnline?.();
      // Attempt to sync pending changes when coming back online
      if (pendingChanges.length > 0) {
        syncPendingChanges();
      }
    } else {
      onOffline?.();
      handleNetworkError(new Error('Network connection lost'), { isOffline: true });
    }
  }, [isOnline, onOnline, onOffline, pendingChanges]);

  // Sync pending changes when network quality improves
  useEffect(() => {
    if (isOnline && getNetworkQualityScore() > 70 && pendingChanges.length > 0) {
      syncPendingChanges();
    }
  }, [isOnline, getNetworkQualityScore, pendingChanges]);

  // Add a change to pending changes
  const addPendingChange = change => {
    setPendingChanges(prev => [
      ...prev,
      {
        ...change,
        timestamp: Date.now(),
        id: Math.random().toString(36).substr(2, 9),
      },
    ]);
  };

  // Sync pending changes with the server
  const syncPendingChanges = async () => {
    if (isSyncing || pendingChanges.length === 0) return;

    setIsSyncing(true);
    try {
      // Group changes by type for efficient syncing
      const changesByType = pendingChanges.reduce((acc, change) => {
        if (!acc[change.type]) {
          acc[change.type] = [];
        }
        acc[change.type].push(change);
        return acc;
      }, {});

      // Sync each type of change
      for (const [type, changes] of Object.entries(changesByType)) {
        await onSync?.(type, changes);
      }

      // Clear synced changes
      setPendingChanges([]);
      setLastSyncTime(Date.now());
    } catch (error) {
      console.error('Failed to sync changes:', error);
      // Keep failed changes in the queue
      setPendingChanges(prev =>
        prev.filter(change => !changesByType[change.type]?.some(synced => synced.id === change.id))
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Get sync status message
  const getSyncStatus = () => {
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Syncing...';
    if (pendingChanges.length > 0) return `${pendingChanges.length} pending changes`;
    if (lastSyncTime) return `Last synced: ${new Date(lastSyncTime).toLocaleTimeString()}`;
    return 'Up to date';
  };

  // Get sync status color
  const getSyncStatusColor = () => {
    if (!isOnline) return 'text-red-500';
    if (isSyncing) return 'text-blue-500';
    if (pendingChanges.length > 0) return 'text-yellow-500';
    return 'text-green-500';
  };

  // Get sync status icon
  const getSyncStatusIcon = () => {
    if (!isOnline) return <FaCloudSlash className="w-5 h-5" />;
    if (isSyncing) return <FaSync className="w-5 h-5 animate-spin" />;
    return <FaCloud className="w-5 h-5" />;
  };

  return (
    <div className={className}>
      {/* Sync status indicator */}
      <div className={`flex items-center space-x-2 ${getSyncStatusColor()}`}>
        {getSyncStatusIcon()}
        <span className="text-sm font-medium">{getSyncStatus()}</span>
      </div>

      {/* Render children with sync context */}
      {React.Children.map(children, child =>
        React.isValidElement(child)
          ? React.cloneElement(child, {
              addPendingChange,
              isOnline,
              isSyncing,
              pendingChangesCount: pendingChanges.length,
            })
          : child
      )}
    </div>
  );
};

OfflineManager.propTypes = {
  onSync: PropTypes.func,
  onOffline: PropTypes.func,
  onOnline: PropTypes.func,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default OfflineManager;
