import React from 'react';

const Loading = () => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        <p className="text-gray-600 font-medium">Loading application...</p>
      </div>
    </div>
  );
};

export default Loading;