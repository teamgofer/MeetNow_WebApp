# MeetNow Proximity Chat - Technical Specification

## Overview

This document details the technical specifications for implementing the proximity-based chat feature in the MeetNow application. The feature enables real-time communication between users who are within 50-100 meters of each other, creating dynamic conversation opportunities based on physical proximity.

## System Architecture

### High-Level Components

```
Proximity Chat System
├── Database Layer
│   ├── Message Storage
│   ├── User Location Tracking
│   └── Spatial Indexing
├── Backend Services
│   ├── WebSocket Server
│   ├── Message Broadcasting Service
│   ├── Proximity Calculation Engine
│   └── User Presence Manager
├── Frontend Components
│   ├── Chat UI
│   ├── Map Integration
│   ├── Notification System
│   └── User Location Updates
└── Security & Privacy
    ├── Message Encryption
    ├── Rate Limiting
    ├── Content Moderation
    └── User Controls
```

## Database Schema

### proximity_messages Table

```sql
CREATE TABLE public.proximity_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  location GEOGRAPHY(Point) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT now() + interval '1 hour',
  is_anonymous BOOLEAN DEFAULT false,
  reply_to_id UUID REFERENCES public.proximity_messages(id),
  metadata JSONB DEFAULT '{}'
);

-- Spatial index for efficient proximity queries
CREATE INDEX proximity_messages_location_idx
  ON public.proximity_messages USING GIST (location);

-- Time-based index for message expiration
CREATE INDEX proximity_messages_expires_idx
  ON public.proximity_messages (expires_at);

-- User messages index
CREATE INDEX proximity_messages_user_id_idx
  ON public.proximity_messages (user_id);
```

### user_locations Table

```sql
CREATE TABLE public.user_locations (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  location GEOGRAPHY(Point) NOT NULL,
  accuracy FLOAT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_sharing_location BOOLEAN DEFAULT true,
  heading FLOAT,
  speed FLOAT
);

-- Spatial index for efficient proximity queries
CREATE INDEX user_locations_location_idx
  ON public.user_locations USING GIST (location);
```

### proximity_chat_settings Table

```sql
CREATE TABLE public.proximity_chat_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  radius_meters INTEGER DEFAULT 100,
  notifications_enabled BOOLEAN DEFAULT true,
  anonymous_mode BOOLEAN DEFAULT false,
  muted_users JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## PostgreSQL Functions

### get_nearby_messages Function

```sql
CREATE OR REPLACE FUNCTION public.get_nearby_messages(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_radius_meters INTEGER DEFAULT 100,
  p_limit INTEGER DEFAULT 50,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  distance_meters FLOAT,
  user_name TEXT,
  user_avatar_url TEXT,
  is_anonymous BOOLEAN,
  reply_to_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    CASE WHEN m.is_anonymous THEN NULL ELSE m.user_id END,
    m.message,
    m.sent_at,
    ST_Distance(
      m.location,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
    ) AS distance_meters,
    CASE WHEN m.is_anonymous THEN 'Anonymous User' ELSE p.display_name END,
    CASE WHEN m.is_anonymous THEN NULL ELSE p.avatar_url END,
    m.is_anonymous,
    m.reply_to_id
  FROM 
    public.proximity_messages m
    JOIN public.profiles p ON m.user_id = p.id
  WHERE 
    m.expires_at > now()
    AND ST_DWithin(
      m.location,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
      p_radius_meters
    )
    AND (
      p_user_id IS NULL 
      OR m.user_id != p_user_id
      OR m.user_id = p_user_id -- Include user's own messages
    )
    AND (
      p_user_id IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM public.proximity_chat_settings
        WHERE user_id = p_user_id
        AND m.user_id::text = ANY(muted_users)
      )
    )
  ORDER BY 
    m.sent_at DESC
  LIMIT p_limit;
