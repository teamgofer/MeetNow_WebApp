# MeetNow Mobility Fleet System - Implementation Guide

This document provides technical guidance for implementing the MeetNow Mobility Fleet System, including API structures, component architecture, and integration points with the existing platform.

## Frontend Architecture

### Component Structure

```
MobilityFleet/
├── Dashboard/
│   ├── FleetOverview.jsx
│   ├── VehicleManagement.jsx
│   ├── OperationsPanel.jsx
│   └── Analytics.jsx
├── OperatorApp/
│   ├── RideManager.jsx
│   ├── VehicleStatus.jsx
│   └── Communications.jsx
├── RiderInterface/
│   ├── RideRequestForm.jsx
│   ├── RideTracker.jsx
│   └── RideHistory.jsx
└── Common/
    ├── VehicleCard.jsx
    ├── RideCard.jsx
    ├── Map/
    │   ├── FleetMap.jsx
    │   ├── OperatorMap.jsx
    │   └── RiderMap.jsx
    └── Communications/
        ├── MessageThread.jsx
        ├── AlertSystem.jsx
        └── Notifications.jsx
```

### Key UI States

1. **Fleet Dashboard States**
   ```javascript
   const [vehicles, setVehicles] = useState([]);
   const [activeRides, setActiveRides] = useState([]);
   const [pendingRequests, setPendingRequests] = useState([]);
   const [operators, setOperators] = useState([]);
   const [fleetMetrics, setFleetMetrics] = useState({
     utilizationRate: 0,
     averageRideLength: 0,
     totalRevenue: 0,
     activeVehicles: 0
   });
   ```

2. **Operator App States**
   ```javascript
   const [currentRide, setCurrentRide] = useState(null);
   const [vehicleStatus, setVehicleStatus] = useState('available');
   const [location, setLocation] = useState(null);
   const [pendingRequests, setPendingRequests] = useState([]);
   const [messages, setMessages] = useState([]);
   ```

3. **Rider Interface States**
   ```javascript
   const [nearbyVehicles, setNearbyVehicles] = useState([]);
   const [rideRequest, setRideRequest] = useState({
     pickupLocation: null,
     destination: null,
     passengers: 1,
     vehicleType: null,
     preferredCompany: null
   });
   const [activeRide, setActiveRide] = useState(null);
   const [estimatedCredits, setEstimatedCredits] = useState(0);
   ```

## API Endpoints

### Fleet Management API

```
/api/mobility/fleet
  GET /                   - List all fleets for current user
  POST /                  - Create a new fleet
  GET /:fleetId           - Get fleet details
  PUT /:fleetId           - Update fleet details
  DELETE /:fleetId        - Delete fleet

/api/mobility/fleet/:fleetId/vehicles
  GET /                   - List all vehicles in fleet
  POST /                  - Add vehicle to fleet
  GET /:vehicleId         - Get vehicle details
  PUT /:vehicleId         - Update vehicle details
  DELETE /:vehicleId      - Remove vehicle from fleet

/api/mobility/fleet/:fleetId/staff
  GET /                   - List all staff members
  POST /                  - Add staff member
  PUT /:staffId           - Update staff member
  DELETE /:staffId        - Remove staff member

/api/mobility/fleet/:fleetId/analytics
  GET /overview           - Get overview analytics
  GET /revenue            - Get revenue analytics
  GET /utilization        - Get utilization analytics
  GET /custom?metrics=... - Get custom analytics
```

### Operator API

```
/api/mobility/operator
  GET /status             - Get operator status
  PUT /status             - Update status (available, unavailable)
  GET /current-ride       - Get details of current ride
  PUT /current-ride       - Update current ride status
  GET /requests           - Get pending ride requests
  POST /requests/:id/accept - Accept a ride request
  POST /requests/:id/decline - Decline a ride request

/api/mobility/operator/vehicle
  GET /status             - Get vehicle status
  PUT /status             - Update vehicle status
  POST /location          - Update vehicle location
  POST /maintenance       - Report maintenance issue
```

### Rider API

```
/api/mobility/rider
  GET /nearby-vehicles    - Find nearby vehicles
  POST /request-ride      - Create ride request
  GET /active-ride        - Get active ride details
  PUT /active-ride        - Update ride (cancel, etc.)
  GET /history            - Get ride history
  POST /:rideId/rate      - Rate completed ride
```

