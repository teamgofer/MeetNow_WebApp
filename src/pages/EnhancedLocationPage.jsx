import React, { useState } from 'react';
import LocationSearchEnhanced from '../components/search/LocationSearchEnhanced';

/**
 * Enhanced location search page with recent and saved locations
 */
const EnhancedLocationPage = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    console.log('Selected location:', location);
  };

  return (
    <div className="enhanced-location-page">
      <header className="page-header">
        <h1>Enhanced Location Search</h1>
        <p className="subtitle">
          Search with recent history, saved locations, and animations
        </p>
      </header>
      
      <main className="page-content">
        <div className="search-container">
          <LocationSearchEnhanced 
            onLocationSelect={handleLocationSelect}
            placeholder="Search for a location or address"
            showCurrentLocation={true}
            autoFocus={true}
            showRecentLocations={true}
          />
        </div>
        
        {selectedLocation && (
          <div className="selected-location-card">
            <h2>Selected Location</h2>
            
            <div className="location-map">
              <img 
                src={`https://maps.googleapis.com/maps/api/staticmap?center=${selectedLocation.lat},${selectedLocation.lon}&zoom=14&size=600x300&maptype=roadmap&markers=color:red%7C${selectedLocation.lat},${selectedLocation.lon}&key=YOUR_API_KEY`}
                alt={`Map of ${selectedLocation.display_name}`}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/600x300?text=Map+Preview+Unavailable';
                }}
              />
            </div>
            
            <div className="location-details">
              <div className="detail-row">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{selectedLocation.name || selectedLocation.display_name}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Address:</span>
                <span className="detail-value">{selectedLocation.display_name}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Coordinates:</span>
                <span className="detail-value">
                  {selectedLocation.lat}, {selectedLocation.lon}
                </span>
              </div>
              
              {selectedLocation.address && (
                <div className="address-details">
                  <h3>Address Components</h3>
                  <div className="address-components">
                    {Object.entries(selectedLocation.address).map(([key, value]) => (
                      <div key={key} className="address-component">
                        <span className="component-label">{key}</span>
                        <span className="component-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      <style jsx>{`
        .enhanced-location-page {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .page-header {
          margin-bottom: 40px;
          text-align: center;
        }
        
        h1 {
          font-size: 36px;
          color: #333;
          margin-bottom: 10px;
        }
        
        .subtitle {
          font-size: 18px;
          color: #666;
        }
        
        .page-content {
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
        }
        
        .search-container {
          max-width: 500px;
          margin: 0 auto;
          width: 100%;
        }
        
        .selected-location-card {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          padding: 24px;
          animation: fadeIn 0.4s ease;
        }
        
        .selected-location-card h2 {
          margin-top: 0;
          margin-bottom: 24px;
          font-size: 24px;
          color: #333;
        }
        
        .location-map {
          margin-bottom: 24px;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .location-map img {
          width: 100%;
          height: auto;
          display: block;
        }
        
        .detail-row {
          margin-bottom: 16px;
        }
        
        .detail-label {
          font-weight: 600;
          color: #4b5563;
          margin-right: 8px;
          min-width: 100px;
          display: inline-block;
        }
        
        .address-details {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #eee;
        }
        
        .address-details h3 {
          margin-top: 0;
          margin-bottom: 16px;
          font-size: 18px;
          color: #4b5563;
        }
        
        .address-components {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }
        
        .address-component {
          display: flex;
          flex-direction: column;
        }
        
        .component-label {
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          text-transform: capitalize;
          margin-bottom: 4px;
        }
        
        .component-value {
          font-size: 16px;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @media (max-width: 768px) {
          .page-content {
            grid-template-columns: 1fr;
          }
          
          .detail-label {
            min-width: 80px;
          }
          
          .address-components {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedLocationPage; 