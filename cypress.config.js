import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3012',
    setupNodeEvents(on, config) {
      // Register event listeners and plugins here
    },
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 8000,
    experimentalStudio: true
  },
  
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
  
  // Default to showing console logs during tests
  watchForFileChanges: false,
  video: false,
  screenshotOnRunFailure: true,
  
  // Record test runs in Cypress Dashboard
  // projectId: 'YOUR_PROJECT_ID', // Uncomment and add your project ID if using Cypress Dashboard
  
  // Retry test runs
  retries: {
    runMode: 1,
    openMode: 0
  }
}); 