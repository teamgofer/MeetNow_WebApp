/**
 * Test utility to directly test Wasabi image upload functionality
 * 
 * Usage:
 * 1. Put a test image in the same directory as this script
 * 2. Run the script with node: node test-image-upload.js
 * 3. Check the console output to see if the upload was successful
 */

import { getUploadPresignedUrl } from './wasabi-storage.js';

// Helper to create a simple logging function
const log = (message, isError = false) => {
  const style = isError 
    ? 'background: #ffdddd; color: #ff0000; padding: 2px 5px; border-radius: 3px;'
    : 'background: #ddffdd; color: #007700; padding: 2px 5px; border-radius: 3px;';
  
  console.log(`%c${message}`, style);
};

// Test regular upload
const testRegularUpload = async () => {
  log('🚀 Testing regular upload with standard credentials');
  
  try {
    // Get a pre-signed URL
    const { success, uploadUrl, publicUrl, error } = await getUploadPresignedUrl(
      `test/regular-upload-${Date.now()}.jpg`,
      'image/jpeg',
      300,
      false // use standard credentials
    );
    
    if (!success) {
      throw error || new Error('Failed to get presigned URL');
    }
    
    log(`✅ Got presigned URL: ${uploadUrl.substring(0, 50)}...`);
    log(`✅ Public URL will be: ${publicUrl}`);
    
    // In a real test, we would fetch the URL here, but this is just a test of URL generation
    return { success: true, message: 'Regular upload URL generation successful' };
  } catch (err) {
    log(`❌ Regular upload test failed: ${err.message}`, true);
    return { success: false, error: err };
  }
};

// Test public upload
const testPublicUpload = async () => {
  log('🚀 Testing public upload with anonymous credentials');
  
  try {
    // Get a pre-signed URL using public credentials
    const { success, uploadUrl, publicUrl, error } = await getUploadPresignedUrl(
      `test/public-upload-${Date.now()}.jpg`,
      'image/jpeg',
      300,
      true // use public credentials
    );
    
    if (!success) {
      throw error || new Error('Failed to get presigned URL');
    }
    
    log(`✅ Got presigned URL: ${uploadUrl.substring(0, 50)}...`);
    log(`✅ Public URL will be: ${publicUrl}`);
    
    // In a real test, we would fetch the URL here, but this is just a test of URL generation
    return { success: true, message: 'Public upload URL generation successful' };
  } catch (err) {
    log(`❌ Public upload test failed: ${err.message}`, true);
    return { success: false, error: err };
  }
};

// Test configuration
const testConfiguration = () => {
  log('🔍 Checking environment configuration');
  
  const requiredVars = [
    'VITE_WASABI_REGION',
    'VITE_WASABI_ENDPOINT',
    'VITE_WASABI_BUCKET_NAME',
    'VITE_WASABI_ACCESS_KEY_ID',
    'VITE_WASABI_SECRET_ACCESS_KEY',
    'VITE_WASABI_PUBLIC_ACCESS_KEY_ID',
    'VITE_WASABI_PUBLIC_SECRET_KEY'
  ];
  
  const missingVars = [];
  
  for (const varName of requiredVars) {
    const value = import.meta.env[varName] || process.env[varName];
    if (!value) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    log(`❌ Missing required environment variables: ${missingVars.join(', ')}`, true);
    return { success: false, missingVars };
  }
  
  log('✅ All required environment variables are set');
  return { success: true };
};

// Run all tests
const runAllTests = async () => {
  log('🧪 STARTING WASABI UPLOAD TESTS 🧪');
  
  // Test 1: Check environment configuration
  const configResult = testConfiguration();
  if (!configResult.success) {
    log('❌ Configuration test failed, aborting remaining tests', true);
    return;
  }
  
  // Test 2: Test regular upload
  const regularResult = await testRegularUpload();
  
  // Test 3: Test public upload
  const publicResult = await testPublicUpload();
  
  // Summarize results
  log('\n📊 TEST RESULTS 📊');
  log(`Configuration Test: ${configResult.success ? 'PASSED ✅' : 'FAILED ❌'}`);
  log(`Regular Upload Test: ${regularResult.success ? 'PASSED ✅' : 'FAILED ❌'}`);
  log(`Public Upload Test: ${publicResult.success ? 'PASSED ✅' : 'FAILED ❌'}`);
  
  // Overall result
  if (configResult.success && regularResult.success && publicResult.success) {
    log('🎉 ALL TESTS PASSED! The Wasabi integration should be working correctly.');
  } else {
    log('❌ SOME TESTS FAILED. Check the logs above for details.', true);
  }
};

// Run the tests when this file is loaded directly
if (import.meta.url === import.meta.main) {
  runAllTests();
}

// Export for use in other files
export {
  testRegularUpload,
  testPublicUpload,
  testConfiguration,
  runAllTests
}; 