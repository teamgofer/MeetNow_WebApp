import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Location {
  lat: number;
  lng: number;
}

interface Meetup {
  id: string;
  location: Location;
  address: string;
  title?: string;
}

interface MapComponentProps {
  location: Location;
  matchedMeetups?: Meetup[];
  onLocationSelect?: (location: { lat: string; lon: string; display_name: string }) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({
  location,
  matchedMeetups = [],
  onLocationSelect
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const initializedRef = useRef(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || initializedRef.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://api.maptiler.com/maps/streets/style.json?key=get_your_own_key',
      center: [location.lng, location.lat],
      zoom: 13,
      attributionControl: false
    });

    map.current.addControl(new maplibregl.NavigationControl());
    map.current.addControl(new maplibregl.AttributionControl(), 'bottom-right');

    // Add click handler for location selection
    if (onLocationSelect) {
      map.current.on('click', async (e) => {
        const { lng, lat } = e.lngLat;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await response.json();
          onLocationSelect({
            lat: lat.toString(),
            lon: lng.toString(),
            display_name: data.display_name
          });
        } catch (error) {
          console.error('Error reverse geocoding:', error);
        }
      });
    }

    initializedRef.current = true;

    return () => {
      if (map.current) {
        map.current.remove();
        initializedRef.current = false;
      }
    };
  }, []);

  // Update map center when location changes
  useEffect(() => {
    if (!map.current || !location) return;

    map.current.flyTo({
      center: [location.lng, location.lat],
      zoom: 13,
      duration: 2000,
      essential: true
    });
  }, [location]);

  // Update markers when meetups change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers
    matchedMeetups.forEach(meetup => {
      const marker = new maplibregl.Marker({
        color: '#FF0000',
        scale: 0.8
      })
        .setLngLat([meetup.location.lng, meetup.location.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 })
            .setHTML(`
              <h3 class="font-medium">${meetup.title || 'Instant Meetup'}</h3>
              <p class="text-sm">${meetup.address}</p>
            `)
        )
        .addTo(map.current!);
      markers.current.push(marker);
    });
  }, [matchedMeetups]);

  return (
    <div ref={mapContainer} className="w-full h-full" />
  );
};

export default MapComponent; 