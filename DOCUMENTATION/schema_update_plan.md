# Schema Update Implementation Plan

## Overview

This document outlines the implementation plan for fixing two major schema inconsistencies:
1. Consolidating credits tracking by removing the redundant `credits` table
2. Standardizing spatial data types by converting `meetup_history.location` from `geometry` to `geography`

## 1. Credits System Consolidation

### Current State
- Credits are currently tracked in two places:
  - `profiles.credits` column
  - `credits.balance` column

### Implementation Steps

#### Database Changes
1. **Create Migration**: The `20240318_fix_schema_inconsistencies.sql` file handles:
   - Syncing any mismatched values from `credits.balance` to `profiles.credits`
   - Creating `credits_history` table for audit trail
   - Setting up a trigger to log credit changes
   - Automatically updating functions that reference `credits.balance`
   - Dropping the redundant `credits` table

#### Affected Functions
The following functions need to be updated:
- `add_user_credits(user_id, credit_amount)`
- `get_user_credits(user_id)`
- `use_credits_for_meetup(user_id, credit_amount)`
- `calculate_required_credits(requested_duration)`

#### Frontend Impact
The Credits component (`src/components/Credits.jsx`) already uses `profiles.credits` for display and interaction:
```javascript
const { data, error } = await supabase
  .from('profiles')
  .select('credits')
  .eq('id', user.id)
  .single();
```

The only potentially affected calls are RPC functions:
```javascript
const { data, error } = await supabase.rpc('add_user_credits', {
  user_id: user.id, 
  credit_amount: purchaseAmount 
});
```

These will be automatically updated by our migration script that modifies the function definitions.

## 2. Geography/Geometry Type Standardization

### Current State
- `meetups.location` uses `geography` type
- `itineraries.location` uses `geography` type
- `meetup_history.location` uses `geometry` type

### Implementation Steps

#### Database Changes
1. **Migration Implementation**: The `20240318_fix_schema_inconsistencies.sql` file handles:
   - Adding a new `location_geo` column with `geography` type to `meetup_history`
   - Converting data from existing `geometry` to `geography` type
   - Dropping the old column and renaming the new one
   - Updating the `cleanup_expired_meetups()` function to handle the new type
   - Creating a new spatial index

#### Affected Functionality
- Archiving of expired meetups
- Any queries directly accessing `meetup_history.location`

#### Frontend Impact
- There should be minimal frontend impact as the queries abstract the underlying data type.
- Any spatial calculations or display should work the same with both types.

## Testing Strategy

1. **Credit System Changes**:
   - Run `test-credits-functionality.js` before and after the migration
   - Verify user credit balances remain the same
   - Test credit additions and uses
   - Verify `credits_history` is properly populated

2. **Geography Type Changes**:
   - Archive a meetup manually before and after the change
   - Verify spatial queries work correctly across both tables
   - Check for any performance differences

## Rollback Plan

If issues are encountered, the following rollback steps can be taken:

1. **Credits System**: 
   - Recreate the `credits` table
   - Sync values from `profiles.credits` to `credits.balance`
   - Restore original function definitions

2. **Geography Type**:
   - Reverse the column transformation process
   - Restore the original data type

## Implementation Timeline

1. Development environment migration: Immediate
2. Testing in staging environment: 1-2 days
3. Production deployment: After successful staging verification

## Future Considerations

1. Consider adding constraints to required foreign keys after verifying data integrity
2. Add enumerated type for `meetups.status` to improve data consistency
3. Implement validation triggers for critical data fields 