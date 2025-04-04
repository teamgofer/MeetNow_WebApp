import { useState, useEffect } from 'react';
import logger from '../utils/Logger';
const useOnlineStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [networkType, setNetworkType] = useState(navigator.connection?.type ?? 'unknown');
    const [effectiveType, setEffectiveType] = useState(navigator.connection?.effectiveType ?? 'unknown');
    const [rtt, setRtt] = useState(navigator.connection?.rtt ?? 0);
    const [downlink, setDownlink] = useState(navigator.connection?.downlink ?? 0);
    const [saveData, setSaveData] = useState(navigator.connection?.saveData ?? false);
    const [lastSeen, setLastSeen] = useState(null);
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
        logger.info('Network', 'Initial online status', { isOnline: navigator.onLine });
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            logger.debug('Network', 'Online status listeners removed');
        };
    }, []);
    useEffect(() => {
        if (!navigator.connection)
            return;
        const handleConnectionChange = () => {
            const connection = navigator.connection;
            if (!connection)
                return;
            setNetworkType(connection.type);
            setEffectiveType(connection.effectiveType);
            setRtt(connection.rtt);
            setDownlink(connection.downlink);
            setSaveData(connection.saveData);
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
    const isSlowNetwork = () => {
        return effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g';
    };
    const isFastNetwork = () => {
        return effectiveType === '4g' || effectiveType === '5g';
    };
    const getNetworkQualityScore = () => {
        if (!isOnline)
            return 0;
        const rttScore = Math.max(0, 100 - rtt / 100);
        const downlinkScore = Math.min(100, (downlink / 10) * 100);
        return Math.round((rttScore + downlinkScore) / 2);
    };
    const getNetworkStatus = () => {
        if (!isOnline)
            return 'Offline';
        if (isSlowNetwork())
            return 'Slow Connection';
        if (isFastNetwork())
            return 'Fast Connection';
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
//# sourceMappingURL=useOnlineStatus.js.map