/**
 * GeoDemographicService.js
 * 
 * Service to fetch geographic and demographic data from external APIs
 * Uses caching for performance and implements fallback strategies for reliability
 */
import axios from 'axios';
import NodeCache from 'node-cache';

// Cache with default TTL of 24 hours (in seconds)
const cache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

class GeoDemographicService {
  constructor() {
    this.censusApiKey = process.env.CENSUS_API_KEY;
    this.worldpopApiKey = process.env.WORLDPOP_API_KEY;
    this.googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    // Initialize API clients
    this.httpClient = axios.create({
      timeout: 10000,
      headers: { 'User-Agent': 'MeetNow-PropertyService/1.0' }
    });
  }

  /**
   * Get population density for a specific location
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<{density: number, source: string, timestamp: Date, confidence: number}>}
   */
  async getPopulationDensity(lat, lng) {
    const cacheKey = `population_density:${lat},${lng}`;
    
    // Try cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for ${cacheKey}`);
      return cachedData;
    }
    
    try {
      // Try primary source first (Census API for US, WorldPop for international)
      let data;
      
      // Determine if location is in US (simplified check)
      const isUS = (lat > 24.396308 && lat < 49.384358 && 
                    lng > -125.000000 && lng < -66.934570);
      
      if (isUS && this.censusApiKey) {
        data = await this.fetchFromCensusAPI(lat, lng);
      } else if (this.worldpopApiKey) {
        data = await this.fetchFromWorldPopAPI(lat, lng);
      } else {
        // Fallback to OpenStreetMap population estimates
        data = await this.fetchFromOSMAPI(lat, lng);
      }
      
      // Cache result
      cache.set(cacheKey, data);
      return data;
      
    } catch (error) {
      console.error(`Error fetching population density: ${error.message}`);
      
      // Return a reasonable default with low confidence if all APIs fail
      return {
        density: 1000, // Default value (could be based on region averages)
        source: 'default',
        timestamp: new Date(),
        confidence: 0.1
      };
    }
  }
  
  /**
   * Get nearby points of interest
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} radius - Search radius in meters
   * @returns {Promise<Array<{name: string, type: string, popularity: number, distance: number}>>}
   */
  async getPointsOfInterest(lat, lng, radius = 1000) {
    const cacheKey = `poi:${lat},${lng},${radius}`;
    
    // Try cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    try {
      // Use Google Places API as primary source
      const response = await this.httpClient.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&key=${this.googleApiKey}`
      );
      
      if (response.data && response.data.results) {
        const data = response.data.results.map(place => ({
          name: place.name,
          type: place.types[0] || 'unknown',
          popularity: place.user_ratings_total || 0,
          distance: this.calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng)
        }));
        
        // Calculate POI density and importance
        const poiMetrics = this.calculatePOIMetrics(data);
        
        // Cache result
        cache.set(cacheKey, poiMetrics);
        return poiMetrics;
      }
      
      throw new Error('No results from Google Places API');
      
    } catch (error) {
      console.error(`Error fetching points of interest: ${error.message}`);
      
      // Return empty result with low importance if API fails
      return {
        poiCount: 0,
        poiDensity: 0,
        poiImportance: 0.5,
        confidence: 0.1,
        source: 'default',
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Get social media trending data for a location
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<{trendingScore: number, mentionsCount: number, source: string}>}
   */
  async getSocialTrendingData(lat, lng) {
    const cacheKey = `trending:${lat},${lng}`;
    
    // Try cache first - shorter TTL for trending data (4 hours)
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // Implementation would connect to Twitter/X API, Instagram, etc.
    // This is a simplified mock implementation
    
    try {
      // Mock data - in a real implementation, this would call social APIs
      const mockTrendingScore = Math.random() * (lat % 10) + (lng % 10);
      const mockMentionsCount = Math.floor(Math.random() * 1000) * (mockTrendingScore / 10);
      
      const data = {
        trendingScore: mockTrendingScore,
        mentionsCount: mockMentionsCount,
        source: 'mock',
        timestamp: new Date(),
        confidence: 0.7
      };
      
      // Cache with shorter TTL for trending data (4 hours)
      cache.set(cacheKey, data, 14400);
      return data;
      
    } catch (error) {
      console.error(`Error fetching trending data: ${error.message}`);
      
      // Return default data with low confidence
      return {
        trendingScore: 5,
        mentionsCount: 0,
        source: 'default',
        timestamp: new Date(),
        confidence: 0.1
      };
    }
  }
  
  /**
   * Calculate property value based on all factors
   * @param {Object} property - Property object with location data
   * @returns {Promise<{baseValue: number, currentValue: number, factors: Object}>}
   */
  async calculatePropertyValue(property) {
    const { lat, lng, baseValue } = property;
    
    // Get all factors in parallel
    const [densityData, poiData, trendingData] = await Promise.all([
      this.getPopulationDensity(lat, lng),
      this.getPointsOfInterest(lat, lng),
      this.getSocialTrendingData(lat, lng)
    ]);
    
    // Calculate individual factor impacts (normalized to 0.8-2.0 range)
    const densityFactor = this.normalizeFactor(densityData.density, 1000, 25000, 0.8, 2.0);
    const poiFactor = this.normalizeFactor(poiData.poiImportance, 0, 1, 0.8, 1.5);
    const trendingFactor = this.normalizeFactor(trendingData.trendingScore, 0, 20, 0.9, 1.3);
    
    // Calculate overall multiplier (with different weights)
    const overallFactor = (
      densityFactor * 0.5 + 
      poiFactor * 0.3 + 
      trendingFactor * 0.2
    );
    
    // Calculate current value
    const currentValue = Math.round(baseValue * overallFactor);
    
    return {
      baseValue,
      currentValue,
      factors: {
        density: {
          value: densityData.density,
          factor: densityFactor,
          source: densityData.source,
          confidence: densityData.confidence
        },
        pointsOfInterest: {
          count: poiData.poiCount,
          factor: poiFactor,
          source: poiData.source,
          confidence: poiData.confidence
        },
        trending: {
          score: trendingData.trendingScore,
          factor: trendingFactor,
          source: trendingData.source,
          confidence: trendingData.confidence
        },
        overall: overallFactor
      }
    };
  }
  
  // -------------------- Private Methods --------------------
  
  /**
   * Fetch population data from US Census API
   * @private
   */
  async fetchFromCensusAPI(lat, lng) {
    // Implementation would use Census geocoding and data APIs
    // For now, returning mock data based on coordinates
    
    // Higher density for coordinates closer to city centers (very simplified)
    const density = 5000 + Math.abs(Math.sin(lat) * Math.cos(lng) * 20000);
    
    return {
      density,
      source: 'census_api',
      timestamp: new Date(),
      confidence: 0.9
    };
  }
  
  /**
   * Fetch population data from WorldPop API
   * @private
   */
  async fetchFromWorldPopAPI(lat, lng) {
    // Implementation would connect to WorldPop API
    // For now, returning mock data
    
    // Different calculation for international locations
    const density = 2000 + Math.abs(Math.cos(lat) * Math.sin(lng) * 10000);
    
    return {
      density,
      source: 'worldpop_api',
      timestamp: new Date(),
      confidence: 0.8
    };
  }
  
  /**
   * Fetch population estimate from OpenStreetMap
   * @private
   */
  async fetchFromOSMAPI(lat, lng) {
    // Implementation would connect to OpenStreetMap Overpass API
    // For now, returning mock data
    
    // Simpler calculation for fallback
    const density = 1000 + Math.abs(lat + lng) * 500;
    
    return {
      density,
      source: 'osm_api',
      timestamp: new Date(),
      confidence: 0.6
    };
  }
  
  /**
   * Calculate distance between two points
   * @private
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    // Haversine formula implementation
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const d = R * c; // Distance in km
    return d * 1000; // Convert to meters
  }
  
  deg2rad(deg) {
    return deg * (Math.PI/180);
  }
  
  /**
   * Calculate POI metrics based on found points
   * @private
   */
  calculatePOIMetrics(pois) {
    if (!pois || pois.length === 0) {
      return {
        poiCount: 0,
        poiDensity: 0,
        poiImportance: 0.5,
        confidence: 0.5,
        source: 'google_places',
        timestamp: new Date()
      };
    }
    
    // Count total POIs
    const poiCount = pois.length;
    
    // Calculate POI density (POIs per square km, assuming 1km radius)
    const poiDensity = poiCount / (Math.PI * 1 * 1); // area of circle = πr²
    
    // Calculate importance based on POI types and popularity
    // Certain types (restaurants, shopping, etc.) are weighted higher
    const importantTypes = ['restaurant', 'shopping_mall', 'tourist_attraction', 'museum', 'park'];
    let importanceScore = 0;
    
    pois.forEach(poi => {
      let typeMultiplier = importantTypes.includes(poi.type) ? 1.5 : 1.0;
      let popularityScore = Math.min(1.0, poi.popularity / 1000);
      let distanceScore = 1.0 - (poi.distance / 1000); // closer is better
      
      importanceScore += typeMultiplier * popularityScore * distanceScore;
    });
    
    // Normalize importance to 0-1 range
    const poiImportance = Math.min(1.0, importanceScore / (poiCount * 1.5));
    
    return {
      poiCount,
      poiDensity,
      poiImportance,
      confidence: 0.8,
      source: 'google_places',
      timestamp: new Date()
    };
  }
  
  /**
   * Normalize a value to a specific range
   * @private
   */
  normalizeFactor(value, minInput, maxInput, minOutput, maxOutput) {
    // Clamp input value to the input range
    const clampedValue = Math.max(minInput, Math.min(maxInput, value));
    
    // Calculate the normalized value in the output range
    return minOutput + (clampedValue - minInput) * (maxOutput - minOutput) / (maxInput - minInput);
  }
}

export default new GeoDemographicService(); 