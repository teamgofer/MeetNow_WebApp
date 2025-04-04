import React, { useState, useEffect } from 'react';
import { getCacheStats } from '../../utils/url-cache';
import { logCacheStats } from '../../utils/wasabi-storage';

/**
 * A development-only component that displays URL cache statistics
 * Note: Currently disabled as per user request
 */
const CacheMonitor: React.FC = () => {
  // Always return null to disable the component
  return null;

  // Original implementation (left for reference but never executed)
  /*
  const [stats, setStats] = useState({
    hits: 0,
    misses: 0,
    expired: 0
  });
  const [isVisible, setIsVisible] = useState(false);

  // Update stats every 2 seconds
  useEffect(() => {
    const updateStats = () => {
      setStats(getCacheStats());
    };
    
    const timer = setInterval(updateStats, 2000);
    updateStats(); // Initial update
    
    return () => clearInterval(timer);
  }, []);

  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const hitRate = stats.hits + stats.misses > 0 
    ? Math.round((stats.hits / (stats.hits + stats.misses)) * 100)
    : 0;
  
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    // Log full stats to console when expanded
    if (!isVisible) {
      logCacheStats();
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        zIndex: 1000,
        opacity: 0.8,
        backgroundColor: '#333',
        color: 'white',
        padding: isVisible ? '10px' : '5px',
        borderRadius: '5px',
        fontSize: '12px',
        fontFamily: 'monospace',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      }}
      onClick={toggleVisibility}
    >
      {isVisible ? (
        <>
          <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>URL Cache Stats</div>
          <div>Hits: {stats.hits}</div>
          <div>Misses: {stats.misses}</div>
          <div>Expired: {stats.expired}</div>
          <div>Hit Rate: {hitRate}%</div>
          <div 
            style={{ 
              backgroundColor: hitRate > 70 ? 'green' : hitRate > 40 ? 'orange' : 'red',
              height: '5px',
              width: `${hitRate}%`,
              marginTop: '5px',
              transition: 'width 0.5s ease'
            }} 
          />
        </>
      ) : (
        <div>Cache: {hitRate}%</div>
      )}
    </div>
  );
  */
};

export default CacheMonitor; 
 
 
 