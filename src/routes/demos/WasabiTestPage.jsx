import React, { useState } from 'react';

import { uploadFile, getSignedFileUrl, deleteFile } from '../../utils/wasabi-storage';
import { testWasabiBucket } from '../../utils/wasabi-test';

function WasabiTestPage() {
  const [testResults, setTestResults] = useState(null);
  const [testing, setTesting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);

  const runTest = async () => {
    setTesting(true);
    setTestResults(null);

    try {
      const results = await testWasabiBucket();
      setTestResults(results);
    } catch (error) {
      setTestResults({
        success: false,
        error: error.message || 'Unknown error during testing',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);
      setUploadResult(null); // Reset previous upload results
    }
  };

  const uploadImage = async () => {
    if (!imageFile) {
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      // Generate a unique path
      const timestamp = Date.now();
      const extension = imageFile.name.split('.').pop();
      const filePath = `test/test-upload-${timestamp}.${extension}`;

      // Upload the file
      const result = await uploadFile(imageFile, filePath);

      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadResult({
        success: true,
        url: result.url,
        message: 'Image uploaded successfully!',
      });
    } catch (error) {
      setUploadResult({
        success: false,
        error: error.message || 'Failed to upload image',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Wasabi Storage Test</h1>
        <a href="/" className="text-blue-500 hover:underline">
          Back to app
        </a>
      </div>

      <div className="bg-blue-50 p-4 rounded-md mb-6">
        <h2 className="text-lg font-semibold mb-2">Your Configuration</h2>
        <ul className="space-y-1">
          <li>
            <strong>Bucket Name:</strong>{' '}
            {import.meta.env.VITE_WASABI_BUCKET_NAME || 'Not configured'}
          </li>
          <li>
            <strong>Region:</strong> {import.meta.env.VITE_WASABI_REGION || 'Not configured'}
          </li>
          <li>
            <strong>Endpoint:</strong> {import.meta.env.VITE_WASABI_ENDPOINT || 'Not configured'}
          </li>
          <li>
            <strong>Access Key ID:</strong>{' '}
            {import.meta.env.VITE_WASABI_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing'}
          </li>
          <li>
            <strong>Secret Key:</strong>{' '}
            {import.meta.env.VITE_WASABI_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing'}
          </li>
        </ul>
      </div>

      <div className="mb-8 border-b pb-6">
        <h2 className="text-xl font-semibold mb-4">Test Bucket Connection</h2>
        <p className="mb-4 text-gray-600">
          This will test the connection to your Wasabi bucket by uploading a small test file,
          getting a signed URL, and then deleting the file.
        </p>

        <button
          className={`px-4 py-2 rounded-md ${testing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
          onClick={runTest}
          disabled={testing}
        >
          {testing ? 'Testing...' : 'Run Bucket Test'}
        </button>

        {testResults && (
          <div
            className={`mt-4 p-4 rounded-md ${testResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
          >
            <h3 className="font-semibold text-lg mb-2">
              {testResults.success ? '✅ Test Successful' : '❌ Test Failed'}
            </h3>

            {testResults.success ? (
              <div>
                <p className="mb-2">{testResults.message}</p>

                {testResults.uploadUrl && (
                  <p className="mb-2">
                    <strong>Upload URL:</strong>
                    <br />
                    <a
                      href={testResults.uploadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 break-all hover:underline"
                    >
                      {testResults.uploadUrl}
                    </a>
                  </p>
                )}

                {testResults.signedUrl && (
                  <p>
                    <strong>Signed URL:</strong>
                    <br />
                    <a
                      href={testResults.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 break-all hover:underline"
                    >
                      {testResults.signedUrl}
                    </a>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-red-600">{testResults.error}</p>
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Test Image Upload</h2>
        <p className="mb-4 text-gray-600">
          Upload an image file to test your Wasabi storage configuration.
        </p>

        <input type="file" accept="image/*" onChange={handleFileChange} className="mb-4" />

        {previewUrl && (
          <div className="mt-4">
            <div className="bg-gray-50 p-4 border rounded-md mb-4">
              <h3 className="font-semibold mb-2">Image Preview:</h3>
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full h-auto max-h-64 rounded-md"
              />
            </div>

            <button
              className={`px-4 py-2 rounded-md ${uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'} text-white transition-colors`}
              onClick={uploadImage}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>

            {uploadResult && (
              <div
                className={`mt-4 p-4 rounded-md ${uploadResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
              >
                <h3 className="font-semibold text-lg mb-2">
                  {uploadResult.success ? '✅ Upload Successful' : '❌ Upload Failed'}
                </h3>

                {uploadResult.success ? (
                  <div>
                    <p className="mb-2">{uploadResult.message}</p>

                    {uploadResult.url && (
                      <>
                        <p className="mb-2">
                          <strong>Image URL:</strong>
                          <br />
                          <a
                            href={uploadResult.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 break-all hover:underline"
                          >
                            {uploadResult.url}
                          </a>
                        </p>

                        <div className="mt-4 bg-gray-50 p-4 border rounded-md">
                          <h4 className="font-semibold mb-2">Uploaded Image:</h4>
                          <img
                            src={uploadResult.url}
                            alt="Uploaded"
                            className="max-w-full h-auto max-h-64 rounded-md"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-red-600">{uploadResult.error}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default WasabiTestPage;
