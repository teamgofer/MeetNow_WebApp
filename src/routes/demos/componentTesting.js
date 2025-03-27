import { render, screen } from '@testing-library/react';
import { ComponentRegistryProvider } from '../components/ui/ComponentRegistry';

/**
 * Creates a test wrapper with necessary providers
 */
export const createTestWrapper = (options = {}) => {
  return function TestWrapper({ children }) {
    return (
      <ComponentRegistryProvider>
        {children}
      </ComponentRegistryProvider>
    );
  };
};

/**
 * Renders a component with test utilities and returns useful testing functions
 */
export const renderWithTestUtils = (ui, options = {}) => {
  const TestWrapper = createTestWrapper(options);
  
  const utils = render(ui, {
    wrapper: TestWrapper,
    ...options,
  });

  return {
    ...utils,
    // Add custom testing utilities here
    findByTestId: (testId) => screen.findByTestId(testId),
    queryByTestId: (testId) => screen.queryByTestId(testId),
    getAllByTestId: (testId) => screen.getAllByTestId(testId),
  };
};

/**
 * Creates a mock component for testing
 */
export const createMockComponent = (name, props = {}) => {
  return function MockComponent({ children, ...rest }) {
    return (
      <div data-testid={`mock-${name}`} {...props} {...rest}>
        {children}
      </div>
    );
  };
};

/**
 * Creates a mock hook for testing
 */
export const createMockHook = (name, returnValue = {}) => {
  return function useMockHook() {
    return {
      ...returnValue,
      __mockName: name,
    };
  };
};

/**
 * Creates a mock context for testing
 */
export const createMockContext = (name, defaultValue = {}) => {
  const Context = React.createContext(defaultValue);
  Context.displayName = name;
  return Context;
};

/**
 * Creates a mock provider for testing
 */
export const createMockProvider = (name, value = {}) => {
  return function MockProvider({ children }) {
    return (
      <div data-testid={`mock-provider-${name}`}>
        {children}
      </div>
    );
  };
};

/**
 * Creates a mock event handler for testing
 */
export const createMockEventHandler = (name) => {
  return function mockEventHandler(...args) {
    return {
      type: 'mock-event',
      name,
      args,
      timestamp: Date.now(),
    };
  };
};

/**
 * Creates a mock ref for testing
 */
export const createMockRef = (name) => {
  return {
    current: null,
    __mockName: name,
  };
};

/**
 * Creates a mock state for testing
 */
export const createMockState = (name, initialState = {}) => {
  return {
    ...initialState,
    __mockName: name,
  };
};

/**
 * Creates a mock effect for testing
 */
export const createMockEffect = (name) => {
  return function mockEffect() {
    return {
      type: 'mock-effect',
      name,
      timestamp: Date.now(),
    };
  };
};

/**
 * Creates a mock callback for testing
 */
export const createMockCallback = (name) => {
  return function mockCallback(...args) {
    return {
      type: 'mock-callback',
      name,
      args,
      timestamp: Date.now(),
    };
  };
};

/**
 * Creates a mock promise for testing
 */
export const createMockPromise = (name, resolveValue = {}) => {
  return Promise.resolve({
    ...resolveValue,
    __mockName: name,
  });
};

/**
 * Creates a mock error for testing
 */
export const createMockError = (name, message = 'Mock error') => {
  const error = new Error(message);
  error.name = name;
  return error;
};

/**
 * Creates a mock logger for testing
 */
export const createMockLogger = (name) => {
  return {
    info: createMockCallback(`${name}.info`),
    warn: createMockCallback(`${name}.warn`),
    error: createMockCallback(`${name}.error`),
    debug: createMockCallback(`${name}.debug`),
    __mockName: name,
  };
}; 