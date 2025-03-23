# MeetNow Technical Handover

## Overview

This document details the technical implementations and fixes for the MeetNow application, focusing on:

1. Meetup timestamp and expiry calculation
2. Timezone handling
3. Credit system for premium meetups
4. Admin routes and authentication
5. Worldwide region structure system

## 1. Meetup Timestamp & Expiry Solutions

### Issue Addressed
- Incorrect timestamp calculations causing meetups to expire at wrong times
- Client-side time calculations leading to inconsistencies
- Missing expiry column in database schema

### Solutions Implemented

#### 1.1 Server-Side Timestamp Calculation (`meetup_functions_fix.sql`)
```sql
CREATE FUNCTION create_meetup(
  -- parameters
)
RETURNS JSONB AS $$
DECLARE
  -- variables
BEGIN
  -- Calculate starts_at using server's current timestamp
  v_starts_at := current_timestamp;
  
  -- Insert with server timestamp
  -- ...
END; $$;
```

- All timestamps now use `current_timestamp` on the server
- Expiry calculated as `starts_at + (duration_minutes * interval '1 minute')`
- Duration properly drives the free vs premium classification

#### 1.2 View with Calculated Expiry (`meetup_timestamp_view_fix.sql`)
```sql
CREATE VIEW meetups_expiry_view AS
SELECT 
  m.*,
  (m.starts_at + (m.duration_minutes * interval '1 minute')) AS expires_at,
  CASE
    WHEN (m.starts_at + (m.duration_minutes * interval '1 minute')) < current_timestamp THEN 'expired'
    WHEN m.status = 'active' THEN 'active'
    ELSE m.status
  END AS calculated_status
FROM 
  meetups m;
```

- Dynamic expiry calculation based on duration
- Automatic status updates based on current time

## 2. Location-Based Timezone Handling

### Issue Addressed
- Meetup times not displayed in correct local timezone
- No consideration for meetup location when displaying times

### Solutions Implemented

#### 2.1 Coordinate-Based Timezone Detection (`location_based_timezone.sql`)
```sql
CREATE FUNCTION get_timezone_from_coordinates(
  lat DOUBLE PRECISION, 
  lng DOUBLE PRECISION
) RETURNS TEXT AS $$
  -- Regional timezone approximations based on lat/lng
  -- Returns timezone identifier (e.g., 'America/New_York')
  -- Now defaults to Pacific Time (America/Los_Angeles) if no match
$$;
```

- Determines appropriate timezone based on geographic coordinates
- Enhanced Mexico coverage with 5 distinct regions
- Handles major regions in North America and Europe
- **Defaults to Pacific Time (America/Los_Angeles) when location is outside known regions**
- Added validation for invalid coordinates

#### 2.2 Location-Aware Meetup View
```sql
CREATE VIEW meetups_with_local_time AS
SELECT 
  m.*,
  get_timezone_from_coordinates(...) AS derived_timezone,
  m.starts_at AT TIME ZONE 'UTC' AT TIME ZONE get_timezone_from_coordinates(...) AS local_starts_at,
  -- Additional fields
FROM 
  meetups m;
```

- Each meetup displays time in its location's timezone
- Times stored in UTC but displayed in local timezone
- Automatic expiry calculations using local time

#### 2.3 Frontend Timezone Display Utilities (`src/utils/timezone.js`)
```javascript
// For display purposes only - client-side rendering of timestamps
export function formatMeetupTime(timestamp, lat, lng, options = {}) {
  // Get timezone from coordinates and format the time accordingly
  // Includes detailed logging and fallbacks to Pacific Time
}
```

- Handles client-side display of UTC timestamps in the appropriate timezone
- Provides graceful fallbacks to Pacific Time for error handling
- Includes detailed console logging for debugging timezone issues
- **For display purposes only** - does not affect database storage

## 3. Address Geocoding Improvements

### Issue Addressed
- Placeholder texts like "Your location" being stored in the database
- Coordinates appearing as address text instead of proper geographic names

### Solutions Implemented

#### 3.1 Enhanced Address Handling in Meetup Creation
```javascript
// Always geocode coordinates to real addresses before database storage
let addressToStore = address;
if (!address || 
    typeof address !== 'string' || 
    address.includes('Your location') ||
    address.includes('Location at')) {
  
  try {
    const locationData = await searchLocations(`${lat},${lng}`, 1);
    if (locationData && locationData[0].display_name) {
      addressToStore = locationData[0].display_name;
    }
  } catch (error) {
    // Fallback with formatted coordinates
  }
}
```

- Always attempts to get a proper geocoded address from coordinates
- Prevents placeholder text like "Your location" from being stored in database
- Multi-level fallback system for address determination
- Detailed logging of address source and resolution process

## 4. Credit System for Premium Meetups

### Issue Addressed
- Problems with credit validation for premium meetups
- Errors during credit deduction for meetings over 60 minutes

