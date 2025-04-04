import React from 'react';
export declare const ComponentStateProvider: React.FC<ComponentStateProviderProps>;
export declare const useComponentState: () => ComponentStateContextType;
export declare const useMeetupState: () => {
    meetupState: any;
    meetupActions: any;
};
export declare const useMapState: () => {
    mapState: any;
    mapActions: any;
};
export declare const useUserState: () => {
    userState: any;
    userActions: any;
};
export declare const useUIState: () => {
    uiState: any;
    uiActions: any;
};
export default ComponentStateProvider;
