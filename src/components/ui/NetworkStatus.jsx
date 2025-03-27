import React from 'react';
import PropTypes from 'prop-types';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { FaWifi, FaWifiSlash, FaTachometerAlt } from 'react-icons/fa';

/**
 * Network status component that displays current network state and quality
 */
const NetworkStatus = ({ 
  className = '',
  showDetails = false,
  onStatusChange
}) => {
  const {
    isOnline,
    networkType,
    effectiveType,
    rtt,
    downlink,
    saveData,
    getNetworkQualityScore,
    getNetworkStatus
  } = useOnlineStatus();

  // Notify parent component of status changes
  React.useEffect(() => {
    if (onStatusChange) {
      onStatusChange({
        isOnline,
        networkType,
        effectiveType,
        qualityScore: getNetworkQualityScore(),
        status: getNetworkStatus()
      });
    }
  }, [isOnline, networkType, effectiveType, getNetworkQualityScore, getNetworkStatus, onStatusChange]);

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500';
    if (effectiveType === '4g' || effectiveType === '5g') return 'text-green-500';
    if (effectiveType === '3g') return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <FaWifiSlash className="w-5 h-5" />;
    return <FaWifi className="w-5 h-5" />;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`${getStatusColor()}`}>
        {getStatusIcon()}
      </div>
      
      <div className="flex flex-col">
        <span className="text-sm font-medium">
          {getNetworkStatus()}
        </span>
        
        {showDetails && isOnline && (
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <FaTachometerAlt className="w-3 h-3" />
            <span>{Math.round(downlink)} Mbps</span>
            <span>•</span>
            <span>{rtt}ms RTT</span>
            {saveData && (
              <>
                <span>•</span>
                <span>Data Saver</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

NetworkStatus.propTypes = {
  className: PropTypes.string,
  showDetails: PropTypes.bool,
  onStatusChange: PropTypes.func
};

export default NetworkStatus; 