import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { checkEnvironment } from './env-check';

// Check environment variables
checkEnvironment();

// Wasabi configuration
export const wasabiConfig = {
  region: import.meta.env.VITE_WASABI_REGION || process.env.VITE_WASABI_REGION || 'us-east-1',
  endpoint: import.meta.env.VITE_WASABI_ENDPOINT || process.env.VITE_WASABI_ENDPOINT,
  bucketName: import.meta.env.VITE_WASABI_BUCKET_NAME || process.env.VITE_WASABI_BUCKET_NAME || 'meetup-photos-west-coast',
  accessKeyId: import.meta.env.VITE_WASABI_ACCESS_KEY_ID || process.env.VITE_WASABI_ACCESS_KEY_ID,
  secretAccessKey: import.meta.env.VITE_WASABI_SECRET_ACCESS_KEY || process.env.VITE_WASABI_SECRET_ACCESS_KEY,
  
  // Public meetups configuration (separate key)
  publicMeetupsAccessKeyId: import.meta.env.VITE_WASABI_PUBLIC_ACCESS_KEY_ID || import.meta.env.VITE_WASABI_ACCESS_KEY_ID,
  publicMeetupsSecretKey: import.meta.env.VITE_WASABI_PUBLIC_SECRET_KEY || import.meta.env.VITE_WASABI_SECRET_ACCESS_KEY,
};

// Validate required configuration
const validateConfig = () => {
  const missingVars = [];
  
  // Check required variables
  if (!wasabiConfig.endpoint) missingVars.push('VITE_WASABI_ENDPOINT');
  if (!wasabiConfig.bucketName) missingVars.push('VITE_WASABI_BUCKET_NAME');
  if (!wasabiConfig.accessKeyId) missingVars.push('VITE_WASABI_ACCESS_KEY_ID');
  if (!wasabiConfig.secretAccessKey) missingVars.push('VITE_WASABI_SECRET_ACCESS_KEY');
  
  if (missingVars.length > 0) {
    const error = new Error(`Missing required Wasabi configuration: ${missingVars.join(', ')}`);
    console.error('Wasabi configuration error:', error);
    throw error;
  }
  
  // Log configuration state (with sensitive data redacted)
  console.log('Wasabi Configuration:', {
    region: wasabiConfig.region,
    endpoint: wasabiConfig.endpoint,
    bucketName: wasabiConfig.bucketName,
    hasAccessKey: !!wasabiConfig.accessKeyId,
    hasSecretKey: !!wasabiConfig.secretAccessKey,
    hasPublicAccessKey: !!wasabiConfig.publicMeetupsAccessKeyId,
    hasPublicSecretKey: !!wasabiConfig.publicMeetupsSecretKey
  });
  
  return true;
};

// Create S3 client for Wasabi
const createWasabiClient = (usePublicCredentials = false) => {
  try {
    if (!validateConfig()) {
      throw new Error('Wasabi configuration is invalid or incomplete');
    }
    
    const credentials = {
      accessKeyId: usePublicCredentials ? 
        (wasabiConfig.publicMeetupsAccessKeyId || wasabiConfig.accessKeyId) : 
        wasabiConfig.accessKeyId,
      secretAccessKey: usePublicCredentials ? 
        (wasabiConfig.publicMeetupsSecretKey || wasabiConfig.secretAccessKey) : 
        wasabiConfig.secretAccessKey,
    };

    // Log client creation (with sensitive data redacted)
    console.log('Creating Wasabi client:', {
      region: wasabiConfig.region,
      endpoint: wasabiConfig.endpoint,
      usePublicCredentials,
      hasCredentials: !!credentials.accessKeyId && !!credentials.secretAccessKey
    });
    
    return new S3Client({
      region: wasabiConfig.region,
      endpoint: wasabiConfig.endpoint,
      credentials,
      forcePathStyle: true, // Required for Wasabi
    });
  } catch (error) {
    console.error('Failed to create Wasabi client:', error);
    throw error;
  }
};

// Initialize clients
const wasabiClient = createWasabiClient();
const publicWasabiClient = createWasabiClient(true);

