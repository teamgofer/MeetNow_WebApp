import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import { FaBell, FaTimes, FaMapMarkerAlt } from 'react-icons/fa';
const SingleMeetupAlert = ({ meetup, onDismiss, onJoin, className = '' }) => {
    if (!meetup)
        return null;
    return (_jsx("div", { className: `bg-white rounded-lg shadow-lg p-4 ${className}`, children: _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(FaBell, { className: "h-5 w-5 text-blue-500" }) }), _jsxs("div", { className: "ml-3 flex-1", children: [_jsx("h3", { className: "text-sm font-medium text-gray-900", children: "New Meetup Nearby" }), _jsxs("div", { className: "mt-1 text-sm text-gray-500", children: [_jsx("p", { className: "font-medium", children: meetup.title }), _jsx("p", { className: "mt-1", children: meetup.location?.display_name }), _jsx("p", { className: "mt-1", children: new Date(meetup.start_time).toLocaleString() })] }), _jsxs("div", { className: "mt-3 flex space-x-3", children: [_jsx("button", { type: "button", className: "inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", onClick: () => onJoin?.(meetup), children: "Join Meetup" }), _jsxs("button", { type: "button", className: "inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500", onClick: () => onDismiss?.(), children: [_jsx(FaTimes, { className: "mr-1" }), "Dismiss"] })] })] })] }) }));
};
const MultipleMeetupsAlert = ({ meetups = [], onView, onClose, autoHideAfter = 8000, }) => {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        if (meetups && meetups.length > 0) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
            }, autoHideAfter);
            return () => clearTimeout(timer);
        }
        else {
            setVisible(false);
        }
    }, [meetups, autoHideAfter]);
    if (!visible || !meetups.length)
        return null;
    const handleView = () => {
        setVisible(false);
        if (onView)
            onView();
    };
    const handleClose = e => {
        e.stopPropagation();
        setVisible(false);
        if (onClose)
            onClose();
    };
    const getClosestMeetupDistance = () => {
        if (!meetups.length)
            return null;
        const closest = meetups.reduce((min, meetup) => {
            const distance = meetup.distance_meters ||
                (meetup.distance_formatted
                    ? parseFloat(meetup.distance_formatted.replace(/[^0-9.]/g, '')) *
                        (meetup.distance_formatted.includes('km') ? 1000 : 1)
                    : Infinity);
            return distance < min.distance ? { meetup, distance } : min;
        }, { meetup: null, distance: Infinity });
        if (closest.meetup?.distance_formatted) {
            return closest.meetup.distance_formatted;
        }
        if (closest.distance < 1000) {
            return `${Math.round(closest.distance)}m`;
        }
        return `${(closest.distance / 1000).toFixed(1)}km`;
    };
    return (_jsxs("div", { className: "nearby-meetup-alert", onClick: handleView, role: "alert", children: [_jsx("div", { className: "nearby-meetup-alert-icon", children: _jsx(FaMapMarkerAlt, { size: 18 }) }), _jsxs("div", { className: "nearby-meetup-alert-content", children: [_jsx("h4", { className: "nearby-meetup-alert-title", children: meetups.length === 1 ? '1 Meetup Nearby' : `${meetups.length} Meetups Nearby` }), _jsx("p", { className: "nearby-meetup-alert-message", children: meetups.length === 1
                            ? `There is a meetup ${getClosestMeetupDistance()} away from you`
                            : `The closest is ${getClosestMeetupDistance()} away from you` })] }), _jsx("button", { className: "nearby-meetup-alert-close", onClick: handleClose, "aria-label": "Close notification", children: _jsx(FaTimes, { size: 16 }) }), _jsx("style", { children: `
        .nearby-meetup-alert {
          position: fixed;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          max-width: 90%;
          width: 340px;
          background: var(--background, #fff);
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
          padding: 16px;
          display: flex;
          align-items: center;
          z-index: 1000;
          animation: slideUp 0.3s ease-out;
          cursor: pointer;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .nearby-meetup-alert:hover {
          transform: translateX(-50%) translateY(-3px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
        }
        
        .nearby-meetup-alert-icon {
          background: var(--primary, #3b82f6);
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          flex-shrink: 0;
        }
        
        .nearby-meetup-alert-content {
          flex: 1;
        }
        
        .nearby-meetup-alert-title {
          font-weight: 600;
          font-size: 16px;
          margin: 0 0 4px 0;
        }
        
        .nearby-meetup-alert-message {
          font-size: 14px;
          margin: 0;
          color: var(--muted, #64748b);
        }
        
        .nearby-meetup-alert-close {
          background: transparent;
          border: none;
          color: var(--muted, #64748b);
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 8px;
        }
        
        .nearby-meetup-alert-close:hover {
          background: rgba(0, 0, 0, 0.05);
          color: var(--foreground, #000);
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        @media (max-width: 768px) {
          .nearby-meetup-alert {
            bottom: 70px;
            width: calc(100% - 32px);
          }
        }
      ` })] }));
};
SingleMeetupAlert.propTypes = {
    meetup: PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        location: PropTypes.shape({
            display_name: PropTypes.string,
        }),
        start_time: PropTypes.string.isRequired,
    }),
    onDismiss: PropTypes.func,
    onJoin: PropTypes.func,
    className: PropTypes.string,
};
MultipleMeetupsAlert.propTypes = {
    meetups: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        location: PropTypes.shape({
            display_name: PropTypes.string,
        }),
        distance_meters: PropTypes.number,
        distance_formatted: PropTypes.string,
        start_time: PropTypes.string.isRequired,
    })),
    onView: PropTypes.func,
    onClose: PropTypes.func,
    autoHideAfter: PropTypes.number,
};
export { SingleMeetupAlert, MultipleMeetupsAlert };
export default MultipleMeetupsAlert;
//# sourceMappingURL=NearbyMeetupAlert.js.map