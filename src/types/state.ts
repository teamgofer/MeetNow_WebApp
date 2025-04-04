import type { LatLng } from 'leaflet';

import type { Meetup, Profile } from './api';

export interface IAppState {
  auth: AuthState;
  meetups: MeetupsState;
  map: MapState;
  ui: UIState;
}

export interface IAuthState {
  user: Profile | null;
  loading: boolean;
  error: string | null;
}

export interface IMeetupsState {
  items: Meetup[];
  selected: Meetup | null;
  loading: boolean;
  error: string | null;
  filters: {
    category: string | null;
    distance: number;
    date: Date | null;
  };
}

export interface IMapState {
  center: LatLng | null;
  zoom: number;
  userLocation: LatLng | null;
  selectedLocation: LatLng | null;
  markers: Array<{
    id: string;
    position: LatLng;
    title: string;
  }>;
  loading: boolean;
  error: string | null;
}

export interface IUIState {
  theme: 'light' | 'dark';
  modal: {
    isOpen: boolean;
    type: string | null;
    data: any;
  };
  toast: {
    isOpen: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  };
  sidebar: {
    isOpen: boolean;
    activeTab: string | null;
  };
  loading: {
    [key: string]: boolean;
  };
  errors: {
    [key: string]: string | null;
  };
}

export type TAppAction =
  | { type: 'AUTH_LOGIN_REQUEST' }
  | { type: 'AUTH_LOGIN_SUCCESS'; payload: Profile }
  | { type: 'AUTH_LOGIN_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'MEETUPS_FETCH_REQUEST' }
  | { type: 'MEETUPS_FETCH_SUCCESS'; payload: Meetup[] }
  | { type: 'MEETUPS_FETCH_FAILURE'; payload: string }
  | { type: 'MEETUP_SELECT'; payload: Meetup }
  | { type: 'MEETUP_DESELECT' }
  | { type: 'MAP_SET_CENTER'; payload: LatLng }
  | { type: 'MAP_SET_ZOOM'; payload: number }
  | { type: 'MAP_SET_USER_LOCATION'; payload: LatLng }
  | { type: 'MAP_SET_SELECTED_LOCATION'; payload: LatLng }
  | { type: 'MAP_SET_MARKERS'; payload: Array<{ id: string; position: LatLng; title: string }> }
  | { type: 'UI_SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'UI_MODAL_OPEN'; payload: { type: string; data?: any } }
  | { type: 'UI_MODAL_CLOSE' }
  | {
      type: 'UI_TOAST_SHOW';
      payload: { type: 'success' | 'error' | 'info' | 'warning'; message: string };
    }
  | { type: 'UI_TOAST_HIDE' }
  | { type: 'UI_SIDEBAR_TOGGLE' }
  | { type: 'UI_SIDEBAR_SET_TAB'; payload: string }
  | { type: 'UI_SET_LOADING'; payload: { key: string; value: boolean } }
  | { type: 'UI_SET_ERROR'; payload: { key: string; value: string | null } };

export type TAppDispatch = (action: AppAction) => void;