### Solutions Implemented

#### 4.1 Credit Functions (`credit_system_fix.sql`)
```sql
-- Credit calculation function
CREATE FUNCTION calculate_required_credits(
  duration_minutes INTEGER
) RETURNS INTEGER AS $$
  -- Calculate credits needed based on duration
$$;

-- Get user's available credits
CREATE FUNCTION get_user_credits(
  user_id UUID
) RETURNS INTEGER AS $$
  -- Fetch credits from profiles
$$;

-- Use credits for premium meetup
CREATE FUNCTION use_credits_for_meetup(
  meetup_id UUID,
  required_credits INTEGER
) RETURNS BOOLEAN AS $$
  -- Deduct credits if sufficient
$$;
```

- Proper credit calculation based on meetup duration
- Secure credit deduction with transaction support
- Error handling for insufficient credits

## 5. Admin Routes Implementation

### Issue Addressed
- Need for admin-specific routes and authentication

### Solutions Implemented

#### 5.1 Router Configuration (`src/main.jsx`)
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import AdminRoutes from './admin/AdminRoutes';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/*" element={<App />} />
      <Route path="/admin/*" element={<AdminRoutes />} />
    </Routes>
  </BrowserRouter>
);
```

- Separate routing for admin and user interfaces
- Admin routes protected under `/admin/*` path

#### 5.2 Admin Security (`admin_rls_policy.sql`)
```sql
-- RLS Policies to restrict admin access
CREATE POLICY admin_update_policy ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    CASE
      WHEN auth.jwt() ? 'app_metadata' AND 
           auth.jwt()->'app_metadata' ? 'is_admin' AND
           (auth.jwt()->'app_metadata'->>'is_admin')::boolean = true
      THEN true
      ELSE old.is_admin = new.is_admin
    END
  );
```

- Row-level security policies for admin functions
- Proper authentication checks for admin operations
- Protection against unauthorized privilege escalation

## 6. Worldwide Region Structure System

### Issue Addressed
- Need for geographic-based feature availability
- Requirement for phased rollout of real estate features
- Ability to target specific markets (California first)

### Solutions Implemented

#### 6.1 Region Management Database Schema (`20240430_worldwide_region_structure.sql`)

```sql
CREATE TABLE IF NOT EXISTS public.supported_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  state_province TEXT,
  city_name TEXT,
  coordinates GEOGRAPHY(POINT),
  radius_km FLOAT,
  features JSONB DEFAULT '{}'::JSONB,
  rollout_phase INTEGER DEFAULT 1,
  launched_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.feature_rollout_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT NOT NULL,
  region_id UUID REFERENCES public.supported_regions(id),
  planned_date DATE,
  actual_date DATE,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

- Geographic regions defined by coordinates and radius
- Feature availability configured with JSONB structure
- Rollout scheduling for feature planning

#### 6.2 Feature Availability Functions

```sql
CREATE OR REPLACE FUNCTION public.check_feature_availability(
  lat FLOAT,
  lng FLOAT,
  feature_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_feature_available BOOLEAN := FALSE;
  v_point GEOGRAPHY;
BEGIN
  -- Create point from coordinates
  v_point := ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography;
  
  -- Check if feature is available in this location
  SELECT 
    (features->>feature_name)::BOOLEAN INTO v_feature_available
  FROM 
    public.supported_regions
  WHERE 
    active = TRUE AND
    features ? feature_name AND
    (
      coordinates IS NULL OR -- Global default
      ST_DWithin(coordinates, v_point, radius_km * 1000)
    )
  ORDER BY 
    coordinates IS NULL, -- Prioritize specific regions over global default
    ST_Distance(coordinates, v_point)
  LIMIT 1;
  
  RETURN COALESCE(v_feature_available, FALSE);
END;
$$;
```

- PostGIS spatial queries to determine feature availability
- Region priority based on distance and specificity
- Global defaults for worldwide features

#### 6.3 Region-Aware React Component

```jsx
// RegionAwareFeatures.tsx
const RegionAwareFeatures: React.FC<RegionAwareFeaturesProps> = ({
  children,
  fallback,
  requiredCategory,
  requiredFeature,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFeatureAvailable, setIsFeatureAvailable] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Use browser geolocation API to get user coordinates
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          // Error handling
        }
      );
    }
  }, []);

  // Check feature availability once we have the user's location
  useEffect(() => {
    if (!userLocation) return;

    const checkFeatureAvailability = async () => {
      try {
        const { data, error } = await supabase.rpc('get_available_features', {
          lat: userLocation.lat,
          lng: userLocation.lng,
        });

        // Check if feature is available and set state
        // ...
      } catch (error) {
        // Error handling
      }
    };

    checkFeatureAvailability();
  }, [userLocation]);

  // Display appropriate content based on feature availability
  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (isFeatureAvailable) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : <FeatureUnavailableMessage />;
};
```

- Conditional rendering based on user's geographic location
- Server-side verification of feature availability
- Graceful fallbacks for unavailable features

#### 6.4 Admin Interface for Region Management

```jsx
// pages/admin/regions.tsx
const RegionManagement = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  
  // Admin functions for managing regions
  const toggleRegionActive = async (region: Region) => {
    // Toggle region active state
  };
  
  const updateFeature = async (regionId: string, featureCategory: string, enabled: boolean) => {
    // Enable/disable feature for region
  };

  const handleAddRegion = () => {
    // Show modal for adding new region
  };

  return (
    <AdminLayout>
      <div className="region-management">
        <h1>Region Management</h1>
        
        {/* Region list */}
        <div className="region-list">
          {regions.map(region => (
            <RegionListItem 
              key={region.id}
              region={region}
              onToggleActive={toggleRegionActive}
              onUpdateFeature={updateFeature}
            />
          ))}
        </div>
        
        {/* Region map */}
        <RegionMap 
          regions={regions}
          selectedRegion={selectedRegion}
          onSelectRegion={setSelectedRegion}
        />
        
        {/* Add region button */}
        <button onClick={handleAddRegion}>Add Region</button>
        
        {/* Region form modal */}
        {showModal && (
          <RegionFormModal
            isEditing={isEditing}
            region={selectedRegion}
            onSave={handleSaveRegion}
            onCancel={() => setShowModal(false)}
          />
        )}
      </div>
    </AdminLayout>
  );
};
```

- Complete admin interface for managing regions
- Interactive map for visualizing region boundaries
- CRUD operations for regions and features

### 6.5 California Rollout Configuration

The system has been pre-configured with the following California regions:

- Los Angeles Metro (50km radius)
- San Francisco Metro (40km radius)
- San Diego Metro (40km radius)
- San Jose Metro (35km radius)

Each region has real estate features enabled, including:
- Property marketplace
- Virtual touring
- Property analytics

Future rollout phases are scheduled for:
- Phase 2: New York, Chicago, Miami
- Phase 3: London, Tokyo, Sydney

## Usage Instructions

### Timezone and Expiry Fix
1. Execute `meetup_timestamp_view_fix.sql` first to fix the view structure
2. Execute `meetup_functions_fix.sql` to update the timestamp handling functions
3. For location-based timezone:
   ```sql
   -- Run the full script
   \i location_based_timezone.sql
   
   -- Test the view
   SELECT * FROM meetups_with_local_time LIMIT 5;
   
   -- Create new meetup with timezone awareness
   SELECT create_meetup(
     'Meetup Title', 'Description', 'Address',
     37.7749, -122.4194, -- San Francisco coordinates
     'image_url', auth.uid(), 90
   );
   ```

### Region-Aware Feature Implementation
1. Wrap feature components with the `RegionAwareFeatures` component:
   ```jsx
   <RegionAwareFeatures 
     requiredCategory="real_estate" 
     requiredFeature="property_marketplace"
     fallback={<ComingSoonMessage />}
   >
     <RealEstateMarketplace />
   </RegionAwareFeatures>
   ```

2. Check feature availability in server-side code:
   ```javascript
   const { data, error } = await supabase.rpc('check_feature_availability', {
     lat: 34.0522,
     lng: -118.2437,
     feature_category: 'real_estate',
     feature_name: 'property_marketplace'
   });
   ```

3. Access the admin interface at `/admin/regions` to manage regions and features

## Known Issues and Limitations

- Geolocation accuracy varies by device and browser
- Users can spoof their location to bypass region restrictions
- Performance impact of geographic queries at scale needs monitoring
- Region boundaries are currently simple circles (future enhancement: complex polygons)

## Future Enhancements

- Multi-level region hierarchy (country > state > city > neighborhood)
- Time-based feature availability
- User segment targeting combined with geographic targeting
- Enhanced analytics for region performance

## Troubleshooting

1. **Incorrect Timezone Display**:
   - Check console logs for timezone determination process
   - Verify coordinates are within expected ranges
   - Pacific Time is used as a fallback for unrecognized regions

2. **Missing Address Information**:
   - The app attempts reverse geocoding for all coordinates
   - Check for network errors during geocoding in console
   - Address fallbacks include formatted coordinate strings

3. **Import Path Issues**:
   - Use relative imports (`./components/...`) instead of alias paths (`@/components/...`)
   - Check vite.config.js for proper alias configuration if using `@/` prefix

## References

- PostgreSQL Documentation: [Date/Time Functions and Operators](https://www.postgresql.org/docs/current/functions-datetime.html)
- PostGIS Documentation: [Spatial Reference Systems](https://postgis.net/docs/using_postgis_dbmanagement.html#spatial_ref_sys)
- IANA Timezone Database: [Time Zone Database](https://www.iana.org/time-zones) 