#!/usr/bin/env node

/**
 * MeetNow WebApp Test Runner
 * 
 * This script provides a convenient way to run specific groups of Cypress tests.
 * 
 * Usage:
 *   node test-runner.js [test-group]
 * 
 * Available test groups:
 *   - all: Run all tests
 *   - basic: Run basic app tests
 *   - map: Run map-related tests
 *   - debug: Run debug console tests
 *   - ui: Run UI component tests
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define test groups
const testGroups = {
  all: ['cypress/e2e/**/*.cy.js'],
  basic: ['cypress/e2e/app.cy.js', 'cypress/e2e/dom-inspector.cy.js'],
  map: ['cypress/e2e/map_navigation.cy.js', 'cypress/e2e/map-controller-inspector.cy.js', 'cypress/e2e/improved-map-tests.cy.js'],
  debug: ['cypress/e2e/debug-console-inspector.cy.js', 'cypress/e2e/debug-console-tests.cy.js'],
  ui: ['cypress/e2e/ui-components-tests.cy.js']
};

// Get the test group from command line arguments
const testGroup = process.argv[2] || 'all';

if (!testGroups[testGroup]) {
  console.error(`Error: Unknown test group '${testGroup}'`);
  console.log('\nAvailable test groups:');
  Object.keys(testGroups).forEach(group => {
    console.log(`  - ${group}`);
  });
  process.exit(1);
}

// Create specs argument
const specs = testGroups[testGroup].map(spec => `"${spec}"`).join(',');

// Run Cypress tests
try {
  console.log(`Running test group: ${testGroup}`);
  console.log(`Specs: ${specs}`);
  console.log('-------------------------------');
  
  execSync(`npx cypress run --spec ${specs}`, { stdio: 'inherit' });
  
  console.log('\nTests completed successfully!');
} catch (error) {
  console.error('\nTests failed with errors.');
  process.exit(1);
} 