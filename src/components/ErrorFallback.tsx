import React from 'react';

const ErrorFallback: React.FC = () => {
  return (
    <div className="p-4 max-w-md mx-auto mt-8 bg-red-50 rounded-lg border border-red-200">
      <h3 className="text-lg font-semibold text-red-600 mb-2">Map Loading Issue</h3>
      <p className="text-red-500 mb-4">Please check:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Location permissions in browser settings</li>
        <li>Internet connection</li>
        <li>Ad-blockers or security software</li>
      </ul>
      <button
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        onClick={() => window.location.reload()}
      >
        Reload Application
      </button>
    </div>
  );
};

export default ErrorFallback;
