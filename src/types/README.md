# Types Directory

This directory contains all global TypeScript interfaces and types used throughout the MeetNow application.

## How to Use

To use types from this directory, import them in your TypeScript files:

```typescript
import { Location, Meetup, User } from '@/types';

const userLocation: Location = {
  lat: 37.7749,
  lng: -122.4194,
  display_name: 'San Francisco'
};
```

## Type Definitions

### Core Types

- `Location`: Geographic location with coordinates
- `Meetup`: Meetup event data
- `User`: User profile data
- `AppError`: Application error with additional metadata

### Component Types

- `BaseProps`: Common props shared by most components
- `MapViewport`: Map view state

### API Types

- `ApiResponse<T>`: Generic API response wrapper
- `NavigationOptions`: Options for map navigation

## Best Practices

1. **Always use shared types** instead of creating one-off interfaces for common data structures.

2. **Export types from a single file** to make imports cleaner. Import from `@/types` rather than individual files.

3. **Use type extensions** to extend base types:

   ```typescript
   import { BaseProps } from '@/types';
   
   interface ButtonProps extends BaseProps {
     onClick: () => void;
     variant?: 'primary' | 'secondary';
   }
   ```

4. **Use type guards** to validate data shapes:

   ```typescript
   import { Location } from '@/types';
   
   function isValidLocation(data: unknown): data is Location {
     return (
       typeof data === 'object' &&
       data !== null &&
       'lat' in data &&
       'lng' in data
     );
   }
   ```

5. **Use discriminated unions** for type-safe state management:

   ```typescript
   type MeetupState = 
     | { status: 'loading' }
     | { status: 'loaded'; data: Meetup[] }
     | { status: 'error'; error: string };
   ```

6. **Document complex types** with JSDoc comments.

## Adding New Types

When adding new shared types:

1. Add them to the appropriate section in `index.ts`
2. Include JSDoc comments explaining the type's purpose
3. Consider backward compatibility if modifying existing types
4. Avoid tight coupling with specific components or views 