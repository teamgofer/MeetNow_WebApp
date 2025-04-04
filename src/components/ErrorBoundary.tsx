import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

/**
 * Interface for ErrorBoundary props
 */
export interface IErrorBoundaryProps {
  /** Child components to be wrapped by the error boundary */
  children: React.ReactNode;
}

/**
 * Interface for ErrorBoundary state
 */
interface IErrorBoundaryState {
  /** Whether an error has occurred */
  hasError: boolean;
  /** The error that was caught, if any */
  error: Error | null;
}

/**
 * ErrorBoundary component that catches JavaScript errors anywhere in its child component tree
 */
class ErrorBoundary extends React.Component<IErrorBoundaryProps, IErrorBoundaryState> {
  constructor(props: IErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): IErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <FaExclamationTriangle className="mx-auto h-12 w-12 text-red-500" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Something went wrong</h2>
              <p className="mt-2 text-sm text-gray-600">
                We apologize for the inconvenience. Please try refreshing the page.
              </p>
            </div>
            <div className="mt-8 space-y-6">
              <button
                onClick={(): void => window.location.reload()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Refresh Page
              </button>
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-4 bg-red-50 rounded-md">
                  <h3 className="text-sm font-medium text-red-800">Error Details:</h3>
                  <pre className="mt-2 text-sm text-red-700 overflow-auto">
                    {this.state.error?.toString()}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
