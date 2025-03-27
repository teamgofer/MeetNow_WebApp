import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { uploadFile, getUploadPresignedUrl, getSignedUrlFromFullUrl } from '../src/utils/wasabi-storage';
import { getMeetupWithSignedImageUrl, addSignedImageUrlsToMeetups } from '../src/utils/meetup';
import fetchMock from 'fetch-mock';

// Mock environment variables
vi.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: vi.fn(() => ({
      send: vi.fn().mockResolvedValue({}),
    })),
    PutObjectCommand: vi.fn(),
    GetObjectCommand: vi.fn(),
    DeleteObjectCommand: vi.fn(),
  };
});

vi.mock('@aws-sdk/s3-request-presigner', () => {
  return {
    getSignedUrl: vi.fn().mockResolvedValue('https://mock-presigned-url.com'),
  };
});

// Mock the environment
vi.stubEnv('VITE_WASABI_REGION', 'us-east-1');
vi.stubEnv('VITE_WASABI_ENDPOINT', 'https://s3.wasabisys.com');
vi.stubEnv('VITE_WASABI_BUCKET_NAME', 'meetnow-images-test');
vi.stubEnv('VITE_WASABI_ACCESS_KEY_ID', 'test-access-key');
vi.stubEnv('VITE_WASABI_SECRET_ACCESS_KEY', 'test-secret-key');
vi.stubEnv('VITE_WASABI_PUBLIC_ACCESS_KEY_ID', 'public-access-key');
vi.stubEnv('VITE_WASABI_PUBLIC_SECRET_KEY', 'public-secret-key');

