import React from 'react';
import PropTypes from 'prop-types';
import { FaMapMarkerAlt, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

const LocationPermissionModal = ({ isOpen, onClose, permissionStatus, onRequestPermission }) => {
  if (!isOpen) return null;

  const getStatusContent = () => {
    switch (permissionStatus) {
      case 'granted':
        return (
          <div className="text-center p-4">
            <FaCheckCircle className="mx-auto text-green-500 text-4xl mb-4" />
            <h3 className="text-xl font-semibold text-green-600 mb-2">Location Access Granted</h3>
            <p className="mb-4">Thank you! We can now show you relevant meetups in your area.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Continue
            </button>
          </div>
        );
      case 'denied':
        return (
          <div className="text-center p-4">
            <FaExclamationTriangle className="mx-auto text-yellow-500 text-4xl mb-4" />
            <h3 className="text-xl font-semibold text-yellow-600 mb-2">Location Access Denied</h3>
            <p className="mb-4">Please enable location access in your browser settings to get the most out of MeetNow.</p>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left">
              <h4 className="font-semibold mb-2">How to enable location access:</h4>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li><strong>Chrome:</strong> Settings → Privacy and Security → Site Settings → Location</li>
                <li><strong>Firefox:</strong> Options → Privacy & Security → Permissions → Location</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Location Services</li>
                <li><strong>Edge:</strong> Settings → Site Permissions → Location</li>
              </ul>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Use Manual Location
              </button>
              <button
                onClick={() => {
                  onRequestPermission();
                  onClose();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        );
      case 'prompt':
      default:
        return (
          <div className="text-center p-4">
            <FaMapMarkerAlt className="mx-auto text-blue-500 text-4xl mb-4" />
            <h3 className="text-xl font-semibold mb-2">Allow Location Access</h3>
            <p className="mb-6">MeetNow needs your location to show you nearby meetups and help others find you.</p>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
              <h4 className="font-semibold mb-2">Why we need your location:</h4>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>Find meetups happening near you</li>
                <li>Show your location on the map to other users</li>
                <li>Calculate distances to nearby events</li>
                <li>Provide accurate directions</li>
              </ul>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Not Now
              </button>
              <button
                onClick={onRequestPermission}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Allow Location Access
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        {getStatusContent()}
      </div>
    </div>
  );
};

LocationPermissionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  permissionStatus: PropTypes.oneOf(['prompt', 'granted', 'denied', 'unavailable']).isRequired,
  onRequestPermission: PropTypes.func.isRequired
};

export default LocationPermissionModal;