import React, { useState, useEffect, useRef } from 'react';
import { IoLocationOutline, IoSearchOutline, IoCloseOutline } from 'react-icons/io5';

import { debounce } from '../../utils/helpers';
import { reverseGeocode } from '../../utils/location-services';
import './LocationSearch.css';

/**
 * LocationSearch component allows users to search for locations by address
 * and supports reverse geocoding for finding addresses from coordinates
 */
const LocationSearch = ({
  onLocationSelect,
  initialQuery = '',
  placeholder = 'Search for a location',
  showCurrentLocation = true,
  autoFocus = false,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showResults, setShowResults] = useState(false);
  const [animateSelection, setAnimateSelection] = useState(false);

  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // Debounced search function to prevent excessive API calls
  const debouncedSearch = useRef(
    debounce(async searchQuery => {
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

  // Handle input changes
  const handleInputChange = e => {
    const value = e.target.value;
    setQuery(value);
    setError(null);

    if (value.length >= 3) {
      setIsLoading(true);
      debouncedSearch(value);
      setShowResults(true);
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
  const handleSelectLocation = location => {
    setSelectedLocation(location);

    // Animate the selection by applying and then removing the animation class
    setAnimateSelection(true);

    // Format the display name nicely if possible
    const displayName = location.display_name || location.name || '';

    // Use a small delay to make the animation feel smoother
    setTimeout(() => {
      setQuery(displayName);
      setShowResults(false);

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
  const handleKeyDown = e => {
    if (!showResults || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prevIndex => {
          const newIndex = prevIndex < searchResults.length - 1 ? prevIndex + 1 : prevIndex;
          scrollToResult(newIndex);
          return newIndex;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prevIndex => {
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
  };

  // Scroll to active result when navigating with keyboard
  const scrollToResult = index => {
    if (resultsRef.current?.children[index]) {
      resultsRef.current.children[index].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  };

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = e => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target) &&
        resultsRef.current &&
        !resultsRef.current.contains(e.target)
      ) {
        setShowResults(false);
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
        async position => {
          try {
            const { latitude, longitude } = position.coords;
            const result = await reverseGeocode(latitude, longitude);

            if (result) {
              const locationData = {
                ...result,
                lat: latitude,
                lon: longitude,
                display_name: result.display_name || `${latitude}, ${longitude}`,
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
        err => {
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

    if (inputRef.current) {
      inputRef.current.focus();
    }

    if (onLocationSelect) {
      onLocationSelect(null);
    }
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
          onFocus={() => query.length >= 3 && setShowResults(true)}
          placeholder={placeholder}
          aria-label="Search for location"
          autoComplete="off"
          data-testid="location-search-input"
        />

        {query && (
          <button className="clear-button" onClick={handleClearInput} aria-label="Clear search">
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

      {showResults && searchResults.length > 0 && (
        <ul ref={resultsRef} className="search-results-list" data-testid="location-search-results">
          {searchResults.map((result, index) => (
            <li
              key={`${result.place_id || index}`}
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationSearch;
