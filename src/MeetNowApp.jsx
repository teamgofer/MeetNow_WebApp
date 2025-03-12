import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
const MapComponent = lazy(() => import('@/components/MapComponent'));
import { Button, Input, Card, CardContent } from '@/components/ui';
import Loading from '@/components/ui/loading';
import NearbyMeetups from '@/components/ui/nearby-meetups';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { createFreeMeetup, getNearbyFreeMeetups } from '@/utils/meetup';
import { searchLocations } from '@/utils/location-services';
import { ErrorBoundary } from 'react-error-boundary';

const MeetNowApp = () => {
  const [location, setLocation] = useState({
    lat: 40.7128,
    lng: -74.0060
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const searchTimeoutRef = useRef(null);
  const [meetupCreated, setMeetupCreated] = useState(false);
  const [nearbyMeetups, setNearbyMeetups] = useState([]);
  const [currentMeetupId, setCurrentMeetupId] = useState(null);

  const fetchNearbyMeetups = async (userLocation) => {
    if (!userLocation || typeof userLocation.lat !== 'number' || typeof userLocation.lng !== 'number') {
      console.error('Invalid user location:', userLocation);
      return;
    }

    try {
      setError('');
      console.log('Fetching nearby meetups for location:', userLocation);
      const result = await getNearbyFreeMeetups(userLocation);
      
      if (result.success) {
        console.log('Fetched meetups:', result.meetups);
        setNearbyMeetups(result.meetups);
        if (result.meetups.length === 0) {
          setError('No meetups found nearby. Try creating one!');
        }
      } else {
        console.error('Error fetching meetups:', result.error);
        setError('Unable to load meetups. Please try again later.');
      }
    } catch (error) {
      console.error('Error in fetchNearbyMeetups:', error);
      setError('Unable to load meetups. Please check your connection and try again.');
    }
  };

  const searchAddresses = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
  
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  
    const timeoutId = setTimeout(async () => {
      try {
        setIsLoading(true);
        const results = await searchLocations(query);
        setSearchResults(results.map(result => ({
          ...result,
          display_name: result.display_name,
          lat: result.lat,
          lon: result.lon
        })));
      } catch (error) {
        console.error('Error searching addresses:', error);
        setError('Failed to search for location. Please try again.');
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  
    searchTimeoutRef.current = timeoutId;
  };

  const handleAddressSelect = (result) => {
    const newLocation = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    };
    setSelectedLocation(newLocation);
    setLocation(newLocation);
    setSearchResults([]);
    setSearchAddress(result.display_name);
    fetchNearbyMeetups(newLocation);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size must be less than 5MB');
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateMeetup = async () => {
    setError('');
    setIsLoading(true);

    if (!selectedLocation) {
      setError('Please select a location for your meetup');
      setIsLoading(false);
      return;
    }
  
    try {
      const meetupData = {
        location: selectedLocation,
        address: searchAddress,
        title: title.trim() || 'Instant Meetup',
        description: description.trim() || null,
        image: image
      };
      
      console.log('Creating meetup with data:', meetupData);
      const result = await createFreeMeetup(meetupData);
      
      if (result.success) {
        console.log('Meetup created successfully:', result);
        setMeetupCreated(true);
        setCurrentMeetupId(result.meetupId);
        // Update the current location to the selected location
        setLocation(selectedLocation);
        // Immediately fetch updated meetups with the new location
        await fetchNearbyMeetups(selectedLocation);
        // Reset form
        setTitle('');
        setDescription('');
        setImage(null);
        setImagePreview(null);
      } else {
        console.error('Failed to create meetup:', result.error);
        setError(result.error || 'Failed to create meetup');
      }
    } catch (err) {
      console.error('Error creating meetup:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial location setup and meetup fetching
  useEffect(() => {
    const getLocation = () => {
      setIsLoading(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setLocation(newLocation);
            setSelectedLocation(newLocation);
            fetchNearbyMeetups(newLocation);
            setIsLoading(false);
          },
          (error) => {
            console.error('Geolocation error:', error);
            fetchNearbyMeetups(location);
            setIsLoading(false);
          }
        );
      } else {
        fetchNearbyMeetups(location);
        setIsLoading(false);
      }
    };

    getLocation();
  }, []);

  // Periodic refresh of nearby meetups
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (selectedLocation) {
        fetchNearbyMeetups(selectedLocation);
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [selectedLocation]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="relative w-full h-screen">
        <ErrorBoundary
          fallback={<div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 mt-4">
            <h3 className="font-semibold">Map Failed to Load</h3>
            <p>Please check your internet connection and try reloading</p>
          </div>}
        >
          <Suspense fallback={<Loading className="absolute inset-0" />}>
            <MapComponent
              location={location}
              matchedMeetups={nearbyMeetups}
              onLocationSelect={handleAddressSelect}
            />
          </Suspense>
        </ErrorBoundary>

        <div className="absolute top-4 left-4 z-10 w-96 space-y-4">
          <Card className="bg-white/50 backdrop-blur-sm border border-white/20">
            <CardContent>
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Create an Instant Meetup</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Create a free 1-hour meetup that starts right now - no sign-up required!
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title (optional)
                    </label>
                    <Input
                      type="text"
                      placeholder="Give your meetup a title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={100}
                      className="w-full bg-white/90 backdrop-blur-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      placeholder="What's this meetup about?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={500}
                      className="w-full px-3 py-2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Add a photo (optional)
                    </label>
                    <div className="mt-1 flex items-center space-x-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white/90 backdrop-blur-sm hover:bg-white/95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors"
                      >
                        Choose Image
                      </label>
                      {imagePreview && (
                        <div className="relative w-20 h-20">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-md"
                          />
                          <button
                            onClick={() => {
                              setImage(null);
                              setImagePreview(null);
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Max size: 5MB. Recommended: Square image.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Where would you like to meet?
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search location..."
                        value={searchAddress}
                        onChange={(e) => {
                          setSearchAddress(e.target.value);
                          searchAddresses(e.target.value);
                        }}
                        className="w-full pr-10 bg-white/90 backdrop-blur-sm"
                      />
                      <FaMapMarkerAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Or click anywhere on the map to select a location
                    </p>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="absolute w-full bg-white/95 backdrop-blur-sm mt-1 rounded-md shadow-lg z-20">
                      {searchResults.map((result, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-blue-50/80 cursor-pointer transition-colors"
                          onClick={() => handleAddressSelect(result)}
                        >
                          {result.display_name}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-blue-50/70 backdrop-blur-sm p-3 rounded-lg">
                    <p className="text-sm text-blue-700">
                      ⏰ Your meetup will start immediately and be active for 1 hour
                    </p>
                  </div>

                  <Button
                    onClick={handleCreateMeetup}
                    disabled={isLoading || meetupCreated}
                    className={`w-full transition-colors ${
                      meetupCreated 
                        ? 'bg-green-500 hover:bg-green-600' 
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </span>
                    ) : meetupCreated ? (
                      'Meetup Created!'
                    ) : (
                      'Start 1-Hour Meetup Now'
                    )}
                  </Button>

                  {error && (
                    <div className="text-red-500 text-sm mt-2 bg-red-50/70 backdrop-blur-sm p-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  {meetupCreated && (
                    <div className="mt-4 p-4 bg-green-50/70 backdrop-blur-sm border border-green-200/50 rounded-lg">
                      <p className="text-green-700">
                        Your meetup is now active! It will expire in 1 hour.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {nearbyMeetups.length > 0 && (
          <NearbyMeetups 
            meetups={nearbyMeetups} 
            currentLocation={location}
          />
        )}
      </div>
    </div>
  );
};

export default MeetNowApp;