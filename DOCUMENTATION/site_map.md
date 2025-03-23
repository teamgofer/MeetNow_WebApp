# MeetNow Site Map

## Main Application Flow

### Public Pages (Unauthenticated Access)
- **/** - Homepage/Map Interface
  - Main map view
  - Nearby meetups display
  - Limited meetup creation (free/1-hour only)
  - Login/Register prompts
  - Mobility vehicles display
  
- **/login** - Authentication Page
  - Login form
  - Registration form
  - Password reset
  
- **/about** - About MeetNow
  - Platform description
  - Team information
  - Mission statement
  
- **/legal** - Legal Information
  - Terms of Service
  - Privacy Policy
  - Data handling practices

### Authenticated User Pages
- **/profile** - User Profile
  - Personal information
  - Avatar/display name management
  - Meetup history
  - Mobility ride history
  
- **/credits** - Credit Management
  - Current balance display
  - Purchase options
  - Transaction history
  
- **/my-meetups** - User's Meetups
  - Created meetups
  - Joined meetups
  - Past meetups
  
- **/create-meetup** - Enhanced Meetup Creation
  - Extended duration options
  - Premium features
  - Itinerary building

### Mobility Fleet System Pages
- **/mobility** - Mobility Hub
  - Nearby vehicles map view
  - Ride request interface
  - Ride history
  - Recent rides 

- **/mobility/ride** - Active Ride Page
  - Live ride tracking
  - Operator information
  - Chat interface
  - Ride controls

- **/mobility/fleet** - Fleet Management Dashboard
  - Fleet overview
  - Vehicle management
  - Staff management
  - Analytics and reporting

- **/mobility/fleet/vehicles** - Vehicle Management
  - Vehicle details and status
  - Maintenance schedule
  - Assignment to operators
  - Performance metrics

- **/mobility/fleet/operators** - Operator Management
  - Operator profiles
  - Performance metrics
  - Shift management
  - Earnings reports

- **/mobility/operator** - Operator Interface
  - Current ride status
  - Vehicle status management
  - Request queue
  - Earnings tracker

## Admin Section
Admin pages are only accessible to users with `is_admin: true` in their profile.

- **/admin** - Admin Dashboard
  - Overview statistics
  - Quick action buttons
  - System status
  
- **/admin/users** - User Management
  - User listing with filters
  - Profile editing
  - Manual credit adjustment
  - Account status control
  
- **/admin/meetups** - Meetup Management
  - All meetups listing
  - Content moderation
  - Manual expiration control
  - Featured meetup selection
  
- **/admin/credits** - Credit System
  - Credit transaction history
  - Usage statistics
  - Pricing configuration
  
- **/admin/settings** - System Settings
  - Application configuration
  - Feature toggles
  - Maintenance mode

- **/admin/mobility** - Mobility Fleet Administration
  - Fleet company verification
  - Vehicle type management
  - Global fleet metrics
  - System settings and policies

## API Endpoints

### Public Endpoints
- `/api/meetups/nearby` - Get nearby meetups
- `/api/meetups/[id]` - Get public meetup details
- `/api/auth/*` - Authentication endpoints
- `/api/mobility/vehicles/nearby` - Get nearby mobility vehicles

### Authenticated Endpoints
- `/api/users/profile` - Get/update user profile
- `/api/users/credits` - Get/add user credits
- `/api/meetups/create` - Create new meetup
- `/api/meetups/join` - Join a meetup

### Mobility API Endpoints
- `/api/mobility/fleet/*` - Fleet management endpoints
- `/api/mobility/operator/*` - Operator endpoints
- `/api/mobility/rider/*` - Rider endpoints
- `/api/mobility/rides/*` - Ride management endpoints

### Admin-Only Endpoints
- `/api/admin/users` - User management
- `/api/admin/meetups` - Meetup management
- `/api/admin/credits` - Credit system management
- `/api/admin/settings` - System configuration
- `/api/admin/mobility/*` - Mobility administration endpoints

## Component Structure

### Core Components
- `MapComponent` - Main map interface
- `MeetupCard` - Meetup display card
- `Auth` - Authentication components
- `Profile` - User profile components
- `Credits` - Credit management components

### Mobility Fleet Components
- `MobilityMap` - Enhanced map with vehicle display
- `VehicleMarker` - Vehicle map marker with status
- `RideRequestForm` - Ride request interface
- `RideTracker` - Active ride tracking component
- `FleetDashboard` - Fleet management dashboard
- `VehicleCard` - Vehicle information card
- `OperatorInterface` - Operator mobile interface
- `RideHistory` - Ride history and details

### Admin Components
- `AdminNav` - Admin navigation
- `UserTable` - User management interface
- `MeetupTable` - Meetup management interface
- `CreditHistory` - Credit transaction history
- `SettingsPanel` - System configuration interface
- `FleetVerification` - Fleet company verification interface
- `MobilityMetrics` - Mobility system metrics dashboard

## Route Implementation 

The route implementation should follow this structure in your routing setup:

```jsx
<Routes>
  {/* Public Routes */}
  <Route path="/" element={<MapInterface />} />
  <Route path="/login" element={<AuthPage />} />
  <Route path="/about" element={<AboutPage />} />
  <Route path="/legal" element={<LegalPage />} />
  
  {/* Protected User Routes */}
  <Route element={<RequireAuth />}>
    <Route path="/profile" element={<ProfilePage />} />
    <Route path="/credits" element={<CreditsPage />} />
    <Route path="/my-meetups" element={<MyMeetupsPage />} />
    <Route path="/create-meetup" element={<CreateMeetupPage />} />
    
    {/* Mobility Routes */}
    <Route path="/mobility" element={<MobilityHub />} />
    <Route path="/mobility/ride/:rideId" element={<ActiveRidePage />} />
    
    {/* Fleet Owner Routes */}
    <Route element={<RequireFleetOwner />}>
      <Route path="/mobility/fleet" element={<FleetDashboard />} />
      <Route path="/mobility/fleet/vehicles" element={<VehicleManagement />} />
      <Route path="/mobility/fleet/operators" element={<OperatorManagement />} />
    </Route>
    
    {/* Operator Routes */}
    <Route element={<RequireOperator />}>
      <Route path="/mobility/operator" element={<OperatorInterface />} />
    </Route>
  </Route>
  
  {/* Admin Routes */}
  <Route element={<RequireAdmin />}>
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/admin/users" element={<UserManagement />} />
    <Route path="/admin/meetups" element={<MeetupManagement />} />
    <Route path="/admin/credits" element={<CreditSystem />} />
    <Route path="/admin/settings" element={<SystemSettings />} />
    <Route path="/admin/mobility" element={<MobilityAdministration />} />
  </Route>
  
  {/* Not Found */}
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

This site map should be updated whenever new pages or significant features are added to prevent them from becoming "ghost pages" in the application. 