import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { formatMeetupDistance, formatTimeAgo } from '../../utils/meetup/index';
import { FaTimes, FaWalking, FaClock } from 'react-icons/fa';
import CountdownTimer from '../ui/CountdownTimer';
const SelectedMeetupCard = ({ meetup, onClose, onDirections, }) => {
    const [imageError, setImageError] = useState(false);
    const { title, description, distance, address, expiresAt, signed_image_url, starts_at = new Date().toISOString(), duration_minutes = 60, } = meetup;
    const handleImageError = () => {
        setImageError(true);
    };
    const getStartTimeAndDuration = () => {
        if (!starts_at)
            return { startTime: 'Now', duration: '1 hour' };
        const start = new Date(starts_at);
        const hours = start.getHours();
        const minutes = start.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        const startTime = `${formattedHours}:${formattedMinutes} ${ampm}`;
        const hours_duration = Math.floor(duration_minutes / 60);
        const minutes_remainder = duration_minutes % 60;
        let duration = '';
        if (hours_duration > 0) {
            duration += `${hours_duration} hour${hours_duration !== 1 ? 's' : ''}`;
        }
        if (minutes_remainder > 0) {
            if (duration)
                duration += ' ';
            duration += `${minutes_remainder} minute${minutes_remainder !== 1 ? 's' : ''}`;
        }
        return { startTime, duration: duration || '1 hour' };
    };
    const { startTime, duration } = getStartTimeAndDuration();
    return (_jsxs("div", { className: "selected-meetup-card bg-white shadow-lg rounded-lg overflow-hidden flex flex-col max-w-md w-full max-h-[80vh]", children: [_jsxs("div", { className: "p-4 bg-blue-600 text-white flex justify-between items-center", children: [_jsx("h3", { className: "font-semibold text-xl truncate", children: title }), _jsx("button", { onClick: onClose, className: "text-white hover:bg-blue-700 rounded-full p-1 transition-colors", "aria-label": "Close meetup details", children: _jsx(FaTimes, { size: 18 }) })] }), signed_image_url && !imageError && (_jsx("div", { className: "w-full h-48 bg-gray-200 overflow-hidden", children: _jsx("img", { src: signed_image_url, alt: title, className: "w-full h-full object-cover", onError: handleImageError }) })), _jsxs("div", { className: "p-4 overflow-y-auto flex-grow", children: [_jsxs("div", { className: "flex items-center text-sm text-gray-600 mb-3", children: [_jsx(FaWalking, { className: "mr-2 text-blue-500" }), formatMeetupDistance(distance)] }), _jsxs("div", { className: "flex items-center text-sm text-gray-600 mb-3", children: [_jsx(FaClock, { className: "mr-2 text-blue-500" }), "Started ", formatTimeAgo(starts_at)] }), _jsx("p", { className: "text-gray-800 mb-4 whitespace-pre-wrap", children: description }), _jsxs("div", { className: "bg-gray-100 p-3 rounded-md mb-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-700", children: "Location" }), _jsx("p", { className: "text-gray-600", children: address })] }), _jsxs("div", { className: "bg-gray-100 p-3 rounded-md mb-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-700", children: "Duration" }), _jsxs("p", { className: "text-gray-600", children: [startTime, " \u2022 ", duration] })] }), _jsxs("div", { className: "bg-gray-100 p-3 rounded-md mb-4", children: [_jsx("p", { className: "text-sm font-medium text-gray-700 mb-1", children: "Expires in" }), _jsx(CountdownTimer, { targetDate: new Date(expiresAt) })] })] }), _jsx("div", { className: "p-4 border-t border-gray-200", children: _jsx("button", { onClick: onDirections, className: "w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors", children: "Get Directions" }) })] }));
};
export default SelectedMeetupCard;
//# sourceMappingURL=SelectedMeetupCard.js.map