# Filter Components

This directory contains reusable filter components for the MeetNow platform. These components allow users to filter meetups by various criteria such as distance, category, and time.

## Components

### SearchFilter

The main container component that combines all the filter components.

```jsx
import SearchFilter from './components/filters/SearchFilter';

// Usage
<SearchFilter className="custom-class" />
```

### DistanceSlider

A slider component for filtering meetups by distance.

```jsx
import DistanceSlider from './components/filters/DistanceSlider';

// Usage
<DistanceSlider 
  initialValue={5} 
  min={1} 
  max={50} 
  onChange={(value) => console.log(`Distance changed to ${value} miles`)} 
/>
```

**Props:**
- `initialValue` (number): Initial slider value (default: 5)
- `min` (number): Minimum slider value (default: 1)
- `max` (number): Maximum slider value (default: 50)
- `onChange` (function): Callback function that receives the new value
- `className` (string): Additional CSS classes

### CategoryFilter

A button group component for filtering meetups by category.

```jsx
import CategoryFilter from './components/filters/CategoryFilter';

// Usage
<CategoryFilter 
  initialCategory="all" 
  onChange={(category) => console.log(`Category changed to ${category}`)} 
/>
```

**Props:**
- `initialCategory` (string): Initial selected category (default: 'all')
- `onChange` (function): Callback function that receives the new category
- `className` (string): Additional CSS classes

### TimeFilter

A button group component for filtering meetups by time range.

```jsx
import TimeFilter from './components/filters/TimeFilter';

// Usage
<TimeFilter 
  initialTimeRange="upcoming" 
  onChange={(timeRange) => console.log(`Time range changed to ${timeRange}`)} 
/>
```

**Props:**
- `initialTimeRange` (string): Initial selected time range (default: 'upcoming')
- `onChange` (function): Callback function that receives the new time range
- `className` (string): Additional CSS classes

## Feature Flags

All filter components can be toggled using feature flags:

- `USE_EXTRACTED_DISTANCE_SLIDER`: Toggle the extracted DistanceSlider
- `USE_EXTRACTED_CATEGORY_FILTER`: Toggle the extracted CategoryFilter
- `USE_EXTRACTED_TIME_FILTER`: Toggle the extracted TimeFilter

You can override these flags in development mode by using localStorage:

```javascript
// Enable extracted component
localStorage.setItem('feature_USE_EXTRACTED_DISTANCE_SLIDER', 'true');

// Disable extracted component
localStorage.setItem('feature_USE_EXTRACTED_DISTANCE_SLIDER', 'false');

// Reset to default
localStorage.removeItem('feature_USE_EXTRACTED_DISTANCE_SLIDER');
```

## Integration with Component State

All filter components automatically integrate with the MeetNow global state system. They:

1. Read initial values from state if available
2. Update state when changed (via the onChange prop)
3. Receive updates when state is changed by other components

## Examples

### Complete Search Filter

```jsx
import React from 'react';
import { useMeetupState } from '../../contexts/ComponentStateContext';
import DistanceSlider from './DistanceSlider';
import CategoryFilter from './CategoryFilter';
import TimeFilter from './TimeFilter';

const FilterContainer = () => {
  const { meetupState, meetupActions } = useMeetupState();
  const { filters } = meetupState;
  
  return (
    <div className="filters-container">
      <h3>Filter Meetups</h3>
      
      <DistanceSlider 
        initialValue={filters.distance} 
        onChange={(value) => meetupActions.updateFilters({ distance: value })}
      />
      
      <CategoryFilter 
        initialCategory={filters.category} 
        onChange={(value) => meetupActions.updateFilters({ category: value })}
      />
      
      <TimeFilter 
        initialTimeRange={filters.timeRange} 
        onChange={(value) => meetupActions.updateFilters({ timeRange: value })}
      />
    </div>
  );
};

export default FilterContainer;
```

### Individual Filter Usage

```jsx
import React, { useState } from 'react';
import DistanceSlider from './DistanceSlider';

const ExampleComponent = () => {
  const [distance, setDistance] = useState(5);
  
  return (
    <div>
      <h3>Current Distance: {distance} miles</h3>
      <DistanceSlider 
        initialValue={distance} 
        onChange={setDistance} 
      />
    </div>
  );
};
``` 