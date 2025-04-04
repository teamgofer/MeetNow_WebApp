import type { ReactNode } from 'react';
export interface IRenderWithProviderOptions {
    initialState?: Record<string, any>;
    store?: any;
    router?: any;
    route?: string;
}
export interface ITestWrapperProps {
    children: ReactNode;
    store?: any;
    router?: any;
    route?: string;
}
export interface IMockIntersectionObserver {
    observe: jest.Mock;
    unobserve: jest.Mock;
    disconnect: jest.Mock;
}
export interface IMockIntersectionObserverEntry {
    isIntersecting: boolean;
    boundingClientRect: DOMRectReadOnly;
    intersectionRatio: number;
    intersectionRect: DOMRectReadOnly;
    rootBounds: DOMRectReadOnly | null;
    target: Element;
    time: number;
}
export interface IMockIntersectionObserverCallback {
    (entries: MockIntersectionObserverEntry[], observer: MockIntersectionObserver): void;
}
export interface ITestUtils {
    renderWithProvider: (ui: ReactNode, options?: RenderWithProviderOptions) => any;
    mockIntersectionObserver: (callback: MockIntersectionObserverCallback) => MockIntersectionObserver;
    mockMatchMedia: (query: string) => MediaQueryList;
    mockResizeObserver: () => ResizeObserver;
    mockPerformanceObserver: () => PerformanceObserver;
}