// Add retry logic with exponential backoff
async function withRetry(operation, maxAttempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Operation failed (attempt ${attempt}/${maxAttempts}):`, error);
      if (attempt < maxAttempts) {
        // Exponential backoff with jitter
        const delay = Math.min(1000 * Math.pow(2, attempt - 1) + Math.random() * 1000, 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

// Add configuration verification function
const verifyWasabiConfig = () => {
  const config = {
    region: wasabiConfig.region,
    endpoint: wasabiConfig.endpoint,
    bucketName: wasabiConfig.bucketName,
    hasAccessKey: !!wasabiConfig.accessKeyId,
    hasSecretKey: !!wasabiConfig.secretAccessKey,
    hasPublicAccessKey: !!wasabiConfig.publicMeetupsAccessKeyId,
    hasPublicSecretKey: !!wasabiConfig.publicMeetupsSecretKey
  };
  
  console.log('Wasabi Configuration:', {
    ...config,
    accessKeyId: config.hasAccessKey ? '[REDACTED]' : 'missing',
    secretAccessKey: config.hasSecretKey ? '[REDACTED]' : 'missing',
    publicMeetupsAccessKeyId: config.hasPublicAccessKey ? '[REDACTED]' : 'missing',
    publicMeetupsSecretKey: config.hasPublicSecretKey ? '[REDACTED]' : 'missing'
  });
  
  return config;
};

// Add error categories
const ERROR_CATEGORIES = {
  CONFIGURATION: 'configuration',
  CREDENTIALS: 'credentials',
  NETWORK: 'network',
  VALIDATION: 'validation',
  PERMISSION: 'permission',
  UNKNOWN: 'unknown'
};

// Add error recovery strategies
const ERROR_RECOVERY_STRATEGIES = {
  [ERROR_CATEGORIES.CONFIGURATION]: async (error) => {
    // Configuration errors can't be recovered from
    return false;
  },
  [ERROR_CATEGORIES.CREDENTIALS]: async (error) => {
    // Credential errors can't be recovered from
    return false;
  },
  [ERROR_CATEGORIES.NETWORK]: async (error, retryCount = 0) => {
    if (retryCount < 3) {
      // Wait with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      return true;
    }
    return false;
  },
  [ERROR_CATEGORIES.PERMISSION]: async (error) => {
    // Permission errors can't be recovered from
    return false;
  },
  [ERROR_CATEGORIES.VALIDATION]: async (error) => {
    // Validation errors can't be recovered from
    return false;
  }
};

// Add error categorization function
const categorizeError = (error) => {
  if (error.message?.includes('configuration') || error.message?.includes('config')) {
    return ERROR_CATEGORIES.CONFIGURATION;
  }
  if (error.message?.includes('credentials') || error.message?.includes('auth')) {
    return ERROR_CATEGORIES.CREDENTIALS;
  }
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return ERROR_CATEGORIES.NETWORK;
  }
  if (error.message?.includes('permission') || error.message?.includes('access')) {
    return ERROR_CATEGORIES.PERMISSION;
  }
  if (error.message?.includes('validation') || error.message?.includes('invalid')) {
    return ERROR_CATEGORIES.VALIDATION;
  }
  return ERROR_CATEGORIES.UNKNOWN;
};

// Add error handling function
const handleError = async (error, operation) => {
  const category = categorizeError(error);
  const retryCount = error.retryCount || 0;
  
  console.error(`Error during ${operation}:`, {
    category,
    error: error.message,
    retryCount,
    timestamp: new Date().toISOString()
  });

  // Try to recover if we have a strategy
  if (ERROR_RECOVERY_STRATEGIES[category]) {
    const shouldRetry = await ERROR_RECOVERY_STRATEGIES[category](error, retryCount);
    if (shouldRetry) {
      error.retryCount = retryCount + 1;
      return error; // Return error to trigger retry
    }
  }

  // If we can't recover, return appropriate error response
  return {
    success: false,
    error: error.message || `Failed to ${operation}`,
    category
  };
};

/**
 * Generate a pre-signed URL for file upload
 * This allows client-side uploads without making the bucket public
 * 
 * @param {string} path - The destination path/key in the bucket
 * @param {string} contentType - The MIME type of the file to be uploaded
 * @param {number} expiresIn - Expiration time in seconds (default: 300 - 5 minutes)
 * @param {boolean} usePublicCredentials - Whether to use the public meetups credentials
 * @returns {Promise<{success: boolean, uploadUrl: string|null, path: string|null, publicUrl: string|null, error: Error|null}>}
 */
export const getUploadPresignedUrl = async (path, contentType, expiresIn = 300, usePublicCredentials = false) => {
  const client = usePublicCredentials ? publicWasabiClient : wasabiClient;
  
  if (!client) {
    return { 
      success: false, 
      uploadUrl: null, 
      path: null, 
      publicUrl: null,
      error: new Error('Wasabi client not initialized'),
      category: ERROR_CATEGORIES.CONFIGURATION
    };
  }
  
  try {
    // Generate a unique path if not provided
    if (!path) {
      const timestamp = Date.now();
      const extension = contentType.split('/')[1] || 'file';
      path = `meetups/meetup_${timestamp}.${extension}`;
    }
    
    console.log('Generating presigned URL with params:', {
      bucket: wasabiConfig.bucketName,
      path,
      contentType,
      expiresIn,
      usePublicCredentials
    });
    
    // Prepare the command for generating a signed URL
    const command = new PutObjectCommand({
      Bucket: wasabiConfig.bucketName,
      Key: path,
      ContentType: contentType,
      ACL: 'public-read' // Allow public read access
    });
    
    // Generate the pre-signed URL with retry logic
    let uploadUrl;
    let retryCount = 0;
    while (retryCount < 3) {
      try {
        uploadUrl = await getSignedUrl(client, command, { expiresIn });
        if (uploadUrl) break;
      } catch (error) {
        const handledError = await handleError(error, 'generate signed URL');
        if (!handledError) break;
        retryCount++;
      }
    }
    
    if (!uploadUrl) {
      throw new Error('Failed to generate signed URL after multiple attempts');
    }
    
    console.log('Successfully generated presigned URL');
    
    // For debugging, generate a public URL that would be used if the object was public
    const publicUrl = `https://${wasabiConfig.bucketName}.${wasabiConfig.endpoint.replace('https://', '')}/${path}`;
    
    return { 
      success: true, 
      uploadUrl, 
      path, 
      publicUrl,
      error: null 
    };
  } catch (error) {
    const handledError = await handleError(error, 'generate upload URL');
    return {
      success: false,
      uploadUrl: null,
      path: null,
      publicUrl: null,
      error: handledError.error,
      category: handledError.category
    };
  }
};

