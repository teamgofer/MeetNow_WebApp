import React, { createContext, useContext, useRef, useState, useCallback, ReactNode } from 'react';

// ComponentMetadata interface
interface IComponentMetadata {
  id?: string;
  name?: string;
  registeredAt?: Date;
  [key: string]: any;
}

// Context type
interface IComponentRegistryContext {
  // Floating windows and pin markers
  registerFloatingWindow: (id: string, component: any) => void;
  unregisterFloatingWindow: (id: string) => void;
  registerPinMarker: (id: string, marker: any) => void;
  unregisterPinMarker: (id: string) => void;
  getFloatingWindow: (id: string) => any;
  getPinMarker: (id: string) => any;
  activeFloatingWindows: string[];
  activePinMarkers: string[];

  // Component registry
  registerComponent: (componentId: string, metadata: IComponentMetadata) => void;
  registerDependency: (componentId: string, dependencyId: string) => void;
  unregisterComponent: (componentId: string) => void;
  getComponentDependencies: (componentId: string) => Set<string>;
  getComponentMetadata: (componentId: string) => IComponentMetadata | undefined;
  getAllComponents: () => Array<IComponentMetadata & { id: string }>;
}

// Create context with null initial value
const ComponentRegistryContext = createContext<IComponentRegistryContext | null>(null);

export const useComponentRegistry = (): IComponentRegistryContext => {
  const context = useContext(ComponentRegistryContext);
  if (!context) {
    throw new Error('useComponentRegistry must be used within a ComponentRegistryProvider');
  }
  return context;
};

interface IComponentRegistryProviderProps {
  children: ReactNode;
}

export const ComponentRegistryProvider: React.FC<IComponentRegistryProviderProps> = ({
  children,
}) => {
  // Original functionality for floating windows and pin markers
  const floatingWindowsRef = useRef(new Map<string, any>());
  const pinMarkersRef = useRef(new Map<string, any>());
  const [activeFloatingWindows, setActiveFloatingWindows] = useState<string[]>([]);
  const [activePinMarkers, setActivePinMarkers] = useState<string[]>([]);

  // New component registry functionality
  const [components, setComponents] = useState<Map<string, IComponentMetadata>>(new Map());
  const [dependencies, setDependencies] = useState<Map<string, Set<string>>>(new Map());

  // Original methods
  const registerFloatingWindow = useCallback((id: string, component: any) => {
    floatingWindowsRef.current.set(id, component);
    setActiveFloatingWindows(prev => [...prev, id]);
  }, []);

  const unregisterFloatingWindow = useCallback((id: string) => {
    floatingWindowsRef.current.delete(id);
    setActiveFloatingWindows(prev => prev.filter(windowId => windowId !== id));
  }, []);

  const registerPinMarker = useCallback((id: string, marker: any) => {
    pinMarkersRef.current.set(id, marker);
    setActivePinMarkers(prev => [...prev, id]);
  }, []);

  const unregisterPinMarker = useCallback((id: string) => {
    pinMarkersRef.current.delete(id);
    setActivePinMarkers(prev => prev.filter(markerId => markerId !== id));
  }, []);

  const getFloatingWindow = useCallback((id: string) => floatingWindowsRef.current.get(id), []);
  const getPinMarker = useCallback((id: string) => pinMarkersRef.current.get(id), []);

  // New component registry methods
  const registerComponent = useCallback((componentId: string, metadata: IComponentMetadata) => {
    setComponents(prev => {
      const newMap = new Map(prev);
      newMap.set(componentId, {
        ...metadata,
        registeredAt: new Date(),
      });
      return newMap;
    });
  }, []);

  const registerDependency = useCallback((componentId: string, dependencyId: string) => {
    setDependencies(prev => {
      const newMap = new Map(prev);
      const deps = newMap.get(componentId) || new Set<string>();
      deps.add(dependencyId);
      newMap.set(componentId, deps);
      return newMap;
    });
  }, []);

  const unregisterComponent = useCallback((componentId: string) => {
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

  const getComponentDependencies = useCallback(
    (componentId: string): Set<string> => {
      return dependencies.get(componentId) || new Set<string>();
    },
    [dependencies]
  );

  const getComponentMetadata = useCallback(
    (componentId: string): IComponentMetadata | undefined => {
      return components.get(componentId);
    },
    [components]
  );

  const getAllComponents = useCallback((): Array<IComponentMetadata & { id: string }> => {
    return Array.from(components.entries()).map(([id, metadata]) => ({
      id,
      ...metadata,
    }));
  }, [components]);

  const value: IComponentRegistryContext = {
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
    <ComponentRegistryContext.Provider value={value}>{children}</ComponentRegistryContext.Provider>
  );
};

// Higher-order component to automatically register components
interface WithRegistryOptions {
  WrappedComponent: React.ComponentType<any>;
  metadata?: IComponentMetadata;
}

export function withComponentRegistry<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  metadata: IComponentMetadata = {}
): React.FC<P> {
  const WithComponentRegistry: React.FC<P> = props => {
    const { registerComponent } = useComponentRegistry();
    const componentId =
      metadata.id || WrappedComponent.displayName || WrappedComponent.name || 'UnnamedComponent';

    React.useEffect(() => {
      registerComponent(componentId, {
        name: WrappedComponent.displayName || WrappedComponent.name || 'UnnamedComponent',
        ...metadata,
      });

      // Cleanup will be handled by the provider
    }, [componentId, registerComponent]);

    return <WrappedComponent {...props} />;
  };

  WithComponentRegistry.displayName = `WithComponentRegistry(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithComponentRegistry;
}

export default ComponentRegistryProvider;
