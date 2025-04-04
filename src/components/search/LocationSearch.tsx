import React, { useState, useEffect, useRef } from 'react';
import { IoSearchOutline, IoCloseOutline, IoLocationOutline } from 'react-icons/io5';
import { LatLngTuple } from 'leaflet';

// Interface for location search results
export interface LocationSearchResult {
  place_id?: string;
  osm_id?: string;
  display_name: string;
  lat: number;
  lon: number;
  address?: {
    city?: string;
    country?: string;
    state?: string;
    road?: string;
    suburb?: string;
    town?: string;
    village?: string;
  };
  type?: string;
  importance?: number;
  distance?: number;
  _source?: string; // Indicates the source of the location (e.g., 'map', 'search', 'dropdown')
}

// Props for the LocationSearch component
interface LocationSearchProps {
  onLocationSelect: (location: LocationSearchResult) => void;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * A component for searching and selecting locations
 */
const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelect,
  value = '',
  onValueChange,
  placeholder = 'Search for a location...',
  className = '',
}) => {
  const [query, setQuery] = useState(value);
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [userInteracting, setUserInteracting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const searchControllerRef = useRef<AbortController | null>(null);

  // Sync with external value prop
  useEffect(() => {
    if (value !== query) {
      setQuery(value);
      // Clear results when value is externally changed (e.g., map click)
      setSearchResults([]);
      // Only show results when user is actively interacting with the component
      if (!userInteracting) {
        setShowResults(false);
      }
    }
  }, [value, userInteracting]);

  // Function to search for locations
  const searchLocations = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 3) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }

    // Cancel any previous search requests
    if (searchControllerRef.current) {
      searchControllerRef.current.abort();
    }

    // Create a new abort controller for this request
    const abortController = new AbortController();
    searchControllerRef.current = abortController;

    try {
      setIsLoading(true);
      // Use Nominatim directly
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`,
        { signal: abortController.signal }
      );

      if (!response.ok) {
        throw new Error(`Error searching for locations: ${response.statusText}`);
      }

      const data = await response.json();

      // Only update if this is still the active controller
      if (searchControllerRef.current === abortController) {
        // Transform the results to our format
        const results: LocationSearchResult[] = data.map((item: any) => ({
          place_id: item.place_id,
          osm_id: item.osm_id,
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          address: item.address,
          type: item.type,
          importance: item.importance,
        }));

        setSearchResults(results);
        setShowResults(true);
      }
    } catch (err: unknown) {
      // Check for AbortError
      const isAbortError = err instanceof Error && err.name === 'AbortError';

      if (!isAbortError && searchControllerRef.current === abortController) {
        console.error('Location search error:', err);
        setError(err instanceof Error ? err.message : 'Failed to search for locations');
        setSearchResults([]);
      }
    } finally {
      if (searchControllerRef.current === abortController) {
        setIsLoading(false);
        searchControllerRef.current = null;
      }
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);

    // Set user as interacting when they type
    setUserInteracting(true);

    // Clear any existing search results if input is too short
    if (newValue.length < 3) {
      setSearchResults([]);
      setShowResults(false);
    }

    // Propagate change to parent if callback provided
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  // Debounced search effect
  useEffect(() => {
    if (query.length < 3) return;

    const timeoutId = setTimeout(() => {
      searchLocations(query);
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      // Cancel any in-flight search when cleaning up
      if (searchControllerRef.current) {
        searchControllerRef.current.abort();
        searchControllerRef.current = null;
      }
    };
  }, [query]);

  // Handle input focus
  const handleFocus = () => {
    setUserInteracting(true);
    if (query.length >= 3) {
      setShowResults(true);
    }
  };

  // Handle input blur
  const handleBlur = () => {
    // Short delay to allow click events on suggestions to fire
    setTimeout(() => {
      setUserInteracting(false);
    }, 200);
  };

  // Handle clicking outside the component
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
        setUserInteracting(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle location selection
  const handleSelectLocation = (location: LocationSearchResult) => {
    // Update the input with the display name
    setQuery(location.display_name);

    // Clear search results immediately to prevent further selections
    setSearchResults([]);
    setShowResults(false);
    setActiveIndex(-1);
    setUserInteracting(false);

    // Propagate value change if callback provided
    if (onValueChange) {
      onValueChange(location.display_name);
    }

    // Notify parent of selection
    onLocationSelect(location);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showResults && searchResults.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          if (activeIndex >= 0 && activeIndex < searchResults.length) {
            const selectedLocation = searchResults[activeIndex];
            if (selectedLocation) {
              handleSelectLocation(selectedLocation);
            }
          }
          break;
        case 'Escape':
          setShowResults(false);
          break;
      }
    }
  };

  // Clear the input and results
  const handleClear = () => {
    setQuery('');
    setSearchResults([]);
    setShowResults(false);
    setActiveIndex(-1);
    setUserInteracting(true);

    // Propagate value change if callback provided
    if (onValueChange) {
      onValueChange('');
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Format the location result for display
  const formatLocationResult = (location: LocationSearchResult) => {
    if (location.address) {
      const parts = [];

      // Add specific place name if available
      const placeName = location.address.road || '';
      if (placeName) parts.push(placeName);

      // Add city/town
      const cityPart =
        location.address.city || location.address.town || location.address.village || '';
      if (cityPart) parts.push(cityPart);

      // Add state for US locations
      if (location.address.state && location.address.country === 'United States') {
        parts.push(location.address.state);
      }

      // Always include country
      if (location.address.country) {
        parts.push(location.address.country);
      }

      return parts.join(', ');
    }

    // Fallback to display_name
    return location.display_name;
  };

  return (
    <div className={`location-search-container ${className}`}>
      <div className="relative">
        {/* Search input */}
        <div className="flex items-center border rounded-md bg-white shadow-sm">
          <span className="pl-3 text-gray-400">
            <IoSearchOutline size={18} />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="w-full py-2 px-3 outline-none"
          />
          {query && (
            <button
              onClick={handleClear}
              className="px-3 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <IoCloseOutline size={18} />
            </button>
          )}
        </div>

        {/* Only show results when showResults is true AND user is interacting */}
        {showResults && userInteracting && (
          <div
            ref={resultsRef}
            className="absolute left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-auto"
          >
            {isLoading && <div className="p-3 text-center text-gray-500">Searching...</div>}

            {!isLoading && searchResults.length === 0 && query.length >= 3 && (
              <div className="p-3 text-center text-gray-500">No locations found</div>
            )}

            {error && <div className="p-3 text-center text-red-500">{error}</div>}

            {searchResults.map((location, index) => (
              <div
                key={location.place_id || index}
                className={`p-3 cursor-pointer hover:bg-gray-100 ${
                  activeIndex === index ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleSelectLocation(location)}
              >
                <div className="flex items-start">
                  <span className="text-gray-500 mr-2 mt-1">
                    <IoLocationOutline size={16} />
                  </span>
                  <div>
                    <div className="font-medium">{formatLocationResult(location)}</div>
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {location.display_name}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSearch;
