import React from 'react';
import PropTypes from 'prop-types';
import withSafeExtraction from '../../hocs/withSafeExtraction';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { withExtractionMonitor } from '../../utils/extraction-monitor';
import { isFeatureEnabled } from '../../config/featureFlags';
import withPerformanceTracking from '../../hocs/withPerformanceTracking';
import OptimizedImage from '../common/OptimizedImage';

/**
 * MeetupCard component displays information about a single meetup
 */
const MeetupCard = ({ meetup, onClick, className = '' }) => {
  const { getResponsiveValue } = useBreakpoint();
  
  // Format distance to display in miles with one decimal place
  const formattedDistance = `${meetup.distance.toFixed(1)} mi`;
  
  // Format date and time for display
  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };
  
  // Responsive card styles
  const cardStyle = getResponsiveValue({
    xs: { padding: '12px', borderRadius: '8px' },
    md: { padding: '16px', borderRadius: '12px' },
    lg: { padding: '20px', borderRadius: '16px' },
    default: { padding: '16px', borderRadius: '12px' }
  });
  
  return (
    <div 
      className={`meetup-card ${className}`}
      style={cardStyle}
      onClick={onClick}
      data-testid={`meetup-card-${meetup.id}`}
      data-extracted={true}
      data-component-id="MeetupCard"
    >
      {/* Meetup image with optimized loading */}
      {meetup.image && (
        <div className="meetup-card-image">
          <OptimizedImage 
            src={meetup.image} 
            alt={meetup.title}
            placeholderColor="#f3f4f6"
            fallbackSrc="/images/placeholder-meetup.jpg"
            objectFit="cover"
          />
        </div>
      )}
      
      <div className="meetup-card-header">
        <h3 className="meetup-title">{meetup.title}</h3>
        <span className="meetup-distance">{formattedDistance}</span>
      </div>
      
      <p className="meetup-description">{meetup.description}</p>
      
      <div className="meetup-card-footer">
        <span className="meetup-time">{formatDateTime(meetup.startTime)}</span>
        <span className="meetup-attendees">{meetup.attendees} attending</span>
      </div>
      
      {/* Click indicator */}
      <div className="meetup-card-action">
        <span>View Details</span>
      </div>
      
      {/* Display extraction mode in development */}
      {process.env.NODE_ENV === 'development' && isFeatureEnabled('SHOW_EXTRACTION_INDICATORS') && (
        <div className="extraction-indicator">
          <small style={{ 
            position: 'absolute', 
            bottom: '2px', 
            right: '5px', 
            fontSize: '8px',
            opacity: 0.5 
          }}>
            Extracted Component
          </small>
        </div>
      )}
    </div>
  );
};

MeetupCard.propTypes = {
  meetup: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    location: PropTypes.shape({
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired
    }).isRequired,
    startTime: PropTypes.string.isRequired,
    attendees: PropTypes.number.isRequired,
    distance: PropTypes.number.isRequired,
    image: PropTypes.string
  }).isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string
};

// Apply performance tracking
const MeetupCardWithPerformance = withPerformanceTracking(MeetupCard, {
  componentId: 'MeetupCard'
});

// Apply high-order components for safe extraction and monitoring
const MeetupCardWithSafeExtraction = withSafeExtraction(MeetupCardWithPerformance, {
  id: 'MeetupCard',
  dependencies: ['OptimizedImage'],
  errorBoundary: true
});

// Apply extraction monitoring in development or if explicitly enabled
const EnhancedMeetupCard = isFeatureEnabled('ENABLE_COMPONENT_REGISTRY') || process.env.NODE_ENV === 'development' 
  ? withExtractionMonitor(MeetupCardWithSafeExtraction, 'MeetupCard')
  : MeetupCardWithSafeExtraction;

export default EnhancedMeetupCard; 