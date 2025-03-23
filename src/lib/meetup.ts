import { query, geo } from './db';
import supabase from '../supabase';

export interface Meetup {
  id: string;
  title: string;
  description?: string;
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  creator_id?: string;
  image_url?: string;
  created_at: Date;
  expires_at: Date;
}

export async function createFreeMeetup(data: {
  title: string;
  description?: string;
  location: { lat: number; lng: number };
  address: string;
  image?: string;
}) {
  try {
    console.log('Creating free meetup with Supabase RPC:', data);
    
    // Validate location data
    if (!data.location || typeof data.location.lat !== 'number' || typeof data.location.lng !== 'number') {
      console.error('Invalid location data:', data.location);
      throw new Error('Invalid location coordinates');
    }

    // Use the RPC function to ensure proper handling
    const { data: result, error } = await supabase.rpc('create_free_meetup', {
      p_location: data.location,
      p_address: data.address || null,
      p_status: 'active'
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      throw error;
    }

    console.log('Free meetup created successfully:', result);
    return { success: true, meetupId: result.id };
  } catch (error) {
    console.error('Error creating meetup:', error);
    return { success: false, error: 'Failed to create meetup' };
  }
}

export async function getNearbyFreeMeetups(location: { lat: number; lng: number }, radius: number = 5000) {
  try {
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      console.error('Invalid user location data:', location);
      throw new Error('Invalid user location coordinates');
    }

    console.log(`Using client-side spatial filtering with USER location:`, location);
    
    // Fetch all active meetups without spatial filtering
    const { data: meetups, error } = await supabase
      .from('meetups_with_expiry')
      .select('*')
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error fetching meetups:', error);
      throw error;
    }

    if (!meetups || meetups.length === 0) {
      console.log('No active meetups found');
      return [];
    }

    console.log(`Found ${meetups.length} active meetups, filtering by distance from USER...`);

    // Process and filter meetups on the client side
    const filteredMeetups = meetups
      // Filter for free meetups only
      .filter(meetup => meetup.is_free_meetup)
      // Only process meetups with valid locations
      .filter(meetup => {
        // Extract location coordinates
        let meetupLat, meetupLng;
        
        if (meetup.location) {
          // Handle different location formats
          if (typeof meetup.location === 'string' && meetup.location.startsWith('POINT')) {
            const match = meetup.location.match(/POINT\(([^ ]+) ([^)]+)\)/);
            if (match) {
              meetupLng = parseFloat(match[1]);
              meetupLat = parseFloat(match[2]);
            }
          } else if (typeof meetup.location === 'object') {
            meetupLat = meetup.location.lat || meetup.location.latitude;
            meetupLng = meetup.location.lng || meetup.location.lon || meetup.location.longitude;
          }
        }
        
        return meetupLat && meetupLng; // Filter out meetups without valid coordinates
      })
      // Calculate distance from USER's location and add it to each meetup
      .map(meetup => {
        let meetupLat, meetupLng;
        
        // Extract coordinates from location object/string
        if (typeof meetup.location === 'string' && meetup.location.startsWith('POINT')) {
          const match = meetup.location.match(/POINT\(([^ ]+) ([^)]+)\)/);
          if (match) {
            meetupLng = parseFloat(match[1]);
            meetupLat = parseFloat(match[2]);
          }
        } else if (typeof meetup.location === 'object') {
          meetupLat = meetup.location.lat || meetup.location.latitude;
          meetupLng = meetup.location.lng || meetup.location.lon || meetup.location.longitude;
        }
        
        // Calculate distance using Haversine formula from USER location
        const distanceRadians = haversineDistance(
          location.lat, 
          location.lng, 
          meetupLat, 
          meetupLng
        );
        
        // Convert radians to meters (Earth radius ~6371 km)
        const distanceMeters = distanceRadians * 6371000;
        
        return {
          ...meetup,
          distance_meters: distanceMeters,
          distance_formatted: distanceMeters < 1000 
            ? `${Math.round(distanceMeters)}m` 
            : `${(distanceMeters / 1000).toFixed(1)}km`,
          location: { 
            lat: meetupLat, 
            lng: meetupLng 
          } // Normalize location format
        };
      })
      // Filter by distance from USER
      .filter(meetup => meetup.distance_meters <= radius)
      // Sort by distance from USER (closest first)
      .sort((a, b) => a.distance_meters - b.distance_meters)
      // Limit to a reasonable number
      .slice(0, 50);

    console.log(`Found ${filteredMeetups.length} nearby meetups after filtering by proximity to USER`);
    
    return filteredMeetups;
  } catch (error) {
    console.error('Error fetching nearby meetups:', error);
    return [];
  }
}

