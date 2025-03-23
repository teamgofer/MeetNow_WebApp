# Import Path Guidelines for MeetNow

This document outlines the recommended approach for handling imports in the MeetNow codebase to maintain consistency and avoid path resolution errors.

## Current Import Strategy

We are transitioning toward more consistent imports. Currently, we support two primary import styles:

### 1. Relative Imports (Preferred for now)

```javascript
// Importing from the same directory
import { Button } from './button';

// Importing from parent directories
import { formatMeetupTime } from '../../utils/timezone.js';
```

**Important: Always include the file extension (.js, .jsx, .tsx) when importing JavaScript/React files**

### 2. Alias Imports (Future direction)

```javascript
// Using the @ alias for src directory
import { Button } from '@/components/ui/button';
```

**Note:** While we have configured the `@` alias to point to the `src` directory, we recommend using relative imports for consistency until the entire codebase has been updated.

## Common Issues and Solutions

### Import Resolution Failures

If you encounter errors like:

```
Failed to resolve import "@/components/ui/loading" from "src/main.jsx". Does the file exist?
```

Try these solutions:

1. Check if the file actually exists at the target path
2. Use a relative import path instead of an alias
3. Add the file extension to the import (.js, .jsx, .tsx)

### Best Practices

1. **Be explicit with file extensions:** Always include `.js`, `.jsx`, or `.tsx` when importing JavaScript files
2. **Choose one import style:** Either use relative imports or alias imports consistently within a file
3. **Check component exports:** Ensure components are properly exported (default vs named exports)

## Troubleshooting

If you're experiencing import issues:

1. Try restarting the development server (`npm run dev`)
2. Check that the file exists at the expected path
3. Verify the component is exported correctly
4. If using an alias import, try switching to a relative import temporarily 