## Real-time Communication

### WebSocket Events

```javascript
// Fleet Management Events
const fleetEvents = {
  // Fleet owner/manager subscribes to fleet updates
  SUBSCRIBE_FLEET: 'fleet:subscribe',
  // Vehicle location/status updates
  VEHICLE_UPDATE: 'fleet:vehicle-update',
  // New ride request
  NEW_RIDE_REQUEST: 'fleet:new-request',
  // Ride status changes
  RIDE_STATUS_CHANGE: 'fleet:ride-status',
  // Operator status changes
  OPERATOR_STATUS_CHANGE: 'fleet:operator-status',
  // Fleet-wide announcements
  ANNOUNCEMENT: 'fleet:announcement'
};

// Operator Events
const operatorEvents = {
  // Operator comes online
  OPERATOR_ONLINE: 'operator:online',
  // New ride request for operator
  RIDE_REQUEST: 'operator:ride-request',
  // Ride status updates
  RIDE_UPDATE: 'operator:ride-update',
  // Direct messages
  MESSAGE: 'operator:message',
  // Emergency alert
  EMERGENCY: 'operator:emergency'
};

// Rider Events
const riderEvents = {
  // Ride request status changes
  REQUEST_STATUS: 'rider:request-status',
  // Vehicle approaching
  VEHICLE_APPROACHING: 'rider:vehicle-approaching',
  // Ride in progress updates
  RIDE_PROGRESS: 'rider:ride-progress',
  // Messages from operator
  OPERATOR_MESSAGE: 'rider:operator-message'
};
```

### WebSocket Connection Setup

```javascript
// Fleet dashboard connection
const setupFleetSocket = (fleetId, userId) => {
  const socket = new WebSocket(`${WS_URL}/fleet/${fleetId}`);
  
  socket.onopen = () => {
    socket.send(JSON.stringify({
      type: fleetEvents.SUBSCRIBE_FLEET,
      data: { fleetId, userId }
    }));
  };
  
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
      case fleetEvents.VEHICLE_UPDATE:
        updateVehicleStatus(data.data);
        break;
      case fleetEvents.NEW_RIDE_REQUEST:
        handleNewRideRequest(data.data);
        break;
      // Handle other events...
    }
  };
  
  return socket;
};
```

## Database Migrations

The implementation will require several database migrations:

### 1. Create Base Tables

```sql
-- Create the initial tables for the mobility fleet system
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Migration script for initial tables
CREATE TABLE IF NOT EXISTS public.mobility_vehicle_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  max_passengers INTEGER NOT NULL,
  icon_url TEXT,
  base_credit_rate INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default vehicle types
INSERT INTO public.mobility_vehicle_types 
  (name, description, max_passengers, base_credit_rate)
VALUES
  ('Paddle Cab', 'Human-powered tricycle with passenger seat', 2, 5),
  ('Golf Cart', 'Small electric vehicle for short distances', 4, 8),
  ('Mobility Scooter', 'Single-person electric mobility device', 1, 3),
  ('Mini Bus', 'Small capacity non-motorized shuttle', 8, 12);

-- Continue with other tables...
```

### 2. Add RLS Policies

```sql
-- Create RLS policies for the mobility fleet system

-- Enable RLS on the tables
ALTER TABLE public.mobility_fleet_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobility_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobility_fleet_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobility_ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobility_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobility_communications ENABLE ROW LEVEL SECURITY;

-- Fleet Companies policies
CREATE POLICY fleet_companies_owner_access ON public.mobility_fleet_companies
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid());

-- Fleet staff access to company data
CREATE POLICY fleet_companies_staff_access ON public.mobility_fleet_companies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mobility_fleet_staff
      WHERE company_id = public.mobility_fleet_companies.id
      AND user_id = auth.uid()
    )
  );

-- Vehicle policies
CREATE POLICY vehicles_owner_access ON public.mobility_vehicles
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid());

-- Continue with other policies...
```

### 3. Create Functions and Triggers

