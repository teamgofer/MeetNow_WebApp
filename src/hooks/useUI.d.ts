export type TToastType = 'info' | 'success' | 'warning' | 'error';
export interface IToast {
    message: string;
    type: TToastType;
}
export interface IUIState {
    isMapExpanded: boolean;
    isMeetupCreatorOpen: boolean;
    isLocationSearchOpen: boolean;
    isMeetupDetailsOpen: boolean;
    isLoadingOverlayVisible: boolean;
    loadingMessage: string;
    toast: IToast | null;
    toggleMapExpanded: () => void;
    openMeetupCreator: () => void;
    closeMeetupCreator: () => void;
    openLocationSearch: () => void;
    closeLocationSearch: () => void;
    openMeetupDetails: () => void;
    closeMeetupDetails: () => void;
    showLoadingOverlay: (message?: string) => void;
    hideLoadingOverlay: () => void;
    showToast: (message: string, type?: TToastType) => void;
    hideToast: () => void;
}
declare const useUI: () => IUIState;
export default useUI;
