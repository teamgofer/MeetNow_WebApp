import React, { useState } from 'react';

import { uploadFile } from './utils/wasabi-storage';
import { testWasabiBucket } from './utils/wasabi-test';

const WasabiTest = () => {
  const [testResults, setTestResults] = useState(null);
  const [testInProgress, setTestInProgress] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create a preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      // Reset previous upload results
      setUploadResult(null);
    }
  };

  const runBucketTest = async () => {
    setTestInProgress(true);
    setTestResults(null);

    try {
      const results = await testWasabiBucket();
      setTestResults(results);
    } catch (error) {
      setTestResults({
        success: false,
        error: error.message || 'Unknown error occurred',
      });
    } finally {
      setTestInProgress(false);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) {
      alert('Please select an image file first');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      // Generate a unique path for the image
      const timestamp = Date.now();
      const extension = imageFile.name.split('.').pop();
      const filePath = `test/image-upload-test-${timestamp}.${extension}`;

      console.log(`Uploading image to ${filePath}...`);

      // Attempt to upload the image
      const { success, url, error } = await uploadFile(imageFile, filePath);

      if (!success || error) {
        console.error('Image upload failed:', error);
        setUploadResult({
          success: false,
          error: error?.message || 'Failed to upload image',
        });
        return;
      }

      console.log('Image uploaded successfully!');
      setUploadResult({
        success: true,
        url: url,
        path: filePath,
      });
    } catch (error) {
      console.error('Error during image upload:', error);
      setUploadResult({
        success: false,
        error: error.message || 'Unknown error during upload',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-4">Wasabi Storage Test</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Test Bucket Connection</h2>
        <p className="text-gray-600 mb-4">
          This will upload a small test file to the Wasabi bucket, generate a signed URL, and then
          delete the file.
        </p>

        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          onClick={runBucketTest}
          disabled={testInProgress}
        >
          {testInProgress ? 'Testing...' : 'Run Bucket Test'}
        </button>

        {testResults && (
          <div
            className={`mt-4 p-4 rounded ${testResults.success ? 'bg-green-100' : 'bg-red-100'}`}
          >
            <h3 className="font-semibold">
              {testResults.success ? '✅ Test Successful!' : '❌ Test Failed'}
            </h3>

            {testResults.success ? (
              <div className="mt-2">
                <p>The Wasabi bucket is properly configured.</p>
                {testResults.uploadUrl && (
                  <p className="mt-2">
                    <strong>Upload URL:</strong> <br />
                    <a
                      href={testResults.uploadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 break-all"
                    >
                      {testResults.uploadUrl}
                    </a>
                  </p>
                )}
                {testResults.signedUrl && (
                  <p className="mt-2">
                    <strong>Signed URL:</strong> <br />
                    <a
                      href={testResults.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 break-all"
                    >
                      {testResults.signedUrl}
                    </a>
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-red-600">{testResults.error || 'Unknown error occurred'}</p>
            )}
          </div>
        )}
      </div>

      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-2">Bucket Configuration</h2>
        <div className="bg-gray-100 p-3 rounded text-sm font-mono">
          <p>
            <strong>Region:</strong> {import.meta.env.VITE_WASABI_REGION}
          </p>
          <p>
            <strong>Endpoint:</strong> {import.meta.env.VITE_WASABI_ENDPOINT}
          </p>
          <p>
            <strong>Bucket:</strong> {import.meta.env.VITE_WASABI_BUCKET_NAME}
          </p>
          <p>
            <strong>Access Key ID:</strong>{' '}
            {import.meta.env.VITE_WASABI_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing'}
          </p>
          <p>
            <strong>Secret Key:</strong>{' '}
            {import.meta.env.VITE_WASABI_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing'}
          </p>
        </div>
      </div>

      <div className="border-t pt-6 mt-6">
        <h2 className="text-xl font-semibold mb-2">Test Image Upload</h2>
        <p className="text-gray-600 mb-4">
          You can test uploading an image file to the Wasabi bucket.
        </p>

        <input type="file" accept="image/*" onChange={handleFileChange} className="mb-4" />

        {previewUrl && (
          <>
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Image Preview:</h3>
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full h-auto max-h-64 rounded border"
              />
            </div>

            <button
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              onClick={uploadImage}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Image to Wasabi'}
            </button>

            {uploadResult && (
              <div
                className={`mt-4 p-4 rounded ${uploadResult.success ? 'bg-green-100' : 'bg-red-100'}`}
              >
                <h3 className="font-semibold">
                  {uploadResult.success ? '✅ Image Upload Successful!' : '❌ Image Upload Failed'}
                </h3>

                {uploadResult.success ? (
                  <div className="mt-2">
                    <p>The image was successfully uploaded to Wasabi.</p>
                    {uploadResult.url && (
                      <p className="mt-2">
                        <strong>Image URL:</strong> <br />
                        <a
                          href={uploadResult.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 break-all"
                        >
                          {uploadResult.url}
                        </a>
                      </p>
                    )}
                    <div className="mt-3">
                      <img
                        src={uploadResult.url}
                        alt="Uploaded to Wasabi"
                        className="max-w-full h-auto max-h-64 rounded border"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-red-600">
                    {uploadResult.error || 'Unknown error occurred during upload'}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default WasabiTest;