/**
 * Upload a file to Wasabi
 * @param {File} file - The file to upload
 * @param {string} path - The path/key in the bucket (e.g., 'meetups/image1.jpg')
 * @param {boolean} usePreSignedUrl - Whether to use pre-signed URL approach (default: true)
 * @param {boolean} isPublicMeetup - Whether this is for a public meetup (uses public credentials)
 * @returns {Promise<{success: boolean, url: string|null, error: Error|null}>}
 */
export const uploadFile = async (file, path, usePreSignedUrl = true, isPublicMeetup = false) => {
  // If we're using pre-signed URLs, generate one and return it
  if (usePreSignedUrl) {
    try {
      // Generate a unique path if not provided
      if (!path) {
        const timestamp = Date.now();
        const extension = file.name.split('.').pop();
        path = `meetups/meetup_${timestamp}.${extension}`;
      }
      
      // Get a pre-signed URL for this upload
      const { success, uploadUrl, path, error } = await getUploadPresignedUrl(
        path, 
        file.type,
        300, // 5 minutes
        isPublicMeetup
      );
      
      if (!success || !uploadUrl) {
        return { success: false, url: null, error: error || new Error('Failed to generate upload URL') };
      }
      
      // Perform the upload using fetch with the pre-signed URL
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
      
      return { success: true, url: null, error: null };
    } catch (error) {
      console.error('Error uploading via pre-signed URL:', error);
      return { success: false, url: null, error };
    }
  }
  
  // Original direct upload implementation (when not using pre-signed URLs)
  const client = isPublicMeetup ? publicWasabiClient : wasabiClient;
  
  if (!client) {
    return { success: false, url: null, error: new Error('Wasabi client not initialized') };
  }
  
  try {
    // Generate a unique filename if path not provided
    if (!path) {
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      path = `meetups/meetup_${timestamp}.${extension}`;
    }
    
    // Prepare upload command
    const command = new PutObjectCommand({
      Bucket: wasabiConfig.bucketName,
      Key: path,
      Body: file,
      ContentType: file.type,
      ACL: 'public-read', // Make the file publicly accessible
    });
    
    // Execute the upload
    await client.send(command);
    
    // Generate the public URL
    const url = `https://${wasabiConfig.bucketName}.${wasabiConfig.endpoint.replace('https://', '')}/${path}`;
    
    return { success: true, url, error: null };
  } catch (error) {
    console.error('Error uploading file to Wasabi:', error);
    return { success: false, url: null, error };
  }
};

/**
 * Generate a signed URL for temporary access to a private file
 * @param {string} path - The path/key in the bucket
 * @param {number} expiresIn - Expiration time in seconds (default: 3600)
 * @returns {Promise<string|null>} - The signed URL or null if error
 */
