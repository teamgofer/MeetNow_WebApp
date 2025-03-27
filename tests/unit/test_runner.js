#!/usr/bin/env node
// MeetNow Test Runner
// Runs all available tests and reports results
// Run with: node test/test_runner.js

console.log('🧪 MeetNow Test Runner');
console.log('====================\n');

// Track overall test results
let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;
let failedSuites = [];

// Helper to run a test file and capture results
async function runTestFile(name, file) {
  console.log(`\n📋 Running ${name}...`);
  
  try {
    // Try to import the test file
    const testModule = await import(`./${file}`);
    
    // Check if it exports a runTests function
    if (typeof testModule.runTests === 'function') {
      const result = await testModule.runTests();
      
      if (result && typeof result.passed === 'number' && typeof result.failed === 'number') {
        totalTests += (result.passed + result.failed);
        totalPassed += result.passed;
        totalFailed += result.failed;
        
        if (result.failed > 0) {
          failedSuites.push(name);
        }
        
        return true;
      } else {
        console.error(`❌ ${name} did not return valid results`);
        failedSuites.push(name);
        return false;
      }
    } else {
      console.error(`❌ ${name} does not export a runTests function`);
      failedSuites.push(name);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error running ${name}:`);
    console.error(error);
    failedSuites.push(name);
    return false;
  }
}

// Main function to run all tests
async function runAllTests() {
  const testFiles = [
    { name: 'Timezone Tests', file: 'timezone_tests.js' },
    { name: 'Address Geocoding Tests', file: 'address_geocoding_tests.js' }
  ];
  
  console.log(`Found ${testFiles.length} test suites to run`);
  
  // Run each test file
  for (const test of testFiles) {
    await runTestFile(test.name, test.file);
  }
  
  // Print overall summary
  console.log('\n====================');
  console.log('🧪 Test Run Complete');
  console.log('====================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalFailed}`);
  
  if (failedSuites.length > 0) {
    console.log('\n❌ Failed Test Suites:');
    failedSuites.forEach(suite => console.log(`  - ${suite}`));
  }
  
  // Exit with appropriate code
  process.exit(totalFailed > 0 ? 1 : 0);
}

// Run the tests
runAllTests().catch(error => {
  console.error('Error in test runner:', error);
  process.exit(1);
}); 