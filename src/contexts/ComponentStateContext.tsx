import type { ReactNode } from 'react';
import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Define types for each section of state
interface IMeetup {
  id: string;
  title: string;
  description?: string;
  location: Location;
  startTime: string;
  endTime?: string;
  category: string;
  creator: string;
  participants: string[];
  // Add other meetup properties as needed
}

interface ILocation {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

interface IMarker {
  id: string;
  position: Location;
  type: string;
  // Add other marker properties as needed
}

interface IToast {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

interface IUserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  // Add other profile properties as needed
}

interface INotification {
  id: string;
  message: string;
  type: string;
  isRead: boolean;
  timestamp: string;
}

// Define state structure with namespaces
interface IMeetupState {
  activeMeetup: Meetup | null;
  nearbyMeetups: Meetup[];
  joinedMeetups: Meetup[];
  createdMeetups: Meetup[];
  isCreatingMeetup: boolean;
  isJoiningMeetup: boolean;
  filters: {
    distance: number;
    category: string;
    timeRange: string;
  };
}

interface IMapState {
  center: Location | null;
  zoom: number;
  userLocation: Location | null;
  isMapInitialized: boolean;
  isLocationLoading: boolean;
  visibleMarkers: Marker[];
  activeMarkerId: string | null;
}

interface IUserState {
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isProfileLoading: boolean;
  preferences: Record<string, any>;
  notifications: Notification[];
}

interface IUIState {
  bottomSheetState: 'collapsed' | 'expanded' | 'hidden';
  activeModal: string | null;
  isMenuOpen: boolean;
  toasts: Toast[];
  currentTab: string;
  isLoading: boolean;
  errors: Record<string, string>;
}

// Combined state interface
interface IComponentState {
  meetup: MeetupState;
  map: MapState;
  user: UserState;
  ui: UIState;
}

// Define action types enum
enum EActionType {
  // Meetup actions
  SET_ACTIVE_MEETUP = 'SET_ACTIVE_MEETUP',
  SET_NEARBY_MEETUPS = 'SET_NEARBY_MEETUPS',
  SET_JOINED_MEETUPS = 'SET_JOINED_MEETUPS',
  SET_CREATED_MEETUPS = 'SET_CREATED_MEETUPS',
  SET_CREATING_MEETUP = 'SET_CREATING_MEETUP',
  SET_JOINING_MEETUP = 'SET_JOINING_MEETUP',
  UPDATE_FILTERS = 'UPDATE_FILTERS',

  // Map actions
  SET_MAP_CENTER = 'SET_MAP_CENTER',
  SET_MAP_ZOOM = 'SET_MAP_ZOOM',
  SET_USER_LOCATION = 'SET_USER_LOCATION',
  SET_MAP_INITIALIZED = 'SET_MAP_INITIALIZED',
  SET_LOCATION_LOADING = 'SET_LOCATION_LOADING',
  SET_VISIBLE_MARKERS = 'SET_VISIBLE_MARKERS',
  SET_ACTIVE_MARKER_ID = 'SET_ACTIVE_MARKER_ID',

  // User actions
  SET_USER_PROFILE = 'SET_USER_PROFILE',
  SET_AUTHENTICATED = 'SET_AUTHENTICATED',
  SET_PROFILE_LOADING = 'SET_PROFILE_LOADING',
  UPDATE_PREFERENCES = 'UPDATE_PREFERENCES',
  SET_NOTIFICATIONS = 'SET_NOTIFICATIONS',

