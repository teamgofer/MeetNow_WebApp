import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Logger from '../../utils/Logger';

/**
 * Debug console for monitoring map navigation and application state
 * Provides real-time debugging information and testing capabilities
 */
const DebugConsole = ({ 
  mapRef, 
  mapNavigator, 
  currentMode, 
  selectedLocation, 
  userLocation,
  onNavigationTest
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Subscribe to logger events
  useEffect(() => {
    const unsubscribe = Logger.subscribe((entry) => {
      if (!isVisible) return;
      
      addLog(`[${entry.levelName}] ${entry.component}: ${entry.message}`);
    });
    
    return unsubscribe;
  }, [isVisible]);
  
  // Log important state changes
  useEffect(() => {
    if (!isVisible) return;
    
    addLog(`Mode changed to: ${getModeLabel(currentMode)}`);
  }, [currentMode, isVisible]);
  
  useEffect(() => {
    if (!isVisible) return;
    
    if (selectedLocation) {
      addLog(`Selected location: [${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lng.toFixed(5)}]`);
    }
  }, [selectedLocation, isVisible]);
  
  const addLog = (message) => {
    const timestamp = new Date().toISOString().substr(11, 8);
    setLogs(prev => [...prev.slice(-99), `[${timestamp}] ${message}`]);
  };
  
  const getModeLabel = (mode) => {
    switch(mode) {
      case 1: return 'Free Navigation';
      case 2: return 'Bird\'s Eye View';
      case 3: return 'Vicinity Mode';
      default: return `Unknown (${mode})`;
    }
  };
  
  const runMapTest = () => {
    if (!mapRef.current || !selectedLocation) {
      addLog('Cannot run test: Map or location not available');
      return;
    }
    
    addLog('Running map navigation test...');
    
    try {
      const map = mapRef.current;
      const zoom = map.getZoom ? map.getZoom() : 15;
      
      try {
        addLog('Testing direct setView method');
        map.setView(
          [selectedLocation.lat, selectedLocation.lng], 
          zoom,
          { animate: true, duration: 0.5 }
        );
        addLog('Direct setView test: SUCCESS');
      } catch (e) {
        addLog(`Direct setView test: FAILED - ${e.message}`);
      }
      
      if (mapNavigator && typeof mapNavigator.navigateTo === 'function') {
        addLog('Testing navigator.navigateTo method');
        mapNavigator.navigateTo(selectedLocation, { mode: currentMode })
          .then(() => addLog('Navigator test: SUCCESS'))
          .catch(err => addLog(`Navigator test: FAILED - ${err.message}`));
      } else {
        addLog('Navigator test: FAILED - Navigator not available');
      }
      
      // Call custom test handler if provided
      if (onNavigationTest) {
        onNavigationTest(selectedLocation);
      }
    } catch (error) {
      addLog(`Test error: ${error.message}`);
    }
  };
  
  const clearLogs = () => {
    setLogs([]);
    addLog('Logs cleared');
  };
  
  const exportLogs = () => {
    Logger.exportLogs();
    addLog('Logs exported');
  };
  
  if (!isVisible) {
    return (
      <button 
        className="fixed bottom-4 left-4 bg-gray-800 text-white px-3 py-1 text-xs rounded z-50 opacity-50 hover:opacity-100"
        onClick={() => setIsVisible(true)}
      >
        Debug
      </button>
    );
  }
  
  return (
    <div 
      className={`fixed bottom-0 left-0 ${isExpanded ? 'w-1/2' : 'w-96'} ${isExpanded ? 'h-1/2' : 'h-96'} bg-gray-900 text-white z-50 overflow-hidden flex flex-col rounded-tr-lg shadow-2xl`}
    >
      <div className="flex justify-between p-2 bg-gray-800 items-center">
        <h3 className="text-sm font-bold">MeetNow Debug Console</h3>
        <div className="space-x-2">
          <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs px-2 py-1 bg-gray-700 rounded">
            {isExpanded ? 'Shrink' : 'Expand'}
          </button>
          <button onClick={() => setIsVisible(false)} className="text-xs px-2 py-1 bg-red-800 rounded">
            Close
          </button>
        </div>
      </div>
      
      <div className="p-2 space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-bold">Current Mode:</span> {getModeLabel(currentMode)}
          </div>
          <div>
            <span className="font-bold">Map Instance:</span> {mapRef.current ? 'Available' : 'Not Available'}
          </div>
          <div>
            <span className="font-bold">Navigator:</span> {mapNavigator ? 'Available' : 'Not Available'}
          </div>
          <div>
            <span className="font-bold">User Location:</span> {userLocation ? `[${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}]` : 'None'}
          </div>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={runMapTest}
            className="bg-blue-700 px-2 py-1 rounded text-xs"
            disabled={!selectedLocation}
          >
            Test Map Navigation
          </button>
          <button 
            onClick={clearLogs}
            className="bg-gray-700 px-2 py-1 rounded text-xs"
          >
            Clear Logs
          </button>
          <button 
            onClick={exportLogs}
            className="bg-green-700 px-2 py-1 rounded text-xs"
          >
            Export Logs
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-black p-2 overflow-auto">
        <pre className="text-xs text-green-400 font-mono">
          {logs.join('\n')}
        </pre>
      </div>
    </div>
  );
};

DebugConsole.propTypes = {
  mapRef: PropTypes.object,
  mapNavigator: PropTypes.object,
  currentMode: PropTypes.number,
  selectedLocation: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number
  }),
  userLocation: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number
  }),
  onNavigationTest: PropTypes.func
};

export default DebugConsole; 