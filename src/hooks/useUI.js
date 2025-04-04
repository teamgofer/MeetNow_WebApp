import { useState, useCallback } from 'react';
import logger from '../utils/Logger';
const useUI = () => {
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [isMeetupCreatorOpen, setIsMeetupCreatorOpen] = useState(false);
    const [isLocationSearchOpen, setIsLocationSearchOpen] = useState(false);
    const [isMeetupDetailsOpen, setIsMeetupDetailsOpen] = useState(false);
    const [isLoadingOverlayVisible, setIsLoadingOverlayVisible] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [toast, setToast] = useState(null);
    const toggleMapExpanded = useCallback(() => {
        setIsMapExpanded(prev => !prev);
        logger.debug('UI', 'Map expansion toggled', { isExpanded: !isMapExpanded });
    }, [isMapExpanded]);
    const openMeetupCreator = useCallback(() => {
        setIsMeetupCreatorOpen(true);
        logger.debug('UI', 'Meetup creator opened');
    }, []);
    const closeMeetupCreator = useCallback(() => {
        setIsMeetupCreatorOpen(false);
        logger.debug('UI', 'Meetup creator closed');
    }, []);
    const openLocationSearch = useCallback(() => {
        setIsLocationSearchOpen(true);
        logger.debug('UI', 'Location search opened');
    }, []);
    const closeLocationSearch = useCallback(() => {
        setIsLocationSearchOpen(false);
        logger.debug('UI', 'Location search closed');
    }, []);
    const openMeetupDetails = useCallback(() => {
        setIsMeetupDetailsOpen(true);
        logger.debug('UI', 'Meetup details opened');
    }, []);
    const closeMeetupDetails = useCallback(() => {
        setIsMeetupDetailsOpen(false);
        logger.debug('UI', 'Meetup details closed');
    }, []);
    const showLoadingOverlay = useCallback((message = 'Loading...') => {
        setLoadingMessage(message);
        setIsLoadingOverlayVisible(true);
        logger.debug('UI', 'Loading overlay shown', { message });
    }, []);
    const hideLoadingOverlay = useCallback(() => {
        setIsLoadingOverlayVisible(false);
        setLoadingMessage('');
        logger.debug('UI', 'Loading overlay hidden');
    }, []);
    const showToast = useCallback((message, type = 'info') => {
        setToast({ message, type });
        logger.debug('UI', 'Toast shown', { message, type });
    }, []);
    const hideToast = useCallback(() => {
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
//# sourceMappingURL=useUI.js.map