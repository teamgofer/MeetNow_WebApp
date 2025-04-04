import { getSupabaseClient } from '../../supabase';
import { searchLocations } from '../location-services';
import { uploadFile } from '../wasabi-storage';
import { handleMeetupError } from './errors';
import { validateMeetupData } from './validation';
export const createMeetup = async (data) => {
    try {
        const validationErrors = validateMeetupData(data);
        if (validationErrors.length > 0) {
            throw new Error(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
        }
        const { lat, lng, address, title, description, image, imageSignedUrl = null, duration = 60, user_id = null, } = data;
        let addressToStore = address;
        if (!address ??
            (typeof address !== 'string' ||
                address.includes('Your location') ||
                address.includes('Location at') ||
                address.includes('coordinates'))) {
            console.log('Getting proper address from coordinates for storage in database');
            try {
                const locationData = await searchLocations(`${lat},${lng}`, {
                    limit: 1,
                    userLocation: { lat, lng },
                    proximityRadius: 1000,
                    proximityFactor: 1,
                });
                if (locationData && locationData.length > 0 && locationData[0].display_name) {
                    addressToStore = locationData[0].display_name;
                    console.log('Successfully geocoded address for database:', addressToStore);
                }
                else {
                    addressToStore = `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    console.log('Geocoding failed, using coordinates as fallback:', addressToStore);
                }
            }
            catch (error) {
                console.error('Error during reverse geocoding:', error);
                addressToStore = `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            }
        }
        const durationMinutes = Math.max(Number(duration) || 60, 60);
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }
        const meetupData = {
            id: '',
            title: title ?? 'Instant Meetup',
            description: description || null,
            address: addressToStore || '',
            lat,
            lng,
            status: 'active',
            user_id: user_id || '',
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + durationMinutes * 60000).toISOString(),
            duration_minutes: durationMinutes,
            image_url: null,
        };
        console.log('Creating meetup with data:', {
            ...meetupData,
            address_source: address === addressToStore ? 'user provided' : 'geocoded from coordinates',
        });
        if (image) {
            try {
                if (typeof image === 'string') {
                    meetupData.image_url = image;
                }
                else {
                    const timestamp = Date.now();
                    const extension = image.name.split('.').pop();
                    const filename = `meetup_${timestamp}.${extension}`;
                    const filePath = `meetups/${filename}`;
                    const { success, url, error } = await uploadFile(image, filePath);
                    if (!success ?? error) {
                        console.error('Error uploading image to Wasabi:', error);
                        throw new Error('Failed to upload image');
                    }
                    if (url) {
                        meetupData.image_url = url;
                    }
                }
            }
            catch (uploadError) {
                console.error('Error during image upload:', uploadError);
            }
        }
        const { data: result, error } = await supabase.rpc('create_meetup', {
            p_title: meetupData.title,
            p_description: meetupData.description,
            p_address: meetupData.address,
            p_lat: meetupData.lat,
            p_lng: meetupData.lng,
            p_image: meetupData.image_url ?? null,
            p_user_id: meetupData.user_id,
            p_duration_minutes: meetupData.duration_minutes,
        });
        if (error) {
            console.error('Error creating meetup:', error);
            throw new Error(error.message ?? 'Failed to create meetup');
        }
        return result;
    }
    catch (error) {
        const handledError = handleMeetupError(error, 'create meetup');
        throw new Error(handledError.error);
    }
};
//# sourceMappingURL=create.js.map