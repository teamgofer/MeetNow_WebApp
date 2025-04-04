import React, { useState, useEffect } from 'react';

import withOfflineSupport from '../../hocs/withOfflineSupport';
import OfflineManager from '../ui/OfflineManager';

const ExampleComponent = ({ isOffline, withOfflineOperation }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      // Simulate an API call
      const result = await withOfflineOperation(
        async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return { message: 'Data fetched successfully!' };
        },
        {
          cache: true,
          key: 'example-data',
          sync: true,
        }
      );
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
      setData(null);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <OfflineManager />
      </div>

      <button
        onClick={fetchData}
        disabled={isOffline}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isOffline ? 'Offline - Using Cached Data' : 'Fetch Data'}
      </button>

      {error && <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}

      {data && <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">{data.message}</div>}
    </div>
  );
};

// Wrap the component with offline support
const ExampleWithOfflineSupport = withOfflineSupport(ExampleComponent, {
  requireOnline: false,
  cacheData: true,
});

export default ExampleWithOfflineSupport;