export const getSignedFileUrl = async (path, expiresIn = 86400) => {
  return withRetry(async () => {
    const client = createWasabiClient();
    if (!client) {
      throw new Error('Failed to create Wasabi client');
    }

    const command = new GetObjectCommand({
      Bucket: wasabiConfig.bucketName,
      Key: path,
    });

    try {
      const signedUrl = await getSignedUrl(client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw error;
    }
  });
};

/**
 * Delete a file from Wasabi
 * @param {string} path - The path/key in the bucket
 * @returns {Promise<boolean>} - Success status
 */
export const deleteFile = async (path) => {
  if (!wasabiClient) {
    console.error('Wasabi client not initialized');
    return false;
  }
  
  try {
    const command = new DeleteObjectCommand({
      Bucket: wasabiConfig.bucketName,
      Key: path,
    });
    
    await wasabiClient.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting file from Wasabi:', error);
    return false;
  }
};

/**
 * Generate a signed URL for viewing/downloading a file in a private bucket
 * @param {string} path - The path/key in the bucket
 * @param {number} expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @param {boolean} usePublicCredentials - Whether to use the public credentials for this operation
 * @returns {Promise<string|null>} - The signed URL or null if error
 */
export const getSignedViewUrl = async (path, expiresIn = 3600, isAnonymous = false) => {
  const client = isAnonymous ? publicWasabiClient : wasabiClient;
  
  if (!client) {
    throw new Error('Wasabi client not initialized');
  }
  
  try {
    // Prepare the command for generating a signed URL
    const command = new GetObjectCommand({
      Bucket: wasabiConfig.bucketName,
      Key: path
    });
    
    // Generate the signed URL with retry logic
    let signedUrl;
    let retryCount = 0;
    while (retryCount < 3) {
      try {
        signedUrl = await getSignedUrl(client, command, { expiresIn });
        if (signedUrl) break;
      } catch (error) {
        const handledError = await handleError(error, 'generate view URL');
        if (!handledError) break;
        retryCount++;
      }
    }
    
    if (!signedUrl) {
      throw new Error('Failed to generate signed URL after multiple attempts');
    }
    
    return signedUrl;
  } catch (error) {
    const handledError = await handleError(error, 'generate view URL');
    console.error('Error generating signed view URL:', handledError);
    return null;
  }
};

/**
 * Extract the path/key from a full Wasabi URL or handle a direct path
 * @param {string} urlOrPath - The complete Wasabi URL or direct path
 * @returns {string|null} - The extracted path or null if invalid
 */
export const extractPathFromWasabiUrl = (urlOrPath) => {
  if (!urlOrPath) return null;
  
  // If it's already a path (doesn't start with http), return it as is
  if (!urlOrPath.startsWith('http')) {
    return urlOrPath;
  }
  
  try {
    // Handle various URL formats
    // Format 1: https://bucket-name.endpoint.com/path
    // Format 2: https://endpoint.com/bucket-name/path
    const url = new URL(urlOrPath);
    
    let path = '';
    
    // Check which format the URL is in
    if (url.hostname.startsWith(wasabiConfig.bucketName + '.')) {
      // Format 1: hostname starts with bucket name
      path = url.pathname;
    } else {
      // Format 2: bucket name is part of the path
      const pathParts = url.pathname.split('/');
      if (pathParts[1] === wasabiConfig.bucketName) {
        // Remove bucket name from path
        pathParts.splice(1, 1);
        path = pathParts.join('/');
      } else {
        path = url.pathname;
      }
    }
    
    // Remove leading slash if present
    return path.startsWith('/') ? path.substring(1) : path;
  } catch (error) {
    console.error('Invalid URL format:', urlOrPath, error);
    return null;
  }
};

/**
 * Get a pre-signed URL for viewing an image, using the full URL or path as input
 * This is a convenience function that combines extractPathFromWasabiUrl and getSignedViewUrl
 * @param {string} urlOrPath - The complete Wasabi URL or direct path
 * @param {number} expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @param {boolean} isAnonymous - Whether to use public credentials
 * @returns {Promise<string|null>} - The signed URL or null if error
 */
export const getSignedUrlFromFullUrl = async (urlOrPath, expiresIn = 86400, isAnonymous = false) => {
  return withRetry(async () => {
    const path = extractPathFromWasabiUrl(urlOrPath);
    if (!path) {
      throw new Error('Invalid URL or path provided');
    }
    return getSignedViewUrl(path, expiresIn, isAnonymous);
  });
};

export default {
  uploadFile,
  getSignedFileUrl,
  getUploadPresignedUrl,
  deleteFile,
  getSignedViewUrl,
  extractPathFromWasabiUrl,
  getSignedUrlFromFullUrl
}; 
 
 