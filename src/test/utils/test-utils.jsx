import React from 'react';
import { render } from '@testing-library/react';
import { ComponentRegistryProvider } from '../../components/ui/ComponentRegistry';

const AllTheProviders = ({ children }) => {
  return (
    <ComponentRegistryProvider>
      {children}
    </ComponentRegistryProvider>
  );
};

const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// re-export everything
export * from '@testing-library/react';

// override render method
export { customRender as render }; 