import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FeatureFlag, isFeatureEnabled } from '../../config/featureFlags';
import { useMeetupState } from '../../contexts/ComponentStateContext';
import DistanceSlider from './DistanceSlider';
import CategoryFilter from './CategoryFilter';
import TimeFilter from './TimeFilter';
import withSafeExtraction from '../../hocs/withSafeExtraction';

/**
 * SearchFilter component for filtering nearby meetups
 */
const SearchFilter = ({ className = '' }) => {
  // Access state from context
  const { meetupState, meetupActions } = useMeetupState();
  const { filters } = meetupState;
  
  // Original implementation of distance slider (will be replaced)
  const OriginalDistanceSlider = () => {
    const [distance, setDistance] = useState(filters.distance || 5);
    
    const handleDistanceChange = (e) => {
      const newValue = parseInt(e.target.value, 10);
      setDistance(newValue);
      meetupActions.updateFilters({ distance: newValue });
    };
    
    return (
      <div className="filter-group">
        <div className="filter-header">
          <span>Distance</span>
          <span>{distance} miles</span>
        </div>
        <input
          type="range"
          min="1"
          max="50"
          value={distance}
          onChange={handleDistanceChange}
          className="slider"
        />
      </div>
    );
  };
  
  // Original implementation of category filter
  const OriginalCategoryFilter = () => {
    const categories = [
      { id: 'all', name: 'All' },
      { id: 'social', name: 'Social' },
      { id: 'business', name: 'Business' },
      { id: 'education', name: 'Education' },
      { id: 'recreation', name: 'Recreation' }
    ];
    
    const handleCategoryChange = (categoryId) => {
      meetupActions.updateFilters({ category: categoryId });
    };
    
    return (
      <div className="filter-group">
        <div className="filter-header">
          <span>Category</span>
        </div>
        <div className="category-buttons">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-button ${filters.category === category.id ? 'active' : ''}`}
              onClick={() => handleCategoryChange(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  // Original implementation of time filter
  const OriginalTimeFilter = () => {
    const timeOptions = [
      { id: 'upcoming', name: 'Upcoming' },
      { id: 'today', name: 'Today' },
      { id: 'tomorrow', name: 'Tomorrow' },
      { id: 'week', name: 'This Week' }
    ];
    
    const handleTimeChange = (timeId) => {
      meetupActions.updateFilters({ timeRange: timeId });
    };
    
    return (
      <div className="filter-group">
        <div className="filter-header">
          <span>Time</span>
        </div>
        <div className="time-buttons">
          {timeOptions.map(time => (
            <button
              key={time.id}
              className={`time-button ${filters.timeRange === time.id ? 'active' : ''}`}
              onClick={() => handleTimeChange(time.id)}
            >
              {time.name}
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className={`search-filter ${className}`} data-testid="search-filter">
      <h3 className="filter-title">Filter Meetups</h3>
      
      {/* Distance Slider with feature flag */}
      <FeatureFlag
        flag="USE_EXTRACTED_DISTANCE_SLIDER"
        fallback={<OriginalDistanceSlider />}
      >
        <DistanceSlider 
          initialValue={filters.distance || 5} 
          onChange={(value) => meetupActions.updateFilters({ distance: value })}
        />
      </FeatureFlag>
      
      {/* Category Filter with feature flag */}
      <FeatureFlag
        flag="USE_EXTRACTED_CATEGORY_FILTER"
        fallback={<OriginalCategoryFilter />}
      >
        <CategoryFilter 
          initialCategory={filters.category || 'all'} 
          onChange={(value) => meetupActions.updateFilters({ category: value })}
        />
      </FeatureFlag>
      
      {/* Time Filter with feature flag */}
      <FeatureFlag
        flag="USE_EXTRACTED_TIME_FILTER"
        fallback={<OriginalTimeFilter />}
      >
        <TimeFilter 
          initialTimeRange={filters.timeRange || 'upcoming'} 
          onChange={(value) => meetupActions.updateFilters({ timeRange: value })}
        />
      </FeatureFlag>
      
      {/* Dev mode indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="development-indicators" style={{ fontSize: '10px', marginTop: '16px', opacity: 0.6 }}>
          <div>DistanceSlider: {isFeatureEnabled('USE_EXTRACTED_DISTANCE_SLIDER') ? '✅ Extracted' : '⚙️ Original'}</div>
          <div>CategoryFilter: {isFeatureEnabled('USE_EXTRACTED_CATEGORY_FILTER') ? '✅ Extracted' : '⚙️ Original'}</div>
          <div>TimeFilter: {isFeatureEnabled('USE_EXTRACTED_TIME_FILTER') ? '✅ Extracted' : '⚙️ Original'}</div>
        </div>
      )}
    </div>
  );
};

SearchFilter.propTypes = {
  className: PropTypes.string
};

export default withSafeExtraction(SearchFilter, {
  id: 'SearchFilter',
  dependencies: ['DistanceSlider', 'CategoryFilter', 'TimeFilter'],
  errorBoundary: true
}); 