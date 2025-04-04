import React, { useState } from 'react';

import LocationSearch from './LocationSearch';
import './LocationSearchExample.css';

/**
 * Example component that demonstrates how to use the LocationSearch component
 */
const LocationSearchExample = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleLocationSelect = location => {
    setSelectedLocation(location);
    console.log('Selected location:', location);
  };

  return (
    <div className="location-search-example">
      <h2>Location Search Demo</h2>

      <div className="search-container">
        <LocationSearch
          onLocationSelect={handleLocationSelect}
          placeholder="Search for an address or place"
          showCurrentLocation={true}
          autoFocus={true}
        />
      </div>

      {selectedLocation && (
        <div className="selected-location-info">
          <h3>Selected Location</h3>

          <div className="location-details">
            <p>
              <strong>Name:</strong> {selectedLocation.name || selectedLocation.display_name}
            </p>

            <p>
              <strong>Address:</strong> {selectedLocation.display_name}
            </p>

            <p>
              <strong>Coordinates:</strong> {selectedLocation.lat}, {selectedLocation.lon}
            </p>

            {selectedLocation.address && (
              <div className="address-components">
                <h4>Address Components</h4>
                <ul>
                  {Object.entries(selectedLocation.address).map(([key, value]) => (
                    <li key={key}>
                      <strong>{key}:</strong> {value}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="location-actions">
            <button
              className="location-action-button"
              onClick={() => {
                // Example of using the coordinates for navigation
                const mapUrl = `https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lon}`;
                window.open(mapUrl, '_blank');
              }}
            >
              Open in Google Maps
            </button>

            <button
              className="location-action-button secondary"
              onClick={() => setSelectedLocation(null)}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSearchExample;
