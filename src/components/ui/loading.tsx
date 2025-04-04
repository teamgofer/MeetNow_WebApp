import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ILoadingProps {
  text?: string;
  className?: string;
}

const Loading: React.FC<ILoadingProps> = ({ text = 'Loading...', className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <LoadingSpinner size="large" color="blue" />
      {text && <p className="mt-2 text-gray-600 text-sm">{text}</p>}
    </div>
  );
};

export default Loading;
