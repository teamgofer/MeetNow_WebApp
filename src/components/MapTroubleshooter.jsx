import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaExclamationTriangle, FaInfoCircle, FaQuestionCircle } from 'react-icons/fa';

const MapTroubleshooter = ({ onClose }) => {
  const browser = getBrowserName();
  const isSecureContext = window.isSecureContext;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Map Loading Troubleshooter</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-md">
              <h3 className="font-semibold mb-2">1. Location Permissions</h3>
              <p className="text-sm">{getLocationPermissionMessage()}</p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-md">
              <h3 className="font-semibold mb-2">2. Internet Connection</h3>
              <p className="text-sm">{getInternetConnectionMessage()}</p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-md">
              <h3 className="font-semibold mb-2">3. Ad Blockers & Security Software</h3>
              <p className="text-sm">{getAdBlockersMessage()}</p>
            </div>
            
            <div className="mt-6">
              <h3 className="font-semibold mb-2">How to Fix:</h3>
              {getFixInstructions()}
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


MapTroubleshooter.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default MapTroubleshooter;