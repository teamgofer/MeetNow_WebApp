import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

const ComponentRegistryContext = createContext(null);

export const useComponentRegistry = () => {
  const context = useContext(ComponentRegistryContext);
  if (!context) {
    throw new Error('useComponentRegistry must be used within a ComponentRegistryProvider');
  }
  return context;
};

export const ComponentRegistryProvider = ({ children }) => {
  // Original functionality for floating windows and pin markers
  const floatingWindowsRef = useRef(new Map());
  const pinMarkersRef = useRef(new Map());
  const [activeFloatingWindows, setActiveFloatingWindows] = useState([]);
  const [activePinMarkers, setActivePinMarkers] = useState([]);

  // New component registry functionality
  const [components, setComponents] = useState(new Map());
  const [dependencies, setDependencies] = useState(new Map());

  // Original methods
  const registerFloatingWindow = useCallback((id, component) => {
    floatingWindowsRef.current.set(id, component);
    setActiveFloatingWindows(prev => [...prev, id]);
  }, []);

  const unregisterFloatingWindow = useCallback((id) => {
    floatingWindowsRef.current.delete(id);
    setActiveFloatingWindows(prev => prev.filter(windowId => windowId !== id));
  }, []);

  const registerPinMarker = useCallback((id, marker) => {
    pinMarkersRef.current.set(id, marker);
    setActivePinMarkers(prev => [...prev, id]);
  }, []);

  const unregisterPinMarker = useCallback((id) => {
    pinMarkersRef.current.delete(id);
    setActivePinMarkers(prev => prev.filter(markerId => markerId !== id));
  }, []);

  const getFloatingWindow = useCallback((id) => floatingWindowsRef.current.get(id), []);
  const getPinMarker = useCallback((id) => pinMarkersRef.current.get(id), []);

  // New component registry methods
  const registerComponent = useCallback((componentId, metadata) => {
    setComponents(prev => {
      const newMap = new Map(prev);
      newMap.set(componentId, {
        ...metadata,
        registeredAt: new Date(),
      });
      return newMap;
    });
  }, []);

  const registerDependency = useCallback((componentId, dependencyId) => {
    setDependencies(prev => {
      const newMap = new Map(prev);
      const deps = newMap.get(componentId) || new Set();
      deps.add(dependencyId);
      newMap.set(componentId, deps);
      return newMap;
    });
  }, []);

  const unregisterComponent = useCallback((componentId) => {
    setComponents(prev => {
      const newMap = new Map(prev);
      newMap.delete(componentId);
      return newMap;
    });
    setDependencies(prev => {
      const newMap = new Map(prev);
      newMap.delete(componentId);
      return newMap;
    });
  }, []);

  const getComponentDependencies = useCallback((componentId) => {
    return dependencies.get(componentId) || new Set();
  }, [dependencies]);

  const getComponentMetadata = useCallback((componentId) => {
    return components.get(componentId);
  }, [components]);

  const getAllComponents = useCallback(() => {
    return Array.from(components.entries()).map(([id, metadata]) => ({
      id,
      ...metadata,
    }));
  }, [components]);

  const value = {
    // Original functionality
    registerFloatingWindow,
    unregisterFloatingWindow,
    registerPinMarker,
    unregisterPinMarker,
    getFloatingWindow,
    getPinMarker,
    activeFloatingWindows,
    activePinMarkers,
    // New component registry functionality
    registerComponent,
    registerDependency,
    unregisterComponent,
    getComponentDependencies,
    getComponentMetadata,
    getAllComponents,
  };

  return (
    <ComponentRegistryContext.Provider value={value}>
      {children}
    </ComponentRegistryContext.Provider>
  );
};

ComponentRegistryProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Higher-order component to automatically register components
export const withComponentRegistry = (WrappedComponent, metadata = {}) => {
  return function WithComponentRegistry(props) {
    const { registerComponent, registerDependency } = useComponentRegistry();
    const componentId = metadata.id || WrappedComponent.name;

    React.useEffect(() => {
      registerComponent(componentId, {
        name: WrappedComponent.name,
        ...metadata,
      });

      return () => {
        // Cleanup will be handled by the provider
      };
    }, [componentId, registerComponent, metadata]);

    return <WrappedComponent {...props} />;
  };
}; 