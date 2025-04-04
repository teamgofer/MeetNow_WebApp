import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { IoSearchOutline, IoCloseOutline, IoLocationOutline } from 'react-icons/io5';
const LocationSearch = ({ onLocationSelect, value = '', onValueChange, placeholder = 'Search for a location...', className = '', }) => {
    const [query, setQuery] = useState(value);
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [userInteracting, setUserInteracting] = useState(false);
    const inputRef = useRef(null);
    const resultsRef = useRef(null);
    const searchControllerRef = useRef(null);
    useEffect(() => {
        if (value !== query) {
            setQuery(value);
            setSearchResults([]);
            if (!userInteracting) {
                setShowResults(false);
            }
        }
    }, [value, userInteracting]);
    const searchLocations = async (searchQuery) => {
        if (!searchQuery || searchQuery.length < 3) {
            setSearchResults([]);
            setIsLoading(false);
            return;
        }
        if (searchControllerRef.current) {
            searchControllerRef.current.abort();
        }
        const abortController = new AbortController();
        searchControllerRef.current = abortController;
        try {
            setIsLoading(true);
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`, { signal: abortController.signal });
            if (!response.ok) {
                throw new Error(`Error searching for locations: ${response.statusText}`);
            }
            const data = await response.json();
            if (searchControllerRef.current === abortController) {
                const results = data.map((item) => ({
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
        }
        catch (err) {
            const isAbortError = err instanceof Error && err.name === 'AbortError';
            if (!isAbortError && searchControllerRef.current === abortController) {
                console.error('Location search error:', err);
                setError(err instanceof Error ? err.message : 'Failed to search for locations');
                setSearchResults([]);
            }
        }
        finally {
            if (searchControllerRef.current === abortController) {
                setIsLoading(false);
                searchControllerRef.current = null;
            }
        }
    };
    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setQuery(newValue);
        setUserInteracting(true);
        if (newValue.length < 3) {
            setSearchResults([]);
            setShowResults(false);
        }
        if (onValueChange) {
            onValueChange(newValue);
        }
    };
    useEffect(() => {
        if (query.length < 3)
            return;
        const timeoutId = setTimeout(() => {
            searchLocations(query);
        }, 300);
        return () => {
            clearTimeout(timeoutId);
            if (searchControllerRef.current) {
                searchControllerRef.current.abort();
                searchControllerRef.current = null;
            }
        };
    }, [query]);
    const handleFocus = () => {
        setUserInteracting(true);
        if (query.length >= 3) {
            setShowResults(true);
        }
    };
    const handleBlur = () => {
        setTimeout(() => {
            setUserInteracting(false);
        }, 200);
    };
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (resultsRef.current &&
                !resultsRef.current.contains(e.target) &&
                inputRef.current &&
                !inputRef.current.contains(e.target)) {
                setShowResults(false);
                setUserInteracting(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    const handleSelectLocation = (location) => {
        setQuery(location.display_name);
        setSearchResults([]);
        setShowResults(false);
        setActiveIndex(-1);
        setUserInteracting(false);
        if (onValueChange) {
            onValueChange(location.display_name);
        }
        onLocationSelect(location);
    };
    const handleKeyDown = (e) => {
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
    const handleClear = () => {
        setQuery('');
        setSearchResults([]);
        setShowResults(false);
        setActiveIndex(-1);
        setUserInteracting(true);
        if (onValueChange) {
            onValueChange('');
        }
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };
    const formatLocationResult = (location) => {
        if (location.address) {
            const parts = [];
            const placeName = location.address.road || '';
            if (placeName)
                parts.push(placeName);
            const cityPart = location.address.city || location.address.town || location.address.village || '';
            if (cityPart)
                parts.push(cityPart);
            if (location.address.state && location.address.country === 'United States') {
                parts.push(location.address.state);
            }
            if (location.address.country) {
                parts.push(location.address.country);
            }
            return parts.join(', ');
        }
        return location.display_name;
    };
    return (_jsx("div", { className: `location-search-container ${className}`, children: _jsxs("div", { className: "relative", children: [_jsxs("div", { className: "flex items-center border rounded-md bg-white shadow-sm", children: [_jsx("span", { className: "pl-3 text-gray-400", children: _jsx(IoSearchOutline, { size: 18 }) }), _jsx("input", { ref: inputRef, type: "text", value: query, onChange: handleInputChange, onKeyDown: handleKeyDown, onFocus: handleFocus, onBlur: handleBlur, placeholder: placeholder, className: "w-full py-2 px-3 outline-none" }), query && (_jsx("button", { onClick: handleClear, className: "px-3 text-gray-400 hover:text-gray-600", "aria-label": "Clear search", children: _jsx(IoCloseOutline, { size: 18 }) }))] }), showResults && userInteracting && (_jsxs("div", { ref: resultsRef, className: "absolute left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-auto", children: [isLoading && _jsx("div", { className: "p-3 text-center text-gray-500", children: "Searching..." }), !isLoading && searchResults.length === 0 && query.length >= 3 && (_jsx("div", { className: "p-3 text-center text-gray-500", children: "No locations found" })), error && _jsx("div", { className: "p-3 text-center text-red-500", children: error }), searchResults.map((location, index) => (_jsx("div", { className: `p-3 cursor-pointer hover:bg-gray-100 ${activeIndex === index ? 'bg-blue-50' : ''}`, onClick: () => handleSelectLocation(location), children: _jsxs("div", { className: "flex items-start", children: [_jsx("span", { className: "text-gray-500 mr-2 mt-1", children: _jsx(IoLocationOutline, { size: 16 }) }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: formatLocationResult(location) }), _jsx("div", { className: "text-xs text-gray-500 mt-1 truncate", children: location.display_name })] })] }) }, location.place_id || index)))] }))] }) }));
};
export default LocationSearch;
//# sourceMappingURL=LocationSearch.js.map