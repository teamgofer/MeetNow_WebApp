# Region Management Admin Guide

## Overview

This guide explains how to manage geographic regions and feature availability in the MeetNow platform. The region management system allows administrators to control which features are available in different locations, enabling a phased rollout of capabilities like virtual real estate.

## Region Structure

The platform uses a hierarchical region structure:

1. **Global Default**: Base configuration for all users worldwide
2. **Region-Specific Settings**: Override settings for specific geographic areas

Each region contains:
- Geographic boundaries (coordinates + radius)
- Feature flags (enabled/disabled)
- Rollout phase information

## Database Tables

### `supported_regions`

This table stores information about geographic regions where features are available:

| Column | Description |
|--------|-------------|
| `id` | Unique identifier (UUID) |
| `region_name` | Human-readable name (e.g., "Los Angeles Metro") |
| `country_code` | ISO country code (e.g., "US") |
| `state_province` | State/province (optional) |
| `city_name` | City name (optional) |
| `coordinates` | Geographic point (longitude/latitude) |
| `radius_km` | Coverage radius in kilometers |
| `features` | JSONB object with feature flags |
| `rollout_phase` | Integer indicating deployment phase |
| `created_at` | Creation timestamp |
| `updated_at` | Last update timestamp |
| `is_active` | Boolean indicating if region is active |

### `feature_rollout_schedule`

This table manages the schedule for feature rollouts:

| Column | Description |
|--------|-------------|
| `id` | Unique identifier (UUID) |
| `feature_name` | Name of the feature being rolled out |
| `rollout_phase` | Phase number |
| `target_regions` | Array of region names |
| `start_date` | Scheduled start date |
| `end_date` | Scheduled end date |
| `status` | Current status (planned/in-progress/completed) |

## Managing Regions

### Adding a New Region

To add a new region with feature support:

```sql
INSERT INTO public.supported_regions 
(region_name, country_code, state_province, city_name, coordinates, radius_km, features, rollout_phase, is_active)
VALUES 
('Miami Metro', 'US', 'FL', 'Miami', 
 ST_SetSRID(ST_MakePoint(-80.1918, 25.7617), 4326)::geography, 
 40, 
 '{
    "core": {
      "enabled": true,
      "features": ["messaging", "events", "profiles", "groups"]
    },
    "real_estate": {
      "enabled": true,
      "features": ["property_marketplace", "virtual_touring", "property_analytics"]
    }
 }'::JSONB,
 2,
 true);
```

### Updating Feature Availability

To enable or disable features for an existing region:

```sql
UPDATE public.supported_regions
SET features = jsonb_set(
  features,
  '{real_estate,enabled}',
  'true'::jsonb
)
WHERE region_name = 'Chicago Metro';
```

### Managing the Rollout Schedule

To schedule a feature rollout:

```sql
INSERT INTO public.feature_rollout_schedule
(feature_name, rollout_phase, target_regions, start_date, end_date, status)
VALUES
('real_estate', 3, ARRAY['Seattle Metro', 'Portland Metro'], 
 now() + interval '90 days', now() + interval '120 days', 'planned');
```

## Feature Availability Functions

### Checking Feature Availability

The platform provides functions to check feature availability:

```sql
-- Check if a feature is available at coordinates
SELECT public.check_feature_availability(
  37.7749, -- latitude
  -122.4194, -- longitude
  'real_estate', -- feature category
  'property_marketplace' -- specific feature (optional)
);
```

### Getting Available Features

```sql
-- Get all available features at coordinates
SELECT public.get_available_features(
  37.7749, -- latitude
  -122.4194 -- longitude
);
```

### Listing Regions with Features

```sql
-- List all regions with real estate features enabled
SELECT * FROM public.list_real_estate_enabled_regions();
```

## Admin Interface

The admin interface provides a visual way to manage regions and features. Access it at `/admin/regions`.

### Key Capabilities

1. **Region Management**:
   - View all regions on a map
   - Create new regions
   - Edit region boundaries
   - Enable/disable features

2. **Rollout Planning**:
   - View the rollout schedule
   - Create new rollout phases
   - Track rollout status

3. **Analytics**:
   - Monitor feature usage by region
   - View user density maps
   - Track feature engagement

## Best Practices

1. **Geographic Planning**:
   - Start with major metropolitan areas
   - Use appropriate radius sizes (typically 30-50km for urban areas)
   - Consider population density when prioritizing regions

2. **Feature Rollout**:
   - Implement phased rollouts
   - Start with limited beta access
   - Expand gradually based on metrics

3. **Monitoring**:
   - Regularly review feature usage by region
   - Monitor system performance during expansion
   - Track user feedback by region

4. **Region Boundaries**:
   - Avoid overlapping regions when possible
   - If regions overlap, the smaller radius takes precedence
   - Use the global default as a fallback

## Troubleshooting

### Common Issues

1. **Features unavailable in expected region**:
   - Verify region boundaries (coordinates and radius)
   - Check that features are properly enabled in JSONB
   - Ensure region is marked as active

2. **Feature checks returning wrong region**:
   - Check for overlapping regions
   - Verify region priority (smaller radius takes precedence)

3. **Rollout schedule not appearing**:
   - Verify dates are correctly formatted
   - Check that target regions exist
   - Ensure status is set properly

## API Endpoints

The platform provides RESTful API endpoints for region management:

- `POST /api/region-checking`: Check feature availability at coordinates
- `GET /api/regions`: List all active regions
- `POST /api/regions`: Create a new region
- `PUT /api/regions/:id`: Update an existing region
- `GET /api/rollout-schedule`: Get the feature rollout schedule

## Security Considerations

Access to region management is restricted to administrators only. All region management functions use row-level security policies to enforce this restriction:

```sql
CREATE POLICY "Only admins can modify regions" 
  ON public.supported_regions
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');
```

## Future Improvements

Planned enhancements to the region management system:

1. **Multi-level Region Hierarchy**: Support for nested regions (country > state > city > neighborhood)
2. **Time-based Feature Availability**: Enable features during specific times/days
3. **User Segment Targeting**: Combine geographic and user segment targeting
4. **A/B Testing**: Geographic-based feature testing
5. **Automated Rollouts**: Rules-based progression through rollout phases

## Conclusion

The region management system provides a flexible framework for controlling feature availability based on geographic location. By carefully planning region boundaries and rollout schedules, administrators can ensure a smooth deployment of features across the platform.