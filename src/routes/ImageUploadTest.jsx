import React, { useState } from 'react';

import MeetupImageUploader from '../components/MeetupImageUploader';
import { getUploadPresignedUrl } from '../utils/wasabi-storage';

/**
 * A comprehensive test page for diagnosing image upload issues
 */
const ImageUploadTest = () => {
  const [results, setResults] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);

  // Add a log entry to the results
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toISOString().substring(11, 19);
    setResults(prev => [...prev, { id: Date.now(), timestamp, message, type }]);
  };

  // Clear logs
  const clearLogs = () => {
    setResults([]);
    setErrorDetails(null);
  };

  // Test environment configuration
  const testConfig = () => {
    addLog('Testing environment configuration...', 'info');

    const requiredVars = [
      'VITE_WASABI_REGION',
      'VITE_WASABI_ENDPOINT',
      'VITE_WASABI_BUCKET_NAME',
      'VITE_WASABI_ACCESS_KEY_ID',
      'VITE_WASABI_SECRET_ACCESS_KEY',
      'VITE_WASABI_PUBLIC_ACCESS_KEY_ID',
      'VITE_WASABI_PUBLIC_SECRET_KEY',
    ];

    const missingVars = [];
    const configValues = {};

    // Check if each required variable is defined
    for (const varName of requiredVars) {
      const value = import.meta.env[varName];
      if (!value) {
        missingVars.push(varName);
        addLog(`Missing environment variable: ${varName}`, 'error');
      } else {
        // Only show partial value for security
        const maskedValue =
          varName.includes('KEY') || varName.includes('SECRET')
            ? `${value.substring(0, 4)}****`
            : value;
        configValues[varName] = maskedValue;
        addLog(`${varName}: ${maskedValue}`, 'success');
      }
    }

    if (missingVars.length > 0) {
      addLog(`Configuration test failed - missing ${missingVars.length} variables`, 'error');
      return false;
    }

    addLog('Configuration test passed - all variables defined', 'success');
    return true;
  };

  // Test getting a presigned URL with standard credentials
  const testPresignedUrl = async (usePublic = false) => {
    const credentialType = usePublic ? 'public' : 'standard';
    addLog(`Testing presigned URL generation with ${credentialType} credentials...`, 'info');

    try {
      setIsLoading(true);

      const path = `test/browser-test-${Date.now()}.jpg`;
      const { success, uploadUrl, publicUrl, error } = await getUploadPresignedUrl(
        path,
        'image/jpeg',
        300,
        usePublic
      );

      if (!success || !uploadUrl) {
        addLog(`Failed to generate presigned URL: ${error?.message || 'Unknown error'}`, 'error');
        setErrorDetails(error);
        return null;
      }

      addLog(
        `Successfully generated presigned URL (starts with ${uploadUrl.substring(0, 30)}...)`,
        'success'
      );
      addLog(`Public URL will be: ${publicUrl}`, 'success');

      return { uploadUrl, publicUrl };
    } catch (error) {
      addLog(`Error while generating presigned URL: ${error.message}`, 'error');
      setErrorDetails(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Test a direct upload using fetch with a presigned URL
  const testDirectUpload = async (usePublic = false) => {
    if (!selectedImage) {
      addLog('No image selected. Please select an image first.', 'error');
      return;
    }

    addLog(
      `Testing direct upload with ${usePublic ? 'public' : 'standard'} credentials...`,
      'info'
    );

    try {
      setIsLoading(true);

      // First, get a presigned URL
      const urlResult = await testPresignedUrl(usePublic);
      if (!urlResult) {
        addLog('Skipping upload test because presigned URL generation failed', 'error');
        return;
      }

      const { uploadUrl, publicUrl } = urlResult;

      // Now use fetch to upload directly
      addLog('Starting direct upload using fetch...', 'info');

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedImage,
        headers: {
          'Content-Type': selectedImage.type,
        },
      });

      if (!response.ok) {
        addLog(`Upload failed with status: ${response.status} ${response.statusText}`, 'error');
        try {
          const errorText = await response.text();
          setErrorDetails({
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries([...response.headers.entries()]),
            body: errorText,
          });
        } catch (e) {
          // Ignore error parsing response body
        }
        return;
      }

      addLog('Upload successful!', 'success');
      addLog(`The image should be available at: ${publicUrl}`, 'success');

      // Try to load the image to validate
      addLog('Validating upload by loading the image...', 'info');
      setUploadedUrl(publicUrl);

      return publicUrl;
    } catch (error) {
      addLog(`Error during direct upload: ${error.message}`, 'error');
      setErrorDetails(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image selection
  const handleImageSelect = e => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      addLog(`Selected image: ${file.name} (${file.size} bytes, ${file.type})`, 'info');
    }
  };

  // Handle image upload success from the component
  const handleImageUploaded = url => {
    addLog(`MeetupImageUploader component successfully uploaded image to: ${url}`, 'success');
    setUploadedUrl(url);
  };

  // Run a complete test
  const runFullTest = async () => {
    clearLogs();
    addLog('⏳ Starting comprehensive image upload test...', 'info');

    // Test 1: Environment configuration
    const configOk = testConfig();
    if (!configOk) {
      addLog('❌ Environment configuration test failed. Aborting further tests.', 'error');
      return;
    }

    // Test 2: Presigned URL generation (standard credentials)
    const standardUrlResult = await testPresignedUrl(false);
    if (!standardUrlResult) {
      addLog('❌ Standard presigned URL test failed. Continuing with public test.', 'error');
    }

    // Test 3: Presigned URL generation (public credentials)
    const publicUrlResult = await testPresignedUrl(true);
    if (!publicUrlResult) {
      addLog('❌ Public presigned URL test failed.', 'error');
    }

    // Test 4: Check if we have an image for upload tests
    if (!selectedImage) {
      addLog(
        '⚠️ No image selected, skipping direct upload tests. Please select an image and run the direct upload tests.',
        'warning'
      );
    } else {
      // Test 5: Direct upload (if image is selected)
      await testDirectUpload(true);
    }

    addLog('✅ All tests completed. Check the results above for details.', 'info');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Image Upload Diagnostics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column - Tests & Controls */}
        <div>
          <div className="bg-white shadow-md rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold mb-4">Test Controls</h2>

            {/* Image Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Test Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              {selectedImage && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected: {selectedImage.name} ({Math.round(selectedImage.size / 1024)} KB)
                </div>
              )}
            </div>

            {/* Test Buttons */}
            <div className="space-y-2">
              <button
                onClick={runFullTest}
                disabled={isLoading}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Running Tests...' : 'Run Full Test'}
              </button>

              <button
                onClick={() => testDirectUpload(true)}
                disabled={isLoading || !selectedImage}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {isLoading ? 'Uploading...' : 'Test Direct Upload (Public)'}
              </button>

              <button
                onClick={clearLogs}
                className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear Logs
              </button>
            </div>
          </div>

          {/* Component Test */}
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Test MeetupImageUploader Component</h2>
            <MeetupImageUploader onImageUploaded={handleImageUploaded} isAnonymous={true} />
          </div>
        </div>

        {/* Right column - Results & Logs */}
        <div>
          {/* Test Results Log */}
          <div className="bg-gray-800 rounded-lg p-4 text-white font-mono text-sm h-[400px] overflow-y-auto mb-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-200">Test Log</h2>
            {results.length === 0 ? (
              <div className="text-gray-400 italic">
                No test results yet. Run a test to see logs.
              </div>
            ) : (
              <div className="space-y-1">
                {results.map(entry => (
                  <div
                    key={entry.id}
                    className={`${
                      entry.type === 'error'
                        ? 'text-red-400'
                        : entry.type === 'success'
                          ? 'text-green-400'
                          : entry.type === 'warning'
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                    }`}
                  >
                    [{entry.timestamp}] {entry.message}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Details */}
          {errorDetails && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold mb-2 text-red-700">Error Details</h2>
              <pre className="whitespace-pre-wrap text-xs text-red-800 bg-red-100 p-3 rounded">
                {JSON.stringify(errorDetails, null, 2)}
              </pre>
            </div>
          )}

          {/* Uploaded Image Preview */}
          {uploadedUrl && (
            <div className="bg-white shadow-md rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">Uploaded Image</h2>
              <div className="relative bg-gray-100 border rounded-lg p-2">
                <img
                  src={uploadedUrl}
                  alt="Uploaded"
                  className="max-h-[200px] mx-auto object-contain"
                  onError={() => {
                    addLog(
                      'Failed to load the uploaded image. The URL might be incorrect or the upload failed.',
                      'error'
                    );
                  }}
                  onLoad={() => {
                    addLog('Successfully loaded the uploaded image!', 'success');
                  }}
                />
                <div className="mt-2 text-xs text-gray-500 break-all">{uploadedUrl}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUploadTest;
