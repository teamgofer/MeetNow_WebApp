/**
 * Global Types for MeetNow Application
 */

// Location Types
export interface ILocation {
  lat: number;
  lng: number;
  display_name: string;
  // For backward compatibility
  latitude?: number;
  longitude?: number;
  address?: string;
}

// Meetup Types
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

// Navigation Types
export interface INavigationOptions {
  animate?: boolean;
  duration?: number;
  easeLinearity?: number;
  noMoveStart?: boolean;
}

// User Types
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

// Error Types
export interface IAppError extends Error {
  code?: string;
  details?: unknown;
  retry?: boolean;
}

// Performance Monitoring
export interface IPerformanceMetrics {
  component?: string;
  operation: string;
  category: 'component' | 'hook' | 'api' | 'render' | 'location' | 'map';
  duration: number;
  details?: Record<string, unknown>;
}

// Component Props
export interface IBaseProps {
  className?: string;
  id?: string;
  testId?: string;
}

// API Response Types
export interface IApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
  timestamp: string;
}

// Map Related Types
export interface IMapViewport {
  center: [number, number];
  zoom: number;
  bounds?: [[number, number], [number, number]];
}

// Re-export from location hook for compatibility
export * from '../hooks/useGeolocation';

export * from './api';
export * from './components';
export * from './hocs';
export * from './map';
export * from './state';
export * from './supabase';
export * from './test';
export * from './utils';
