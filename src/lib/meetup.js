import supabase from '../supabase';
export async function createFreeMeetup(data) {
    try {
        console.log('Creating free meetup with Supabase RPC:', data);
        if (!data.location ??
            (typeof data.location.lat !== 'number' || typeof data.location.lng !== 'number')) {
            console.error('Invalid location data:', data.location);
            throw new Error('Invalid location coordinates');
        }
        const { data: result, error } = await supabase.rpc('create_free_meetup', {
            p_location: data.location,
            p_address: data.address ?? null,
            p_status: 'active',
        });
        if (error) {
            console.error('Supabase RPC error:', error);
            throw error;
        }
        console.log('Free meetup created successfully:', result);
        return { success: true, meetupId: result.id };
    }
    catch (error) {
        console.error('Error creating meetup:', error);
        return { success: false, error: 'Failed to create meetup' };
    }
}
export async function getNearbyFreeMeetups(location, radius = 5000) {
    try {
        if (!location ?? (typeof location.lat !== 'number' || typeof location.lng !== 'number')) {
            console.error('Invalid user location data:', location);
            throw new Error('Invalid user location coordinates');
        }
        console.log(`Using client-side spatial filtering with USER location:`, location);
        const { data: meetups, error } = await supabase
            .from('meetups_with_expiry')
            .select('*')
            .eq('status', 'active')
            .gt('expires_at', new Date().toISOString());
        if (error) {
            console.error('Error fetching meetups:', error);
            throw error;
        }
        if (!meetups ?? meetups.length === 0) {
            console.log('No active meetups found');
            return [];
        }
        console.log(`Found ${meetups.length} active meetups, filtering by distance from USER...`);
        const filteredMeetups = meetups
            .filter(meetup => meetup.is_free_meetup)
            .filter(meetup => {
            let meetupLat, meetupLng;
            if (meetup.location) {
                if (typeof meetup.location === 'string' && meetup.location.startsWith('POINT')) {
                    const match = meetup.location.match(/POINT\(([^ ]+) ([^)]+)\)/);
                    if (match) {
                        meetupLng = parseFloat(match[1]);
                        meetupLat = parseFloat(match[2]);
                    }
                }
                else if (typeof meetup.location === 'object') {
                    meetupLat = meetup.location.lat ?? meetup.location.latitude;
                    meetupLng = meetup.location.lng ?? (meetup.location.lon || meetup.location.longitude);
                }
            }
            return meetupLat && meetupLng;
        })
            .map(meetup => {
            let meetupLat, meetupLng;
            if (typeof meetup.location === 'string' && meetup.location.startsWith('POINT')) {
                const match = meetup.location.match(/POINT\(([^ ]+) ([^)]+)\)/);
                if (match) {
                    meetupLng = parseFloat(match[1]);
                    meetupLat = parseFloat(match[2]);
                }
            }
            else if (typeof meetup.location === 'object') {
                meetupLat = meetup.location.lat ?? meetup.location.latitude;
                meetupLng = meetup.location.lng ?? (meetup.location.lon || meetup.location.longitude);
            }
            const distanceRadians = haversineDistance(location.lat, location.lng, meetupLat, meetupLng);
            const distanceMeters = distanceRadians * 6371000;
            return {
                ...meetup,
                distance_meters: distanceMeters,
                distance_formatted: distanceMeters < 1000
                    ? `${Math.round(distanceMeters)}m`
                    : `${(distanceMeters / 1000).toFixed(1)}km`,
                location: {
                    lat: meetupLat,
                    lng: meetupLng,
                },
            };
        })
            .filter(meetup => meetup.distance_meters <= radius)
            .sort((a, b) => a.distance_meters - b.distance_meters)
            .slice(0, 50);
        console.log(`Found ${filteredMeetups.length} nearby meetups after filtering by proximity to USER`);
        return filteredMeetups;
    }
    catch (error) {
        console.error('Error fetching nearby meetups:', error);
        return [];
    }
}
export async function nearbyMeetups(location, radius = 5000) {
    try {
        if (!location.lat ?? !location.lng) {
            console.error('Invalid location data:', location);
            return [];
        }
        console.log(`Using client-side spatial filtering with location:`, location);
        const { data: meetups, error } = await supabase
            .from('meetups_with_expiry')
            .select('*')
            .eq('status', 'active')
            .gt('expires_at', new Date().toISOString());
        if (error) {
            console.error('Error fetching meetups:', error);
            throw error;
        }
        if (!meetups ?? meetups.length === 0) {
            console.log('No active meetups found');
            return [];
        }
        console.log(`Found ${meetups.length} active meetups, filtering by distance...`);
        const filteredMeetups = meetups
            .filter(meetup => meetup.is_free_meetup)
            .filter(meetup => {
            let meetupLat, meetupLng;
            if (meetup.location) {
                if (typeof meetup.location === 'string' && meetup.location.startsWith('POINT')) {
                    const match = meetup.location.match(/POINT\(([^ ]+) ([^)]+)\)/);
                    if (match) {
                        meetupLng = parseFloat(match[1]);
                        meetupLat = parseFloat(match[2]);
                    }
                }
                else if (typeof meetup.location === 'object') {
                    meetupLat = meetup.location.lat ?? meetup.location.latitude;
                    meetupLng = meetup.location.lng ?? (meetup.location.lon || meetup.location.longitude);
                }
            }
            return meetupLat && meetupLng;
        })
            .map(meetup => {
            let meetupLat, meetupLng;
            if (typeof meetup.location === 'string' && meetup.location.startsWith('POINT')) {
                const match = meetup.location.match(/POINT\(([^ ]+) ([^)]+)\)/);
                if (match) {
                    meetupLng = parseFloat(match[1]);
                    meetupLat = parseFloat(match[2]);
                }
            }
            else if (typeof meetup.location === 'object') {
                meetupLat = meetup.location.lat ?? meetup.location.latitude;
                meetupLng = meetup.location.lng ?? (meetup.location.lon || meetup.location.longitude);
            }
            const distanceRadians = haversineDistance(location.lat, location.lng, meetupLat, meetupLng);
            const distanceMeters = distanceRadians * 6371000;
            return {
                ...meetup,
                distance_meters: distanceMeters,
                location: {
                    lat: meetupLat,
                    lng: meetupLng,
                },
            };
        })
            .filter(meetup => meetup.distance_meters <= radius)
            .sort((a, b) => a.distance_meters - b.distance_meters)
            .slice(0, 50);
        console.log(`Found ${filteredMeetups.length} nearby meetups after client-side filtering`);
        return filteredMeetups;
    }
    catch (error) {
        console.error('Error fetching nearby meetups:', error);
        return [];
    }
}
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 1;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}
//# sourceMappingURL=meetup.js.map