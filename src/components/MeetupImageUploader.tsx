import PropTypes from 'prop-types';
import React, { useState, useEffect, useRef } from 'react';
import { FaImage, FaUpload, FaTimes, FaCheck } from 'react-icons/fa';

import { handleError, createStorageError, ErrorTypes } from '@/utils/error-handler';

import { getUploadPresignedUrl, getSignedViewUrl, wasabiConfig } from '../utils/wasabi-storage';

interface MeetupImageUploaderProps {
  onImageUploaded: (path: string, signedUrl: string) => void;
  meetupId?: string;
  className?: string;
  isAnonymous?: boolean;
}

interface ErrorResult {
  success: false;
  error: string;
  category: string;
}

interface UploadUrlResult {
  success: boolean;
  uploadUrl: string | null;
  path: string | null;
  error: string | null;
}

/**
 * Component for uploading images to meetup cards using pre-signed URLs
 *
 * @param {Object} props
 * @param {Function} props.onImageUploaded - Callback when image is uploaded successfully
 * @param {string} props.meetupId - Meetup ID (for filename generation)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.isAnonymous - Whether this is for an anonymous/public meetup
 */
const MeetupImageUploader: React.FC<MeetupImageUploaderProps> = ({
  onImageUploaded,
  meetupId,
  className = '',
  isAnonymous = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<'success' | 'error' | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [signedViewUrl, setSignedViewUrl] = useState<string | null>(null);
  const [fallbackImageUrl, setFallbackImageUrl] = useState<string | null>(null);

  // Add error categories
  const ERROR_CATEGORIES = {
    UPLOAD: 'upload',
    URL_GENERATION: 'url_generation',
    VALIDATION: 'validation',
    NETWORK: 'network',
    UNKNOWN: 'unknown',
  };

  // Add error recovery strategies
  const ERROR_RECOVERY_STRATEGIES = {
    [ERROR_CATEGORIES.UPLOAD]: async (error: Error, retryCount = 0): Promise<boolean> => {
      if (retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return true;
      }
      return false;
    },
    [ERROR_CATEGORIES.URL_GENERATION]: async (error: Error, retryCount = 0): Promise<boolean> => {
      if (retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return true;
      }
      return false;
    },
    [ERROR_CATEGORIES.NETWORK]: async (error: Error, retryCount = 0): Promise<boolean> => {
      if (retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        return true;
      }
      return false;
    },
    [ERROR_CATEGORIES.VALIDATION]: async (error: Error): Promise<boolean> => {
      return false;
    },
    [ERROR_CATEGORIES.UNKNOWN]: async (error: Error): Promise<boolean> => {
      return false;
    },
  };

  const categorizeError = (error: Error): string => {
    if (error.message.includes('upload')) return ERROR_CATEGORIES.UPLOAD;
    if (error.message.includes('url')) return ERROR_CATEGORIES.URL_GENERATION;
    if (error.message.includes('network')) return ERROR_CATEGORIES.NETWORK;
    if (error.message.includes('validation')) return ERROR_CATEGORIES.VALIDATION;
    return ERROR_CATEGORIES.UNKNOWN;
  };

  const handleError = async (error: Error, operation: string): Promise<ErrorResult | null> => {
    const category = categorizeError(error);
    const retryCount = (error as any).retryCount || 0;

    console.error(`Error during ${operation}:`, {
      category,
      error: error.message,
      retryCount,
      timestamp: new Date().toISOString(),
    });

    if (ERROR_RECOVERY_STRATEGIES[category]) {
      const shouldRetry = await ERROR_RECOVERY_STRATEGIES[category](error, retryCount);
      if (shouldRetry) {
        (error as any).retryCount = retryCount + 1;
        return null;
      }
    }

    return {
      success: false,
      error: error.message || `Failed to ${operation}`,
      category,
    };
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset states
    setError(null);
    setUploadStatus(null);
    setUploadProgress(0);
    setUploadedImageUrl(null);
    setSignedViewUrl(null);

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, WEBP)');
      return;
    }

    // Max 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image is too large. Maximum size is 5MB.');
      return;
    }

    // Set the selected file and generate preview
    setSelectedFile(file);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
  };

  // Generate a signed URL when we have an uploaded image URL
  useEffect(() => {
    const generateSignedUrl = async () => {
      if (uploadedImageUrl) {
        try {
          // The uploadedImageUrl is now just the path
          const signedUrl = await getSignedViewUrl(uploadedImageUrl, 86400, isAnonymous);
          console.log('Generated signed view URL for uploaded image');
          setSignedViewUrl(signedUrl);
        } catch (err) {
          console.error('Error generating signed URL for viewing:', err);
          setError('Failed to generate image URL. Please try again.');
          setSignedViewUrl(null);
        }
      }
    };

    generateSignedUrl();
  }, [uploadedImageUrl, isAnonymous]);

  // Handle image upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);
      setError(null);

      // Generate a unique path for the image - simpler path format
      const timestamp = Date.now();
      const extension = selectedFile.name.split('.').pop().toLowerCase();

      // Use a simple, predetermined path format
      // meetups/meetup_[timestamp].[extension]
      const filename = `meetup_${timestamp}.${extension}`;
      const filePath = `meetups/${filename}`;

      console.log('Starting upload process with simplified path:', {
        filePath,
        contentType: selectedFile.type,
        fileSize: selectedFile.size,
        isAnonymous,
      });

      // Get pre-signed URL for upload with retry logic
      let uploadUrlResult: UploadUrlResult;
      let retryCount = 0;
      while (retryCount < 3) {
        try {
          uploadUrlResult = await getUploadPresignedUrl(
            filePath,
            selectedFile.type,
            300,
            isAnonymous
          );
          if (uploadUrlResult.success && uploadUrlResult.uploadUrl) {
            break;
          }
        } catch (error) {
          const handledError = await handleError(error as Error, 'generate upload URL');
          if (!handledError) break;
          retryCount++;
        }
      }

      if (!uploadUrlResult?.success || !uploadUrlResult.uploadUrl) {
        throw new Error('Failed to generate upload URL after multiple attempts');
      }

      console.log('Got presigned URL, starting upload');
      setUploadProgress(30);

      // Upload the file with retry logic
      let uploadSuccess = false;
      retryCount = 0;
      while (!uploadSuccess && retryCount < 3) {
        try {
          const uploadResponse = await fetch(uploadUrlResult.uploadUrl, {
            method: 'PUT',
            body: selectedFile,
            headers: {
              'Content-Type': selectedFile.type,
            },
          });

          if (uploadResponse.ok) {
            uploadSuccess = true;
          } else {
            throw new Error(`Upload failed: ${uploadResponse.statusText}`);
          }
        } catch (error) {
          const handledError = await handleError(error as Error, 'upload file');
          if (!handledError) break;
          retryCount++;
        }
      }

      if (!uploadSuccess) {
        throw new Error('Failed to upload file after multiple attempts');
      }

      console.log('Upload successful, generating view URL');
      setUploadProgress(70);

      // Get the signed view URL with retry logic
      let signedUrl;
      retryCount = 0;
      while (!signedUrl && retryCount < 3) {
        try {
          signedUrl = await getSignedViewUrl(uploadUrlResult.path, 86400, isAnonymous);
        } catch (error) {
          const handledError = await handleError(error as Error, 'generate view URL');
          if (!handledError) break;
          retryCount++;
        }
      }

      if (!signedUrl) {
        throw new Error('Failed to generate view URL after multiple attempts');
      }

      console.log('Generated view URL successfully');
      setUploadProgress(90);

      // Update states
      setUploadedImageUrl(uploadUrlResult.path);
      setSignedViewUrl(signedUrl);
      setUploadStatus('success');
      setUploadProgress(100);

      // Call the callback with the file path
      if (onImageUploaded) {
        onImageUploaded(uploadUrlResult.path, signedUrl);
      }
    } catch (error) {
      await handleError(error as Error, 'complete upload process');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle cancellation
  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setUploadStatus(null);
    setUploadProgress(0);
    setError(null);
    setUploadedImageUrl(null);
    setSignedViewUrl(null);
  };

  // Add function to handle image load errors
  const handleImageError = async (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    try {
      if (!uploadedImageUrl) return;

      console.error('Failed to load signed URL image');

      // Try to regenerate a new signed URL
      try {
        console.log('Regenerating signed URL for', uploadedImageUrl);
        const newSignedUrl = await getSignedViewUrl(uploadedImageUrl, 86400, isAnonymous);
        if (newSignedUrl) {
          console.log('Regenerated signed URL:', newSignedUrl);
          (e.target as HTMLImageElement).src = newSignedUrl;
          setSignedViewUrl(newSignedUrl);
          return;
        }
      } catch (err) {
        console.error('Error regenerating signed URL:', err);
      }

      // If URL regeneration fails, fall back to placeholder image
      console.log('Falling back to placeholder image');
      (e.target as HTMLImageElement).src = '/images/placeholder.png';
      (e.target as HTMLImageElement).style.opacity = '0.7';
      setFallbackImageUrl('/images/placeholder.png');
    } catch (error) {
      const result = await handleError(error as Error, ErrorTypes.STORAGE);

      // Final fallback to placeholder image
      (e.target as HTMLImageElement).src = '/images/placeholder.png';
      (e.target as HTMLImageElement).style.opacity = '0.7';
      setFallbackImageUrl('/images/placeholder.png');
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        const error = new Error('Image size must be less than 5MB');
        (error as any).type = ErrorTypes.VALIDATION;
        throw error;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        const error = new Error('File must be an image');
        (error as any).type = ErrorTypes.VALIDATION;
        throw error;
      }

      setUploading(true);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Generate file path
      const timestamp = Date.now();
      const extension = file.name.split('.').pop()?.toLowerCase() || 'file';
      const path = `meetups/meetup_${timestamp}.${extension}`;

      // Get pre-signed URL for upload
      // Order of params: path, contentType, expiresIn, usePublicCredentials
      const uploadUrlResult = await getUploadPresignedUrl(
        path, // Path to store the file
        file.type, // Content type
        7200, // Expires in 2 hours
        isAnonymous // Use public credentials for anonymous meetups
      );

      if (!uploadUrlResult.success || !uploadUrlResult.uploadUrl) {
        throw new Error(uploadUrlResult.error?.toString() || 'Failed to generate upload URL');
      }

      // Upload the file
      const uploadResponse = await fetch(uploadUrlResult.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      // Get signed view URL
      const signedUrl = await getSignedViewUrl(uploadUrlResult.path || '', 86400, isAnonymous);

      if (!signedUrl) {
        throw new Error('Failed to generate view URL');
      }

      setUploadedImageUrl(uploadUrlResult.path || '');
      setSignedViewUrl(signedUrl);
      onImageUploaded(uploadUrlResult.path || '', signedUrl);
    } catch (error) {
      console.error('Error in handleImageChange:', error);
      const result = await handleError(error as Error, (error as any).type || ErrorTypes.UPLOAD);

      if (result) {
        setError(result.message);
        setPreview(null);
        setUploadedImageUrl(null);
        setSignedViewUrl(null);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`meetup-image-uploader ${className}`}>
      {/* Image Preview */}
      {preview && !signedViewUrl && (
        <div className="preview-container relative mb-3">
          <img src={preview} alt="Preview" className="w-full h-32 object-cover rounded-md" />
          <button
            onClick={handleCancel}
            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
            title="Remove image"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Uploaded Image Preview with Signed URL */}
      {signedViewUrl && (
        <div className="preview-container relative mb-3">
          <img
            src={signedViewUrl}
            alt="Uploaded"
            className="w-full h-32 object-cover rounded-md"
            onError={handleImageError}
          />
          <button
            onClick={handleCancel}
            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
            title="Remove image"
          >
            <FaTimes />
          </button>

          {/* Debug: Test direct signed URL */}
          <button
            onClick={async () => {
              try {
                console.log('Testing direct signed URL generation for:', uploadedImageUrl);
                const newSignedUrl = await getSignedViewUrl(uploadedImageUrl, 3600, true); // Force using public credentials
                console.log('Generated direct signed URL:', newSignedUrl);

                if (newSignedUrl) {
                  // Try to fetch with this URL
                  const testImg = new Image();
                  testImg.onload = () => console.log('Test image loaded successfully');
                  testImg.onerror = e => console.error('Test image failed to load:', e);
                  testImg.src = newSignedUrl;

                  window.open(newSignedUrl, '_blank');
                }
              } catch (err) {
                console.error('Error in direct signed URL test:', err);
              }
            }}
            className="absolute top-1 left-1 p-1 bg-gray-200 text-gray-700 rounded text-xs z-10"
            title="Test signed URL generation"
          >
            Test URL
          </button>
        </div>
      )}

      {/* File Input */}
      {!preview && !signedViewUrl && (
        <div className="file-input-container">
          <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-500 cursor-pointer bg-gray-50 transition-colors">
            <FaImage className="text-gray-500" />
            <span className="text-gray-700">Select Image</span>
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && !uploadStatus && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="mt-2 flex items-center justify-center gap-2 w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
        >
          {uploading ? (
            <>
              <div className="spinner mr-2"></div>
              <span>{Math.round(uploadProgress)}%</span>
            </>
          ) : (
            <>
              <FaUpload />
              <span>Upload Image</span>
            </>
          )}
        </button>
      )}

      {/* Upload Status */}
      {uploadStatus === 'success' && (
        <div className="mt-2 flex items-center text-green-600">
          <FaCheck className="mr-2" />
          <span>Upload successful!</span>
        </div>
      )}

      {/* Error Message */}
      {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}

      {/* Upload Progress Bar */}
      {uploading && (
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}

      {/* Updated image preview section */}
      {uploadedImageUrl && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Preview</h3>
          <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
            {fallbackImageUrl ? (
              <img
                src={fallbackImageUrl}
                alt="Meetup placeholder"
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={signedViewUrl || uploadedImageUrl}
                alt="Meetup preview"
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

MeetupImageUploader.propTypes = {
  onImageUploaded: PropTypes.func.isRequired,
  meetupId: PropTypes.string,
  className: PropTypes.string,
  isAnonymous: PropTypes.bool,
};

export default MeetupImageUploader;

// Add some global CSS for the spinner
const style = document.createElement('style');
style.textContent = `
  .spinner {
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top: 2px solid white;
    width: 16px;
    height: 16px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
