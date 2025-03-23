// Import cypress commands and assertions
import './commands';

// Alternatively import directly from cypress
// import 'cypress-file-upload';

// Prevent uncaught exceptions from failing tests
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  return false;
});

// You can configure global behavior here
beforeEach(() => {
  // Reset any application state or setup needed before each test
});

// Add any global hooks or custom commands here 