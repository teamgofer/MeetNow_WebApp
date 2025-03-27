# MeetNow Testing Documentation

This section contains testing guides and procedures for the MeetNow application.

## Testing Guides

- [Mobile Responsiveness Testing](/DOCUMENTATION/TESTING/mobile-testing.md)
- [Geolocation Testing](/DOCUMENTATION/TESTING/geolocation-testing.md)
- [Unit Testing Guide](/DOCUMENTATION/TESTING/unit-testing.md)
- [Integration Testing Guide](/DOCUMENTATION/TESTING/integration-testing.md)
- [End-to-End Testing Guide](/DOCUMENTATION/TESTING/e2e-testing.md)
- [Performance Testing Guide](/DOCUMENTATION/TESTING/performance-testing.md)
- [Security Testing Guide](/DOCUMENTATION/TESTING/security-testing.md)

## Testing Procedures

### Pre-Commit Testing

Before committing code:

1. Run unit tests for modified components
2. Verify visual changes on multiple viewport sizes

### Pull Request Testing

When creating a pull request:

1. Run the full test suite
2. Test on at least one mobile and one desktop device
3. Verify that any new features have corresponding tests

### Release Testing

Before releasing to production:

1. Run the full test suite on all supported browsers
2. Perform manual testing on multiple devices
3. Validate core user flows work correctly
4. Run accessibility checks
5. Run performance checks 