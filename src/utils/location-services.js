import { handleGeolocationError, createGeolocationError } from './error-handler';
import logger from './Logger';
const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org';
const PHOTON_ENDPOINT = 'https://photon.komoot.io/api/';
const MAX_RESULTS = 8;
const USER_AGENT = 'MeetNowApp/1.0';
const DEFAULT_TIMEOUT = 15000;
const DEFAULT_PROXIMITY_RADIUS = 50;
const DEFAULT_PROXIMITY_FACTOR = 0.7;
const LOCATION_CACHE_DURATION = 30000;
class LocationRequestManager {
    constructor() {
        this.cachedLocation = null;
        this.lastRequestTime = 0;
        this.requestTimeout = DEFAULT_TIMEOUT;
        this.minRequestInterval = 5000;
        this.maxCacheAge = LOCATION_CACHE_DURATION;
        this.retryCount = 2;
        this.retryDelay = 2000;
        this.pendingRequest = null;
        this.requestQueue = [];
        this.isRequesting = false;
        this.initializeCache();
    }
    initializeCache() {
        try {
            const cachedData = localStorage.getItem('location_cache');
            if (cachedData) {
                const { location, timestamp } = JSON.parse(cachedData);
                if (location && timestamp && Date.now() - timestamp < this.maxCacheAge) {
                    this.cachedLocation = location;
                    this.lastRequestTime = timestamp;
                    logger.info('LocationManager', 'Loaded location from persistent cache', { location });
                }
                else {
                    localStorage.removeItem('location_cache');
                }
            }
        }
        catch (err) {
            logger.warn('LocationManager', 'Failed to load location from cache', err);
        }
    }
    updateCache(location) {
        this.cachedLocation = location;
        this.lastRequestTime = Date.now();
        try {
            localStorage.setItem('location_cache', JSON.stringify({
                location,
                timestamp: this.lastRequestTime,
            }));
        }
        catch (err) {
            logger.warn('LocationManager', 'Failed to persist location to cache', err);
        }
    }
    async requestLocation(options = {}) {
        const bypassCache = options.bypassCache ?? false;
        const timeout = options.timeout ?? this.requestTimeout;
        const now = Date.now();
        if (!bypassCache && this.cachedLocation && now - this.lastRequestTime < this.maxCacheAge) {
            logger.debug('LocationManager', 'Using cached location', {
                location: this.cachedLocation,
                age: now - this.lastRequestTime,
            });
            return this.cachedLocation;
        }
        if (this.isRequesting) {
            logger.debug('LocationManager', 'Location request already in progress, queueing request');
            return new Promise((resolve, reject) => {
                this.requestQueue.push({ resolve, reject });
            });
        }
        this.isRequesting = true;
        try {
            const position = await this.getCurrentPosition({ timeout });
            const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                display_name: 'Your Location',
                accuracy: position.coords.accuracy,
                type: 'Your Location',
                importance: 1,
                distance: null,
            };
            this.updateCache(location);
            this.resolveQueuedRequests(location);
            logger.info('LocationManager', 'Location request succeeded', { location });
            return location;
        }
        catch (error) {
            this.rejectQueuedRequests(error);
            logger.error('LocationManager', 'Error getting location', error);
            throw error;
        }
        finally {
            this.isRequesting = false;
        }
    }
    resolveQueuedRequests(location) {
        if (this.requestQueue.length > 0) {
            logger.debug('LocationManager', `Resolving ${this.requestQueue.length} queued location requests`);
            for (const request of this.requestQueue) {
                request.resolve(location);
            }
            this.requestQueue = [];
        }
    }
    rejectQueuedRequests(error) {
        if (this.requestQueue.length > 0) {
            logger.debug('LocationManager', `Rejecting ${this.requestQueue.length} queued location requests with error`);
            for (const request of this.requestQueue) {
                request.reject(error);
            }
            this.requestQueue = [];
        }
    }
    async getCurrentPosition(options = {}) {
        const positionOptions = {
            enableHighAccuracy: options.enableHighAccuracy !== undefined ? options.enableHighAccuracy : true,
            timeout: options.timeout ?? this.requestTimeout,
            maximumAge: options.maximumAge || 0,
        };
        const retryCount = options.retryCount !== undefined ? options.retryCount : this.retryCount;
        const retryDelay = options.retryDelay ?? this.retryDelay;
        let attempts = 0;
        const attemptGetPosition = async () => {
            return new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    reject(new Error('Location request timed out'));
                }, positionOptions.timeout);
                navigator.geolocation.getCurrentPosition(position => {
                    clearTimeout(timeoutId);
                    resolve(position);
                }, error => {
                    clearTimeout(timeoutId);
                    reject(error);
                }, positionOptions);
            });
        };
        while (true) {
            try {
                return await attemptGetPosition();
            }
            catch (error) {
                attempts++;
                if (attempts > retryCount) {
                    let errorMessage = 'Unable to retrieve your location';
                    if (error.code) {
                        switch (error.code) {
                            case 1:
                                errorMessage = 'Location permission denied';
                                break;
                            case 2:
                                errorMessage = 'Location information unavailable';
                                break;
                            case 3:
                                errorMessage = 'Location request timed out';
                                break;
                            default:
                                errorMessage = 'An unknown error occurred';
                        }
                    }
                    else if (error.message) {
                        errorMessage = error.message;
                    }
                    const geoError = createGeolocationError(errorMessage);
                    handleGeolocationError(geoError, { originalError: error });
                    throw geoError;
                }
                logger.warn('LocationManager', `Location request attempt ${attempts} failed, retrying in ${retryDelay}ms`, error);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }
    clearCache() {
        this.cachedLocation = null;
        this.lastRequestTime = 0;
        try {
            localStorage.removeItem('location_cache');
        }
        catch (err) {
        }
        logger.debug('LocationManager', 'Location cache cleared');
    }
}
export const locationRequestManager = new LocationRequestManager();
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function toRad(degrees) {
    return degrees * (Math.PI / 180);
}
function prepareSearchQuery(query) {
    return query.trim().replace(/\s+/g, ' ');
}
function formatAddress(result) {
    const props = result.properties;
    const parts = [];
    if (props.name)
        parts.push(props.name);
    if (props.street)
        parts.push(props.street);
    if (props.city)
        parts.push(props.city);
    if (props.state)
        parts.push(props.state);
    if (props.country)
        parts.push(props.country);
    return parts.join(', ');
}
function formatPOI(result) {
    const props = result.properties;
    if (props.name)
        return props.name;
    if (props.osm_key && props.osm_value) {
        return `${props.osm_key}: ${props.osm_value}`;
    }
    return 'Unnamed Location';
}
function getPlaceType(result) {
    const props = result.properties;
    if (props.osm_key)
        return props.osm_key;
    return 'place';
}
export async function searchLocations(query, options = {}) {
    try {
        const { lat, lng, limit = MAX_RESULTS, userLocation = null, proximityRadius = DEFAULT_PROXIMITY_RADIUS, proximityFactor = DEFAULT_PROXIMITY_FACTOR, } = options;
        const contextLat = lat !== undefined ? lat : userLocation ? userLocation.lat : undefined;
        const contextLng = lng !== undefined ? lng : userLocation ? userLocation.lng : undefined;
        const enhancedOptions = {
            lat: contextLat,
            lng: contextLng,
            limit,
            userLocation: userLocation ??
                (contextLat !== undefined && contextLng !== undefined
                    ? {
                        lat: contextLat,
                        lng: contextLng,
                        display_name: 'Context Location',
                        type: 'Context',
                        importance: 0.5,
                        distance: null,
                    }
                    : undefined),
            proximityRadius,
            proximityFactor,
        };
        if (query) {
            try {
                const results = await searchWithPhoton(query, enhancedOptions);
                if (results && results.length > 0) {
                    logger.info('LocationServices', 'Photon search successful with results:', {
                        count: results.length,
                    });
                    return results;
                }
            }
            catch (photonError) {
                logger.warn('LocationServices', 'Photon search failed, falling back to Nominatim:', photonError);
            }
            return await forwardGeocode(query, enhancedOptions);
        }
        else if (contextLat !== undefined && contextLng !== undefined) {
            const results = await reverseGeocode(contextLat, contextLng);
            return Array.isArray(results) ? results : [];
        }
        else {
            throw new Error('Either query or coordinates are required');
        }
    }
    catch (error) {
        logger.error('LocationServices', 'Error in searchLocations:', error);
        return [];
    }
}
async function searchWithPhoton(query, options) {
    const { lat, lng, limit = MAX_RESULTS, userLocation, proximityFactor = DEFAULT_PROXIMITY_FACTOR, } = options;
    const cleanQuery = prepareSearchQuery(query);
    if (!cleanQuery)
        return [];
    let url = `${PHOTON_ENDPOINT}?q=${encodeURIComponent(cleanQuery)}&limit=${limit}`;
    if (lat !== undefined && lng !== undefined) {
        url += `&lat=${lat}&lon=${lng}`;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
    try {
        const response = await fetch(url, {
            headers: {
                Accept: 'application/json',
                'User-Agent': USER_AGENT,
            },
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            throw new Error(`Photon API error: ${response.status} ${response.statusText}`);
        }
        const data = (await response.json());
        if (data && data.features) {
            let results = data.features.map(feature => {
                const props = feature.properties;
                const coordinates = feature.geometry.coordinates;
                const resultLat = parseFloat(coordinates[1].toString());
                const resultLng = parseFloat(coordinates[0].toString());
                let distance = null;
                if (userLocation) {
                    distance = calculateDistance(userLocation.lat, userLocation.lng, resultLat, resultLng);
                }
                return {
                    lat: resultLat,
                    lng: resultLng,
                    display_name: formatAddress(feature),
                    type: getPlaceType(feature),
                    distance,
                    importance: props.osm_key ? 0.5 : 0.3,
                };
            });
            if (userLocation) {
                results = rankByProximity(results, userLocation, proximityFactor);
            }
            return results;
        }
        return [];
    }
    catch (error) {
        logger.error('LocationServices', 'Error in searchWithPhoton:', error);
        throw error;
    }
}
async function forwardGeocode(query, options) {
    const { lat, lng, limit = MAX_RESULTS, userLocation, proximityFactor = DEFAULT_PROXIMITY_FACTOR, } = options;
    const cleanQuery = prepareSearchQuery(query);
    if (!cleanQuery)
        return [];
    let url = `${NOMINATIM_ENDPOINT}/search?q=${encodeURIComponent(cleanQuery)}&format=json&limit=${limit}`;
    if (lat !== undefined && lng !== undefined) {
        url += `&lat=${lat}&lon=${lng}`;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
    try {
        const response = await fetch(url, {
            headers: {
                Accept: 'application/json',
                'User-Agent': USER_AGENT,
            },
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
        }
        const results = (await response.json());
        if (userLocation) {
            return rankByProximity(results, userLocation, proximityFactor);
        }
        return results;
    }
    catch (error) {
        logger.error('LocationServices', 'Error in forwardGeocode:', error);
        throw error;
    }
}
export async function reverseGeocode(lat, lng) {
    const url = `${NOMINATIM_ENDPOINT}/reverse?lat=${lat}&lon=${lng}&format=json`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);
    try {
        const response = await fetch(url, {
            headers: {
                Accept: 'application/json',
                'User-Agent': USER_AGENT,
            },
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        return [
            {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                display_name: result.display_name,
                type: result.type ?? 'Unknown',
                importance: result.importance || 0.5,
                distance: null,
            },
        ];
    }
    catch (error) {
        logger.error('LocationServices', 'Error in reverseGeocode:', error);
        throw error;
    }
}
function rankByProximity(results, userLocation, proximityFactor) {
    return results.sort((a, b) => {
        const distanceA = calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
        const distanceB = calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
        const importanceA = a.importance ?? 0;
        const importanceB = b.importance ?? 0;
        const scoreA = (1 - proximityFactor) * importanceA + proximityFactor * (1 / (distanceA + 1));
        const scoreB = (1 - proximityFactor) * importanceB + proximityFactor * (1 / (distanceB + 1));
        return scoreB - scoreA;
    });
}
//# sourceMappingURL=location-services.js.map