END;
$$;
```

### nearby_users_count Function

```sql
CREATE OR REPLACE FUNCTION public.nearby_users_count(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_radius_meters INTEGER DEFAULT 100
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO user_count
  FROM public.user_locations
  WHERE 
    is_sharing_location = true
    AND last_updated > (now() - interval '5 minutes')
    AND ST_DWithin(
      location,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
      p_radius_meters
    );
    
  RETURN user_count;
END;
$$;
```

## WebSocket Infrastructure

### Connection Workflow

1. Client establishes WebSocket connection to `wss://meetnow.app/proximity-chat`
2. Server authenticates user via JWT
3. Client sends initial location
4. Server subscribes user to proximity channel based on location
5. Server sends all recent messages within user's radius
6. Client periodically updates location (every 10-30 seconds)
7. Server updates user's subscribed channels based on new location

### WebSocket Events

```javascript
// Client -> Server Events
const clientEvents = {
  // Initial connection with authentication
  CONNECT: 'connect',
  // Update user's location
  UPDATE_LOCATION: 'update_location',
  // Send a new message
  SEND_MESSAGE: 'send_message',
  // Update user settings
  UPDATE_SETTINGS: 'update_settings',
  // User starts/stops typing
  TYPING_STATUS: 'typing_status',
  // Request historical messages
  GET_MESSAGE_HISTORY: 'get_message_history'
};

// Server -> Client Events
const serverEvents = {
  // New message in proximity
  NEW_MESSAGE: 'new_message',
  // User enters proximity radius
  USER_ENTERED: 'user_entered',
  // User leaves proximity radius
  USER_LEFT: 'user_left',
  // Nearby user count update
  USERS_COUNT_UPDATE: 'users_count_update',
  // User typing status
  USER_TYPING: 'user_typing',
  // Historical messages
  MESSAGE_HISTORY: 'message_history',
  // Error events
  ERROR: 'error'
};
```

### Geospatial Channel Management

To efficiently manage WebSocket subscriptions, we'll implement a hierarchical channel structure based on geospatial cells:

1. Divide the world into H3 hexagonal cells (resolution 9, ~150m)
2. Subscribe users to their current cell and adjacent cells
3. When a user moves between cells, dynamically update their subscriptions
4. Messages are broadcast only to relevant cell channels

## Frontend Implementation

### React Components

```
src/components/proximity-chat/
├── ProximityChat.jsx               # Main component
├── ChatMessageList.jsx             # Message list view
├── ChatMessageItem.jsx             # Individual message 
├── ChatInput.jsx                   # Message input with send button
├── NearbyUsersIndicator.jsx        # Shows count of nearby users
├── ChatSettings.jsx                # User settings panel
├── MapChatIntegration.jsx          # Map overlay for chat
└── ChatNotifications.jsx           # Notification system
```

### State Management

```javascript
// Proximity Chat State
const proximityChatState = {
  messages: [],            // List of current messages
  nearbyUsers: 0,          // Count of nearby users
  isConnected: false,      // WebSocket connection status
  location: null,          // User's current location
  settings: {              // User settings
    radiusMeters: 100,
    notificationsEnabled: true,
    anonymousMode: false,
    mutedUsers: []
  },
  activeUsers: [],         // Users currently online nearby
  typingUsers: []          // Users currently typing
};
```

### Integration with Map Component

The chat interface will integrate with the existing MapComponent:

1. Chat messages will have an optional UI element showing on the map
2. Areas with active chats will show visual indicators on the map
3. Users can toggle between map view and chat view
4. Location updates are shared between map and chat components

## Security Considerations

### Row Level Security Policies

```sql
-- Ensure users can only read messages within their proximity
CREATE POLICY "Users can only read nearby messages"
  ON public.proximity_messages
  FOR SELECT
  USING (
    ST_DWithin(
      location,
      (SELECT location FROM public.user_locations WHERE user_id = auth.uid()),
      (SELECT COALESCE(
        (SELECT radius_meters FROM public.proximity_chat_settings WHERE user_id = auth.uid()),
        100
      ))
    )
  );

-- Users can only update/delete their own messages
CREATE POLICY "Users can only update their own messages"
  ON public.proximity_messages
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can only delete their own messages"
  ON public.proximity_messages
  FOR DELETE
  USING (user_id = auth.uid());
```

### Rate Limiting

1. Message rate limits: Maximum 1 message per 2 seconds, 30 messages per 5 minutes
2. Location update rate limits: Minimum 5 seconds between updates
3. WebSocket connection limits: Maximum 3 concurrent connections per user

### Content Moderation

1. Implement profanity filtering using client and server-side checks
2. Enable user reporting of inappropriate messages
3. Automated flagging of potentially harmful content
4. Admin dashboard for reviewing reported content

## Performance Considerations

### Database Optimization

1. Use BRIN indexes for timestamp columns
2. Implement message partitioning by geography and time
3. Regular cleanup of expired messages (older than 1 hour)
4. Cache frequently accessed data like nearby user counts

### Real-time System Scaling

1. Implement WebSocket connection pooling
2. Shard WebSocket servers by geographic region
3. Use Redis for pub/sub to coordinate between WebSocket servers
4. Implement backpressure handling for high-traffic areas

## Testing Strategy

### Unit Tests

1. Test proximity calculation functions
2. Validate message formatting and sanitization
3. Test WebSocket event handlers
4. Verify security policy enforcement

### Integration Tests

1. End-to-end message flow tests
2. Location update and channel subscription tests
3. Performance tests with simulated users
4. Security penetration testing

### Load Testing

1. Simulate 1000+ concurrent users in a small geographic area
2. Test message broadcast performance under load
3. Validate database query performance at scale
4. Stress test WebSocket servers with high connection churn

## Monitoring and Analytics

### Key Metrics

1. **Message Volume**: Messages per minute, per geographic area
2. **User Engagement**: Active users, message response rate
3. **Performance**: WebSocket latency, message delivery time
4. **Errors**: Connection failures, message delivery failures

### Logging Strategy

1. Structured logging for all WebSocket events
2. Anonymized user interaction logs
3. Performance trace logging for slow queries
4. Security event logging

## Phased Rollout Plan

### Phase 1: Alpha Testing

1. Deploy to development environment
2. Internal team testing in controlled locations
3. Fix critical issues and optimize core functionality

### Phase 2: Beta Testing

1. Limited release to 10% of users in 3 test cities
2. Collect feedback and usage metrics
3. Optimize performance and fix issues

### Phase 3: Full Rollout

1. Progressive rollout to all users over 2 weeks
2. Monitor system performance and user engagement
3. Implement fast iterations based on feedback

## Dependencies

1. Existing geolocation system in MeetNow app
2. Supabase WebSocket infrastructure
3. PostGIS spatial functions
4. React frontend components

## Future Enhancements

1. **Message Attachments**: Support for images and short videos
2. **Voice Messages**: Short audio clips in proximity chat
3. **Topic-Based Channels**: Subject filtering within proximity
4. **Translation**: Real-time translation for multi-language areas
5. **AR Integration**: Augmented reality visualization of nearby chats

## Conclusion

The proximity chat feature leverages MeetNow's existing location infrastructure to create a dynamic, location-based communication system. By building on our PostgreSQL/PostGIS foundation and implementing efficient real-time communication channels, we can deliver a responsive and engaging user experience that enhances the core value proposition of spontaneous, location-based social connections. 