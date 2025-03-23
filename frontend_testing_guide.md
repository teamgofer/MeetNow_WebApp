# MeetNow Frontend Testing Guide

This guide will help you test the timezone and timestamp fixes we've implemented, ensuring that meetups display properly in local time based on their location.

## Testing the Location-Based Timezone Feature

### 1. Create a Meetup in a Specific Location

1. Open the MeetNow app
2. Click on a location on the map (preferably in a city where you know the timezone)
3. Create a new meetup with:
   - Title: "Timezone Test"
   - Description: "Testing location-based timezone"
   - Duration: 90 minutes (to test premium meetup creation)

### 2. Verify Timezone Calculation

Once the meetup is created, check:

1. Open the meetup popup by clicking its marker
2. Verify the expiry time displays in the correct local timezone for that location
   - If you created a meetup in San Francisco, the time should be in PT
   - If you created a meetup in New York, the time should be in ET

### 3. Check Timestamps in Database

Run the following SQL query in Supabase to check the raw and converted timestamps:

```sql
SELECT 
  id, 
  title, 
  starts_at,
  ST_Y(location::geometry) AS lat,
  ST_X(location::geometry) AS lng,
  derived_timezone,
  local_starts_at,
  local_expires_at
FROM 
  meetups_with_local_time
WHERE 
  title = 'Timezone Test'
ORDER BY 
  starts_at DESC
LIMIT 5;
```

This should show your new meetup with:
- `starts_at`: The UTC timestamp in the database
- `derived_timezone`: The timezone derived from coordinates
- `local_starts_at`: The local time based on location

## Testing Expiry Calculation

### 1. Create Test Meetups with Different Durations

Create three meetups:
1. A 60-minute meetup (free tier)
2. A 120-minute meetup (premium tier)
3. A 180-minute meetup (premium tier)

### 2. Verify Expiry Times

For each meetup:
1. Check the expiry time displayed in the UI
2. Verify it matches the formula: `starts_at + duration_minutes`
3. Watch a meetup approach expiry to confirm it:
   - Shows correct "time remaining" countdown
   - Updates status to "expired" at the right time

### 3. Check Premium Credit Deduction

For premium meetups:
1. Check your credit balance before creating the meetup
2. Create a premium meetup (>60 minutes)
3. Verify credits were deducted correctly
4. Confirm the meetup was created successfully

## Testing Timezone Edge Cases

### 1. International Date Line

Create a meetup near longitude 180° (e.g., Fiji or eastern Russia) and verify the date calculation is correct.

### 2. Different Hemispheres

Create meetups in both northern and southern hemispheres to test coordinate handling.

## Debugging Tips

If you encounter issues:

1. Open browser console (F12) to check for errors
2. Look for timestamp-related errors in API responses
3. Use the SQL queries in our documentation to examine database values
4. Try the repair function if existing meetups have incorrect times:
   ```sql
   SELECT fix_meetup_timestamps();
   ```

## Expected Results

- All meetups should show correct local times based on their geographic location
- Meetup expiry should be calculated correctly as `starts_at + duration_minutes`
- The expiry status should update automatically when a meetup expires
- Premium meetups should properly deduct credits and create extended-duration meetups 