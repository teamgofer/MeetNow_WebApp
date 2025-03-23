# External API Integration for Property Valuation

This document outlines how MeetNow's property system will integrate with external APIs to dynamically fetch geographic and demographic data rather than relying on manually entered values.

## Architecture Overview

Instead of storing population density and other geographic data in our database, we'll implement a service-based architecture that:

1. Fetches real-time data from external APIs
2. Caches results when appropriate for performance
3. Applies this external data to our property valuation formulas

## External APIs to Integrate

### Population Density Data
- **Census API**: For official population statistics (US)
- **WorldPop API**: For global population density data
- **OpenStreetMap Population**: For community-maintained population estimates

### Points of Interest
- **Google Places API**: For business and attraction data
- **Foursquare API**: For trending places and foot traffic
- **Yelp API**: For business ratings and popularity

### Trending Data
- **Twitter/X API**: For location mentions and activity
- **Instagram Graph API**: For location tags and popularity
- **Google Trends API**: For location-based search trends

## Implementation Strategy

### 1. API Gateway Service

Create a dedicated service that:
- Manages all external API calls
- Handles rate limiting and quotas
- Provides consistent response formatting
- Implements intelligent caching (hourly/daily/weekly depending on data volatility)

```typescript
// Example of API Gateway service
class GeoDemographicService {
  async getPopulationDensity(lat, lng): Promise<PopulationDensityData> {
    // Check cache first
    const cachedData = await this.cache.get(`pop_density:${lat},${lng}`);
    if (cachedData) return cachedData;
    
    // Try primary source
    try {
      const data = await this.censusApiClient.getPopulationDensity(lat, lng);
      await this.cache.set(`pop_density:${lat},${lng}`, data, '1 day');
      return data;
    } catch (e) {
      // Fall back to alternative source
      const fallbackData = await this.worldPopApiClient.getPopulationDensity(lat, lng);
      await this.cache.set(`pop_density:${lat},${lng}`, fallbackData, '1 day');
      return fallbackData;
    }
  }
  
  // Similar methods for other data types
}
```

### 2. Data Normalization Layer

Create adapters for each API that normalize responses to a consistent format:

```typescript
interface NormalizedDensityData {
  density: number;         // people per sq km
  confidence: number;      // 0-1 score
  lastUpdated: Date;       // when this data was captured
  source: string;          // which API provided this
  resolution: number;      // geographic resolution in meters
}
```

### 3. Database Schema Modifications

Instead of storing full demographic datasets, we'll modify our approach to:

1. Store minimal reference data (API keys, credentials, etc.)
2. Create a lightweight cache table for frequently accessed data
3. Maintain a log of external data usage for auditability

```sql
-- API reference table
CREATE TABLE external_api_configs (
  api_name TEXT PRIMARY KEY,
  api_key TEXT,
  base_url TEXT,
  rate_limit INTEGER,
  enabled BOOLEAN
);

-- Lightweight cache for API responses
CREATE TABLE api_data_cache (
  cache_key TEXT PRIMARY KEY,
  data JSONB,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_accessed TIMESTAMP WITH TIME ZONE
);

-- Update property_value_factors to reference external data
ALTER TABLE property_value_factors
ADD COLUMN external_data_sources JSONB;
```

### 4. Background Processing

For efficiency, implement background jobs to:

1. Pre-fetch data for high-interest areas
2. Update property values in batches using the latest external data
3. Clean up expired cache entries

## Property Valuation Formula

Update the property valuation function to use this dynamic external data:

```sql
CREATE OR REPLACE FUNCTION calculate_property_value(property_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  base_value NUMERIC;
  density_factor NUMERIC;
  poi_factor NUMERIC;
  trends_factor NUMERIC;
BEGIN
  -- Get base values first
  SELECT p.base_value 
  INTO base_value
  FROM virtual_properties p
  WHERE p.id = property_id;
  
  -- Call external API service via database function that wraps HTTP request
  SELECT value::NUMERIC INTO density_factor
  FROM http_get_json('http://internal-api-gateway/population-density?lat=' || 
                     ST_Y(p.center_point::geometry) || '&lng=' || 
                     ST_X(p.center_point::geometry))
  FROM virtual_properties p
  WHERE p.id = property_id;
  
  -- Similar calls for other factors
  
  -- Apply combined factors
  RETURN base_value * density_factor * poi_factor * trends_factor;
END;
$$ LANGUAGE plpgsql;
```

## Fallback Strategy

To ensure system reliability when external APIs are unavailable:

1. Implement exponential backoff for API retries
2. Maintain a minimum viable dataset for critical regions
3. Use last known good values when fresh data is unavailable
4. Alert operations team when external data sources are consistently failing

## API Cost Management

To manage costs associated with external APIs:

1. Implement tiered data freshness (premium properties get real-time data, others get daily/weekly updates)
2. Batch and share API calls for properties in similar geographic areas
3. Use free/open data sources where possible, falling back to paid APIs for premium accuracy

## Next Steps

1. Research and select specific APIs for each data category
2. Develop the API Gateway service with proper caching and error handling
3. Create mock API responses for development and testing
4. Implement the database modifications to support this architecture
5. Update the property valuation logic to use dynamic external data 