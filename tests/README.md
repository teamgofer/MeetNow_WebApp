# MeetNow Tests

This directory contains all tests for the MeetNow webapp, organized for better maintainability and clarity.

## Directory Structure

- **unit/** - Unit tests for individual components and functions
  - Component tests
  - Utility function tests
  - Hook tests

- **integration/** - Integration tests for interacting components
  - Feature integration tests
  - API interaction tests
  - Service integration tests

- **e2e/** - End-to-end tests
  - User flow tests
  - Critical path tests
  - UI regression tests

- **mocks/** - Mock data and mock implementations
  - Mock services
  - Test fixtures
  - Mock data

- **db/** - Database tests
  - Schema validation tests
  - Migration tests
  - Database function tests

## Running Tests

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Database Tests
```bash
npm run test:db
```

## Test Coverage

To generate a test coverage report:
```bash
npm run test:coverage
```

## Writing Tests

When adding new tests:
1. Place them in the appropriate subdirectory
2. Follow the existing naming convention (`*.test.js` for Jest/Vitest tests)
3. Use the existing patterns and utilities
4. Ensure proper setup and teardown

## Test Utilities

Common test utilities can be found in `tests/utils/` directory:
- Test renderers
- Custom matchers
- Test helpers 