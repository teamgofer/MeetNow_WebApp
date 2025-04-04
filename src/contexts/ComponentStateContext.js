import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useReducer, useCallback } from 'react';
var EActionType;
(function (EActionType) {
    EActionType["SET_ACTIVE_MEETUP"] = "SET_ACTIVE_MEETUP";
    EActionType["SET_NEARBY_MEETUPS"] = "SET_NEARBY_MEETUPS";
    EActionType["SET_JOINED_MEETUPS"] = "SET_JOINED_MEETUPS";
    EActionType["SET_CREATED_MEETUPS"] = "SET_CREATED_MEETUPS";
    EActionType["SET_CREATING_MEETUP"] = "SET_CREATING_MEETUP";
    EActionType["SET_JOINING_MEETUP"] = "SET_JOINING_MEETUP";
    EActionType["UPDATE_FILTERS"] = "UPDATE_FILTERS";
    EActionType["SET_MAP_CENTER"] = "SET_MAP_CENTER";
    EActionType["SET_MAP_ZOOM"] = "SET_MAP_ZOOM";
    EActionType["SET_USER_LOCATION"] = "SET_USER_LOCATION";
    EActionType["SET_MAP_INITIALIZED"] = "SET_MAP_INITIALIZED";
    EActionType["SET_LOCATION_LOADING"] = "SET_LOCATION_LOADING";
    EActionType["SET_VISIBLE_MARKERS"] = "SET_VISIBLE_MARKERS";
    EActionType["SET_ACTIVE_MARKER_ID"] = "SET_ACTIVE_MARKER_ID";
    EActionType["SET_USER_PROFILE"] = "SET_USER_PROFILE";
    EActionType["SET_AUTHENTICATED"] = "SET_AUTHENTICATED";
    EActionType["SET_PROFILE_LOADING"] = "SET_PROFILE_LOADING";
    EActionType["UPDATE_PREFERENCES"] = "UPDATE_PREFERENCES";
    EActionType["SET_NOTIFICATIONS"] = "SET_NOTIFICATIONS";
    EActionType["SET_BOTTOM_SHEET_STATE"] = "SET_BOTTOM_SHEET_STATE";
    EActionType["SET_ACTIVE_MODAL"] = "SET_ACTIVE_MODAL";
    EActionType["SET_MENU_OPEN"] = "SET_MENU_OPEN";
    EActionType["ADD_TOAST"] = "ADD_TOAST";
    EActionType["REMOVE_TOAST"] = "REMOVE_TOAST";
    EActionType["SET_CURRENT_TAB"] = "SET_CURRENT_TAB";
    EActionType["SET_LOADING"] = "SET_LOADING";
    EActionType["SET_ERROR"] = "SET_ERROR";
    EActionType["CLEAR_ERROR"] = "CLEAR_ERROR";
})(EActionType || (EActionType = {}));
const ComponentStateContext = createContext(undefined);
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
const reducer = (state, action) => {
    switch (action.type) {
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
export const ComponentStateProvider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const meetupActions = {
        setActiveMeetup: useCallback(meetup => dispatch({ type: ActionType.SET_ACTIVE_MEETUP, payload: meetup }), []),
        setNearbyMeetups: useCallback(meetups => dispatch({ type: ActionType.SET_NEARBY_MEETUPS, payload: meetups }), []),
        setJoinedMeetups: useCallback(meetups => dispatch({ type: ActionType.SET_JOINED_MEETUPS, payload: meetups }), []),
        setCreatedMeetups: useCallback(meetups => dispatch({ type: ActionType.SET_CREATED_MEETUPS, payload: meetups }), []),
        setCreatingMeetup: useCallback(isCreating => dispatch({ type: ActionType.SET_CREATING_MEETUP, payload: isCreating }), []),
        setJoiningMeetup: useCallback(isJoining => dispatch({ type: ActionType.SET_JOINING_MEETUP, payload: isJoining }), []),
        updateFilters: useCallback(filters => dispatch({ type: ActionType.UPDATE_FILTERS, payload: filters }), []),
    };
    const mapActions = {
        setMapCenter: useCallback(center => dispatch({ type: ActionType.SET_MAP_CENTER, payload: center }), []),
        setMapZoom: useCallback(zoom => dispatch({ type: ActionType.SET_MAP_ZOOM, payload: zoom }), []),
        setUserLocation: useCallback(location => dispatch({ type: ActionType.SET_USER_LOCATION, payload: location }), []),
        setMapInitialized: useCallback(isInitialized => dispatch({ type: ActionType.SET_MAP_INITIALIZED, payload: isInitialized }), []),
        setLocationLoading: useCallback(isLoading => dispatch({ type: ActionType.SET_LOCATION_LOADING, payload: isLoading }), []),
        setVisibleMarkers: useCallback(markers => dispatch({ type: ActionType.SET_VISIBLE_MARKERS, payload: markers }), []),
        setActiveMarkerId: useCallback(markerId => dispatch({ type: ActionType.SET_ACTIVE_MARKER_ID, payload: markerId }), []),
    };
    const userActions = {
        setUserProfile: useCallback(profile => dispatch({ type: ActionType.SET_USER_PROFILE, payload: profile }), []),
        setAuthenticated: useCallback(isAuthenticated => dispatch({ type: ActionType.SET_AUTHENTICATED, payload: isAuthenticated }), []),
        setProfileLoading: useCallback(isLoading => dispatch({ type: ActionType.SET_PROFILE_LOADING, payload: isLoading }), []),
        updatePreferences: useCallback(preferences => dispatch({ type: ActionType.UPDATE_PREFERENCES, payload: preferences }), []),
        setNotifications: useCallback(notifications => dispatch({ type: ActionType.SET_NOTIFICATIONS, payload: notifications }), []),
    };
    const uiActions = {
        setBottomSheetState: useCallback(state => dispatch({ type: ActionType.SET_BOTTOM_SHEET_STATE, payload: state }), []),
        setActiveModal: useCallback(modal => dispatch({ type: ActionType.SET_ACTIVE_MODAL, payload: modal }), []),
        setMenuOpen: useCallback(isOpen => dispatch({ type: ActionType.SET_MENU_OPEN, payload: isOpen }), []),
        addToast: useCallback(toast => dispatch({ type: ActionType.ADD_TOAST, payload: { ...toast } }), []),
        removeToast: useCallback(id => dispatch({ type: ActionType.REMOVE_TOAST, payload: id }), []),
        setCurrentTab: useCallback(tab => dispatch({ type: ActionType.SET_CURRENT_TAB, payload: tab }), []),
        setLoading: useCallback(isLoading => dispatch({ type: ActionType.SET_LOADING, payload: isLoading }), []),
        setError: useCallback((key, error) => dispatch({ type: ActionType.SET_ERROR, payload: { key, error } }), []),
        clearError: useCallback(key => dispatch({ type: ActionType.CLEAR_ERROR, payload: key }), []),
    };
    const contextValue = {
        state,
        actions: {
            meetup: meetupActions,
            map: mapActions,
            user: userActions,
            ui: uiActions,
        },
    };
    return (_jsx(ComponentStateContext.Provider, { value: contextValue, children: children }));
};
export const useComponentState = () => {
    const context = useContext(ComponentStateContext);
    if (!context) {
        throw new Error('useComponentState must be used within a ComponentStateProvider');
    }
    return context;
};
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
//# sourceMappingURL=ComponentStateContext.js.map