```sql
-- Create functions and triggers for the mobility fleet system

-- Function to update vehicle location
CREATE OR REPLACE FUNCTION update_vehicle_location(
  p_vehicle_id UUID,
  p_latitude NUMERIC,
  p_longitude NUMERIC
) RETURNS BOOLEAN AS $$
DECLARE
  v_geometry GEOGRAPHY;
BEGIN
  -- Create geography point
  v_geometry := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;
  
  -- Update the vehicle location
  UPDATE public.mobility_vehicles
  SET 
    current_location = v_geometry,
    last_location_update = NOW()
  WHERE id = p_vehicle_id
  AND (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.mobility_fleet_staff 
      WHERE user_id = auth.uid()
      AND company_id = (SELECT company_id FROM public.mobility_vehicles WHERE id = p_vehicle_id)
    )
  );
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for ride completion
CREATE OR REPLACE FUNCTION process_ride_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Process the completed ride
    
    -- 1. Update vehicle status
    UPDATE public.mobility_vehicles
    SET is_available = true
    WHERE id = NEW.vehicle_id;
    
    -- 2. Update operator earnings (would be implemented in a real system)
    
    -- 3. Add to completed rides count for the operator
    
    -- 4. Log the ride completion
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ride_completion_trigger
AFTER UPDATE ON public.mobility_rides
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION process_ride_completion();
```

## Integration with Core MeetNow System

### 1. Credit System Integration

The Mobility Fleet System will leverage the existing credit system:

```javascript
// Function to process ride payment
async function processRidePayment(rideId, userId, creditAmount) {
  // Call the existing credit deduction function
  const { data, error } = await supabase.rpc('use_credits_for_ride', {
    p_user_id: userId,
    p_credit_amount: creditAmount,
    p_ride_id: rideId
  });
  
  if (error) {
    console.error('Payment processing error:', error);
    return false;
  }
  
  // Update the ride record with payment status
  await supabase
    .from('mobility_rides')
    .update({ 
      payment_status: 'completed',
      final_credits_charged: creditAmount,
      payment_timestamp: new Date()
    })
    .eq('id', rideId);
    
  return true;
}
```

### 2. User Profile Enhancements

```javascript
// Add mobility roles to user profile
async function enhanceUserProfileWithMobilityRoles(userId) {
  // Check if user has any fleet roles
  const { data: fleetOwner } = await supabase
    .from('mobility_fleet_companies')
    .select('id')
    .eq('owner_id', userId)
    .limit(1);
    
  const { data: fleetStaff } = await supabase
    .from('mobility_fleet_staff')
    .select('role')
    .eq('user_id', userId)
    .limit(1);
    
  // Update the profile with roles
  const mobilityRoles = [];
  
  if (fleetOwner && fleetOwner.length > 0) {
    mobilityRoles.push('fleet_owner');
  }
  
  if (fleetStaff && fleetStaff.length > 0) {
    mobilityRoles.push(fleetStaff[0].role);
  }
  
  if (mobilityRoles.length > 0) {
    await supabase
      .from('profiles')
      .update({ 
        mobility_roles: mobilityRoles
      })
      .eq('id', userId);
  }
}
```

### 3. Map Component Integration

```javascript
// Enhance the existing map component to display mobility vehicles
function enhanceMeetNowMap(mapComponent) {
  // Add vehicle layer
  const vehicleLayer = L.layerGroup().addTo(mapComponent);
  
  // Add vehicle icons
  async function loadNearbyVehicles(center, radius) {
    const { data: vehicles } = await supabase.rpc('find_nearby_vehicles', {
      p_location: `POINT(${center.lng} ${center.lat})`,
      p_radius: radius
    });
    
    vehicleLayer.clearLayers();
    
    vehicles.forEach(vehicle => {
      const vehicleMarker = L.marker([vehicle.lat, vehicle.lng], {
        icon: getVehicleIcon(vehicle.vehicle_type)
      }).addTo(vehicleLayer);
      
      vehicleMarker.bindPopup(`
        <strong>${vehicle.vehicle_name}</strong><br>
        Type: ${vehicle.vehicle_type}<br>
        Distance: ${Math.round(vehicle.distance_meters)}m<br>
        <button class="request-ride-btn" data-vehicle-id="${vehicle.vehicle_id}">
          Request Ride
        </button>
      `);
    });
  }
  
  // Return enhanced map methods
  return {
    refreshVehicles: loadNearbyVehicles,
    toggleVehicleLayer: (visible) => {
      if (visible) {
        mapComponent.addLayer(vehicleLayer);
      } else {
        mapComponent.removeLayer(vehicleLayer);
      }
    }
  };
}
```

## Testing Strategy

### 1. Unit Tests for Core Functions

