import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef } from 'react';

import logger from '../../utils/Logger';

/**
 * Debug console for monitoring map navigation and application state
 * Provides real-time debugging information and testing capabilities
 */
const DebugConsole = ({
  isVisible = true,
  className = '',
  mapRef,
  mapNavigator,
  userLocation,
  selectedLocation,
  onNavigationTest,
}) => {
  const [logs, setLogs] = useState([]);
  const consoleRef = useRef(null);

  const addLog = message => {
    const timestamp = new Date().toISOString().substr(11, 8);
    setLogs(prev => [...prev.slice(-99), `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    if (!isVisible) return;

    const unsubscribe = logger.subscribe(entry => {
      if (!isVisible) return;
      addLog(`[${entry.levelName}] ${entry.component}: ${entry.message}`);
    });

    return () => {
      unsubscribe();
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    if (selectedLocation) {
      addLog(
        `Selected location: [${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lng.toFixed(5)}]`
      );
    }
  }, [selectedLocation, isVisible]);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

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
        map.setView([selectedLocation.lat, selectedLocation.lng], zoom, {
          animate: true,
          duration: 0.5,
        });
        addLog('Direct setView test: SUCCESS');
      } catch (error) {
        addLog(`Direct setView test: FAILED - ${error.message}`);
      }

      if (mapNavigator) {
        try {
          addLog('Testing navigation controller');
          mapNavigator.navigateTo(selectedLocation, { zoom, animate: true });
          addLog('Navigation controller test: SUCCESS');
        } catch (error) {
          addLog(`Navigation controller test: FAILED - ${error.message}`);
        }
      }
    } catch (error) {
      addLog(`Map test failed: ${error.message}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const logText = logs.join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-0 right-0 w-96 h-64 bg-gray-900 text-white p-4 ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Debug Console</h3>
        <div className="flex space-x-2">
          <button
            onClick={clearLogs}
            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Clear
          </button>
          <button
            onClick={exportLogs}
            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Export
          </button>
        </div>
      </div>
      <div ref={consoleRef} className="h-[calc(100%-2rem)] overflow-y-auto font-mono text-xs">
        {logs.map((log, index) => (
          <div key={index} className="whitespace-pre-wrap">
            {log}
          </div>
        ))}
      </div>
      <div className="absolute bottom-4 right-4 flex space-x-2">
        <button
          onClick={runMapTest}
          className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded"
        >
          Test Navigation
        </button>
      </div>
    </div>
  );
};

DebugConsole.propTypes = {
  isVisible: PropTypes.bool,
  className: PropTypes.string,
  mapRef: PropTypes.object,
  mapNavigator: PropTypes.object,
  userLocation: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
  selectedLocation: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
  onNavigationTest: PropTypes.func,
};

export default DebugConsole;
