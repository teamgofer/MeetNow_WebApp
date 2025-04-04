import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import CountdownTimer from '../ui/CountdownTimer';
import { FaTimes, FaDirections, FaMapMarkerAlt, FaPen, FaInfoCircle, FaClock, FaPalette, } from 'react-icons/fa';
import { IoCreateOutline, IoTimeOutline, IoImageOutline } from 'react-icons/io5';
import { formatMeetupDistance } from '../../utils/meetup/index';
import { CardMode } from '../../constants/card-modes';
import { ProgressiveImage } from '../common';
import MeetupImagePreview from '../MeetupImagePreview';
import { getUploadPresignedUrl, getSignedViewUrl } from '../../utils/wasabi-storage';
const colorSchemes = {
    A: {
        background: 'from-indigo-50 via-purple-50/90 to-pink-50/80',
        hover: 'hover:from-indigo-100 hover:via-purple-100/90 hover:to-pink-100/80',
        shimmer: 'from-indigo-100/50 via-purple-100/50 to-pink-100/50',
        text: 'text-indigo-900',
        textSecondary: 'text-indigo-700',
        badge: 'from-indigo-500 to-purple-500',
        item: 'from-indigo-100 to-purple-100',
        scrollbar: 'scrollbar-thumb-indigo-300',
    },
    B: {
        background: 'from-emerald-50 via-orange-50/90 to-rose-50/80',
        hover: 'hover:from-emerald-100 hover:via-orange-100/90 hover:to-rose-100/80',
        shimmer: 'from-emerald-100/50 via-orange-100/50 to-rose-100/50',
        text: 'text-emerald-900',
        textSecondary: 'text-emerald-700',
        badge: 'from-emerald-500 to-orange-500',
        item: 'from-emerald-100 to-orange-100',
        scrollbar: 'scrollbar-thumb-emerald-300',
    },
};
const UnifiedMeetupCard = ({ meetup, locationData, mode: initialMode, onClose, onDirections, onCreateMeetup, onEditMeetup, className = '', isLoading = false, isDirectionsActive = false, awaitingSecondPoint = false, }) => {
    const getInitialMode = () => {
        if (initialMode)
            return initialMode;
        if (meetup)
            return CardMode.MEETUP_DISPLAY;
        if (locationData)
            return CardMode.LOCATION_DISPLAY;
        return CardMode.HIDDEN;
    };
    const [mode, setMode] = useState(getInitialMode());
    const [colorScheme, setColorScheme] = useState('A');
    const toggleColorScheme = () => {
        setColorScheme(prev => (prev === 'A' ? 'B' : 'A'));
    };
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        duration: 60,
        image: null,
    });
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [error, setError] = useState(null);
    const formatDistance = (dist) => {
        if (!dist)
            return '';
        return dist < 1 ? `${Math.round(dist * 1000)}m away` : `${dist.toFixed(1)}km away`;
    };
    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const date = new Date(timestamp);
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (seconds < 60) {
            return 'just now';
        }
        if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        }
        if (seconds < 86400) {
            const hours = Math.floor(seconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        }
        if (seconds < 604800) {
            const days = Math.floor(seconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }
        return date.toLocaleDateString();
    };
    const handleImageError = (e) => {
        e.currentTarget.src = 'https://via.placeholder.com/400x200';
        e.currentTarget.style.opacity = '0.7';
    };
    const getStartTimeAndDuration = () => {
        if (!meetup)
            return { starts_at: '', durationMinutes: 60 };
        if (meetup.starts_at) {
            return {
                starts_at: meetup.starts_at,
                durationMinutes: meetup.duration_minutes || 60,
            };
        }
        if (meetup.createdAt && meetup.expiresAt) {
            const createdDate = new Date(meetup.createdAt);
            const expiresDate = new Date(meetup.expiresAt);
            const durationMs = expiresDate.getTime() - createdDate.getTime();
            const durationMinutes = Math.round(durationMs / (1000 * 60));
            return {
                starts_at: meetup.createdAt,
                durationMinutes,
            };
        }
        return {
            starts_at: meetup.createdAt,
            durationMinutes: 60,
        };
    };
    const formatCoordinates = (lat, lon) => {
        return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    };
    const handleSwitchMode = (newMode) => {
        setMode(newMode);
    };
    const handleGetDirections = () => {
        console.log('Get directions button clicked', {
            isDirectionsActive,
            mode,
            hasMeetup: !!meetup,
            hasLocationData: !!locationData,
        });
        if (onDirections) {
            if (mode === CardMode.MEETUP_DISPLAY && meetup) {
                console.log('Calling onDirections with meetup', meetup.title);
                onDirections(meetup);
            }
            else if ((mode === CardMode.LOCATION_DISPLAY || mode === CardMode.CREATE_FORM) &&
                locationData) {
                console.log('Calling onDirections with location', locationData.display_name);
                onDirections(locationData);
            }
        }
        else if (locationData) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${locationData.lat},${locationData.lon}`, '_blank');
        }
        else if (meetup && Array.isArray(meetup.position)) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${meetup.position[0]},${meetup.position[1]}`, '_blank');
        }
    };
    const handleImageSelected = (file) => {
        setSelectedImageFile(file);
        if (!file && imagePreview) {
            setImagePreview(null);
            setFormData(prev => ({
                ...prev,
                image: null,
                image_url: undefined,
            }));
            return;
        }
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };
    const handleCreateMeetup = async () => {
        if (mode === CardMode.CREATE_FORM && locationData && onCreateMeetup) {
            try {
                setError(null);
                if (!formData.title.trim()) {
                    setError('Please enter a title for your meetup');
                    return;
                }
                if (isLoading)
                    return;
                let finalFormData = { ...formData };
                if (selectedImageFile) {
                    try {
                        const timestamp = Date.now();
                        const extension = selectedImageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
                        const path = `meetups/meetup_${timestamp}.${extension}`;
                        const uploadUrlResult = await getUploadPresignedUrl(path, selectedImageFile.type, 7200, true);
                        if (!uploadUrlResult.success || !uploadUrlResult.uploadUrl) {
                            throw new Error('Failed to get upload URL');
                        }
                        const uploadResponse = await fetch(uploadUrlResult.uploadUrl, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': selectedImageFile.type,
                            },
                            body: selectedImageFile,
                        });
                        if (!uploadResponse.ok) {
                            throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
                        }
                        if (uploadUrlResult.path) {
                            const signedUrl = await getSignedViewUrl(uploadUrlResult.path, 86400, true);
                            finalFormData = {
                                ...finalFormData,
                                image_url: uploadUrlResult.path,
                            };
                        }
                        else {
                            console.error('Failed to get a valid path from upload');
                        }
                    }
                    catch (err) {
                        if (err instanceof Error) {
                            setError(`Image upload failed: ${err.message}`);
                        }
                        else {
                            setError('Image upload failed due to an unknown error');
                        }
                        return;
                    }
                }
                await onCreateMeetup({
                    ...finalFormData,
                    location: locationData,
                });
                setFormData({
                    title: '',
                    description: '',
                    duration: 60,
                    image: null,
                });
                setSelectedImageFile(null);
                setImagePreview(null);
                onClose();
            }
            catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                }
                else {
                    setError('An error occurred while creating the meetup');
                }
            }
        }
        else if (mode === CardMode.LOCATION_DISPLAY && locationData) {
            handleSwitchMode(CardMode.CREATE_FORM);
        }
    };
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };
    if (mode === CardMode.HIDDEN || (!meetup && !locationData)) {
        return null;
    }
    const { starts_at, durationMinutes } = getStartTimeAndDuration();
    const colors = colorSchemes[colorScheme];
    return (_jsxs("div", { className: `unified-meetup-card relative bg-gradient-to-br ${colors.background} backdrop-blur-sm shadow-xl rounded-lg overflow-hidden max-w-xl w-full mx-auto transition-all duration-300 ${className}`, children: [_jsx("button", { className: "absolute top-3 right-3 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg text-gray-700 hover:bg-white/90 transition-all duration-200", onClick: toggleColorScheme, "aria-label": "Toggle color scheme", children: _jsx(FaPalette, { className: "text-lg" }) }), _jsx("button", { className: "absolute top-3 right-12 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg text-gray-700 hover:bg-white/90 transition-all duration-200", onClick: onClose, "aria-label": "Close", children: _jsx(FaTimes, {}) }), mode === CardMode.MEETUP_DISPLAY && meetup && (_jsxs(_Fragment, { children: [meetup.signed_image_url || meetup.image_url ? (_jsx("div", { className: "w-full h-48 relative", children: _jsx(ProgressiveImage, { src: meetup.signed_image_url || meetup.image_url || '', alt: meetup.title, className: "w-full h-full", width: "100%", height: "100%", objectFit: "cover", placeholderColor: "#e5e7eb", fallbackSrc: "https://via.placeholder.com/400x200", loading: "lazy", onError: handleImageError }) })) : (_jsx("div", { className: `w-full h-16 bg-gradient-to-r ${colors.badge}` })), _jsxs("div", { className: "p-4 mb-3", children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsx("h2", { className: `text-xl font-semibold ${colors.text} leading-tight`, children: meetup.title || 'Unnamed Meetup' }), meetup.distance !== undefined && (_jsx("span", { className: `text-xs ${colors.textSecondary} font-medium bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm`, children: formatMeetupDistance(meetup.distance) }))] }), meetup.description && (_jsx("p", { className: `text-sm ${colors.textSecondary} mb-3`, children: meetup.description })), meetup.address && (_jsxs("div", { className: "flex items-start mb-3", children: [_jsx("div", { className: `w-4 h-4 mt-0.5 mr-2 ${colors.textSecondary} flex-shrink-0`, children: _jsx(FaMapMarkerAlt, {}) }), _jsx("p", { className: `text-sm ${colors.textSecondary} flex-1`, children: meetup.address })] })), _jsxs("div", { className: "flex items-center mb-3", children: [_jsx("div", { className: `w-4 h-4 mr-2 ${colors.textSecondary}`, children: _jsx(FaClock, {}) }), _jsxs("div", { className: "text-sm", children: [_jsx("span", { className: colors.textSecondary, children: "Started " }), _jsx("span", { className: `font-medium ${colors.text}`, children: formatTimeAgo(starts_at) })] })] }), _jsx("div", { className: `bg-white/80 backdrop-blur-sm rounded-md p-2 mb-3 shadow-sm`, children: _jsx(CountdownTimer, { starts_at: starts_at, durationMinutes: durationMinutes }) }), imagePreview && (_jsxs("div", { className: "relative h-32 bg-white/80 backdrop-blur-sm rounded-md overflow-hidden shadow-sm", children: [_jsx(ProgressiveImage, { src: imagePreview, alt: "Meetup preview", className: "w-full h-full", width: "100%", height: "100%", objectFit: "cover", placeholderColor: "#e5e7eb", loading: "eager" }), _jsx("button", { type: "button", onClick: () => {
                                            setImagePreview(null);
                                            setSelectedImageFile(null);
                                            setFormData(prev => ({
                                                ...prev,
                                                image: null,
                                                image_url: undefined,
                                            }));
                                        }, className: "absolute top-2 right-2 bg-white/80 backdrop-blur-sm rounded-full p-1 text-gray-700 hover:text-red-500 shadow-sm", "aria-label": "Remove image", children: _jsx(FaTimes, {}) })] })), _jsxs("div", { className: "flex justify-between mt-4", children: [_jsxs("button", { className: `px-4 py-2 bg-gradient-to-r ${colors.badge} text-white rounded-md hover:opacity-90 transition-all duration-200 flex items-center shadow-sm`, onClick: handleGetDirections, children: [_jsx(FaDirections, { className: "mr-1" }), awaitingSecondPoint
                                                ? 'Select another point to trace the route'
                                                : isDirectionsActive
                                                    ? 'To Another Spot'
                                                    : 'Get Directions'] }), onEditMeetup && (_jsxs("button", { className: `px-4 py-2 bg-gradient-to-r ${colors.item} ${colors.text} rounded-md hover:opacity-90 transition-all duration-200 flex items-center shadow-sm`, onClick: () => handleSwitchMode(CardMode.EDIT_FORM), children: [_jsx(FaPen, { className: "mr-1" }), "Edit"] })), _jsx("button", { className: "px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-800 rounded-md hover:bg-white/90 transition-all duration-200 shadow-sm", onClick: onClose, children: "Close" })] })] })] })), mode === CardMode.LOCATION_DISPLAY && locationData && (_jsxs(_Fragment, { children: [_jsx("div", { className: `w-full h-32 bg-gradient-to-r ${colors.badge} flex items-center justify-center`, children: _jsx(FaMapMarkerAlt, { className: "text-white text-5xl" }) }), _jsxs("div", { className: "p-4 mb-3", children: [_jsx("h2", { className: `text-xl font-semibold ${colors.text} leading-tight mb-2`, children: locationData.display_name?.split(',')[0] || 'Selected Location' }), _jsxs("div", { className: "flex items-start mb-3", children: [_jsx("div", { className: `w-4 h-4 mt-0.5 mr-2 ${colors.textSecondary} flex-shrink-0`, children: _jsx(FaMapMarkerAlt, {}) }), _jsx("p", { className: `text-sm ${colors.textSecondary} flex-1`, children: locationData.display_name || 'No address available' })] }), _jsxs("div", { className: "bg-white/80 backdrop-blur-sm rounded-md p-3 mb-4 shadow-sm", children: [_jsx("p", { className: `text-xs ${colors.textSecondary} mb-1`, children: "Coordinates" }), _jsx("p", { className: `text-sm font-mono ${colors.text}`, children: formatCoordinates(locationData.lat, locationData.lon) })] }), _jsxs("div", { className: "flex justify-between mt-4", children: [onCreateMeetup && (_jsxs("button", { className: `px-4 py-2 bg-gradient-to-r ${colors.badge} text-white rounded-md hover:opacity-90 transition-all duration-200 flex items-center shadow-sm`, onClick: handleCreateMeetup, children: [_jsx(IoCreateOutline, { className: "mr-1" }), "Create Meetup"] })), _jsxs("button", { className: `px-4 py-2 bg-gradient-to-r ${colors.item} ${colors.text} rounded-md hover:opacity-90 transition-all duration-200 flex items-center shadow-sm`, onClick: handleGetDirections, children: [_jsx(FaDirections, { className: "mr-1" }), awaitingSecondPoint
                                                ? 'Select another point to trace the route'
                                                : isDirectionsActive
                                                    ? 'To Another Spot'
                                                    : 'Get Directions'] }), _jsx("button", { className: "px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-800 rounded-md hover:bg-white/90 transition-all duration-200 shadow-sm", onClick: onClose, children: "Close" })] })] })] })), mode === CardMode.CREATE_FORM && locationData && (_jsxs(_Fragment, { children: [_jsxs("div", { className: `w-full h-16 bg-gradient-to-r ${colors.badge} flex items-center justify-center`, children: [_jsx(IoCreateOutline, { className: "text-white text-3xl mr-2" }), _jsx("h2", { className: "text-xl font-semibold text-white", children: "Create Meetup" })] }), _jsxs("div", { className: "p-4", children: [_jsxs("div", { className: `mb-4 text-sm bg-white/80 backdrop-blur-sm p-3 rounded-md flex items-start shadow-sm`, children: [_jsx(FaInfoCircle, { className: `${colors.textSecondary} mr-2 mt-0.5 flex-shrink-0` }), _jsxs("div", { children: [_jsx("p", { className: `font-medium ${colors.text} mb-1`, children: "Selected Location" }), _jsx("p", { className: colors.textSecondary, children: locationData.display_name || 'Unknown location' })] })] }), error && (_jsx("div", { className: "mb-4 text-sm bg-red-50 p-3 rounded-md text-red-700", children: error })), _jsxs("form", { onSubmit: e => {
                                    e.preventDefault();
                                    handleCreateMeetup();
                                }, children: [_jsxs("div", { className: "mb-4", children: [_jsx("label", { className: `block text-sm font-medium ${colors.text} mb-1`, htmlFor: "title", children: "Title" }), _jsx("input", { id: "title", name: "title", type: "text", value: formData.title, onChange: handleInputChange, className: `w-full p-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-opacity-50 focus:ring-${colors.text} focus:border-${colors.text} shadow-sm`, placeholder: "What's this meetup about?", required: true, maxLength: 100, disabled: isLoading })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: `block text-sm font-medium ${colors.text} mb-1`, htmlFor: "description", children: "Description" }), _jsx("textarea", { id: "description", name: "description", value: formData.description, onChange: handleInputChange, className: `w-full p-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-opacity-50 focus:ring-${colors.text} focus:border-${colors.text} shadow-sm`, placeholder: "Add some details about your meetup...", rows: 3, maxLength: 500, disabled: isLoading })] }), _jsxs("div", { className: "mb-4", children: [_jsxs("label", { className: `block text-sm font-medium ${colors.text} mb-1`, htmlFor: "duration", children: [_jsx(IoTimeOutline, { className: "inline mr-1" }), "Duration"] }), _jsxs("select", { id: "duration", name: "duration", value: formData.duration, onChange: handleInputChange, className: `w-full p-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-opacity-50 focus:ring-${colors.text} focus:border-${colors.text} shadow-sm`, disabled: isLoading, children: [_jsx("option", { value: 30, children: "30 minutes" }), _jsx("option", { value: 60, children: "1 hour" }), _jsx("option", { value: 120, children: "2 hours" }), _jsx("option", { value: 180, children: "3 hours" }), _jsx("option", { value: 240, children: "4 hours" })] })] }), _jsxs("div", { className: "mb-4", children: [_jsxs("label", { className: `block text-sm font-medium ${colors.text} mb-1`, children: [_jsx(IoImageOutline, { className: "inline mr-1" }), "Image (optional)"] }), !imagePreview ? (_jsx("div", { className: `w-full p-3 border-2 border-dashed border-gray-300 rounded-md hover:border-${colors.text} transition-colors bg-white/80 backdrop-blur-sm shadow-sm`, children: _jsx(MeetupImagePreview, { onImageSelected: handleImageSelected, className: "w-full" }) })) : (_jsxs("div", { className: "relative h-32 bg-white/80 backdrop-blur-sm rounded-md overflow-hidden shadow-sm", children: [_jsx(ProgressiveImage, { src: imagePreview, alt: "Meetup preview", className: "w-full h-full", width: "100%", height: "100%", objectFit: "cover", placeholderColor: "#e5e7eb", loading: "eager" }), _jsx("button", { type: "button", onClick: () => {
                                                            setImagePreview(null);
                                                            setSelectedImageFile(null);
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                image: null,
                                                                image_url: undefined,
                                                            }));
                                                        }, className: "absolute top-2 right-2 bg-white/80 backdrop-blur-sm rounded-full p-1 text-gray-700 hover:text-red-500 shadow-sm", "aria-label": "Remove image", children: _jsx(FaTimes, {}) })] }))] }), _jsxs("div", { className: "flex justify-between mt-6", children: [_jsx("button", { type: "button", onClick: () => handleSwitchMode(CardMode.LOCATION_DISPLAY), className: "px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-800 rounded-md hover:bg-white/90 transition-all duration-200 shadow-sm", disabled: isLoading, children: "Back" }), _jsxs("button", { type: "submit", className: `px-4 py-2 ${isLoading ? 'bg-gray-400' : `bg-gradient-to-r ${colors.badge}`} text-white rounded-md transition-all duration-200 flex items-center shadow-sm`, disabled: isLoading, children: [isLoading && (_jsxs("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] })), "Create Meetup"] })] })] })] })] })), mode === CardMode.EDIT_FORM && meetup && (_jsxs("div", { className: "p-4", children: [_jsx("h2", { className: `text-xl font-semibold ${colors.text} mb-4`, children: "Edit Meetup" }), _jsx("p", { className: `${colors.textSecondary} mb-4`, children: "Edit functionality will be implemented in a future update." }), _jsx("button", { className: "px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-800 rounded-md hover:bg-white/90 transition-all duration-200 shadow-sm", onClick: () => handleSwitchMode(CardMode.MEETUP_DISPLAY), children: "Back to Details" })] }))] }));
};
export default UnifiedMeetupCard;
//# sourceMappingURL=UnifiedMeetupCard.js.map