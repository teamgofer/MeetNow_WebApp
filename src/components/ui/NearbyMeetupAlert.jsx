import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaMapMarkerAlt, FaTimes } from 'react-icons/fa';

/**
 * A notification component that appears when meetups are found near the user's location
 */
const NearbyMeetupAlert = ({ 
  meetups = [], 
  onView,
  onClose,
  autoHideAfter = 8000 // Auto-hide after 8 seconds by default
}) => {
  const [visible, setVisible] = useState(false);
  
  // Show the notification when meetups are provided
  useEffect(() => {
    if (meetups && meetups.length > 0) {
      setVisible(true);
      
      // Auto-hide after specified time
      const timer = setTimeout(() => {
        setVisible(false);
      }, autoHideAfter);
      
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [meetups, autoHideAfter]);
  
  // Don't render anything if not visible or no meetups
  if (!visible || !meetups.length) return null;
  
  const handleView = () => {
    setVisible(false);
    if (onView) onView();
  };
  
  const handleClose = (e) => {
    e.stopPropagation();
    setVisible(false);
    if (onClose) onClose();
  };
  
  // Get closest meetup distance for display
  const getClosestMeetupDistance = () => {
    if (!meetups.length) return null;
    
    // Find meetup with minimum distance
    const closest = meetups.reduce((min, meetup) => {
      const distance = meetup.distance_meters || 
                      (meetup.distance_formatted ? 
                        parseFloat(meetup.distance_formatted.replace(/[^0-9.]/g, '')) * 
                        (meetup.distance_formatted.includes('km') ? 1000 : 1) : 
                        Infinity);
      return distance < min.distance ? { meetup, distance } : min;
    }, { meetup: null, distance: Infinity });
    
    if (closest.meetup && closest.meetup.distance_formatted) {
      return closest.meetup.distance_formatted;
    }
    
    if (closest.distance < 1000) {
      return `${Math.round(closest.distance)}m`;
    }
    return `${(closest.distance / 1000).toFixed(1)}km`;
  };

  return (
    <div 
      className="nearby-meetup-alert"
      onClick={handleView}
      role="alert"
    >
      <div className="nearby-meetup-alert-icon">
        <FaMapMarkerAlt size={18} />
      </div>
      <div className="nearby-meetup-alert-content">
        <h4 className="nearby-meetup-alert-title">
          {meetups.length === 1 ? '1 Meetup Nearby' : `${meetups.length} Meetups Nearby`}
        </h4>
        <p className="nearby-meetup-alert-message">
          {meetups.length === 1 
            ? `There is a meetup ${getClosestMeetupDistance()} away from you` 
            : `The closest is ${getClosestMeetupDistance()} away from you`}
        </p>
      </div>
      <button 
        className="nearby-meetup-alert-close" 
        onClick={handleClose}
        aria-label="Close notification"
      >
        <FaTimes size={16} />
      </button>
      
      <style>{`
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
      `}</style>
    </div>
  );
};

NearbyMeetupAlert.propTypes = {
  meetups: PropTypes.array,
  onView: PropTypes.func,
  onClose: PropTypes.func,
  autoHideAfter: PropTypes.number
};

export default NearbyMeetupAlert; 