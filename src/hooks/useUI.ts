import { useState, useCallback } from 'react';
import logger from '../utils/Logger';

/**
 * Type for toast message types
 */
export type TToastType = 'info' | 'success' | 'warning' | 'error';

/**
 * Interface for toast message
 */
export interface IToast {
  /** The message to display */
  message: string;
  /** The type of toast message */
  type: TToastType;
}

/**
 * Interface for UI state and control functions
 */
export interface IUIState {
  /** Whether the map is expanded */
  isMapExpanded: boolean;
  /** Whether the meetup creator is open */
  isMeetupCreatorOpen: boolean;
  /** Whether the location search is open */
  isLocationSearchOpen: boolean;
  /** Whether the meetup details are open */
  isMeetupDetailsOpen: boolean;
  /** Whether the loading overlay is visible */
  isLoadingOverlayVisible: boolean;
  /** The message to display in the loading overlay */
  loadingMessage: string;
  /** The current toast message */
  toast: IToast | null;
  /** Function to toggle map expansion */
  toggleMapExpanded: () => void;
  /** Function to open the meetup creator */
  openMeetupCreator: () => void;
  /** Function to close the meetup creator */
  closeMeetupCreator: () => void;
  /** Function to open the location search */
  openLocationSearch: () => void;
  /** Function to close the location search */
  closeLocationSearch: () => void;
  /** Function to open meetup details */
  openMeetupDetails: () => void;
  /** Function to close meetup details */
  closeMeetupDetails: () => void;
  /** Function to show the loading overlay */
  showLoadingOverlay: (message?: string) => void;
  /** Function to hide the loading overlay */
  hideLoadingOverlay: () => void;
  /** Function to show a toast message */
  showToast: (message: string, type?: TToastType) => void;
  /** Function to hide the toast message */
  hideToast: () => void;
}

/**
 * Hook for managing UI state and interactions
 * @returns UI state and control functions
 */
const useUI = (): IUIState => {
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);
  const [isMeetupCreatorOpen, setIsMeetupCreatorOpen] = useState<boolean>(false);
  const [isLocationSearchOpen, setIsLocationSearchOpen] = useState<boolean>(false);
  const [isMeetupDetailsOpen, setIsMeetupDetailsOpen] = useState<boolean>(false);
  const [isLoadingOverlayVisible, setIsLoadingOverlayVisible] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [toast, setToast] = useState<IToast | null>(null);

  const toggleMapExpanded = useCallback((): void => {
    setIsMapExpanded(prev => !prev);
    logger.debug('UI', 'Map expansion toggled', { isExpanded: !isMapExpanded });
  }, [isMapExpanded]);

  const openMeetupCreator = useCallback((): void => {
    setIsMeetupCreatorOpen(true);
    logger.debug('UI', 'Meetup creator opened');
  }, []);

  const closeMeetupCreator = useCallback((): void => {
    setIsMeetupCreatorOpen(false);
    logger.debug('UI', 'Meetup creator closed');
  }, []);

  const openLocationSearch = useCallback((): void => {
    setIsLocationSearchOpen(true);
    logger.debug('UI', 'Location search opened');
  }, []);

  const closeLocationSearch = useCallback((): void => {
    setIsLocationSearchOpen(false);
    logger.debug('UI', 'Location search closed');
  }, []);

  const openMeetupDetails = useCallback((): void => {
    setIsMeetupDetailsOpen(true);
    logger.debug('UI', 'Meetup details opened');
  }, []);

  const closeMeetupDetails = useCallback((): void => {
    setIsMeetupDetailsOpen(false);
    logger.debug('UI', 'Meetup details closed');
  }, []);

  const showLoadingOverlay = useCallback((message = 'Loading...'): void => {
    setLoadingMessage(message);
    setIsLoadingOverlayVisible(true);
    logger.debug('UI', 'Loading overlay shown', { message });
  }, []);

  const hideLoadingOverlay = useCallback((): void => {
    setIsLoadingOverlayVisible(false);
    setLoadingMessage('');
    logger.debug('UI', 'Loading overlay hidden');
  }, []);

  const showToast = useCallback((message: string, type: TToastType = 'info'): void => {
    setToast({ message, type });
    logger.debug('UI', 'Toast shown', { message, type });
  }, []);

  const hideToast = useCallback((): void => {
    setToast(null);
    logger.debug('UI', 'Toast hidden');
  }, []);

  return {
    isMapExpanded,
    isMeetupCreatorOpen,
    isLocationSearchOpen,
    isMeetupDetailsOpen,
    isLoadingOverlayVisible,
    loadingMessage,
    toast,
    toggleMapExpanded,
    openMeetupCreator,
    closeMeetupCreator,
    openLocationSearch,
    closeLocationSearch,
    openMeetupDetails,
    closeMeetupDetails,
    showLoadingOverlay,
    hideLoadingOverlay,
    showToast,
    hideToast,
  };
};

export default useUI;
