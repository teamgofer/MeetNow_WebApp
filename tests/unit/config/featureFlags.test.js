import { 
  isFeatureEnabled, 
  enableFeature, 
  disableFeature, 
  resetFeature, 
  FeatureFlag, 
  FEATURE_FLAGS,
  getAllFeatureFlags
} from '../featureFlags';
import React from 'react';
import { render, screen } from '@testing-library/react';

// Save original environment
const originalEnv = process.env.NODE_ENV;

// Mock localStorage
let localStorageMock = {};

beforeEach(() => {
  // Reset mocks before each test
  localStorageMock = {};
  
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(key => localStorageMock[key] || null),
      setItem: jest.fn((key, value) => {
        localStorageMock[key] = value;
      }),
      removeItem: jest.fn(key => {
        delete localStorageMock[key];
      })
    },
    writable: true
  });
  
  // Set environment to development for most tests
  process.env.NODE_ENV = 'development';
});

afterAll(() => {
  // Restore original environment
  process.env.NODE_ENV = originalEnv;
});

describe('Feature Flags', () => {
  test('isFeatureEnabled returns default value when no override exists', () => {
    // A flag that's enabled by default
    expect(isFeatureEnabled('USE_EXTRACTED_NEARBY_MEETUPS')).toBe(true);
    
    // A flag that's disabled by default
    expect(isFeatureEnabled('USE_EXTRACTED_MEETUP_DETAILS')).toBe(false);
  });
  
  test('isFeatureEnabled respects localStorage override in development', () => {
    // Override an enabled flag to be disabled
    localStorage.setItem('feature_USE_EXTRACTED_NEARBY_MEETUPS', 'false');
    expect(isFeatureEnabled('USE_EXTRACTED_NEARBY_MEETUPS')).toBe(false);
    
    // Override a disabled flag to be enabled
    localStorage.setItem('feature_USE_EXTRACTED_MEETUP_DETAILS', 'true');
    expect(isFeatureEnabled('USE_EXTRACTED_MEETUP_DETAILS')).toBe(true);
  });
  
  test('isFeatureEnabled ignores localStorage in production', () => {
    // Set environment to production
    process.env.NODE_ENV = 'production';
    
    // Try to override flags
    localStorage.setItem('feature_USE_EXTRACTED_NEARBY_MEETUPS', 'false');
    localStorage.setItem('feature_USE_EXTRACTED_MEETUP_DETAILS', 'true');
    
    // Should use default values in production
    expect(isFeatureEnabled('USE_EXTRACTED_NEARBY_MEETUPS')).toBe(true);
    expect(isFeatureEnabled('USE_EXTRACTED_MEETUP_DETAILS')).toBe(false);
  });
  
  test('enableFeature sets the feature flag to true', () => {
    enableFeature('USE_EXTRACTED_MEETUP_DETAILS');
    expect(localStorage.setItem).toHaveBeenCalledWith('feature_USE_EXTRACTED_MEETUP_DETAILS', 'true');
  });
  
  test('disableFeature sets the feature flag to false', () => {
    disableFeature('USE_EXTRACTED_NEARBY_MEETUPS');
    expect(localStorage.setItem).toHaveBeenCalledWith('feature_USE_EXTRACTED_NEARBY_MEETUPS', 'false');
  });
  
  test('resetFeature removes the override', () => {
    resetFeature('USE_EXTRACTED_MEETUP_DETAILS');
    expect(localStorage.removeItem).toHaveBeenCalledWith('feature_USE_EXTRACTED_MEETUP_DETAILS');
  });
  
  test('getAllFeatureFlags returns all feature flags', () => {
    const allFlags = getAllFeatureFlags();
    expect(allFlags).toContain('USE_EXTRACTED_NEARBY_MEETUPS');
    expect(allFlags).toContain('USE_EXTRACTED_MEETUP_DETAILS');
    expect(allFlags).toContain('ENABLE_PERFORMANCE_TRACKING');
  });
  
  test('FeatureFlag component conditionally renders children', () => {
    // Test when flag is enabled
    localStorage.setItem('feature_TEST_FLAG', 'true');
    render(
      <FeatureFlag flag="TEST_FLAG">
        <div data-testid="feature-enabled">Enabled</div>
      </FeatureFlag>
    );
    expect(screen.getByTestId('feature-enabled')).toBeInTheDocument();
    
    // Test when flag is disabled
    localStorage.setItem('feature_TEST_FLAG', 'false');
    render(
      <FeatureFlag flag="TEST_FLAG">
        <div data-testid="feature-enabled">Enabled</div>
      </FeatureFlag>
    );
    expect(screen.queryByTestId('feature-enabled')).not.toBeInTheDocument();
  });
  
  test('FeatureFlag component renders fallback when provided', () => {
    // Disable the feature
    localStorage.setItem('feature_TEST_FLAG', 'false');
    
    render(
      <FeatureFlag 
        flag="TEST_FLAG"
        fallback={<div data-testid="feature-disabled">Disabled</div>}
      >
        <div data-testid="feature-enabled">Enabled</div>
      </FeatureFlag>
    );
    
    // Check that fallback is rendered instead
    expect(screen.queryByTestId('feature-enabled')).not.toBeInTheDocument();
    expect(screen.getByTestId('feature-disabled')).toBeInTheDocument();
  });
}); 