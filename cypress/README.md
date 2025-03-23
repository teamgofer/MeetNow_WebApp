# MeetNow WebApp Cypress Tests

This directory contains the Cypress tests for the MeetNow WebApp.

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
Make sure all dependencies are installed:

```bash
npm install
```

### Running Tests

#### Run all tests in headless mode
```bash
npm run cypress:run
```

#### Run a specific test file
```bash
npm run cypress:run -- --spec "cypress/e2e/[filename].cy.js"
```

#### Open Cypress Test Runner (interactive mode)
```bash
npm run cypress:open
```

## Test Structure

### End-to-End (E2E) Tests
Located in the `cypress/e2e` directory:

1. **Basic Application Tests**
   - `app.cy.js` - Basic application loading tests

2. **Map Functionality Tests**
   - `map_navigation.cy.js` - Map navigation functionality
   - `map-controller-inspector.cy.js` - Map controller analysis
   - `improved-map-tests.cy.js` - Enhanced map interaction tests

3. **Debug Console Tests**
   - `debug-console-inspector.cy.js` - Initial debug console exploration
   - `debug-console-tests.cy.js` - Comprehensive debug console tests

4. **UI Component Tests**
   - `ui-components-tests.cy.js` - UI components tests
   - `dom-inspector.cy.js` - DOM structure analysis

### Fixtures
Located in the `cypress/fixtures` directory:
- Contains data used by tests and stores analysis results

### Screenshots
Located in the `cypress/screenshots` directory:
- Contains screenshots taken during test runs

## Test Reports

For a summary of all tests and improvements, see:
- [Testing Summary](./TESTING_SUMMARY.md)

## Common Issues and Solutions

### DOM Detachment Issues
When elements disappear from the DOM before Cypress can interact with them:
- Break command chains after finding elements
- Store element indices instead of references
- Use `{ force: true }` when clicking potentially hidden elements

### Asynchronous Operations
For handling operations that take time to complete:
- Use `cy.wait()` with appropriate timeouts
- Add assertions to confirm elements are present before interacting
- Consider using the Mutation Observer pattern for monitoring DOM changes

## Adding New Tests

1. Create a new file in the `cypress/e2e` directory with the `.cy.js` extension
2. Follow the existing patterns in similar test files
3. Use the `beforeEach` hook to set up common test conditions
4. Add detailed comments explaining what you're testing
5. Use `cy.log()` for debugging information
6. Update the Testing Summary document with new tests 