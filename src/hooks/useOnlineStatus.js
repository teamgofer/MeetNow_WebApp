import { useState, useEffect } from 'react';
import logger from '../utils/Logger';

/**
 * Custom hook for handling online/offline status and network connectivity
 * @returns {Object} Object containing online status and network information
 */
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkType, setNetworkType] = useState(navigator.connection?.type || 'unknown');
  const [effectiveType, setEffectiveType] = useState(navigator.connection?.effectiveType || 'unknown');
  const [rtt, setRtt] = useState(navigator.connection?.rtt || 0);
  const [downlink, setDownlink] = useState(navigator.connection?.downlink || 0);
  const [saveData, setSaveData] = useState(navigator.connection?.saveData || false);
  const [lastSeen, setLastSeen] = useState(null);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastSeen(new Date());
      logger.info('Device is now online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastSeen(new Date());
      logger.warn('Device is now offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Log initial status
    logger.info('Initial online status', { isOnline: navigator.onLine });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      logger.debug('Online status listeners removed');
    };
  }, []);

  // Handle network information changes
  useEffect(() => {
    if (!navigator.connection) return;

    const handleConnectionChange = () => {
      const connection = navigator.connection;
      setNetworkType(connection.type);
      setEffectiveType(connection.effectiveType);
      setRtt(connection.rtt);
      setDownlink(connection.downlink);
      setSaveData(connection.saveData);

      // Log significant network changes
      if (connection.type !== networkType || connection.effectiveType !== effectiveType) {
        console.log('Network connection changed:', {
          type: connection.type,
          effectiveType: connection.effectiveType,
          rtt: connection.rtt,
          downlink: connection.downlink
        });
      }
    };

    navigator.connection.addEventListener('change', handleConnectionChange);

    return () => {
      navigator.connection.removeEventListener('change', handleConnectionChange);
    };
  }, [networkType, effectiveType]);

  // Helper function to check if network is slow
  const isSlowNetwork = () => {
    return effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g';
  };

  // Helper function to check if network is fast
  const isFastNetwork = () => {
    return effectiveType === '4g' || effectiveType === '5g';
  };

  // Helper function to get network quality score (0-100)
  const getNetworkQualityScore = () => {
    if (!isOnline) return 0;
    
    const rttScore = Math.max(0, 100 - (rtt / 100));
    const downlinkScore = Math.min(100, (downlink / 10) * 100);
    
    return Math.round((rttScore + downlinkScore) / 2);
  };

  // Helper function to get network status description
  const getNetworkStatus = () => {
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
    lastSeen
  };
};

export default useOnlineStatus; 
}; 
}; 