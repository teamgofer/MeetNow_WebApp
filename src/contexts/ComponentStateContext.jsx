import React, { createContext, useContext, useReducer, useCallback } from 'react';
import PropTypes from 'prop-types';

// Create context for component state management
const ComponentStateContext = createContext(null);

// Initial state structure with namespaces for different component areas
const initialState = {
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
      timeRange: 'upcoming'
    }
  },
  map: {
    center: null,
    zoom: 15,
    userLocation: null,
    isMapInitialized: false,
    isLocationLoading: false,
    visibleMarkers: [],
    activeMarkerId: null
  },
  user: {
    profile: null,
    isAuthenticated: false,
    isProfileLoading: false,
    preferences: {},
    notifications: []
  },
  ui: {
    bottomSheetState: 'collapsed',
    activeModal: null,
    isMenuOpen: false,
    toasts: [],
    currentTab: 'nearby',
    isLoading: false,
    errors: {}
  }
};

// Action types
const ActionTypes = {
  // Meetup actions
  SET_ACTIVE_MEETUP: 'SET_ACTIVE_MEETUP',
  SET_NEARBY_MEETUPS: 'SET_NEARBY_MEETUPS',
  SET_JOINED_MEETUPS: 'SET_JOINED_MEETUPS',
  SET_CREATED_MEETUPS: 'SET_CREATED_MEETUPS',
  SET_CREATING_MEETUP: 'SET_CREATING_MEETUP',
  SET_JOINING_MEETUP: 'SET_JOINING_MEETUP',
  UPDATE_FILTERS: 'UPDATE_FILTERS',
  
  // Map actions
  SET_MAP_CENTER: 'SET_MAP_CENTER',
  SET_MAP_ZOOM: 'SET_MAP_ZOOM',
  SET_USER_LOCATION: 'SET_USER_LOCATION',
  SET_MAP_INITIALIZED: 'SET_MAP_INITIALIZED',
  SET_LOCATION_LOADING: 'SET_LOCATION_LOADING',
  SET_VISIBLE_MARKERS: 'SET_VISIBLE_MARKERS',
  SET_ACTIVE_MARKER_ID: 'SET_ACTIVE_MARKER_ID',
  
  // User actions
  SET_USER_PROFILE: 'SET_USER_PROFILE',
  SET_AUTHENTICATED: 'SET_AUTHENTICATED',
  SET_PROFILE_LOADING: 'SET_PROFILE_LOADING',
  UPDATE_PREFERENCES: 'UPDATE_PREFERENCES',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  
  // UI actions
  SET_BOTTOM_SHEET_STATE: 'SET_BOTTOM_SHEET_STATE',
  SET_ACTIVE_MODAL: 'SET_ACTIVE_MODAL',
  SET_MENU_OPEN: 'SET_MENU_OPEN',
  ADD_TOAST: 'ADD_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
  SET_CURRENT_TAB: 'SET_CURRENT_TAB',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer with namespaced actions
const reducer = (state, action) => {
  switch (action.type) {
    // Meetup actions
    case ActionTypes.SET_ACTIVE_MEETUP:
      return {
        ...state,
        meetup: {
          ...state.meetup,
          activeMeetup: action.payload
        }
      };
    case ActionTypes.SET_NEARBY_MEETUPS:
      return {
        ...state,
        meetup: {
          ...state.meetup,
          nearbyMeetups: action.payload
        }
      };
    case ActionTypes.SET_JOINED_MEETUPS:
      return {
        ...state,
        meetup: {
          ...state.meetup,
          joinedMeetups: action.payload
        }
      };
    case ActionTypes.SET_CREATED_MEETUPS:
      return {
        ...state,
        meetup: {
          ...state.meetup,
          createdMeetups: action.payload
        }
      };
    case ActionTypes.SET_CREATING_MEETUP:
      return {
        ...state,
        meetup: {
          ...state.meetup,
          isCreatingMeetup: action.payload
        }
      };
    case ActionTypes.SET_JOINING_MEETUP:
      return {
        ...state,
        meetup: {
          ...state.meetup,
          isJoiningMeetup: action.payload
        }
      };
    case ActionTypes.UPDATE_FILTERS:
      return {
        ...state,
        meetup: {
          ...state.meetup,
          filters: {
            ...state.meetup.filters,
            ...action.payload
          }
        }
      };
      
    // Map actions
    case ActionTypes.SET_MAP_CENTER:
      return {
        ...state,
        map: {
          ...state.map,
          center: action.payload
        }
      };
    case ActionTypes.SET_MAP_ZOOM:
      return {
        ...state,
        map: {
          ...state.map,
          zoom: action.payload
        }
      };
    case ActionTypes.SET_USER_LOCATION:
      return {
        ...state,
        map: {
          ...state.map,
          userLocation: action.payload
        }
      };
    case ActionTypes.SET_MAP_INITIALIZED:
      return {
        ...state,
        map: {
          ...state.map,
          isMapInitialized: action.payload
        }
      };
    case ActionTypes.SET_LOCATION_LOADING:
      return {
        ...state,
        map: {
          ...state.map,
          isLocationLoading: action.payload
        }
      };
    case ActionTypes.SET_VISIBLE_MARKERS:
      return {
        ...state,
        map: {
          ...state.map,
          visibleMarkers: action.payload
        }
      };
    case ActionTypes.SET_ACTIVE_MARKER_ID:
      return {
        ...state,
        map: {
          ...state.map,
          activeMarkerId: action.payload
        }
      };
      
    // User actions
    case ActionTypes.SET_USER_PROFILE:
      return {
        ...state,
        user: {
          ...state.user,
          profile: action.payload
        }
      };
    case ActionTypes.SET_AUTHENTICATED:
      return {
        ...state,
        user: {
          ...state.user,
          isAuthenticated: action.payload
        }
      };
    case ActionTypes.SET_PROFILE_LOADING:
      return {
        ...state,
        user: {
          ...state.user,
          isProfileLoading: action.payload
        }
      };
    case ActionTypes.UPDATE_PREFERENCES:
      return {
        ...state,
        user: {
          ...state.user,
          preferences: {
            ...state.user.preferences,
            ...action.payload
          }
        }
      };
    case ActionTypes.SET_NOTIFICATIONS:
      return {
        ...state,
        user: {
          ...state.user,
          notifications: action.payload
        }
      };
      
    // UI actions
    case ActionTypes.SET_BOTTOM_SHEET_STATE:
      return {
        ...state,
        ui: {
          ...state.ui,
          bottomSheetState: action.payload
        }
      };
    case ActionTypes.SET_ACTIVE_MODAL:
      return {
        ...state,
        ui: {
          ...state.ui,
          activeModal: action.payload
        }
      };
    case ActionTypes.SET_MENU_OPEN:
      return {
        ...state,
        ui: {
          ...state.ui,
          isMenuOpen: action.payload
        }
      };
    case ActionTypes.ADD_TOAST:
      return {
        ...state,
        ui: {
          ...state.ui,
          toasts: [...state.ui.toasts, action.payload]
        }
      };
    case ActionTypes.REMOVE_TOAST:
      return {
        ...state,
        ui: {
          ...state.ui,
          toasts: state.ui.toasts.filter(toast => toast.id !== action.payload)
        }
      };
    case ActionTypes.SET_CURRENT_TAB:
      return {
        ...state,
        ui: {
          ...state.ui,
          currentTab: action.payload
        }
      };
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        ui: {
          ...state.ui,
          isLoading: action.payload
        }
      };
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        ui: {
          ...state.ui,
          errors: {
            ...state.ui.errors,
            [action.payload.key]: action.payload.error
          }
        }
      };
    case ActionTypes.CLEAR_ERROR:
      const newErrors = { ...state.ui.errors };
      delete newErrors[action.payload];
      return {
        ...state,
        ui: {
          ...state.ui,
          errors: newErrors
        }
      };
      
    default:
      return state;
  }
};

