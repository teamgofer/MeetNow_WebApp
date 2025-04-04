import React, { ReactNode } from 'react';
interface IComponentMetadata {
    id?: string;
    name?: string;
    registeredAt?: Date;
    [key: string]: any;
}
interface IComponentRegistryContext {
    registerFloatingWindow: (id: string, component: any) => void;
    unregisterFloatingWindow: (id: string) => void;
    registerPinMarker: (id: string, marker: any) => void;
    unregisterPinMarker: (id: string) => void;
    getFloatingWindow: (id: string) => any;
    getPinMarker: (id: string) => any;
    activeFloatingWindows: string[];
    activePinMarkers: string[];
    registerComponent: (componentId: string, metadata: IComponentMetadata) => void;
    registerDependency: (componentId: string, dependencyId: string) => void;
    unregisterComponent: (componentId: string) => void;
    getComponentDependencies: (componentId: string) => Set<string>;
    getComponentMetadata: (componentId: string) => IComponentMetadata | undefined;
    getAllComponents: () => Array<IComponentMetadata & {
        id: string;
    }>;
}
export declare const useComponentRegistry: () => IComponentRegistryContext;
interface IComponentRegistryProviderProps {
    children: ReactNode;
}
export declare const ComponentRegistryProvider: React.FC<IComponentRegistryProviderProps>;
export declare function withComponentRegistry<P extends object>(WrappedComponent: React.ComponentType<P>, metadata?: IComponentMetadata): React.FC<P>;
export default ComponentRegistryProvider;