```javascript
// Example Jest test for ride cost calculation
describe('Ride Cost Calculation', () => {
  test('calculates correct cost for short distance', async () => {
    const { data, error } = await supabase.rpc('calculate_ride_cost', {
      p_distance: 500, // 500 meters
      p_vehicle_type_id: 'paddle-cab-id', 
      p_passenger_count: 1,
      p_surge_factor: 1.0
    });
    
    expect(error).toBeNull();
    expect(data).toBe(7); // Base 5 + 2 for distance
  });
  
  test('applies passenger multiplier correctly', async () => {
    const { data, error } = await supabase.rpc('calculate_ride_cost', {
      p_distance: 500,
      p_vehicle_type_id: 'paddle-cab-id',
      p_passenger_count: 2, // Two passengers
      p_surge_factor: 1.0
    });
    
    expect(error).toBeNull();
    expect(data).toBe(8); // Base 5 + 2 for distance + 20% for extra passenger
  });
});
```

### 2. Integration Tests

```javascript
// Example integration test for the rider flow
describe('Rider Request Flow', () => {
  test('rider can request and complete a ride', async () => {
    // 1. Setup test user and environment
    const testRider = await createTestUser();
    const testOperator = await createTestOperator();
    const testVehicle = await createTestVehicle(testOperator.id);
    
    // 2. Create a ride request
    const rideRequest = await createRideRequest(testRider.id, {
      pickupLocation: [37.7749, -122.4194], // San Francisco
      destination: [37.7746, -122.4172],
      passengers: 1,
      vehicleType: testVehicle.vehicle_type_id
    });
    
    expect(rideRequest.id).toBeTruthy();
    expect(rideRequest.status).toBe('pending');
    
    // 3. Operator accepts the request
    const acceptResult = await acceptRideRequest(testOperator.id, rideRequest.id);
    expect(acceptResult.success).toBe(true);
    
    // 4. Simulate ride completion
    const completeRide = await completeRide(rideRequest.id, {
      final_credits_charged: 10,
      operator_rating: 5
    });
    
    expect(completeRide.status).toBe('completed');
    
    // 5. Verify credit transaction
    const creditHistory = await getCreditHistory(testRider.id);
    const rideTransaction = creditHistory.find(t => t.reason === `Ride ${rideRequest.id}`);
    expect(rideTransaction).toBeTruthy();
    expect(rideTransaction.amount).toBe(-10);
  });
});
```

## Mobile Considerations

Since the Mobility Fleet System has significant mobile usage requirements, special consideration is needed for mobile optimization:

### 1. Progressive Web App Setup

```javascript
// In vite.config.js
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'MeetNow Mobility',
        short_name: 'MeetNow',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.meetnow\.app\/api\/mobility/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'mobility-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hour
              }
            }
          }
        ]
      }
    })
  ]
});
```

### 2. Background Location Tracking

```javascript
// Operator background location tracking
const setupLocationTracking = (vehicleId) => {
  let watchId;
  
  const startTracking = () => {
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Update vehicle location in database
          await supabase.rpc('update_vehicle_location', {
            p_vehicle_id: vehicleId,
            p_latitude: latitude,
            p_longitude: longitude
          });
          
          // Notify WebSocket for real-time updates
          socket.send(JSON.stringify({
            type: 'LOCATION_UPDATE',
            data: { vehicleId, latitude, longitude }
          }));
        },
        (error) => console.error('Location tracking error:', error),
        { 
          enableHighAccuracy: true, 
          maximumAge: 10000, // 10 seconds
          timeout: 60000 // 1 minute
        }
      );
    }
  };
  
  const stopTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  };
  
  return { startTracking, stopTracking };
};
```

## Deployment Strategy

The Mobility Fleet System should be deployed in phases:

### Phase 1: Database and API Setup
1. Deploy database migrations
2. Implement and deploy core API endpoints
3. Establish RLS policies and security measures

### Phase 2: Web Interface
1. Deploy fleet management dashboard
2. Implement rider request interface on main app
3. Setup WebSocket infrastructure for real-time updates

### Phase 3: Mobile Optimization
1. Enhance PWA capabilities
2. Implement operator mobile experience
3. Fine-tune location tracking and offline capabilities

### Phase 4: Scale and Optimize
1. Implement analytics and reporting
2. Optimize database queries for performance
3. Add advanced features like dynamic pricing 