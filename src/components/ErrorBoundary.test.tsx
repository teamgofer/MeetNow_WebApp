import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

// Mock console.error to prevent test output noise
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

// Mock process.env
const originalProcess = process;

describe('ErrorBoundary', () => {
  const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }): JSX.Element => {
    if (shouldThrow) {
      throw new Error('Test error');
    }
    return <div>Normal render</div>;
  };

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render error UI when an error occurs', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal render')).toBeInTheDocument();

    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText('We apologize for the inconvenience. Please try refreshing the page')
    ).toBeInTheDocument();
  });

  it('should show error details in development mode', () => {
    // Mock process.env
    const processEnv = { ...originalProcess.env, NODE_ENV: 'development' as const };
    jest.replaceProperty(process, 'env', processEnv);

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error Details:')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();

    // Restore process.env
    jest.replaceProperty(process, 'env', originalProcess.env);
  });

  it('should not show error details in production mode', () => {
    // Mock process.env
    const processEnv = { ...originalProcess.env, NODE_ENV: 'production' as const };
    jest.replaceProperty(process, 'env', processEnv);

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Error Details:')).not.toBeInTheDocument();

    // Restore process.env
    jest.replaceProperty(process, 'env', originalProcess.env);
  });

  it('should call console.error when an error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalled();
  });

  it('should provide a refresh button that reloads the page', () => {
    const reloadMock = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Refresh Page'));
    expect(reloadMock).toHaveBeenCalled();
  });
});