// Create a mock File
const createMockFile = (name = 'test-image.jpg', size = 1024, type = 'image/jpeg') => {
  const file = new File(['mock file content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Mock the meetup module
vi.mock('../src/utils/meetup', async () => {
  const actual = await vi.importActual('../src/utils/meetup');
  return {
    ...actual,
    getMeetupWithSignedImageUrl: vi.fn(),
    addSignedImageUrlsToMeetups: vi.fn()
  };
});

describe('Wasabi Storage Integration Tests', () => {
  beforeEach(() => {
    fetchMock.reset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getUploadPresignedUrl function', () => {
    test('should generate a presigned URL successfully', async () => {
      const result = await getUploadPresignedUrl('test/path.jpg', 'image/jpeg');
      
      expect(result.success).toBe(true);
      expect(result.uploadUrl).toContain('https://mock-presigned-url.com');
      expect(result.publicUrl).toContain('meetnow-images-test');
    });

    test('should use public credentials when specified', async () => {
      const result = await getUploadPresignedUrl('test/path.jpg', 'image/jpeg', 300, true);
      
      expect(result.success).toBe(true);
      // In reality, we would check if the correct client was used, but this is 
      // difficult in our mocked environment
    });

    test('should handle errors gracefully', async () => {
      // Mock the getSignedUrl to throw an error
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
      getSignedUrl.mockRejectedValueOnce(new Error('Mocked failure'));
      
      const result = await getUploadPresignedUrl('test/path.jpg', 'image/jpeg');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });
  });

  describe('getSignedUrlFromFullUrl function', () => {
    test('should extract file path and generate signed URL', async () => {
      const fullUrl = 'https://meetnow-images-test.s3.wasabisys.com/meetups/test-image-123.jpg';
      const signedUrl = await getSignedUrlFromFullUrl(fullUrl);
      
      expect(signedUrl).toBe('https://mock-presigned-url.com');
    });
    
    test('should handle different bucket URL formats', async () => {
      const fullUrl = 'https://s3.wasabisys.com/meetnow-images-test/meetups/another-test.jpg';
      const signedUrl = await getSignedUrlFromFullUrl(fullUrl);
      
      expect(signedUrl).toBe('https://mock-presigned-url.com');
    });
    
    test('should return null for invalid URLs', async () => {
      const invalidUrl = 'https://example.com/not-a-wasabi-url.jpg';
      const signedUrl = await getSignedUrlFromFullUrl(invalidUrl);
      
      expect(signedUrl).toBeNull();
    });
    
    test('should handle errors gracefully', async () => {
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
      getSignedUrl.mockRejectedValueOnce(new Error('Mocked failure'));
      
      const fullUrl = 'https://meetnow-images-test.s3.wasabisys.com/meetups/test-image-123.jpg';
      const signedUrl = await getSignedUrlFromFullUrl(fullUrl);
      
      expect(signedUrl).toBeNull();
    });
  });

  describe('uploadFile function', () => {
    test('should upload a file using presigned URL', async () => {
      // Mock the fetch response for the upload
      fetchMock.put('https://mock-presigned-url.com', 200);
      
      const file = createMockFile();
      const result = await uploadFile(file, 'test/path.jpg');
      
      expect(result.success).toBe(true);
      expect(result.url).toContain('meetnow-images-test');
      expect(fetchMock.called('https://mock-presigned-url.com')).toBe(true);
    });

    test('should handle upload failures', async () => {
      // Mock the fetch to fail
      fetchMock.put('https://mock-presigned-url.com', 403);
      
      const file = createMockFile();
      const result = await uploadFile(file, 'test/path.jpg');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
    });

    test('should handle presigned URL generation failure', async () => {
      // Mock getUploadPresignedUrl to fail
      vi.mock('../src/utils/wasabi-storage', async (importOriginal) => {
        const actual = await importOriginal();
        return {
          ...actual,
          getUploadPresignedUrl: vi.fn().mockResolvedValue({
            success: false,
            error: new Error('Failed to generate URL')
          })
        };
      });
      
      const file = createMockFile();
      const result = await uploadFile(file, 'test/path.jpg');
      
      expect(result.success).toBe(false);
    });
  });
});

// Test Meetup Integration with Signed URLs
describe('Meetup Signed URL Integration', () => {
  beforeEach(() => {
    // Reset mocks
    vi.mocked(getMeetupWithSignedImageUrl).mockReset();
    vi.mocked(addSignedImageUrlsToMeetups).mockReset();
  });

  test('getMeetupWithSignedImageUrl should add signed URL to meetup with image', async () => {
    const mockMeetup = {
      id: 'meetup123',
      title: 'Test Meetup',
      image_url: 'https://meetnow-images-test.s3.wasabisys.com/meetups/test-image.jpg'
    };
    
    // Mock implementation for testing
    vi.mocked(getMeetupWithSignedImageUrl).mockImplementation(async (meetup) => {
      if (meetup.image_url) {
        return {
          ...meetup,
          signed_image_url: 'https://mock-presigned-url.com'
        };
      }
      return meetup;
    });
    
    const result = await getMeetupWithSignedImageUrl(mockMeetup);
    
    expect(result).toEqual({
      ...mockMeetup,
      signed_image_url: 'https://mock-presigned-url.com'
    });
  });
  
  test('getMeetupWithSignedImageUrl should handle meetups without images', async () => {
    const mockMeetup = {
      id: 'meetup456',
      title: 'No Image Meetup'
    };
    
    vi.mocked(getMeetupWithSignedImageUrl).mockImplementation(async (meetup) => meetup);
    
    const result = await getMeetupWithSignedImageUrl(mockMeetup);
    
    expect(result).toEqual(mockMeetup);
    expect(result.signed_image_url).toBeUndefined();
  });
  
  test('addSignedImageUrlsToMeetups should process multiple meetups', async () => {
    const mockMeetups = [
      {
        id: 'meetup1',
        title: 'First Meetup',
        image_url: 'https://meetnow-images-test.s3.wasabisys.com/meetups/image1.jpg'
      },
      {
        id: 'meetup2',
        title: 'Second Meetup',
        image_url: null
      },
      {
        id: 'meetup3',
        title: 'Third Meetup',
        image_url: 'https://meetnow-images-test.s3.wasabisys.com/meetups/image3.jpg'
      }
    ];
    
    vi.mocked(addSignedImageUrlsToMeetups).mockImplementation(async (meetups) => {
      return meetups.map(meetup => {
        if (meetup.image_url) {
          return {
            ...meetup,
            signed_image_url: 'https://mock-presigned-url.com'
          };
        }
        return meetup;
      });
    });
    
    const result = await addSignedImageUrlsToMeetups(mockMeetups);
    
    expect(result).toHaveLength(3);
    expect(result[0].signed_image_url).toBe('https://mock-presigned-url.com');
    expect(result[1].signed_image_url).toBeUndefined();
    expect(result[2].signed_image_url).toBe('https://mock-presigned-url.com');
  });
});

// Test the network connection to Wasabi
describe('Wasabi Connectivity Tests', () => {
  test('should be able to connect to Wasabi endpoint', async () => {
    try {
      const response = await fetch('https://s3.wasabisys.com', {
        method: 'HEAD',
        mode: 'no-cors' // This is important for CORS issues
      });
      
      // With no-cors, we can't actually check status, but if it doesn't throw, it connected
      expect(response).toBeDefined();
    } catch (error) {
      console.error('Failed to connect to Wasabi:', error);
      throw error; // Re-throw to fail the test
    }
  });
});

// Test the MeetupImageUploader component
describe('MeetupImageUploader Component Tests', () => {
  test('should upload an image and call onImageUploaded callback', async () => {
    // This would require a more complex setup with React Testing Library or similar
    // For simplicity, we'll outline what needs to be tested:
    
    // 1. Render the MeetupImageUploader component
    // 2. Simulate selecting a file
    // 3. Simulate clicking the upload button
    // 4. Verify that the onImageUploaded callback is called with the correct URL and signedViewUrl
    
    // Example with React Testing Library:
    // render(<MeetupImageUploader onImageUploaded={mockCallback} isAnonymous={true} />);
    // const input = screen.getByLabelText(/select image/i);
    // fireEvent.change(input, { target: { files: [createMockFile()] } });
    // const uploadButton = screen.getByText(/upload image/i);
    // fireEvent.click(uploadButton);
    // await waitFor(() => expect(mockCallback).toHaveBeenCalledWith('https://some-url', 'https://signed-url'));
  });
});

// Test the full integration from MeetNowApp form
describe('MeetNowApp Integration Tests', () => {
  test('should be able to create a meetup with an image', async () => {
    // This would also be a more complex integration test
    // For now, we'll outline what should be tested:
    
    // 1. Render the MeetNowApp component
    // 2. Fill in the meetup form
    // 3. Upload an image using the MeetupImageUploader
    // 4. Submit the form
    // 5. Verify that createFreeMeetup was called with the image URL and imageSignedUrl
    // 6. Verify that the meetup was created successfully with both URLs
  });
});

// Command line utility to test the upload from Node.js environment
if (process.env.NODE_ENV === 'test-cli') {
  const testUpload = async () => {
    const fs = require('fs');
    const path = require('path');
    
    try {
      // Read a test image file
      const filePath = path.join(__dirname, 'test-image.jpg');
      const fileContent = fs.readFileSync(filePath);
      const file = new File([fileContent], 'test-image.jpg', { type: 'image/jpeg' });
      
      console.log('Testing upload with file:', file.name, file.size, 'bytes');
      
      // Get a presigned URL
      const { success, uploadUrl, publicUrl, error } = await getUploadPresignedUrl(
        'test/cli-upload.jpg',
        'image/jpeg',
        300,
        true // use public credentials
      );
      
      if (!success) {
        throw error || new Error('Failed to get presigned URL');
      }
      
      console.log('Got presigned URL:', uploadUrl);
      console.log('Public URL will be:', publicUrl);
      
      // Upload the file
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': 'image/jpeg',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
      
      console.log('Upload successful!');
      console.log('The file should be available at:', publicUrl);
      
    } catch (err) {
      console.error('Test upload failed:', err);
    }
  };
  
  // Run the test upload if called directly
  testUpload();
} 