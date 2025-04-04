import { handleGeolocationError, createGeolocationError } from './error-handler';
import logger from './Logger';

// Constants
const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org';
const PHOTON_ENDPOINT = 'https://photon.komoot.io/api/';
const MAX_RESULTS = 8;
const USER_AGENT = 'MeetNowApp/1.0';
const DEFAULT_TIMEOUT = 15000;
const DEFAULT_PROXIMITY_RADIUS = 50;
const DEFAULT_PROXIMITY_FACTOR = 0.7;
const LOCATION_CACHE_DURATION = 30000;

// Types
export interface ILocation {
  lat: number;
  lng: number;
  display_name: string;
  accuracy?: number;
  type: string;
  importance: number;
  distance: number | null;
}

export interface ILocationRequestOptions {
  bypassCache?: boolean;
  timeout?: number;
  enableHighAccuracy?: boolean;
  maximumAge?: number;
  retryCount?: number;
  retryDelay?: number;
}

export interface ISearchOptions {
  lat?: number;
  lng?: number;
  limit?: number;
  userLocation?: Location;
  proximityRadius?: number;
  proximityFactor?: number;
}

export interface ICachedLocation {
  location: Location;
  timestamp: number;
}

export interface IQueuedRequest {
  resolve: (location: Location) => void;
  reject: (error: Error) => void;
}

export interface IPhotonFeature {
  properties: {
    name: string;
    osm_key?: string;
    osm_value?: string;
    housenumber?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  geometry: {
    coordinates: [number, number];
  };
}

export interface IPhotonResponse {
  features: PhotonFeature[];
}

// Location Request Manager Class
class LocationRequestManager {
  private cachedLocation: Location | null;
  private lastRequestTime: number;
  private requestTimeout: number;
  private minRequestInterval: number;
  private maxCacheAge: number;
  private retryCount: number;
  private retryDelay: number;
  private pendingRequest: Promise<Location> | null;
  private requestQueue: QueuedRequest[];
  private isRequesting: boolean;

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

  private initializeCache(): void {
    try {
      const cachedData = localStorage.getItem('location_cache');
      if (cachedData) {
        const { location, timestamp } = JSON.parse(cachedData) as CachedLocation;
        if (location && timestamp && Date.now() - timestamp < this.maxCacheAge) {
          this.cachedLocation = location;
          this.lastRequestTime = timestamp;
          logger.info('LocationManager', 'Loaded location from persistent cache', { location });
        } else {
          localStorage.removeItem('location_cache');
        }
      }
    } catch (err) {
      logger.warn('LocationManager', 'Failed to load location from cache', err);
    }
  }

  private updateCache(location: Location): void {
    this.cachedLocation = location;
    this.lastRequestTime = Date.now();

    try {
      localStorage.setItem(
        'location_cache',
        JSON.stringify({
          location,
          timestamp: this.lastRequestTime,
        })
      );
    } catch (err) {
      logger.warn('LocationManager', 'Failed to persist location to cache', err);
    }
  }

  public async requestLocation(options: LocationRequestOptions = {}): Promise<Location> {
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
      const location: Location = {
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
    } catch (error) {
      this.rejectQueuedRequests(error as Error);
      logger.error('LocationManager', 'Error getting location', error);
      throw error;
    } finally {
      this.isRequesting = false;
    }
  }

  private resolveQueuedRequests(location: Location): void {
    if (this.requestQueue.length > 0) {
      logger.debug(
        'LocationManager',
        `Resolving ${this.requestQueue.length} queued location requests`
      );
      for (const request of this.requestQueue) {
        request.resolve(location);
      }
      this.requestQueue = [];
    }
  }

  private rejectQueuedRequests(error: Error): void {
    if (this.requestQueue.length > 0) {
      logger.debug(
        'LocationManager',
        `Rejecting ${this.requestQueue.length} queued location requests with error`
      );
      for (const request of this.requestQueue) {
        request.reject(error);
      }
      this.requestQueue = [];
    }
  }

  private async getCurrentPosition(
    options: LocationRequestOptions = {}
  ): Promise<GeolocationPosition> {
    const positionOptions: PositionOptions = {
      enableHighAccuracy:
        options.enableHighAccuracy !== undefined ? options.enableHighAccuracy : true,
      timeout: options.timeout ?? this.requestTimeout,
      maximumAge: options.maximumAge || 0,
    };

    const retryCount = options.retryCount !== undefined ? options.retryCount : this.retryCount;
    const retryDelay = options.retryDelay ?? this.retryDelay;

    let attempts = 0;

    const attemptGetPosition = async (): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Location request timed out'));
        }, positionOptions.timeout);

