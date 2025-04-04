import type { ILocation, ILoadingStateObject, IErrorResponse } from './common';
import { TLoadingState } from './common';
import type { IMapNavigationController } from './map';
import type { IMeetup, IMeetupFilters } from './meetup';
import type { User } from '@supabase/supabase-js';
import type { IStandardizedError } from '../utils/error-handler';

export interface IUseLocationResult extends ILoadingStateObject<ILocation> {
  getCurrentLocation: () => Promise<void>;
  updateLocation: (location: ILocation) => void;
  clearLocation: () => void;
}

export interface IUseMeetupsResult extends ILoadingStateObject<IMeetup[]> {
  meetups: IMeetup[];
  filters: IMeetupFilters;
  setFilters: (filters: IMeetupFilters) => void;
  createMeetup: (meetup: IMeetup) => Promise<void>;
  updateMeetup: (id: string, meetup: IMeetup) => Promise<void>;
  deleteMeetup: (id: string) => Promise<void>;
  joinMeetup: (id: string) => Promise<void>;
  leaveMeetup: (id: string) => Promise<void>;
  refreshMeetups: () => Promise<void>;
}

export interface IUseMapResult extends ILoadingStateObject<IMapNavigationController> {
  controller: IMapNavigationController | null;
  isReady: boolean;
  error: IErrorResponse | undefined;
  initialize: () => Promise<void>;
  dispose: () => void;
  navigateTo: (location: ILocation) => Promise<boolean>;
  setUserLocation: (location: ILocation) => void;
  setSelectedLocation: (location: ILocation) => void;
}

export interface IUseAuthResult {
  state: TLoadingState;
  data: {
    user: User | null;
    isAuthenticated: boolean;
  };
  error: IStandardizedError | undefined;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export interface IUseImageUploadResult extends ILoadingStateObject<{
  url: string;
  signedUrl: string;
  key: string;
}> {
  uploadImage: (file: File) => Promise<void>;
  deleteImage: (key: string) => Promise<void>;
  getSignedUrl: (key: string) => Promise<string>;
}

export interface IBreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
  isTouchDevice: boolean;
  currentBreakpoint: string;
}

export interface IUseModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export interface IUseLoadingReturn {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

export interface IUseOfflineReturn {
  isOffline: boolean;
  withOfflineOperation: <T>(operation: () => Promise<T>) => Promise<T>;
}

export interface IUseErrorHandlingReturn {
  error: Error | null;
  handleError: (error: Error) => void;
  clearError: () => void;
}

export interface IUsePerformanceTrackingReturn {
  startTracking: () => void;
  stopTracking: () => void;
  getMetrics: () => {
    renderTime: number;
    mountTime: number;
    updateTime: number;
  };
} 