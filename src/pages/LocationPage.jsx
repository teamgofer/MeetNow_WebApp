import React from 'react';

import LocationSearchExample from '../components/search/LocationSearchExample';

/**
 * Location page that demonstrates the LocationSearch component
 */
const LocationPage = () => {
  return (
    <div className="location-page">
      <header className="page-header">
        <h1>Location Search</h1>
        <p className="subtitle">Advanced location search with reverse geocoding functionality</p>
      </header>

      <main className="page-content">
        <LocationSearchExample />
      </main>

      <style jsx>{`
        .location-page {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
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
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 30px;
        }
      `}</style>
    </div>
  );
};

export default LocationPage;
