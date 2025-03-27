import React, { useState } from 'react';
import { isFeatureEnabled } from '../../config/featureFlags';

/**
 * DebugMenu component for development tools
 * Only shown in development mode or when debugMode is enabled
 */
const DebugMenu = ({ onShowPerformanceDashboard }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Hide in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && !isFeatureEnabled('DEBUG_MODE')) {
    return null;
  }
  
  return (
    <div className="debug-menu">
      {/* Toggle button */}
      <button
        className="debug-menu-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle debug menu"
      >
        {isOpen ? 'X' : '⚙️'}
      </button>
      
      {/* Menu content */}
      {isOpen && (
        <div className="debug-menu-content">
          <h3>Development Tools</h3>
          
          <div className="debug-menu-section">
            <h4>Performance</h4>
            <button 
              className="debug-button"
              onClick={onShowPerformanceDashboard}
            >
              Performance Dashboard
            </button>
          </div>
          
          <div className="debug-menu-section">
            <h4>Component Extraction</h4>
            <button 
              className="debug-button"
              onClick={() => window.open('/extraction-report', '_blank')}
            >
              Extraction Report
            </button>
          </div>
          
          <div className="debug-menu-section">
            <h4>Feature Flags</h4>
            <div className="feature-flag-toggles">
              {Object.keys(localStorage)
                .filter(key => key.startsWith('feature_'))
                .map(key => {
                  const flagName = key.replace('feature_', '');
                  const isEnabled = localStorage.getItem(key) === 'true';
                  
                  return (
                    <div key={key} className="feature-flag-item">
                      <label>
                        <input 
                          type="checkbox" 
                          checked={isEnabled}
                          onChange={e => {
                            localStorage.setItem(key, e.target.checked ? 'true' : 'false');
                            // Force refresh to apply changes
                            window.location.reload();
                          }}
                        />
                        <span>{flagName}</span>
                      </label>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
      
      {/* Styles */}
      <style jsx="true">{`
        .debug-menu {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9999;
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .debug-menu-toggle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: #333;
          color: white;
          border: none;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }
        
        .debug-menu-content {
          position: absolute;
          bottom: 50px;
          right: 0;
          width: 300px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
          padding: 16px;
          border: 1px solid #eee;
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .debug-menu-content h3 {
          margin-top: 0;
          margin-bottom: 12px;
          font-size: 16px;
          color: #333;
          border-bottom: 1px solid #eee;
          padding-bottom: 8px;
        }
        
        .debug-menu-section {
          margin-bottom: 16px;
        }
        
        .debug-menu-section h4 {
          margin-top: 0;
          margin-bottom: 8px;
          font-size: 14px;
          color: #555;
        }
        
        .debug-button {
          background-color: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 6px 12px;
          font-size: 13px;
          cursor: pointer;
          margin-right: 8px;
          margin-bottom: 8px;
        }
        
        .debug-button:hover {
          background-color: #e0e0e0;
        }
        
        .feature-flag-toggles {
          max-height: 200px;
          overflow-y: auto;
          font-size: 13px;
        }
        
        .feature-flag-item {
          margin-bottom: 6px;
        }
        
        .feature-flag-item label {
          display: flex;
          align-items: center;
          cursor: pointer;
        }
        
        .feature-flag-item input {
          margin-right: 8px;
        }
      `}</style>
    </div>
  );
};

export default DebugMenu; 