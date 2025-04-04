export interface ILocation {
    lat: number;
    lng: number;
    display_name: string;
    latitude?: number;
    longitude?: number;
    address?: string;
}
export interface IMeetup {
    id: string;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    time: string;
    createdBy: string;
    attendees?: number;
    tags?: string[];
    distance?: number;
}
export interface INavigationOptions {
    animate?: boolean;
    duration?: number;
    easeLinearity?: number;
    noMoveStart?: boolean;
}
export interface IUser {
    id: string;
    name: string;
    avatar?: string;
    preferences?: UserPreferences;
}
export interface IUserPreferences {
    theme?: 'light' | 'dark' | 'system';
    notifications?: boolean;
    locationSharing?: boolean;
    meetupRadius?: number;
}
export interface IAppError extends Error {
    code?: string;
    details?: unknown;
    retry?: boolean;
}
export interface IPerformanceMetrics {
    component?: string;
    operation: string;
    category: 'component' | 'hook' | 'api' | 'render' | 'location' | 'map';
    duration: number;
    details?: Record<string, unknown>;
}
export interface IBaseProps {
    className?: string;
    id?: string;
    testId?: string;
}
export interface IApiResponse<T> {
    data?: T;
    error?: string;
    status: number;
    timestamp: string;
}
export interface IMapViewport {
    center: [number, number];
    zoom: number;
    bounds?: [[number, number], [number, number]];
}
export * from '../hooks/useGeolocation';
export * from './api';
export * from './components';
export * from './hocs';
export * from './map';
export * from './state';
export * from './supabase';
export * from './test';
export * from './utils';