  // UI actions
  SET_BOTTOM_SHEET_STATE = 'SET_BOTTOM_SHEET_STATE',
  SET_ACTIVE_MODAL = 'SET_ACTIVE_MODAL',
  SET_MENU_OPEN = 'SET_MENU_OPEN',
  ADD_TOAST = 'ADD_TOAST',
  REMOVE_TOAST = 'REMOVE_TOAST',
  SET_CURRENT_TAB = 'SET_CURRENT_TAB',
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
  CLEAR_ERROR = 'CLEAR_ERROR',
}

// Define action interfaces
interface ISetActiveMeetupAction {
  type: ActionType.SET_ACTIVE_MEETUP;
  payload: Meetup | null;
}

interface ISetNearbyMeetupsAction {
  type: ActionType.SET_NEARBY_MEETUPS;
  payload: Meetup[];
}

interface ISetJoinedMeetupsAction {
  type: ActionType.SET_JOINED_MEETUPS;
  payload: Meetup[];
}

interface ISetCreatedMeetupsAction {
  type: ActionType.SET_CREATED_MEETUPS;
  payload: Meetup[];
}

interface ISetCreatingMeetupAction {
  type: ActionType.SET_CREATING_MEETUP;
  payload: boolean;
}

interface ISetJoiningMeetupAction {
  type: ActionType.SET_JOINING_MEETUP;
  payload: boolean;
}

interface IUpdateFiltersAction {
  type: ActionType.UPDATE_FILTERS;
  payload: Partial<MeetupState['filters']>;
}

interface ISetMapCenterAction {
  type: ActionType.SET_MAP_CENTER;
  payload: Location | null;
}

interface ISetMapZoomAction {
  type: ActionType.SET_MAP_ZOOM;
  payload: number;
}

interface ISetUserLocationAction {
  type: ActionType.SET_USER_LOCATION;
  payload: Location | null;
}

interface ISetMapInitializedAction {
  type: ActionType.SET_MAP_INITIALIZED;
  payload: boolean;
}

interface ISetLocationLoadingAction {
  type: ActionType.SET_LOCATION_LOADING;
  payload: boolean;
}

interface ISetVisibleMarkersAction {
  type: ActionType.SET_VISIBLE_MARKERS;
  payload: Marker[];
}

interface ISetActiveMarkerIdAction {
  type: ActionType.SET_ACTIVE_MARKER_ID;
  payload: string | null;
}

interface ISetUserProfileAction {
  type: ActionType.SET_USER_PROFILE;
  payload: UserProfile | null;
}

interface ISetAuthenticatedAction {
  type: ActionType.SET_AUTHENTICATED;
  payload: boolean;
}

interface ISetProfileLoadingAction {
  type: ActionType.SET_PROFILE_LOADING;
  payload: boolean;
}

interface IUpdatePreferencesAction {
  type: ActionType.UPDATE_PREFERENCES;
  payload: Record<string, any>;
}

interface ISetNotificationsAction {
  type: ActionType.SET_NOTIFICATIONS;
  payload: Notification[];
}

interface ISetBottomSheetStateAction {
  type: ActionType.SET_BOTTOM_SHEET_STATE;
  payload: UIState['bottomSheetState'];
}

interface ISetActiveModalAction {
  type: ActionType.SET_ACTIVE_MODAL;
  payload: string | null;
}

interface ISetMenuOpenAction {
  type: ActionType.SET_MENU_OPEN;
  payload: boolean;
}

interface IAddToastAction {
  type: ActionType.ADD_TOAST;
  payload: Omit<Toast, 'id'> & { id?: number };
}

interface IRemoveToastAction {
  type: ActionType.REMOVE_TOAST;
  payload: number;
}

interface ISetCurrentTabAction {
  type: ActionType.SET_CURRENT_TAB;
  payload: string;
}

interface ISetLoadingAction {
  type: ActionType.SET_LOADING;
  payload: boolean;
}

interface ISetErrorAction {
  type: ActionType.SET_ERROR;
  payload: { key: string; error: string };
}

interface IClearErrorAction {
  type: ActionType.CLEAR_ERROR;
  payload: string;
}

type TComponentAction =
  | SetActiveMeetupAction
  | SetNearbyMeetupsAction
  | SetJoinedMeetupsAction
  | SetCreatedMeetupsAction
  | SetCreatingMeetupAction
  | SetJoiningMeetupAction
  | UpdateFiltersAction
  | SetMapCenterAction
  | SetMapZoomAction
  | SetUserLocationAction
  | SetMapInitializedAction
  | SetLocationLoadingAction
  | SetVisibleMarkersAction
  | SetActiveMarkerIdAction
  | SetUserProfileAction
  | SetAuthenticatedAction
  | SetProfileLoadingAction
  | UpdatePreferencesAction
  | SetNotificationsAction
  | SetBottomSheetStateAction
  | SetActiveModalAction
  | SetMenuOpenAction
  | AddToastAction
  | RemoveToastAction
  | SetCurrentTabAction
  | SetLoadingAction
  | SetErrorAction
  | ClearErrorAction;

// Define action creators interfaces
interface IMeetupActions {
  setActiveMeetup: (meetup: Meetup | null) => void;
  setNearbyMeetups: (meetups: Meetup[]) => void;
  setJoinedMeetups: (meetups: Meetup[]) => void;
  setCreatedMeetups: (meetups: Meetup[]) => void;
  setCreatingMeetup: (isCreating: boolean) => void;
  setJoiningMeetup: (isJoining: boolean) => void;
  updateFilters: (filters: Partial<MeetupState['filters']>) => void;
}

interface IMapActions {
  setMapCenter: (center: Location | null) => void;
  setMapZoom: (zoom: number) => void;
  setUserLocation: (location: Location | null) => void;
  setMapInitialized: (isInitialized: boolean) => void;
  setLocationLoading: (isLoading: boolean) => void;
  setVisibleMarkers: (markers: Marker[]) => void;
  setActiveMarkerId: (markerId: string | null) => void;
}

interface IUserActions {
  setUserProfile: (profile: UserProfile | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setProfileLoading: (isLoading: boolean) => void;
  updatePreferences: (preferences: Record<string, any>) => void;
  setNotifications: (notifications: Notification[]) => void;
}

interface IUIActions {
  setBottomSheetState: (state: UIState['bottomSheetState']) => void;
  setActiveModal: (modal: string | null) => void;
  setMenuOpen: (isOpen: boolean) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: number) => void;
  setCurrentTab: (tab: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (key: string, error: string) => void;
  clearError: (key: string) => void;
}

interface IComponentActions {
  meetup: MeetupActions;
  map: MapActions;
  user: UserActions;
  ui: UIActions;
}

// Combined context value interface
interface IComponentStateContextType {
  state: ComponentState;
  actions: ComponentActions;
}

// Create context
const ComponentStateContext = createContext<ComponentStateContextType | undefined>(undefined);

// Initial state
const initialState: ComponentState = {
  meetup: {
    activeMeetup: null,
    nearbyMeetups: [],
    joinedMeetups: [],
    createdMeetups: [],
    isCreatingMeetup: false,
    isJoiningMeetup: false,
    filters: {
      distance: 5,
      category: 'all',
      timeRange: 'upcoming',
    },
  },
  map: {
    center: null,
    zoom: 15,
    userLocation: null,
    isMapInitialized: false,
    isLocationLoading: false,
    visibleMarkers: [],
    activeMarkerId: null,
  },
  user: {
    profile: null,
    isAuthenticated: false,
    isProfileLoading: false,
    preferences: {},
    notifications: [],
  },
  ui: {
    bottomSheetState: 'collapsed',
    activeModal: null,
    isMenuOpen: false,
    toasts: [],
    currentTab: 'nearby',
    isLoading: false,
    errors: {},
  },
};

// Reducer with namespaced actions
const reducer = (state: ComponentState, action: ComponentAction): ComponentState => {
  switch (action.type) {
    // Meetup actions
    case ActionType.SET_ACTIVE_MEETUP:
      return {
        ...state,
        meetup: {
          ...state.meetup,
          activeMeetup: action.payload,
        },
      };
    case ActionType.SET_NEARBY_MEETUPS:
      return {
        ...state,
        meetup: {
          ...state.meetup,
          nearbyMeetups: action.payload,
        },
      };
    case ActionType.SET_JOINED_MEETUPS:
      return {
        ...state,
        meetup: {
          ...state.meetup,
          joinedMeetups: action.payload,
        },
      };
    case ActionType.SET_CREATED_MEETUPS:
      return {
        ...state,
        meetup: {
          ...state.meetup,
          createdMeetups: action.payload,
        },
      };
    case ActionType.SET_CREATING_MEETUP:
      return {
        ...state,
        meetup: {
          ...state.meetup,
          isCreatingMeetup: action.payload,
        },
      };
    case ActionType.SET_JOINING_MEETUP:
      return {
        ...state,
        meetup: {
          ...state.meetup,
          isJoiningMeetup: action.payload,
        },
      };
    case ActionType.UPDATE_FILTERS:
      return {
        ...state,
        meetup: {
          ...state.meetup,
          filters: {
            ...state.meetup.filters,
            ...action.payload,
          },
        },
      };

    // Map actions
    case ActionType.SET_MAP_CENTER:
      return {
        ...state,
        map: {
          ...state.map,
          center: action.payload,
        },
      };
    case ActionType.SET_MAP_ZOOM:
      return {
        ...state,
        map: {
          ...state.map,
          zoom: action.payload,
        },
      };
    case ActionType.SET_USER_LOCATION:
      return {
        ...state,
        map: {
          ...state.map,
          userLocation: action.payload,
        },
      };
    case ActionType.SET_MAP_INITIALIZED:
      return {
        ...state,
        map: {
          ...state.map,
          isMapInitialized: action.payload,
        },
      };
    case ActionType.SET_LOCATION_LOADING:
      return {
        ...state,
        map: {
          ...state.map,
          isLocationLoading: action.payload,
        },
      };
    case ActionType.SET_VISIBLE_MARKERS:
      return {
        ...state,
        map: {
          ...state.map,
          visibleMarkers: action.payload,
        },
      };
    case ActionType.SET_ACTIVE_MARKER_ID:
      return {
        ...state,
        map: {
          ...state.map,
          activeMarkerId: action.payload,
        },
      };

    // User actions
    case ActionType.SET_USER_PROFILE:
      return {
        ...state,
        user: {
          ...state.user,
          profile: action.payload,
        },
      };
    case ActionType.SET_AUTHENTICATED:
      return {
        ...state,
        user: {
          ...state.user,
          isAuthenticated: action.payload,
        },
      };
    case ActionType.SET_PROFILE_LOADING:
      return {
        ...state,
        user: {
          ...state.user,
          isProfileLoading: action.payload,
        },
      };
    case ActionType.UPDATE_PREFERENCES:
      return {
        ...state,
        user: {
          ...state.user,
          preferences: {
            ...state.user.preferences,
            ...action.payload,
          },
        },
      };
    case ActionType.SET_NOTIFICATIONS:
      return {
        ...state,
        user: {
          ...state.user,
          notifications: action.payload,
        },
      };

    // UI actions
    case ActionType.SET_BOTTOM_SHEET_STATE:
      return {
        ...state,
        ui: {
          ...state.ui,
          bottomSheetState: action.payload,
        },
      };
    case ActionType.SET_ACTIVE_MODAL:
      return {
        ...state,
        ui: {
          ...state.ui,
          activeModal: action.payload,
        },
      };
    case ActionType.SET_MENU_OPEN:
      return {
        ...state,
        ui: {
          ...state.ui,
          isMenuOpen: action.payload,
        },
      };
    case ActionType.ADD_TOAST:
      return {
        ...state,
        ui: {
          ...state.ui,
          toasts: [
            ...state.ui.toasts,
            {
              id: action.payload.id ?? Date.now(),
              ...action.payload,
            },
          ],
        },
      };
    case ActionType.REMOVE_TOAST:
      return {
        ...state,
        ui: {
          ...state.ui,
          toasts: state.ui.toasts.filter(toast => toast.id !== action.payload),
        },
      };
    case ActionType.SET_CURRENT_TAB:
      return {
        ...state,
        ui: {
          ...state.ui,
          currentTab: action.payload,
        },
      };
    case ActionType.SET_LOADING:
      return {
        ...state,
        ui: {
          ...state.ui,
          isLoading: action.payload,
        },
      };
    case ActionType.SET_ERROR:
      return {
        ...state,
        ui: {
          ...state.ui,
          errors: {
            ...state.ui.errors,
            [action.payload.key]: action.payload.error,
          },
        },
      };
    case ActionType.CLEAR_ERROR:
      const newErrors = { ...state.ui.errors };
      delete newErrors[action.payload];
      return {
        ...state,
        ui: {
          ...state.ui,
          errors: newErrors,
        },
      };

    default:
      return state;
  }
};

interface IComponentStateProviderProps {
  children: ReactNode;
}

// Provider component
export const ComponentStateProvider: React.FC<ComponentStateProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Namespaced action creators
  const meetupActions: MeetupActions = {
    setActiveMeetup: useCallback(
      meetup => dispatch({ type: ActionType.SET_ACTIVE_MEETUP, payload: meetup }),
      []
    ),
    setNearbyMeetups: useCallback(
      meetups => dispatch({ type: ActionType.SET_NEARBY_MEETUPS, payload: meetups }),
      []
    ),
    setJoinedMeetups: useCallback(
      meetups => dispatch({ type: ActionType.SET_JOINED_MEETUPS, payload: meetups }),
      []
    ),
    setCreatedMeetups: useCallback(
      meetups => dispatch({ type: ActionType.SET_CREATED_MEETUPS, payload: meetups }),
      []
    ),
    setCreatingMeetup: useCallback(
      isCreating => dispatch({ type: ActionType.SET_CREATING_MEETUP, payload: isCreating }),
      []
    ),
    setJoiningMeetup: useCallback(
      isJoining => dispatch({ type: ActionType.SET_JOINING_MEETUP, payload: isJoining }),
      []
    ),
    updateFilters: useCallback(
      filters => dispatch({ type: ActionType.UPDATE_FILTERS, payload: filters }),
      []
    ),
  };

