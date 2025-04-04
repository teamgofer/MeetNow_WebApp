import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getCachedUrl, setCachedUrl, getCacheStats } from './url-cache';

// Simple configuration with defaults to prevent errors
export const wasabiConfig = {
  region: import.meta.env.VITE_WASABI_REGION || 'us-west-1',
  endpoint: import.meta.env.VITE_WASABI_ENDPOINT || 'https://s3.us-west-1.wasabisys.com',
  bucketName: import.meta.env.VITE_WASABI_BUCKET_NAME || 'meetup-photos-west-coast',
  accessKeyId: import.meta.env.VITE_WASABI_ACCESS_KEY_ID || '',
  secretAccessKey: import.meta.env.VITE_WASABI_SECRET_ACCESS_KEY || '',
  // Add public credentials
  publicAccessKeyId: import.meta.env.VITE_WASABI_PUBLIC_ACCESS_KEY_ID || '',
  publicSecretAccessKey: import.meta.env.VITE_WASABI_PUBLIC_SECRET_KEY || '',
};

// Create S3 client for Wasabi if credentials are available
let wasabiClient: S3Client | null = null;
let wasabiPublicClient: S3Client | null = null;

try {
  // Only create the standard client if we have credentials
  if (wasabiConfig.accessKeyId && wasabiConfig.secretAccessKey) {
    wasabiClient = new S3Client({
      region: wasabiConfig.region,
      endpoint: wasabiConfig.endpoint,
      credentials: {
        accessKeyId: wasabiConfig.accessKeyId,
        secretAccessKey: wasabiConfig.secretAccessKey,
      },
      forcePathStyle: true, // Required for Wasabi
    });
    console.log('Wasabi S3 client initialized successfully');
  } else {
    console.log('Wasabi credentials not found. Using passthrough mode for URLs.');
  }
  
  // Create the public client if we have public credentials
  if (wasabiConfig.publicAccessKeyId && wasabiConfig.publicSecretAccessKey) {
    wasabiPublicClient = new S3Client({
      region: wasabiConfig.region,
      endpoint: wasabiConfig.endpoint,
      credentials: {
        accessKeyId: wasabiConfig.publicAccessKeyId,
        secretAccessKey: wasabiConfig.publicSecretAccessKey,
      },
      forcePathStyle: true, // Required for Wasabi
    });
    console.log('Wasabi public S3 client initialized successfully');
  }
} catch (error) {
  console.error('Failed to initialize Wasabi client:', error);
}

/**
 * Gets the appropriate client based on whether this is an anonymous/public request
 */
const getClient = (isAnonymous: boolean): S3Client | null => {
  if (isAnonymous && wasabiPublicClient) {
    return wasabiPublicClient;
  }
  return wasabiClient;
};

/**
 * Get a pre-signed upload URL for direct browser uploads
 */