export async function nearbyMeetups(location: { lat: number; lng: number }, radius: number = 5000): Promise<any[]> {
  try {
    if (!location || !location.lat || !location.lng) {
      console.error('Invalid location data:', location);
      return [];
    }

    console.log(`Using client-side spatial filtering with location:`, location);
    
    // Fetch all active meetups without spatial filtering
    const { data: meetups, error } = await supabase
      .from('meetups_with_expiry')
      .select('*')
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error fetching meetups:', error);
      throw error;
    }

    if (!meetups || meetups.length === 0) {
      console.log('No active meetups found');
      return [];
    }

    console.log(`Found ${meetups.length} active meetups, filtering by distance...`);

    // Process and filter meetups on the client side
    const filteredMeetups = meetups
      // Filter for free meetups (keeping this requirement from original code)
      .filter(meetup => meetup.is_free_meetup)
      // Only process meetups with valid locations
      .filter(meetup => {
        // Extract location coordinates
        let meetupLat, meetupLng;
        
        if (meetup.location) {
          // Handle different location formats
          if (typeof meetup.location === 'string' && meetup.location.startsWith('POINT')) {
            const match = meetup.location.match(/POINT\(([^ ]+) ([^)]+)\)/);
            if (match) {
              meetupLng = parseFloat(match[1]);
              meetupLat = parseFloat(match[2]);
            }
          } else if (typeof meetup.location === 'object') {
            meetupLat = meetup.location.lat || meetup.location.latitude;
            meetupLng = meetup.location.lng || meetup.location.lon || meetup.location.longitude;
          }
        }
        
        return meetupLat && meetupLng; // Filter out meetups without valid coordinates
      })
      // Calculate distance and add it to each meetup
      .map(meetup => {
        let meetupLat, meetupLng;
        
        // Extract coordinates from location object/string
        if (typeof meetup.location === 'string' && meetup.location.startsWith('POINT')) {
          const match = meetup.location.match(/POINT\(([^ ]+) ([^)]+)\)/);
          if (match) {
            meetupLng = parseFloat(match[1]);
            meetupLat = parseFloat(match[2]);
          }
        } else if (typeof meetup.location === 'object') {
          meetupLat = meetup.location.lat || meetup.location.latitude;
          meetupLng = meetup.location.lng || meetup.location.lon || meetup.location.longitude;
        }
        
        // Calculate distance (use a function from utils or implement here)
        const distanceRadians = haversineDistance(
          location.lat, 
          location.lng, 
          meetupLat, 
          meetupLng
        );
        
        // Convert radians to meters (Earth radius ~6371 km)
        const distanceMeters = distanceRadians * 6371000;
        
        return {
          ...meetup,
          distance_meters: distanceMeters,
          location: { 
            lat: meetupLat, 
            lng: meetupLng 
          } // Normalize location format
        };
      })
      // Filter by distance
      .filter(meetup => meetup.distance_meters <= radius)
      // Sort by distance (closest first)
      .sort((a, b) => a.distance_meters - b.distance_meters)
      // Limit to a reasonable number
      .slice(0, 50);

    console.log(`Found ${filteredMeetups.length} nearby meetups after client-side filtering`);
    
    return filteredMeetups;
  } catch (error) {
    console.error('Error fetching nearby meetups:', error);
    return [];
  }
}

// Haversine formula for calculating distance between two points on Earth
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 1; // Use 1 for distance in radians, multiply by Earth's radius later
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
} 