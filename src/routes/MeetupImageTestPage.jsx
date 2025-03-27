import React, { useState } from 'react';
import { testWasabiConfig, testPresignedUrl, testWasabiBucket } from '../utils/wasabi-test';
import MeetupImageUploader from '../components/MeetupImageUploader';
import { getMeetupImageUploadUrl, updateMeetupImage, createFreeMeetup, refreshMeetupImageUrl } from '../utils/meetup';

const MeetupImageTestPage = () => {
  const [testResults, setTestResults] = useState(null);
  const [testing, setTesting] = useState(false);
  const [meetupId, setMeetupId] = useState('');
  const [testType, setTestType] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [createdMeetup, setCreatedMeetup] = useState(null);
  
  // Test Wasabi configuration
  const runConfigTest = async () => {
    setTesting(true);
    setTestType('config');
    setTestResults(null);
    
    try {
      const results = await testWasabiConfig();
      setTestResults(results);
    } catch (error) {
      setTestResults({
        success: false,
        message: `Error: ${error.message}`,
        error
      });
    } finally {
      setTesting(false);
    }
  };
  
  // Test pre-signed URL generation
  const runPresignedUrlTest = async () => {
    if (!meetupId) {
      alert('Please enter a meetup ID');
      return;
    }
    
    setTesting(true);
    setTestType('presignedUrl');
    setTestResults(null);
    
    try {
      const results = await testPresignedUrl(meetupId, isPublic);
      setTestResults(results);
    } catch (error) {
      setTestResults({
        success: false,
        message: `Error: ${error.message}`,
        error
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
      setTestResults(results);
    } catch (error) {
      setTestResults({
        success: false,
        message: `Error: ${error.message}`,
        error
      });
    } finally {
      setTesting(false);
    }
  };
  
  // Test getMeetupImageUploadUrl directly
  const testGetUploadUrl = async () => {
    if (!meetupId) {
      alert('Please enter a meetup ID');
      return;
    }
    
    setTesting(true);
    setTestType('getUploadUrl');
    setTestResults(null);
    
    try {
      const results = await getMeetupImageUploadUrl(
        meetupId,
        'image/jpeg',
        `test_${Date.now()}.jpg`,
        isPublic
      );
      
      setTestResults(results);
    } catch (error) {
      setTestResults({
        success: false,
        message: `Error: ${error.message}`,
        error
      });
    } finally {
      setTesting(false);
    }
  };
  
  // Test updateMeetupImage
  const testUpdateMeetupImage = async () => {
    if (!meetupId || !imageUrl) {
      alert('Please enter a meetup ID and image URL');
      return;
    }
    
    setTesting(true);
    setTestType('updateImage');
    setTestResults(null);
    
    try {
      const results = await updateMeetupImage(meetupId, imageUrl);
      setTestResults(results);
    } catch (error) {
      setTestResults({
        success: false,
        message: `Error: ${error.message}`,
        error
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
      const results = await createFreeMeetup({
        lat: 37.7749,
        lng: -122.4194,
        address: 'San Francisco, CA',
        title: 'Test Meetup ' + Date.now(),
        description: 'This is a test meetup created via the image test page',
        duration: 60
      });
      
      setTestResults(results);
      
      if (results.success && results.meetup && results.meetup.id) {
        setMeetupId(results.meetup.id);
        setCreatedMeetup(results.meetup);
      }
    } catch (error) {
      setTestResults({
        success: false,
        message: `Error: ${error.message}`,
        error
      });
    } finally {
      setTesting(false);
    }
  };
  
  // Handle successful image upload
  const handleImageUploaded = (url, path) => {
    setImageUrl(url);
    
    // If we also have a meetup ID, offer to update the meetup
    if (meetupId) {
      if (confirm(`Image uploaded successfully! Do you want to update meetup ${meetupId} with this image?`)) {
        testUpdateMeetupImageWithPath(url, path);
      }
    }
  };
  
  // Test updateMeetupImage with path
  const testUpdateMeetupImageWithPath = async (url, path) => {
    if (!meetupId || !url) {
      alert('Meetup ID and image URL are required');
      return;
    }
    
    setTesting(true);
    setTestType('updateImage');
    setTestResults(null);
    
    try {
      const results = await updateMeetupImage(meetupId, url, path);
      setTestResults(results);
    } catch (error) {
      setTestResults({
        success: false,
        message: `Error: ${error.message}`,
        error
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
                onChange={(e) => setMeetupId(e.target.value)}
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
              onClick={runPresignedUrlTest}
              disabled={testing || !meetupId}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400 w-full"
            >
              {testing && testType === 'presignedUrl' ? 'Testing...' : 'Test Pre-signed URL'}
            </button>
            
            <button 
              onClick={testGetUploadUrl}
              disabled={testing || !meetupId}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400 w-full"
            >
              {testing && testType === 'getUploadUrl' ? 'Testing...' : 'Test getMeetupImageUploadUrl'}
            </button>
            
            <div className="mt-4">
              <h3 className="font-medium mb-2">Free Meetup Creation Test</h3>
              <button 
                onClick={testCreateFreeMeetup}
                disabled={testing}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400 w-full"
              >
                {testing && testType === 'createFreeMeetup' ? 'Creating...' : 'Create Test Free Meetup'}
              </button>
            </div>
            
            {createdMeetup && (
              <div className="mt-3 p-3 bg-purple-50 rounded-md">
                <p className="font-medium">Meetup Created:</p>
                <p className="text-sm">ID: {createdMeetup.id}</p>
                <p className="text-sm">Title: {createdMeetup.title}</p>
                
                {createdMeetup.image_path && (
                  <button
                    onClick={async () => {
                      const refreshedMeetup = await refreshMeetupImageUrl(createdMeetup, isPublic);
                      setCreatedMeetup(refreshedMeetup);
                      setImageUrl(refreshedMeetup.image_url);
                      alert('Image URL refreshed!');
                    }}
                    className="mt-2 px-2 py-1 bg-green-500 text-white rounded-md text-xs"
                  >
                    Refresh Image URL
                  </button>
                )}
              </div>
            )}
            
            <div className="mt-4">
              <h3 className="font-medium mb-2">Update Meetup Image</h3>
              <div className="flex space-x-2 items-center">
                <input 
                  type="text" 
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Image URL"
                  className="border rounded-md px-3 py-2 flex-1"
                />
              </div>
              
              <button 
                onClick={testUpdateMeetupImage}
                disabled={testing || !meetupId || !imageUrl}
                className="mt-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400 w-full"
              >
                {testing && testType === 'updateImage' ? 'Updating...' : 'Update Meetup Image'}
              </button>
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Image Uploader Component Test</h2>
            
            {meetupId ? (
              <MeetupImageUploader
                meetupId={meetupId}
                isPublicMeetup={isPublic}
                onImageUploaded={handleImageUploaded}
              />
            ) : (
              <p className="text-gray-500">Enter a meetup ID to test the uploader component</p>
            )}
          </div>
          
          {testResults && (
            <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
              testResults.success ? 'border-green-500' : 'border-red-500'
            }`}>
              <h3 className="font-semibold mb-2">Test Results</h3>
              <p className={testResults.success ? 'text-green-600' : 'text-red-600'}>
                {testResults.message}
              </p>
              
              <div className="mt-4 bg-gray-50 rounded-md p-3 overflow-auto max-h-60">
                <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(testResults, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetupImageTestPage; 
import { testWasabiConfig, testPresignedUrl, testWasabiBucket } from '../utils/wasabi-test';
import MeetupImageUploader from '../components/MeetupImageUploader';
import { getMeetupImageUploadUrl, updateMeetupImage, createFreeMeetup, refreshMeetupImageUrl } from '../utils/meetup';

const MeetupImageTestPage = () => {
  const [testResults, setTestResults] = useState(null);
  const [testing, setTesting] = useState(false);
  const [meetupId, setMeetupId] = useState('');
  const [testType, setTestType] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [createdMeetup, setCreatedMeetup] = useState(null);
  
  // Test Wasabi configuration
  const runConfigTest = async () => {
    setTesting(true);
    setTestType('config');
    setTestResults(null);
    
    try {
      const results = await testWasabiConfig();
      setTestResults(results);
    } catch (error) {
      setTestResults({
        success: false,
        message: `Error: ${error.message}`,
        error
      });
    } finally {
      setTesting(false);
    }
  };
  
  // Test pre-signed URL generation
  const runPresignedUrlTest = async () => {
    if (!meetupId) {
      alert('Please enter a meetup ID');
      return;
    }
    
    setTesting(true);
    setTestType('presignedUrl');
    setTestResults(null);
    
    try {
      const results = await testPresignedUrl(meetupId, isPublic);
      setTestResults(results);
    } catch (error) {
      setTestResults({
        success: false,
        message: `Error: ${error.message}`,
        error
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
      setTestResults(results);
    } catch (error) {
      setTestResults({
        success: false,
        message: `Error: ${error.message}`,
        error
      });
    } finally {
      setTesting(false);
    }
  };
  
  // Test getMeetupImageUploadUrl directly
  const testGetUploadUrl = async () => {
    if (!meetupId) {
      alert('Please enter a meetup ID');
      return;
    }
    
    setTesting(true);
    setTestType('getUploadUrl');
    setTestResults(null);
    
    try {
      const results = await getMeetupImageUploadUrl(
        meetupId,
        'image/jpeg',
        `test_${Date.now()}.jpg`,
        isPublic
      );
      
      setTestResults(results);
    } catch (error) {
      setTestResults({
        success: false,
        message: `Error: ${error.message}`,
        error
      });
    } finally {
      setTesting(false);
    }
  };
  
  // Test updateMeetupImage
  const testUpdateMeetupImage = async () => {
    if (!meetupId || !imageUrl) {
      alert('Please enter a meetup ID and image URL');
      return;
    }
    
    setTesting(true);
    setTestType('updateImage');
    setTestResults(null);
    
    try {
      const results = await updateMeetupImage(meetupId, imageUrl);
      setTestResults(results);
    } catch (error) {
      setTestResults({
        success: false,
        message: `Error: ${error.message}`,
        error
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
      const results = await createFreeMeetup({
        lat: 37.7749,
        lng: -122.4194,
        address: 'San Francisco, CA',
        title: 'Test Meetup ' + Date.now(),
        description: 'This is a test meetup created via the image test page',
        duration: 60
      });
      
      setTestResults(results);
      
      if (results.success && results.meetup && results.meetup.id) {
        setMeetupId(results.meetup.id);
        setCreatedMeetup(results.meetup);
      }
    } catch (error) {
      setTestResults({
        success: false,
        message: `Error: ${error.message}`,
        error
      });
    } finally {
      setTesting(false);
    }
  };
  
  // Handle successful image upload
  const handleImageUploaded = (url, path) => {
    setImageUrl(url);
    
    // If we also have a meetup ID, offer to update the meetup
    if (meetupId) {
      if (confirm(`Image uploaded successfully! Do you want to update meetup ${meetupId} with this image?`)) {
        testUpdateMeetupImageWithPath(url, path);
      }
    }
  };
  
  // Test updateMeetupImage with path
  const testUpdateMeetupImageWithPath = async (url, path) => {
    if (!meetupId || !url) {
      alert('Meetup ID and image URL are required');
      return;
    }
    
    setTesting(true);
    setTestType('updateImage');
    setTestResults(null);
    
    try {
      const results = await updateMeetupImage(meetupId, url, path);
      setTestResults(results);
    } catch (error) {
      setTestResults({
        success: false,
        message: `Error: ${error.message}`,
        error
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
                onChange={(e) => setMeetupId(e.target.value)}
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
              onClick={runPresignedUrlTest}
              disabled={testing || !meetupId}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400 w-full"
            >
              {testing && testType === 'presignedUrl' ? 'Testing...' : 'Test Pre-signed URL'}
            </button>
            
            <button 
              onClick={testGetUploadUrl}
              disabled={testing || !meetupId}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400 w-full"
            >
              {testing && testType === 'getUploadUrl' ? 'Testing...' : 'Test getMeetupImageUploadUrl'}
            </button>
            
            <div className="mt-4">
              <h3 className="font-medium mb-2">Free Meetup Creation Test</h3>
              <button 
                onClick={testCreateFreeMeetup}
                disabled={testing}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400 w-full"
              >
                {testing && testType === 'createFreeMeetup' ? 'Creating...' : 'Create Test Free Meetup'}
              </button>
            </div>
            
            {createdMeetup && (
              <div className="mt-3 p-3 bg-purple-50 rounded-md">
                <p className="font-medium">Meetup Created:</p>
                <p className="text-sm">ID: {createdMeetup.id}</p>
                <p className="text-sm">Title: {createdMeetup.title}</p>
                
                {createdMeetup.image_path && (
                  <button
                    onClick={async () => {
                      const refreshedMeetup = await refreshMeetupImageUrl(createdMeetup, isPublic);
                      setCreatedMeetup(refreshedMeetup);
                      setImageUrl(refreshedMeetup.image_url);
                      alert('Image URL refreshed!');
                    }}
                    className="mt-2 px-2 py-1 bg-green-500 text-white rounded-md text-xs"
                  >
                    Refresh Image URL
                  </button>
                )}
              </div>
            )}
            
            <div className="mt-4">
              <h3 className="font-medium mb-2">Update Meetup Image</h3>
              <div className="flex space-x-2 items-center">
                <input 
                  type="text" 
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Image URL"
                  className="border rounded-md px-3 py-2 flex-1"
                />
              </div>
              
              <button 
                onClick={testUpdateMeetupImage}
                disabled={testing || !meetupId || !imageUrl}
                className="mt-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400 w-full"
              >
                {testing && testType === 'updateImage' ? 'Updating...' : 'Update Meetup Image'}
              </button>
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Image Uploader Component Test</h2>
            
            {meetupId ? (
              <MeetupImageUploader
                meetupId={meetupId}
                isPublicMeetup={isPublic}
                onImageUploaded={handleImageUploaded}
              />
            ) : (
              <p className="text-gray-500">Enter a meetup ID to test the uploader component</p>
            )}
          </div>
          
          {testResults && (
            <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
              testResults.success ? 'border-green-500' : 'border-red-500'
            }`}>
              <h3 className="font-semibold mb-2">Test Results</h3>
              <p className={testResults.success ? 'text-green-600' : 'text-red-600'}>
                {testResults.message}
              </p>
              
              <div className="mt-4 bg-gray-50 rounded-md p-3 overflow-auto max-h-60">
                <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(testResults, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MeetupImageTestPage; 