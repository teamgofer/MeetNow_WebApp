import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

/**
 * A simple loading spinner component
 */
const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'text-blue-500',
  className = '',
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div
      className={`${sizeClasses[size]} ${color} ${className} rounded-full border-solid border-t-transparent animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );
};

export default Spinner;
