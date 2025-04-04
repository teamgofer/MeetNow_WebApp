import PropTypes from 'prop-types';
import React, { memo } from 'react';

import { isFeatureEnabled } from '../../config/featureFlags';
import { useMeetupState } from '../../contexts/ComponentStateContext';
import withSafeExtraction from '../../hocs/withSafeExtraction';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { withExtractionMonitor } from '../../utils/extraction-monitor';

/**
 * TimeFilter component for filtering meetups by time range
 */
const TimeFilter = ({ className = '', initialTimeRange = 'upcoming', onChange }) => {
  // Access state from context for time range info if available
  const { meetupState } = useMeetupState();
  const currentTimeRange = meetupState.filters.timeRange || initialTimeRange;

  // Get breakpoints for responsive design
  const { isMobile } = useBreakpoint();

  // Standard time options - can be extended through props later if needed
  const timeOptions = [
    { id: 'upcoming', name: 'Upcoming' },
    { id: 'today', name: 'Today' },
    { id: 'tomorrow', name: 'Tomorrow' },
    { id: 'week', name: 'This Week' },
  ];

  // Handler for time range change
  const handleTimeChange = timeId => {
    if (onChange) {
      onChange(timeId);
    }
  };

  return (
    <div
      className={`filter-group time-filter ${className}`}
      data-extracted="true"
      data-component-id="TimeFilter"
    >
      <div className="filter-header">
        <span>Time</span>
      </div>
      <div className={`time-buttons ${isMobile ? 'mobile' : ''}`}>
        {timeOptions.map(time => (
          <button
            key={time.id}
            className={`time-button ${currentTimeRange === time.id ? 'active' : ''}`}
            onClick={() => handleTimeChange(time.id)}
            aria-pressed={currentTimeRange === time.id}
          >
            {time.name}
          </button>
        ))}
      </div>

      {/* Dev mode indicator */}
      {process.env.NODE_ENV === 'development' && isFeatureEnabled('SHOW_EXTRACTION_INDICATORS') && (
        <div
          className="extraction-indicator"
          style={{ fontSize: '9px', marginTop: '4px', opacity: 0.4 }}
        >
          ✅ Extracted
        </div>
      )}
    </div>
  );
};

TimeFilter.propTypes = {
  className: PropTypes.string,
  initialTimeRange: PropTypes.string,
  onChange: PropTypes.func,
};

// Export with safe extraction and monitoring HOCs
export default withSafeExtraction(withExtractionMonitor(memo(TimeFilter), 'TimeFilter'), {
  id: 'TimeFilter',
  dependencies: [],
  errorBoundary: true,
});
