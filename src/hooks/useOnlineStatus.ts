import { useState, useEffect } from 'react';

import logger from '../utils/Logger';

interface IOnlineStatus {
  isOnline: boolean;
  networkType: string;
  effectiveType: string;
  rtt: number;
  downlink: number;
  saveData: boolean;
  isSlowNetwork: () => boolean;
  isFastNetwork: () => boolean;
  getNetworkQualityScore: () => number;
  getNetworkStatus: () => string;
  lastSeen: Date | null;
}

/**
 * Custom hook for handling online/offline status and network connectivity
 * @returns {OnlineStatus} Object containing online status and network information
 */
const useOnlineStatus = (): OnlineStatus => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [networkType, setNetworkType] = useState<string>(navigator.connection?.type ?? 'unknown');
  const [effectiveType, setEffectiveType] = useState<string>(
    navigator.connection?.effectiveType ?? 'unknown'
  );
  const [rtt, setRtt] = useState<number>(navigator.connection?.rtt ?? 0);
  const [downlink, setDownlink] = useState<number>(navigator.connection?.downlink ?? 0);
  const [saveData, setSaveData] = useState<boolean>(navigator.connection?.saveData ?? false);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastSeen(new Date());
      logger.info('Network', 'Device is now online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastSeen(new Date());
      logger.warn('Network', 'Device is now offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Log initial status
    logger.info('Network', 'Initial online status', { isOnline: navigator.onLine });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      logger.debug('Network', 'Online status listeners removed');
    };
  }, []);

  // Handle network information changes
  useEffect(() => {
    if (!navigator.connection) return;

    const handleConnectionChange = () => {
      const connection = navigator.connection;
      if (!connection) return;

      setNetworkType(connection.type);
      setEffectiveType(connection.effectiveType);
      setRtt(connection.rtt);
      setDownlink(connection.downlink);
      setSaveData(connection.saveData);

      // Log significant network changes
      if (connection.type !== networkType ?? connection.effectiveType !== effectiveType) {
        logger.info('Network', 'Network connection changed', {
          type: connection.type,
          effectiveType: connection.effectiveType,
          rtt: connection.rtt,
          downlink: connection.downlink,
        });
      }
    };

    navigator.connection.addEventListener('change', handleConnectionChange);

    return () => {
      navigator.connection?.removeEventListener('change', handleConnectionChange);
    };
  }, [networkType, effectiveType]);

  // Helper function to check if network is slow
  const isSlowNetwork = (): boolean => {
    return effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g';
  };

  // Helper function to check if network is fast
  const isFastNetwork = (): boolean => {
    return effectiveType === '4g' || effectiveType === '5g';
  };

  // Helper function to get network quality score (0-100)
  const getNetworkQualityScore = (): number => {
    if (!isOnline) return 0;

    const rttScore = Math.max(0, 100 - rtt / 100);
    const downlinkScore = Math.min(100, (downlink / 10) * 100);

    return Math.round((rttScore + downlinkScore) / 2);
  };

  // Helper function to get network status description
  const getNetworkStatus = (): string => {
    if (!isOnline) return 'Offline';

    if (isSlowNetwork()) return 'Slow Connection';
    if (isFastNetwork()) return 'Fast Connection';

    return 'Normal Connection';
  };

  return {
    isOnline,
    networkType,
    effectiveType,
    rtt,
    downlink,
    saveData,
    isSlowNetwork,
    isFastNetwork,
    getNetworkQualityScore,
    getNetworkStatus,
    lastSeen,
  };
};

export default useOnlineStatus;