        navigator.geolocation.getCurrentPosition(
          position => {
            clearTimeout(timeoutId);
            resolve(position);
          },
          error => {
            clearTimeout(timeoutId);
            reject(error);
          },
          positionOptions
        );
      });
    };

    while (true) {
      try {
        return await attemptGetPosition();
      } catch (error) {
        attempts++;

        if (attempts > retryCount) {
          let errorMessage = 'Unable to retrieve your location';
          if ((error as GeolocationPositionError).code) {
            switch ((error as GeolocationPositionError).code) {
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
          } else if ((error as Error).message) {
            errorMessage = (error as Error).message;
          }

          const geoError = createGeolocationError(errorMessage);
          handleGeolocationError(geoError, { originalError: error as Error });

          throw geoError;
        }

        logger.warn(
          'LocationManager',
          `Location request attempt ${attempts} failed, retrying in ${retryDelay}ms`,
          error
        );
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  public clearCache(): void {
    this.cachedLocation = null;
    this.lastRequestTime = 0;

    try {
      localStorage.removeItem('location_cache');
    } catch (err) {
      // Ignore storage errors
    }

    logger.debug('LocationManager', 'Location cache cleared');
  }
}

export const locationRequestManager = new LocationRequestManager();

// Helper functions
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function prepareSearchQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ');
}

function formatAddress(result: PhotonFeature): string {
  const props = result.properties;
  const parts = [];

  if (props.name) parts.push(props.name);
  if (props.street) parts.push(props.street);
  if (props.city) parts.push(props.city);
  if (props.state) parts.push(props.state);
  if (props.country) parts.push(props.country);

  return parts.join(', ');
}

function formatPOI(result: PhotonFeature): string {
  const props = result.properties;
  if (props.name) return props.name;
  if (props.osm_key && props.osm_value) {
    return `${props.osm_key}: ${props.osm_value}`;
  }
  return 'Unnamed Location';
}

function getPlaceType(result: PhotonFeature): string {
  const props = result.properties;
  if (props.osm_key) return props.osm_key;
  return 'place';
}

// Main search function
export async function searchLocations(
  query: string,
  options: SearchOptions = {}
): Promise<Location[]> {
  try {
    const {
      lat,
      lng,
      limit = MAX_RESULTS,
      userLocation = null,
      proximityRadius = DEFAULT_PROXIMITY_RADIUS,
      proximityFactor = DEFAULT_PROXIMITY_FACTOR,
    } = options;

    const contextLat = lat !== undefined ? lat : userLocation ? userLocation.lat : undefined;
    const contextLng = lng !== undefined ? lng : userLocation ? userLocation.lng : undefined;

    const enhancedOptions: SearchOptions = {
      lat: contextLat,
      lng: contextLng,
      limit,
      userLocation:
        userLocation ??
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
      } catch (photonError) {
        logger.warn(
          'LocationServices',
          'Photon search failed, falling back to Nominatim:',
          photonError
        );
      }

      return await forwardGeocode(query, enhancedOptions);
    } else if (contextLat !== undefined && contextLng !== undefined) {
      const results = await reverseGeocode(contextLat, contextLng);
      return Array.isArray(results) ? results : [];
    } else {
      throw new Error('Either query or coordinates are required');
    }
  } catch (error) {
    logger.error('LocationServices', 'Error in searchLocations:', error);
    return [];
  }
}

/**
 * Search using Photon API
 */
async function searchWithPhoton(query: string, options: SearchOptions): Promise<Location[]> {
  const {
    lat,
    lng,
    limit = MAX_RESULTS,
    userLocation,
    proximityFactor = DEFAULT_PROXIMITY_FACTOR,
  } = options;

  const cleanQuery = prepareSearchQuery(query);
  if (!cleanQuery) return [];

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

    const data = (await response.json()) as PhotonResponse;

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

      // Sort by distance if user location is available
      if (userLocation) {
        results = rankByProximity(results, userLocation, proximityFactor);
      }

      return results;
    }

    return [];
  } catch (error) {
    logger.error('LocationServices', 'Error in searchWithPhoton:', error);
    throw error;
  }
}

/**
 * Forward geocode using Nominatim API
 */
async function forwardGeocode(query: string, options: SearchOptions): Promise<Location[]> {
  const {
    lat,
    lng,
    limit = MAX_RESULTS,
    userLocation,
    proximityFactor = DEFAULT_PROXIMITY_FACTOR,
  } = options;

  const cleanQuery = prepareSearchQuery(query);
  if (!cleanQuery) return [];

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

    const results = (await response.json()) as Location[];

    if (userLocation) {
      return rankByProximity(results, userLocation, proximityFactor);
    }

    return results;
  } catch (error) {
    logger.error('LocationServices', 'Error in forwardGeocode:', error);
    throw error;
  }
}

/**
 * Reverse geocode using Nominatim API
 */
export async function reverseGeocode(lat: number, lng: number): Promise<Location[]> {
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
  } catch (error) {
    logger.error('LocationServices', 'Error in reverseGeocode:', error);
    throw error;
  }
}

/**
 * Rank search results by proximity to user location
 */
function rankByProximity(
  results: Location[],
  userLocation: Location,
  proximityFactor: number
): Location[] {
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