  const mapActions: MapActions = {
    setMapCenter: useCallback(
      center => dispatch({ type: ActionType.SET_MAP_CENTER, payload: center }),
      []
    ),
    setMapZoom: useCallback(zoom => dispatch({ type: ActionType.SET_MAP_ZOOM, payload: zoom }), []),
    setUserLocation: useCallback(
      location => dispatch({ type: ActionType.SET_USER_LOCATION, payload: location }),
      []
    ),
    setMapInitialized: useCallback(
      isInitialized => dispatch({ type: ActionType.SET_MAP_INITIALIZED, payload: isInitialized }),
      []
    ),
    setLocationLoading: useCallback(
      isLoading => dispatch({ type: ActionType.SET_LOCATION_LOADING, payload: isLoading }),
      []
    ),
    setVisibleMarkers: useCallback(
      markers => dispatch({ type: ActionType.SET_VISIBLE_MARKERS, payload: markers }),
      []
    ),
    setActiveMarkerId: useCallback(
      markerId => dispatch({ type: ActionType.SET_ACTIVE_MARKER_ID, payload: markerId }),
      []
    ),
  };

  const userActions: UserActions = {
    setUserProfile: useCallback(
      profile => dispatch({ type: ActionType.SET_USER_PROFILE, payload: profile }),
      []
    ),
    setAuthenticated: useCallback(
      isAuthenticated => dispatch({ type: ActionType.SET_AUTHENTICATED, payload: isAuthenticated }),
      []
    ),
    setProfileLoading: useCallback(
      isLoading => dispatch({ type: ActionType.SET_PROFILE_LOADING, payload: isLoading }),
      []
    ),
    updatePreferences: useCallback(
      preferences => dispatch({ type: ActionType.UPDATE_PREFERENCES, payload: preferences }),
      []
    ),
    setNotifications: useCallback(
      notifications => dispatch({ type: ActionType.SET_NOTIFICATIONS, payload: notifications }),
      []
    ),
  };

