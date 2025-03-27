# MeetNow Security Guide

This document outlines security features implemented in the MeetNow application and provides guidelines for maintaining security when developing new features.

## Table of Contents

1. [Authentication Security](#authentication-security)
2. [Database Security](#database-security)
3. [Input Validation](#input-validation)
4. [CSRF Protection](#csrf-protection)
5. [Rate Limiting](#rate-limiting)
6. [Security Headers](#security-headers)
7. [Secure Coding Practices](#secure-coding-practices)
8. [Error Handling](#error-handling)

## Authentication Security

### Token Management

We use a custom token management system rather than relying solely on the Supabase anonymous key. This provides:

- Token validation and automatic refresh
- Expiration monitoring
- Secure token storage
- Token revocation during logout

```javascript
// Example of secure token usage
import { refreshTokenIfNeeded } from '../utils/auth';

// Before making authenticated requests:
await refreshTokenIfNeeded();
```

### Rate Limiting

We implement client-side rate limiting for authentication operations to prevent brute force attacks. This is handled through the `auth.js` utility:

```javascript
// Example of rate limiting in auth operations
import { secureLogin } from '../utils/auth';

// This automatically applies rate limiting
const { data, error } = await secureLogin({ 
  email, 
  password 
});
```

### Session Management

Sessions are managed securely with automatic refresh and validation:

```javascript
// Setting up a secure auth listener
import { setupSecureAuthListener } from '../utils/auth';

// This will refresh the session when needed
const cleanup = setupSecureAuthListener((event, session) => {
  // Handle auth state changes
});
```

## Database Security

### Secure API Client

All database operations should use the secure API client to ensure proper data validation and security checks:

```javascript
import { secureSelect, secureInsert } from '../utils/secure-api-client';

// Secure select operation
const { data, error } = await secureSelect('profiles', {
  filters: {
    eq: { id: userId }
  }
});

// Secure insert with automatic input validation
const { data, error } = await secureInsert('meetups', meetupData);
```

### Permission Checks

Always verify user permissions before accessing or modifying data:

```javascript
import { validatePermission } from '../utils/security';

// Check if user has permission
if (!validatePermission(user, 'edit', meetup)) {
  throw new Error('Permission denied');
}
```

### Input Sanitization

All user input must be validated and sanitized before use:

```javascript
import { validateInput, sanitizeForDatabase } from '../utils/security';

// Validate and sanitize input
const safeData = validateInput(userData);

// Sanitize for database operations
const queryParam = sanitizeForDatabase(searchTerm);
```

## CSRF Protection

Cross-Site Request Forgery protection is implemented for all state-changing operations:

```javascript
import { generateCSRFToken, validateCSRFToken } from '../utils/security';

// Generate a token for a specific action
const token = generateCSRFToken('create-meetup');

// When making the request, include the token in headers
fetch('/api/meetups', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': token,
    'X-Action-ID': 'create-meetup'
  },
  body: JSON.stringify(data)
});
```

## Rate Limiting

The application implements custom rate limiting to prevent abuse:

```javascript
import { 
  applyRateLimit, 
  incrementFailedAttempts, 
  resetRateLimiting 
} from '../utils/auth';

try {
  // Apply rate limiting based on client ID
  const clientId = getClientId();
  applyRateLimit(clientId);
  
  // Perform operation...
  
  // On success, reset rate limiting
  resetRateLimiting(clientId);
} catch (error) {
  // On failure, increment failed attempts
  incrementFailedAttempts(clientId);
  throw error;
}
```

## Security Headers

The application applies security headers to all responses:

```javascript
import { applySecurityHeaders } from '../utils/security-middleware';

// In an API route handler
applySecurityHeaders(res);
```

Key security headers include:
- Content-Security-Policy
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy
- Strict-Transport-Security

## Secure Coding Practices

### General Guidelines

1. Never trust user input - always validate and sanitize
2. Use parameterized queries to prevent SQL injection
3. Apply the principle of least privilege
4. Keep dependencies updated
5. Use HTTPS for all communications
6. Implement proper logging without sensitive data
7. Use secure random for all cryptographic operations

### React-Specific Guidelines

1. Use the `useProtectedRoute` hook for routes requiring authentication
2. Sanitize any data displayed in the UI
3. Use proper state management to prevent data leaks
4. Avoid storing sensitive data in localStorage or sessionStorage
5. Use the secure API client for all data operations

```javascript
import { useProtectedRoute } from '../utils/security-middleware';
import { useNavigate } from 'react-router-dom';

function ProtectedComponent({ user }) {
  const navigate = useNavigate();
  
  // This will redirect if user is not authenticated
  if (!useProtectedRoute(user, navigate)) {
    return null;
  }
  
  return <div>Protected content</div>;
}
```

## Error Handling

Security-related errors are handled with proper logging and user feedback:

```javascript
import { handleAuthError, createSecurityError } from '../utils/error-handler';

try {
  // Perform operation...
} catch (error) {
  // Create a properly typed security error
  const securityError = createSecurityError('Operation failed', { 
    context: 'user-operation', 
    originalError: error 
  });
  
  // Handle and log the error
  handleAuthError(securityError);
  
  // Show appropriate user message
  showErrorMessage('An error occurred. Please try again later.');
}
```

---

## Important Security Notes

1. **DO NOT** use the Supabase anonymous key directly for authentication operations
2. **DO NOT** store sensitive data in client-side storage without encryption
3. **DO NOT** log sensitive user information
4. **DO NOT** execute user-provided code or queries
5. **DO NOT** rely solely on client-side validation
6. **ALWAYS** implement server-side validation as well as client-side validation
7. **ALWAYS** check user permissions before accessing or modifying data
8. **ALWAYS** use HTTPS in production environments
9. **REGULARLY** review and update security practices 