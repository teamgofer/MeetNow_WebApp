/**
 * Utilities for handling image URLs and signatures
 */

/**
 * Get a signed URL for an image from storage
 * @param url Original image URL
 * @param expirySeconds Expiry time in seconds (default: 3600)
 * @param forceRefresh Force a refresh of the URL even if it's already signed
 * @returns Signed URL or the original URL if signing fails
 */
export const getSignedUrlFromFullUrl = async (
  url: string,
  expirySeconds: number = 3600,
  forceRefresh: boolean = false
): Promise<string> => {
  // Skip signing if URL is not a storage URL or is already signed
  if (!url || !isStorageUrl(url)) {
    return url;
  }

  if (isAlreadySigned(url) && !forceRefresh) {
    return url;
  }

  try {
    // For now, just append a fake signature parameter to demonstrate the functionality
    // In a real implementation, this would call Supabase or other storage API
    const timestamp = Date.now();
    const expiryTime = timestamp + expirySeconds * 1000;

    // Build signed URL with expiry timestamp
    const signedUrl = `${url}?signature=demo&expires=${expiryTime}`;
    return signedUrl;
  } catch (error) {
    console.error('Error signing URL:', error);
    // Return original URL if signing fails
    return url;
  }
};

/**
 * Check if a URL is from a storage provider
 */
function isStorageUrl(url: string): boolean {
  const storagePatterns = [
    /supabase\.co\/storage/,
    /googleapis\.com\/storage/,
    /s3\.amazonaws\.com/,
    /cloudinary\.com/,
  ];

  return storagePatterns.some(pattern => pattern.test(url));
}

/**
 * Check if a URL is already signed
 */
function isAlreadySigned(url: string): boolean {
  return url.includes('signature=') && url.includes('expires=');
}
