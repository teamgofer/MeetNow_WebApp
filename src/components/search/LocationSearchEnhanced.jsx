import React, { useState, useEffect, useRef } from 'react';
import { debounce } from '../../utils/helpers';
import { reverseGeocode } from '../../utils/location-services';
import { 
  IoLocationOutline, 
  IoSearchOutline, 
  IoCloseOutline, 
  IoTimeOutline,
  IoStarOutline,
  IoStarSharp,
  IoChevronDownOutline,
  IoChevronUpOutline
} from 'react-icons/io5';
import './LocationSearch.css';

/**
 * Enhanced LocationSearch component with recent and saved locations
 */
const LocationSearchEnhanced = ({
  onLocationSelect,
  initialQuery = '',
  placeholder = 'Search for a location',
  showCurrentLocation = true,
  autoFocus = false,
  showRecentLocations = true
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showResults, setShowResults] = useState(false);
  const [animateSelection, setAnimateSelection] = useState(false);
  const [recentLocations, setRecentLocations] = useState([]);
  const [savedLocations, setSavedLocations] = useState([]);
  const [showRecent, setShowRecent] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  
  // Load user preferences including recent locations
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const response = await fetch('/api/user-preferences');
        
        if (response.ok) {
          const data = await response.json();
          setRecentLocations(data.recentSearches || []);
          setSavedLocations(data.locations || []);
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    };
    
    loadUserPreferences();
  }, []);

  // Debounced search function to prevent excessive API calls
  const debouncedSearch = useRef(
    debounce(async (searchQuery) => {
      if (!searchQuery || searchQuery.length < 3) {
        setSearchResults([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/geocode?query=${encodeURIComponent(searchQuery)}`);
        
        if (!response.ok) {
          throw new Error(`Error searching for locations: ${response.statusText}`);
        }
        
        const data = await response.json();
        setSearchResults(data.results || []);
      } catch (err) {
        console.error('Location search error:', err);
        setError(err.message || 'Failed to search for locations');
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300)
  ).current;

  // Save location to recent searches
  const saveLocationToRecent = async (location) => {
    try {
      const response = await fetch('/api/user-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location,
          type: 'recent'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentLocations(data.preferences.recentSearches || []);
      }
    } catch (error) {
      console.error('Error saving recent location:', error);
    }
  };
  
  // Toggle location as saved/favorite
  const toggleSavedLocation = async (location) => {
    // Check if location is already saved
    const isSaved = savedLocations.some(item => 
      item.place_id === location.place_id
    );
    
    try {
      if (isSaved) {
        // Remove from saved locations
        const response = await fetch('/api/user-preferences', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            location,
            type: 'saved'
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setSavedLocations(data.preferences.locations || []);
        }
      } else {
        // Add to saved locations
        const response = await fetch('/api/user-preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            location,
            type: 'saved'
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setSavedLocations(data.preferences.locations || []);
        }
      }
    } catch (error) {
      console.error('Error toggling saved location:', error);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setError(null);
    
    if (value.length >= 3) {
      setIsLoading(true);
      debouncedSearch(value);
      setShowResults(true);
      setShowRecent(false);
      setShowSaved(false);
    } else if (value.length === 0 && showRecentLocations) {
      setSearchResults([]);
      setShowResults(false);
      setShowRecent(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
    
    // If user clears input, also clear selected location
    if (!value && selectedLocation) {
      setSelectedLocation(null);
    }
  };

  // Handle location selection with animation
  const handleSelectLocation = (location) => {
    setSelectedLocation(location);
    
    // Animate the selection by applying and then removing the animation class
    setAnimateSelection(true);
    
    // Format the display name nicely if possible
    const displayName = location.display_name || location.name || '';
    
    // Use a small delay to make the animation feel smoother
    setTimeout(() => {
      setQuery(displayName);
      setShowResults(false);
      setShowRecent(false);
      setShowSaved(false);
      
      // Save to recent locations
      saveLocationToRecent(location);
      
      if (onLocationSelect) {
        onLocationSelect(location);
      }
    }, 50);
  };

  // Reset animation state after animation completes
  useEffect(() => {
    if (animateSelection) {
      const timeout = setTimeout(() => {
        setAnimateSelection(false);
      }, 800); // Match the animation duration
      
      return () => clearTimeout(timeout);
    }
  }, [animateSelection]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    // For search results
    if (showResults && searchResults.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prevIndex) => {
            const newIndex = prevIndex < searchResults.length - 1 ? prevIndex + 1 : prevIndex;
            scrollToResult(newIndex);
            return newIndex;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prevIndex) => {
            const newIndex = prevIndex > 0 ? prevIndex - 1 : 0;
            scrollToResult(newIndex);
            return newIndex;
          });
          break;
        case 'Enter':
          if (activeIndex >= 0 && activeIndex < searchResults.length) {
            handleSelectLocation(searchResults[activeIndex]);
          }
          break;
        case 'Escape':
          setShowResults(false);
          break;
        default:
          break;
      }
    }
    // For recent locations
    else if (showRecent && recentLocations.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prevIndex) => {
            const newIndex = prevIndex < recentLocations.length - 1 ? prevIndex + 1 : prevIndex;
            return newIndex;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prevIndex) => {
            const newIndex = prevIndex > 0 ? prevIndex - 1 : 0;
            return newIndex;
          });
          break;
        case 'Enter':
          if (activeIndex >= 0 && activeIndex < recentLocations.length) {
            handleSelectLocation(recentLocations[activeIndex]);
          }
          break;
        case 'Escape':
          setShowRecent(false);
          break;
        default:
          break;
      }
    }
  };

  // Scroll to active result when navigating with keyboard
  const scrollToResult = (index) => {
    if (resultsRef.current && resultsRef.current.children[index]) {
      resultsRef.current.children[index].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  };

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target) &&
          resultsRef.current && !resultsRef.current.contains(e.target)) {
        setShowResults(false);
        setShowRecent(false);
        setShowSaved(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus input when autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Handle focus events
  const handleFocus = () => {
    if (query.length >= 3) {
      setShowResults(true);
    } else if (query.length === 0 && showRecentLocations && recentLocations.length > 0) {
      setShowRecent(true);
    }
  };

  // Handle getting current location
  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const result = await reverseGeocode(latitude, longitude);
            
            if (result) {
              const locationData = {
                ...result,
                lat: latitude,
                lon: longitude,
                display_name: result.display_name || `${latitude}, ${longitude}`
              };
              
              handleSelectLocation(locationData);
            } else {
              setError('Could not find address for your location');
            }
          } catch (err) {
            console.error('Reverse geocoding error:', err);
            setError('Failed to get address for your location');
          } finally {
            setIsLoading(false);
          }
        },
        (err) => {
          console.error('Geolocation error:', err);
          setIsLoading(false);
          setError(`Error getting your location: ${err.message}`);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } catch (err) {
      setIsLoading(false);
      setError('An unexpected error occurred');
      console.error('Unexpected geolocation error:', err);
    }
  };

  // Clear the search input
  const handleClearInput = () => {
    setQuery('');
    setSelectedLocation(null);
    setSearchResults([]);
    setShowResults(false);
    
    if (showRecentLocations && recentLocations.length > 0) {
      setShowRecent(true);
    }
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    if (onLocationSelect) {
      onLocationSelect(null);
    }
  };

  // Toggle showing recent locations
  const toggleRecentLocations = () => {
    setShowRecent(!showRecent);
    if (showRecent) {
      setActiveIndex(-1);
    }
    if (showSaved && !showRecent) {
      setShowSaved(false);
    }
  };
  
  // Toggle showing saved locations
  const toggleSavedLocations = () => {
    setShowSaved(!showSaved);
    if (showSaved) {
      setActiveIndex(-1);
    }
    if (showRecent && !showSaved) {
      setShowRecent(false);
    }
  };

  // Check if a location is saved
  const isLocationSaved = (location) => {
    return savedLocations.some(item => item.place_id === location.place_id);
  };

  return (
    <div className="location-search-container">
      <div className="search-input-wrapper">
        <div className="search-icon">
          <IoSearchOutline />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          className={`location-search-input ${selectedLocation ? 'has-location' : ''} ${animateSelection ? 'location-selected-animation' : ''}`}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          aria-label="Search for location"
          autoComplete="off"
          data-testid="location-search-input"
        />
        
        {query && (
          <button 
            className="clear-button" 
            onClick={handleClearInput}
            aria-label="Clear search"
          >
            <IoCloseOutline />
          </button>
        )}
        
        {showCurrentLocation && (
          <button 
            className="current-location-button" 
            onClick={handleGetCurrentLocation}
            disabled={isLoading}
            aria-label="Use current location"
            title="Use current location"
          >
            <IoLocationOutline />
          </button>
        )}
      </div>
      
      {isLoading && <div className="search-loading">Loading...</div>}
      
      {error && <div className="search-error">{error}</div>}
      
      {/* Search Results */}
      {showResults && searchResults.length > 0 && (
        <ul 
          ref={resultsRef} 
          className="search-results-list"
          data-testid="location-search-results"
        >
          {searchResults.map((result, index) => (
            <li
              key={`result-${result.place_id || index}`}
              className={`search-result-item ${index === activeIndex ? 'active' : ''}`}
              onClick={() => handleSelectLocation(result)}
              onMouseEnter={() => setActiveIndex(index)}
              data-testid={`location-result-${index}`}
            >
              <div className="result-icon">
                <IoLocationOutline />
              </div>
              <div className="result-details">
                <div className="result-name">{result.name || result.display_name}</div>
                {result.address && (
                  <div className="result-address">
                    {result.address.road && `${result.address.road}, `}
                    {result.address.city && `${result.address.city}, `}
                    {result.address.state && `${result.address.state}, `}
                    {result.address.country}
                  </div>
                )}
              </div>
              <button 
                className="save-location-button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSavedLocation(result);
                }}
                aria-label={isLocationSaved(result) ? "Remove from saved" : "Save location"}
              >
                {isLocationSaved(result) ? <IoStarSharp /> : <IoStarOutline />}
              </button>
            </li>
          ))}
        </ul>
      )}
      
      {/* Recent Locations */}
      {showRecentLocations && recentLocations.length > 0 && (
        <div className="location-section">
          <button 
            className="section-toggle"
            onClick={toggleRecentLocations}
            aria-expanded={showRecent}
          >
            <div className="section-header">
              <IoTimeOutline className="section-icon" />
              <span>Recent Locations</span>
            </div>
            {showRecent ? <IoChevronUpOutline /> : <IoChevronDownOutline />}
          </button>
          
          {showRecent && (
            <ul className="location-list recent-locations">
              {recentLocations.map((location, index) => (
                <li 
                  key={`recent-${location.place_id || index}`}
                  className={`location-item ${index === activeIndex ? 'active' : ''}`}
                  onClick={() => handleSelectLocation(location)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <div className="location-item-icon">
                    <IoTimeOutline />
                  </div>
                  <div className="location-item-details">
                    <div className="location-item-name">{location.name || location.display_name}</div>
                    <div className="location-item-time">
                      {new Date(location.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <button 
                    className="save-location-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSavedLocation(location);
                    }}
                    aria-label={isLocationSaved(location) ? "Remove from saved" : "Save location"}
                  >
                    {isLocationSaved(location) ? <IoStarSharp /> : <IoStarOutline />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      {/* Saved Locations */}
      {savedLocations.length > 0 && (
        <div className="location-section">
          <button 
            className="section-toggle"
            onClick={toggleSavedLocations}
            aria-expanded={showSaved}
          >
            <div className="section-header">
              <IoStarSharp className="section-icon" />
              <span>Saved Locations</span>
            </div>
            {showSaved ? <IoChevronUpOutline /> : <IoChevronDownOutline />}
          </button>
          
          {showSaved && (
            <ul className="location-list saved-locations">
              {savedLocations.map((location, index) => (
                <li 
                  key={`saved-${location.place_id || index}`}
                  className="location-item"
                  onClick={() => handleSelectLocation(location)}
                >
                  <div className="location-item-icon saved">
                    <IoStarSharp />
                  </div>
                  <div className="location-item-details">
                    <div className="location-item-name">{location.name || location.display_name}</div>
                    {location.address && (
                      <div className="location-item-address">
                        {location.address.road && `${location.address.road}, `}
                        {location.address.city && `${location.address.city}, `}
                        {location.address.country}
                      </div>
                    )}
                  </div>
                  <button 
                    className="save-location-button active"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSavedLocation(location);
                    }}
                    aria-label="Remove from saved"
                  >
                    <IoStarSharp />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSearchEnhanced; 