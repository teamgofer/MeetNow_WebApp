'use client';

import { useState, useEffect, lazy, Suspense, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { NearbyMeetups } from '@/components/ui/nearby-meetups';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { createFreeMeetup, getNearbyFreeMeetups } from '@/lib/meetup';
import { searchLocations } from '@/lib/location-services';
import { ErrorBoundary } from 'react-error-boundary';

// Dynamic import for the map component since it uses browser APIs
const MapComponent = dynamic(() => import('@/components/map-component'), {
  ssr: false,
  loading: () => <Loading className="absolute inset-0" />
});

export default function Home() {
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
    const getLocation = async () => {
      setIsLoading(true);
      setError('');

      try {
        if (navigator.geolocation) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            });
          });

          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          setLocation(newLocation);
          setSelectedLocation(newLocation);
          
          // Get address for the location
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${newLocation.lat}&lon=${newLocation.lng}&format=json`
          );
          const data = await response.json();
          setSearchAddress(data.display_name);
          
          await fetchNearbyMeetups(newLocation);
        } else {
          setError('Geolocation is not supported by your browser');
          await fetchNearbyMeetups(location);
        }
      } catch (error) {
        console.error('Error getting location:', error);
        setError('Unable to get your location. Using default location.');
        await fetchNearbyMeetups(location);
      } finally {
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
          <MapComponent
            location={location}
            matchedMeetups={nearbyMeetups}
            onLocationSelect={handleAddressSelect}
          />
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
                      Location
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search for a location..."
                        value={searchAddress}
                        onChange={(e) => {
                          setSearchAddress(e.target.value);
                          searchAddresses(e.target.value);
                        }}
                        className="w-full bg-white/90 backdrop-blur-sm pr-10"
                      />
                      <FaMapMarkerAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    
                    {searchResults.length > 0 && (
                      <div className="absolute mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto z-50">
                        {searchResults.map((result, index) => (
                          <button
                            key={index}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                            onClick={() => handleAddressSelect(result)}
                          >
                            {result.display_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      placeholder="Add a description..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-2 border rounded-md bg-white/90 backdrop-blur-sm"
                      rows={3}
                      maxLength={500}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image (optional)
                    </label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full bg-white/90 backdrop-blur-sm"
                    />
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mt-2 max-h-32 rounded"
                      />
                    )}
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700">
                      {error}
                    </div>
                  )}

                  <Button
                    onClick={handleCreateMeetup}
                    disabled={isLoading || !selectedLocation}
                    className="w-full"
                  >
                    {isLoading ? 'Creating...' : 'Create Meetup'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {nearbyMeetups.length > 0 && (
            <NearbyMeetups
              meetups={nearbyMeetups}
              currentLocation={location}
              currentMeetupId={currentMeetupId}
            />
          )}
        </div>
      </div>
    </div>
  );
} 