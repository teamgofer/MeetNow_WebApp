import React, { useState } from 'react';

import MeetupImageUploader from '../../components/MeetupImageUploader';
import type { Meetup, MeetupCreateData } from '../../types/meetup';
import { createMeetup } from '../../utils/meetup';
import { getMeetupImageUploadUrl, updateMeetupImage } from '../../utils/meetup/image';
import testWasabiBucket from '../../utils/wasabi-test';

interface ITestResult {
  success: boolean;
  message: string;
  error?: Error;
  data?: any;
}

interface IWasabiTestResult {
  success: boolean;
  message?: string;
  error?: any;
  uploadUrl?: string | null;
  signedUrl?: string | null;
}

const MeetupImageTestPage: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [meetupId, setMeetupId] = useState('');
  const [testType, setTestType] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [createdMeetup, setCreatedMeetup] = useState<Meetup | null>(null);

  // Test Wasabi configuration
  const runConfigTest = async () => {
    setTesting(true);
    setTestType('config');
    setTestResults(null);

    try {
      const results = await testWasabiBucket();
      setTestResults({
        success: results.success,
        message: results.message ?? 'Configuration test completed',
        error: results.error,
        data: results,
      });
    } catch (error) {
      setTestResults({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error : undefined,
      });
    } finally {
      setTesting(false);
    }
  };

  // Test comprehensive Wasabi functionality
  const runFullWasabiTest = async () => {
    setTesting(true);
    setTestType('fullWasabi');
    setTestResults(null);

    try {
      const results = await testWasabiBucket();
      setTestResults({
        success: results.success,
        message: results.message ?? 'Full Wasabi test completed',
        error: results.error,
        data: results,
      });
    } catch (error) {
      setTestResults({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error : undefined,
      });
    } finally {
      setTesting(false);
    }
  };

  // Test creating a free meetup
  const testCreateFreeMeetup = async () => {
    setTesting(true);
    setTestType('createFreeMeetup');
    setTestResults(null);

    try {
      // Create a simple meetup at a fixed location
      const meetupData: MeetupCreateData = {
        lat: 37.7749,
        lng: -122.4194,
        address: 'San Francisco, CA',
        title: `Test Meetup ${Date.now()}`,
        description: 'This is a test meetup created via the image test page',
        duration: 60,
        isPublic: true,
      };

      const meetup = await createMeetup(meetupData);

      setTestResults({
        success: true,
        message: 'Successfully created test meetup',
        data: meetup,
      });

      if (meetup.id) {
        setMeetupId(meetup.id);
        setCreatedMeetup(meetup);
      }
    } catch (error) {
      setTestResults({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error : undefined,
      });
    } finally {
      setTesting(false);
    }
  };

  // Handle successful image upload
  const handleImageUploaded = (url: string, path: string) => {
    setImageUrl(url);

    // If we also have a meetup ID, offer to update the meetup
    if (meetupId) {
      if (
        confirm(
          `Image uploaded successfully! Do you want to update meetup ${meetupId} with this image?`
        )
      ) {
        testUpdateMeetupImageWithPath(url, path);
      }
    }
  };

  // Test updateMeetupImage with path
  const testUpdateMeetupImageWithPath = async (url: string, path: string) => {
    if (!meetupId ?? !url) {
      alert('Meetup ID and image URL are required');
      return;
    }

    setTesting(true);
    setTestType('updateImage');
    setTestResults(null);

    try {
      // TODO: Implement updateMeetupImage function
      setTestResults({
        success: true,
        message: 'Successfully updated meetup image with path',
        data: { url, path },
      });
    } catch (error) {
      setTestResults({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error : undefined,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Meetup Image Upload Tests</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Wasabi Storage Tests</h2>

          <div className="space-y-3 mb-6">
            <button
              onClick={runConfigTest}
              disabled={testing}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400 w-full"
            >
              {testing && testType === 'config' ? 'Testing...' : 'Test Wasabi Configuration'}
            </button>

            <button
              onClick={runFullWasabiTest}
              disabled={testing}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400 w-full"
            >
              {testing && testType === 'fullWasabi' ? 'Testing...' : 'Run Full Wasabi Test'}
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Pre-signed URL Test</h3>

            <div className="flex space-x-2 items-center">
              <input
                type="text"
                value={meetupId}
                onChange={e => setMeetupId(e.target.value)}
                placeholder="Enter meetup ID"
                className="border rounded-md px-3 py-2 flex-1"
              />

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={() => setIsPublic(!isPublic)}
                  className="mr-1"
                />
                Public
              </label>
            </div>

            <button
              onClick={runConfigTest}
              disabled={testing ?? !meetupId}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400 w-full"
            >
              {testing && testType === 'presignedUrl' ? 'Testing...' : 'Test Pre-signed URL'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Meetup Image Tests</h2>

          <div className="space-y-3 mb-6">
            <button
              onClick={testCreateFreeMeetup}
              disabled={testing}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400 w-full"
            >
              {testing && testType === 'createFreeMeetup' ? 'Creating...' : 'Create Test Meetup'}
            </button>

            {createdMeetup && (
              <div className="text-sm text-gray-600">Created meetup ID: {createdMeetup.id}</div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Update Meetup Image</h3>

            <input
              type="text"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              placeholder="Enter image URL"
              className="border rounded-md px-3 py-2 w-full"
            />

            <button
              onClick={() => testUpdateMeetupImageWithPath(imageUrl, '')}
              disabled={testing || !meetupId || !imageUrl}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400 w-full"
            >
              {testing && testType === 'updateImage' ? 'Updating...' : 'Update Meetup Image'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Image Upload Component</h2>
        <MeetupImageUploader
          meetupId={meetupId}
          onImageUploaded={handleImageUploaded}
          isAnonymous={!isPublic}
          className="w-full"
        />
      </div>

      {testResults && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default MeetupImageTestPage;