export const getUploadPresignedUrl = async (
  filePath: string,
  contentType: string,
  expiresIn = 7200,
  isAnonymous = false
): Promise<{
  success: boolean;
  uploadUrl: string | null;
  path: string | null;
  error: string | null;
}> => {
  try {
    // Get the appropriate client
    const client = getClient(isAnonymous);
    
    // If we don't have a client, try to use API endpoint fallback
    if (!client) {
      console.log(`No Wasabi ${isAnonymous ? 'public' : 'standard'} client available, using API fallback for uploads`);

      // In a real implementation, we would call a backend API here
      // For example: /api/get-upload-url?type=image/jpeg

      // Try to use the API_URL from environment if available
      const apiUrl = import.meta.env.VITE_API_URL;

      if (apiUrl) {
        // Use the API endpoint to get a upload URL
        const uploadUrl = `${apiUrl}/get-upload-url?path=${filePath}&type=${encodeURIComponent(contentType)}`;

        return {
          success: true,
          uploadUrl,
          path: filePath,
          error: null,
        };
      }

      // If no API URL, return a more helpful error
      return {
        success: false,
        uploadUrl: null,
        path: filePath,
        error: 'Missing both Wasabi credentials and API fallback. Image uploads unavailable.',
      };
    }

    // Prepare the command for generating a signed URL
    const command = new PutObjectCommand({
      Bucket: wasabiConfig.bucketName,
      Key: filePath,
      ContentType: contentType,
    });

    // Generate the pre-signed URL
    const uploadUrl = await getSignedUrl(client, command, { expiresIn });

    return {
      success: true,
      uploadUrl,
      path: filePath,
      error: null,
    };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return {
      success: false,
      uploadUrl: null,
      path: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Generate a signed URL for viewing a file
 */
export const getSignedViewUrl = async (
  path: string,
  expiresIn = 7200,
  isAnonymous = false
): Promise<string | null> => {
  try {
    // Get the appropriate client
    const client = getClient(isAnonymous);
    
    // If we don't have a client or the path is already a full URL, just return the path
    if (!client || path.startsWith('http')) {
      return path;
    }

    const command = new GetObjectCommand({
      Bucket: wasabiConfig.bucketName,
      Key: path,
    });

    // Generate the signed URL
    const signedUrl = await getSignedUrl(client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed view URL:', error);
    // Fallback: return the path as is
    return path;
  }
};

/**
 * Extract the path/key from a full URL or handle a direct path
 */
export const extractPathFromWasabiUrl = (urlOrPath: string): string | null => {
  if (!urlOrPath) return null;

  // If it's already a path (doesn't start with http), return it as is
  if (!urlOrPath.startsWith('http')) {
    return urlOrPath;
  }

  try {
    // Parse the URL to extract the path
    const url = new URL(urlOrPath);

    // If it's already a signed URL, just return the original URL
    if (
      url.searchParams.has('X-Amz-Signature') ||
      url.searchParams.has('X-Amz-Algorithm') ||
      url.searchParams.has('AWSAccessKeyId')
    ) {
      return urlOrPath;
    }

    // Get the pathname and remove leading slash if present
    let path = url.pathname;

    // If it contains the bucket name in the path, extract the relevant part
    if (wasabiConfig.bucketName && path.includes(wasabiConfig.bucketName)) {
      const parts = path.split('/');
      const bucketIndex = parts.findIndex(p => p === wasabiConfig.bucketName);
      if (bucketIndex >= 0 && bucketIndex < parts.length - 1) {
        path = '/' + parts.slice(bucketIndex + 1).join('/');
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
 * This function handles both pre-signed URL generation and URL path passthrough.
 *
 * If S3 credentials are available, it will generate a pre-signed URL.
 * If no credentials are available, it will pass through the URL as is.
 *
 * @param urlOrPath - The complete URL or direct path
 * @param expiresIn - Expiration time in seconds (default: 86400 = 24 hours)
 * @param isAnonymous - Whether this is for an anonymous/public access (default: false)
 * @returns Promise with the signed URL or original URL if signing not possible
 */
export const getSignedUrlFromFullUrl = async (
  urlOrPath?: string | null,
  expiresIn = 86400,
  isAnonymous = false
): Promise<string | null> => {
  // Early return for empty input
  if (!urlOrPath) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[URL Cache] SKIP: Empty path provided');
    }
    return null;
  }

  // If the URL is already pre-signed (contains signature parameters), return it as is
  if (
    urlOrPath.includes('X-Amz-Signature=') ||
    urlOrPath.includes('X-Amz-Algorithm=') ||
    urlOrPath.includes('AWSAccessKeyId=')
  ) {
    return urlOrPath;
  }

  // Create a cache key that includes the isAnonymous flag
  const cacheKey = `${urlOrPath}:${isAnonymous ? 'anon' : 'auth'}`;

  // Check if we have a cached URL that's still valid
  const cachedUrl = getCachedUrl(cacheKey);
  if (cachedUrl) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[URL Cache] HIT: ${cacheKey}`);
    }
    return cachedUrl;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[URL Cache] MISS: ${cacheKey}`);
  }

  // Extract the path
  const path = extractPathFromWasabiUrl(urlOrPath);
  if (!path) {
    console.error('Invalid URL or path provided:', urlOrPath);
    return urlOrPath; // Return original as fallback
  }

  // If the extracted path is a full URL, it means extract function returned the original
  // This happens with already signed URLs or URLs we couldn't parse
  if (path.startsWith('http')) {
    return path;
  }

  try {
    // If we don't have a Wasabi client, just return the original URL
    if (!wasabiClient) {
      return urlOrPath;
    }

    // Generate a signed URL
    const signedUrl = await getSignedViewUrl(path, expiresIn, isAnonymous);

    // Cache the result if successful
    if (signedUrl) {
      setCachedUrl(cacheKey, signedUrl, expiresIn);
    }

    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    // Fallback to original URL
    return urlOrPath;
  }
};

/**
 * Debug helper to log cache statistics (only in development)
 */
export const logCacheStats = (): void => {
  if (process.env.NODE_ENV === 'development') {
    const stats = getCacheStats();
    console.log('URL Cache Stats:', {
      hits: stats.hits,
      misses: stats.misses,
      expired: stats.expired,
      hitRate: (stats.hits / (stats.hits + stats.misses)) * 100 + '%',
    });
  }
};

export default {
  getUploadPresignedUrl,
  getSignedViewUrl,
  extractPathFromWasabiUrl,
  getSignedUrlFromFullUrl,
  logCacheStats,
  wasabiConfig,
};