  const uiActions: UIActions = {
    setBottomSheetState: useCallback(
      state => dispatch({ type: ActionType.SET_BOTTOM_SHEET_STATE, payload: state }),
      []
    ),
    setActiveModal: useCallback(
      modal => dispatch({ type: ActionType.SET_ACTIVE_MODAL, payload: modal }),
      []
    ),
    setMenuOpen: useCallback(
      isOpen => dispatch({ type: ActionType.SET_MENU_OPEN, payload: isOpen }),
      []
    ),
    addToast: useCallback(
      toast => dispatch({ type: ActionType.ADD_TOAST, payload: { ...toast } }),
      []
    ),
    removeToast: useCallback(id => dispatch({ type: ActionType.REMOVE_TOAST, payload: id }), []),
    setCurrentTab: useCallback(
      tab => dispatch({ type: ActionType.SET_CURRENT_TAB, payload: tab }),
      []
    ),
    setLoading: useCallback(
      isLoading => dispatch({ type: ActionType.SET_LOADING, payload: isLoading }),
      []
    ),
    setError: useCallback(
      (key, error) => dispatch({ type: ActionType.SET_ERROR, payload: { key, error } }),
      []
    ),
    clearError: useCallback(key => dispatch({ type: ActionType.CLEAR_ERROR, payload: key }), []),
  };

  // Combined context value with state and actions
  const contextValue: ComponentStateContextType = {
    state,
    actions: {
      meetup: meetupActions,
      map: mapActions,
      user: userActions,
      ui: uiActions,
    },
  };

  return (
    <ComponentStateContext.Provider value={contextValue}>{children}</ComponentStateContext.Provider>
  );
};

// Custom hooks for accessing the context
export const useComponentState = (): ComponentStateContextType => {
  const context = useContext(ComponentStateContext);
  if (!context) {
    throw new Error('useComponentState must be used within a ComponentStateProvider');
  }
  return context;
};

// Specialized hooks for specific sections of state
export const useMeetupState = () => {
  const { state, actions } = useComponentState();
  return { meetupState: state.meetup, meetupActions: actions.meetup };
};

export const useMapState = () => {
  const { state, actions } = useComponentState();
  return { mapState: state.map, mapActions: actions.map };
};

export const useUserState = () => {
  const { state, actions } = useComponentState();
  return { userState: state.user, userActions: actions.user };
};

export const useUIState = () => {
  const { state, actions } = useComponentState();
  return { uiState: state.ui, uiActions: actions.ui };
};

export default ComponentStateProvider;