// Provider component
export const ComponentStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  // Namespaced action creators
  const meetupActions = {
    setActiveMeetup: useCallback((meetup) => 
      dispatch({ type: ActionTypes.SET_ACTIVE_MEETUP, payload: meetup }), []),
    setNearbyMeetups: useCallback((meetups) => 
      dispatch({ type: ActionTypes.SET_NEARBY_MEETUPS, payload: meetups }), []),
    setJoinedMeetups: useCallback((meetups) => 
      dispatch({ type: ActionTypes.SET_JOINED_MEETUPS, payload: meetups }), []),
    setCreatedMeetups: useCallback((meetups) => 
      dispatch({ type: ActionTypes.SET_CREATED_MEETUPS, payload: meetups }), []),
    setCreatingMeetup: useCallback((isCreating) => 
      dispatch({ type: ActionTypes.SET_CREATING_MEETUP, payload: isCreating }), []),
    setJoiningMeetup: useCallback((isJoining) => 
      dispatch({ type: ActionTypes.SET_JOINING_MEETUP, payload: isJoining }), []),
    updateFilters: useCallback((filters) => 
      dispatch({ type: ActionTypes.UPDATE_FILTERS, payload: filters }), [])
  };
  
  const mapActions = {
    setMapCenter: useCallback((center) => 
      dispatch({ type: ActionTypes.SET_MAP_CENTER, payload: center }), []),
    setMapZoom: useCallback((zoom) => 
      dispatch({ type: ActionTypes.SET_MAP_ZOOM, payload: zoom }), []),
    setUserLocation: useCallback((location) => 
      dispatch({ type: ActionTypes.SET_USER_LOCATION, payload: location }), []),
    setMapInitialized: useCallback((isInitialized) => 
      dispatch({ type: ActionTypes.SET_MAP_INITIALIZED, payload: isInitialized }), []),
    setLocationLoading: useCallback((isLoading) => 
      dispatch({ type: ActionTypes.SET_LOCATION_LOADING, payload: isLoading }), []),
    setVisibleMarkers: useCallback((markers) => 
      dispatch({ type: ActionTypes.SET_VISIBLE_MARKERS, payload: markers }), []),
    setActiveMarkerId: useCallback((markerId) => 
      dispatch({ type: ActionTypes.SET_ACTIVE_MARKER_ID, payload: markerId }), [])
  };
  
  const userActions = {
    setUserProfile: useCallback((profile) => 
      dispatch({ type: ActionTypes.SET_USER_PROFILE, payload: profile }), []),
    setAuthenticated: useCallback((isAuthenticated) => 
      dispatch({ type: ActionTypes.SET_AUTHENTICATED, payload: isAuthenticated }), []),
    setProfileLoading: useCallback((isLoading) => 
      dispatch({ type: ActionTypes.SET_PROFILE_LOADING, payload: isLoading }), []),
    updatePreferences: useCallback((preferences) => 
      dispatch({ type: ActionTypes.UPDATE_PREFERENCES, payload: preferences }), []),
    setNotifications: useCallback((notifications) => 
      dispatch({ type: ActionTypes.SET_NOTIFICATIONS, payload: notifications }), [])
  };
  
  const uiActions = {
    setBottomSheetState: useCallback((state) => 
      dispatch({ type: ActionTypes.SET_BOTTOM_SHEET_STATE, payload: state }), []),
    setActiveModal: useCallback((modal) => 
      dispatch({ type: ActionTypes.SET_ACTIVE_MODAL, payload: modal }), []),
    setMenuOpen: useCallback((isOpen) => 
      dispatch({ type: ActionTypes.SET_MENU_OPEN, payload: isOpen }), []),
    addToast: useCallback((toast) => 
      dispatch({ type: ActionTypes.ADD_TOAST, payload: { id: Date.now(), ...toast } }), []),
    removeToast: useCallback((id) => 
      dispatch({ type: ActionTypes.REMOVE_TOAST, payload: id }), []),
    setCurrentTab: useCallback((tab) => 
      dispatch({ type: ActionTypes.SET_CURRENT_TAB, payload: tab }), []),
    setLoading: useCallback((isLoading) => 
      dispatch({ type: ActionTypes.SET_LOADING, payload: isLoading }), []),
    setError: useCallback((key, error) => 
      dispatch({ type: ActionTypes.SET_ERROR, payload: { key, error } }), []),
    clearError: useCallback((key) => 
      dispatch({ type: ActionTypes.CLEAR_ERROR, payload: key }), [])
  };
  
  // Combined context value with state and actions
  const contextValue = {
    state,
    actions: {
      meetup: meetupActions,
      map: mapActions,
      user: userActions,
      ui: uiActions
    }
  };
  
  return (
    <ComponentStateContext.Provider value={contextValue}>
      {children}
    </ComponentStateContext.Provider>
  );
};

ComponentStateProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Custom hooks for accessing the context
export const useComponentState = () => {
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