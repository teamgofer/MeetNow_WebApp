import React, { useState } from 'react';

import withErrorHandling from '../../hocs/withErrorHandling';

const ExampleComponent = ({ withErrorBoundary, isProcessing }) => {
  const [data, setData] = useState(null);

  const fetchData = async () => {
    // Simulate an API call that might fail
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (Math.random() > 0.5) {
      throw new Error('Failed to fetch data. Please try again.');
    }

    return { message: 'Data fetched successfully!' };
  };

  const handleFetch = async () => {
    try {
      const result = await withErrorBoundary(fetchData, {
        retry: true,
        showLoading: true,
      });
      setData(result);
    } catch (error) {
      // Error is already handled by withErrorBoundary
      console.error('Operation failed:', error);
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={handleFetch}
        disabled={isProcessing}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Fetching...' : 'Fetch Data'}
      </button>

      {data && <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">{data.message}</div>}
    </div>
  );
};

// Wrap the component with error handling
const ExampleWithErrorHandling = withErrorHandling(ExampleComponent, {
  withRetry: true,
  withLoading: true,
  withOffline: true,
});

export default ExampleWithErrorHandling;
