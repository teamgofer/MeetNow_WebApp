import PropTypes from 'prop-types';
import React, { memo } from 'react';

import { isFeatureEnabled } from '../../config/featureFlags';
import { useMeetupState } from '../../contexts/ComponentStateContext';
import withSafeExtraction from '../../hocs/withSafeExtraction';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { withExtractionMonitor } from '../../utils/extraction-monitor';

/**
 * CategoryFilter component for filtering meetups by category
 */
const CategoryFilter = ({ className = '', initialCategory = 'all', onChange }) => {
  // Access state from context for category info if available
  const { meetupState } = useMeetupState();
  const currentCategory = meetupState.filters.category || initialCategory;

  // Get breakpoints for responsive design
  const { isMobile } = useBreakpoint();

  // Standard categories - can be extended through props later if needed
  const categories = [
    { id: 'all', name: 'All' },
    { id: 'social', name: 'Social' },
    { id: 'business', name: 'Business' },
    { id: 'education', name: 'Education' },
    { id: 'recreation', name: 'Recreation' },
  ];

  // Handler for category change
  const handleCategoryChange = categoryId => {
    if (onChange) {
      onChange(categoryId);
    }
  };

  return (
    <div
      className={`filter-group category-filter ${className}`}
      data-extracted="true"
      data-component-id="CategoryFilter"
    >
      <div className="filter-header">
        <span>Category</span>
      </div>
      <div className={`category-buttons ${isMobile ? 'mobile' : ''}`}>
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-button ${currentCategory === category.id ? 'active' : ''}`}
            onClick={() => handleCategoryChange(category.id)}
            aria-pressed={currentCategory === category.id}
          >
            {category.name}
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

CategoryFilter.propTypes = {
  className: PropTypes.string,
  initialCategory: PropTypes.string,
  onChange: PropTypes.func,
};

// Export with safe extraction and monitoring HOCs
export default withSafeExtraction(withExtractionMonitor(memo(CategoryFilter), 'CategoryFilter'), {
  id: 'CategoryFilter',
  dependencies: [],
  errorBoundary: true,
});
