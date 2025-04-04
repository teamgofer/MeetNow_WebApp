import React, { useState, useEffect } from 'react';
import { FaSpinner } from 'react-icons/fa';

interface ILoadingStateProps {
  isLoading: boolean;
  children?: React.ReactNode;
  className?: string;
  overlay?: boolean;
  spinner?: boolean;
  text?: string;
  delay?: number;
  fade?: boolean;
}

/**
 * Component to handle loading states and transitions
 */
const LoadingState: React.FC<ILoadingStateProps> = ({
  isLoading,
  children,
  className = '',
  overlay = false,
  spinner = true,
  text = 'Loading...',
  delay = 300,
  fade = true,
}) => {
  const [show, setShow] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Handle loading state changes with delay
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (isLoading) {
      timeout = setTimeout(() => {
        setShow(true);
        // Small delay before showing content to ensure smooth transition
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      }, delay);
    } else {
      setIsVisible(false);
      timeout = setTimeout(() => {
        setShow(false);
      }, 300); // Match transition duration
    }

    return () => clearTimeout(timeout);
  }, [isLoading, delay]);

  if (!show) return null;

  const baseClasses = `
    ${fade ? 'transition-opacity duration-300' : ''}
    ${overlay ? 'fixed inset-0 z-50 bg-black bg-opacity-50' : 'relative'}
    ${className}
  `;

  const contentClasses = `
    ${fade ? 'transition-opacity duration-300' : ''}
    ${isVisible ? 'opacity-100' : 'opacity-0'}
    flex flex-col items-center justify-center
    ${overlay ? 'h-screen' : 'h-full'}
  `;

  return (
    <div className={baseClasses}>
      <div className={contentClasses}>
        {spinner && <FaSpinner className="w-8 h-8 animate-spin text-white mb-4" />}
        {text && <span className="text-white text-lg font-medium">{text}</span>}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
};

interface ILoadingSkeletonProps {
  className?: string;
  lines?: number;
  height?: string;
  width?: string;
  rounded?: string;
}

/**
 * Loading skeleton component for content placeholders
 */
export const LoadingSkeleton: React.FC<ILoadingSkeletonProps> = ({
  className = '',
  lines = 1,
  height = 'h-4',
  width = 'w-full',
  rounded = 'rounded',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`
            ${height}
            ${width}
            ${rounded}
            bg-gray-200 dark:bg-gray-700
            animate-pulse
          `}
        />
      ))}
    </div>
  );
};

interface ILoadingProgressProps {
  progress: number;
  className?: string;
  height?: string;
  rounded?: string;
  color?: string;
}

/**
 * Loading progress component
 */
export const LoadingProgress: React.FC<ILoadingProgressProps> = ({
  progress,
  className = '',
  height = 'h-2',
  rounded = 'rounded-full',
  color = 'bg-blue-500',
}) => {
  return (
    <div className={`w-full bg-gray-200 dark:bg-gray-700 ${height} ${rounded} ${className}`}>
      <div
        className={`
          ${height}
          ${rounded}
          ${color}
          transition-all duration-300 ease-out
        `}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
};

export default LoadingState;
