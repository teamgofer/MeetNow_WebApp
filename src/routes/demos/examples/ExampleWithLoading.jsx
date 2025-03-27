import React, { useState } from 'react';
import withLoading from '../../hocs/withLoading';
import LoadingState from '../ui/LoadingState';

const ExampleComponent = ({ isLoading, startLoading, stopLoading }) => {
  const [data, setData] = useState(null);

  const fetchData = async () => {
    startLoading();
    try {
      // Simulate an API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setData({ message: 'Data loaded successfully!' });
    } finally {
      stopLoading();
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={fetchData}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Loading...' : 'Load Data'}
      </button>

      {isLoading && (
        <div className="mt-4">
          <LoadingState message="Loading data..." />
        </div>
      )}

      {data && !isLoading && (
        <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">
          {data.message}
        </div>
      )}
    </div>
  );
};

// Wrap the component with loading state
const ExampleWithLoading = withLoading(ExampleComponent, {
  loaderId: 'example-loader',
  autoStart: false,
  showLoading: true
});

export default ExampleWithLoading; 