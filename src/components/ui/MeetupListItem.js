import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/lib/utils';
import CountdownDisplay from './CountdownDisplay';
import StopwatchCountdown from './StopwatchCountdown';
import { Clock } from 'lucide-react';
const colorSchemes = {
    A: {
        background: 'from-indigo-50 via-purple-50/90 to-pink-50/80',
        hover: 'from-indigo-100/30 via-purple-100/20 to-pink-100/30',
        shimmer: 'from-indigo-200/0 via-purple-200/20 to-pink-200/0',
        text: {
            primary: 'text-indigo-900',
            secondary: 'text-purple-700/70',
            hover: 'text-purple-600',
            accent: 'text-indigo-600',
        },
        gradients: {
            badge: 'from-indigo-200 via-purple-200 to-pink-200',
            item: 'from-indigo-100 via-purple-100 to-pink-100',
            hover: 'from-indigo-200 group-hover:via-purple-200 group-hover:to-pink-200',
        },
        scrollbar: 'scrollbar-thumb-purple-200',
        overlay: 'from-indigo-800/50 to-purple-800/50',
    },
    B: {
        background: 'from-emerald-50 via-orange-50/90 to-rose-50/80',
        hover: 'from-emerald-100/30 via-orange-100/20 to-rose-100/30',
        shimmer: 'from-emerald-200/0 via-orange-200/20 to-rose-200/0',
        text: {
            primary: 'text-emerald-900',
            secondary: 'text-orange-700/70',
            hover: 'text-orange-600',
            accent: 'text-emerald-600',
        },
        gradients: {
            badge: 'from-emerald-200 via-orange-200 to-rose-200',
            item: 'from-emerald-100 via-orange-100 to-rose-100',
            hover: 'from-emerald-200 group-hover:via-orange-200 group-hover:to-rose-200',
        },
        scrollbar: 'scrollbar-thumb-orange-200',
        overlay: 'from-emerald-800/50 to-orange-800/50',
    },
};
const placeholderImages = [
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=500&auto=format&fit=crop',
];
export const MeetupListItem = ({ meetup, currentLocation, isSelected, colorScheme, onSelect, onHover, useStopwatch = true, }) => {
    const colors = colorSchemes[colorScheme];
    const calculateDistance = () => {
        const R = 6371;
        const lat1 = (currentLocation.lat * Math.PI) / 180;
        const lat2 = (meetup.location.lat * Math.PI) / 180;
        const dLat = ((meetup.location.lat - currentLocation.lat) * Math.PI) / 180;
        const dLon = ((meetup.location.lng - currentLocation.lng) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
    };
    const getLocationName = (address) => {
        return address.split(',')[0];
    };
    const getMeetupImage = () => {
        const imageIndex = parseInt(meetup.id.substring(0, 8), 16) % placeholderImages.length;
        return meetup.image || placeholderImages[imageIndex];
    };
    return (_jsxs("div", { className: cn('p-1.5 rounded-xl border-none text-sm transition-all duration-300 cursor-pointer', 'shadow-[inset_-1px_-1px_2px_rgba(255,255,255,0.8),_inset_1px_1px_2px_rgba(0,0,0,0.1)]', 'hover:shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.8),_inset_2px_2px_4px_rgba(0,0,0,0.1)]', 'active:shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1),_inset_-1px_-1px_2px_rgba(255,255,255,0.8)]', 'relative overflow-hidden group h-12 hover:h-auto', isSelected
            ? `bg-gradient-to-br ${colors.gradients.item} shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.8),_inset_2px_2px_4px_rgba(0,0,0,0.1)]`
            : 'bg-gradient-to-br from-white via-gray-50/90 to-white'), onClick: () => onSelect(meetup.id), onMouseEnter: () => onHover && onHover(meetup.id), onMouseLeave: () => onHover && onHover(null), children: [_jsxs("div", { className: "absolute inset-0 w-full h-full overflow-hidden", children: [_jsx("img", { src: getMeetupImage(), alt: "", className: "w-full h-full object-cover opacity-20 blur-sm" }), _jsx("div", { className: `absolute inset-0 bg-gradient-to-br ${colors.overlay} opacity-30` })] }), _jsx("div", { className: `absolute inset-0 bg-gradient-to-r ${colors.shimmer} opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%]` }), _jsxs("div", { className: "relative z-10 h-full flex flex-col justify-between", children: [_jsxs("div", { className: "flex items-center justify-between gap-1", children: [_jsxs("div", { className: "flex items-center gap-1 flex-1 min-w-0", children: [_jsx("h4", { className: `font-medium text-sm truncate ${colors.text.primary} group-hover:${colors.text.hover} transition-colors duration-300`, children: meetup.title ?? 'Instant Meetup' }), _jsx("span", { className: `text-xs bg-gradient-to-r ${colors.gradients.badge} px-1.5 py-0.5 rounded-full ${colors.text.primary} font-medium whitespace-nowrap flex-shrink-0 shadow-[0_2px_5px_-1px_rgba(0,0,0,0.1),_0_1px_3px_-1px_rgba(0,0,0,0.1)] border border-white/20 transition-all duration-300 group-hover:shadow-[0_3px_6px_-1px_rgba(0,0,0,0.1),_0_2px_4px_-2px_rgba(0,0,0,0.1)]`, children: calculateDistance() })] }), _jsx("div", { className: `flex items-center bg-gradient-to-r ${colors.gradients.badge} backdrop-blur-sm rounded-full px-1.5 py-0.5 shadow-[0_2px_5px_-1px_rgba(0,0,0,0.1),_0_1px_3px_-1px_rgba(0,0,0,0.1)] border border-white/20 transition-all duration-300 group-hover:shadow-[0_3px_6px_-1px_rgba(0,0,0,0.1),_0_2px_4px_-2px_rgba(0,0,0,0.1)]`, children: _jsx("span", { className: `${colors.text.primary} text-xs font-medium`, children: useStopwatch ? (_jsx(StopwatchCountdown, { expiryTime: new Date(meetup.expires_at), colorScheme: colorScheme, size: 12, displayMode: "hybrid", pillStyle: true, adaptiveDuration: true })) : (_jsxs("div", { className: "flex items-center", children: [_jsx(Clock, { size: 10, className: `mr-1 ${colors.text.primary}` }), _jsx(CountdownDisplay, { expiryTime: meetup.expires_at, className: "text-xs" })] })) }) })] }), _jsxs("div", { className: "overflow-hidden transition-all duration-300 mt-1 group-hover:opacity-100 opacity-0 h-0 group-hover:h-auto", children: [meetup.description && (_jsx("p", { className: `text-xs ${colors.text.secondary} line-clamp-2 group-hover:${colors.text.hover} transition-colors duration-300 mb-1`, children: meetup.description })), _jsx("p", { className: `text-xs ${colors.text.secondary} opacity-70 line-clamp-1 group-hover:${colors.text.hover} transition-colors duration-300`, children: meetup.address })] })] })] }));
};
export default MeetupListItem;
//# sourceMappingURL=MeetupListItem.js.map