import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useComponentRegistry } from '../components/ui/ComponentRegistry';

/**
 * Higher-order component that provides safe extraction capabilities
 * @param {React.Component} WrappedComponent - The component to wrap
 * @param {Object} options - Component extraction options
 * @param {string} options.id - Unique identifier for this component
 * @param {string[]} options.dependencies - List of component IDs this component depends on
 * @param {boolean} options.errorBoundary - Whether to include an error boundary
 * @param {Object} options.defaultProps - Default props to apply if parent doesn't provide them
 * @param {Function} options.onExtract - Function to run when component is safely extracted
 * @returns {React.Component} Component with safe extraction capabilities
 */
const withSafeExtraction = (
  WrappedComponent,
  {
    id = null,
    dependencies = [],
    errorBoundary = true,
    defaultProps = {},
    onExtract = null
  } = {}
) => {
  // Create component ID if not provided
  const componentId = id || `${WrappedComponent.displayName || WrappedComponent.name || 'Component'}_${Math.random().toString(36).substr(2, 9)}`;

  // Define the wrapped component
  const SafeExtractedComponent = ({ forwardedRef, ...props }) => {
    const [hasError, setHasError] = useState(false);
    const [errorInfo, setErrorInfo] = useState(null);
    const componentRef = useRef(null);
    const { registerComponent, registerDependency } = useComponentRegistry();
    const [initialMount, setInitialMount] = useState(true);

    // Register component with registry
    useEffect(() => {
      // Register the component
      registerComponent(componentId, {
        name: WrappedComponent.displayName || WrappedComponent.name || 'Component',
        refObject: componentRef
      });

      // Register dependencies
      dependencies.forEach(depId => {
        registerDependency(componentId, depId);
      });

      // Mark initial mount as complete
      setInitialMount(false);

      // Call onExtract callback if provided
      if (onExtract && typeof onExtract === 'function') {
        onExtract(componentId, componentRef);
      }

      // Cleanup will be handled by the ComponentRegistry
    }, [registerComponent, registerDependency]);

    // Error handler for error boundary
    const componentDidCatch = (error, info) => {
      if (errorBoundary) {
        console.error(`Error in component ${componentId}:`, error);
        setHasError(true);
        setErrorInfo(info);
      } else {
        // If not using error boundary, re-throw the error
        throw error;
      }
    };

    // Apply default props if not provided
    const finalProps = {
      ...defaultProps,
      ...props
    };

    // Assign ref
    const ref = forwardedRef || componentRef;

    // If there's an error and using error boundary, render fallback UI
    if (hasError && errorBoundary) {
      return (
        <div 
          className="component-error-boundary" 
          data-component-id={componentId}
          ref={ref}
        >
          <h3>Component Error</h3>
          <p>Something went wrong in this component.</p>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ whiteSpace: 'pre-wrap' }}>
              {errorInfo && errorInfo.componentStack}
            </details>
          )}
          <button 
            onClick={() => setHasError(false)}
            className="retry-button"
          >
            Retry
          </button>
        </div>
      );
    }

    // Render the component with a data attribute for identification
    return (
      <WrappedComponent
        {...finalProps}
        ref={ref}
        data-component-id={componentId}
        data-extracted="true"
        data-initial-mount={initialMount}
      />
    );
  };

  SafeExtractedComponent.propTypes = {
    forwardedRef: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.shape({ current: PropTypes.any })
    ])
  };

  // Add display name for better debugging
  SafeExtractedComponent.displayName = `withSafeExtraction(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  // Forward refs to the wrapped component
  return React.forwardRef((props, ref) => (
    <SafeExtractedComponent {...props} forwardedRef={ref} />
  ));
};

// ErrorBoundary class component for use with components that can't use the HOC
class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component error:', error);
    this.setState({ errorInfo });
    
    // Call onError if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="component-error-boundary">
          <h3>Component Error</h3>
          <p>{this.props.errorMessage || 'Something went wrong in this component.'}</p>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ whiteSpace: 'pre-wrap' }}>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </details>
          )}
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="retry-button"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ComponentErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  errorMessage: PropTypes.string,
  onError: PropTypes.func
};

export { ComponentErrorBoundary };
export default withSafeExtraction; 