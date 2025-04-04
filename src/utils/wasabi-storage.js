import { S3Client, PutObjectCommand, GetObjectCommand, } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getCachedUrl, setCachedUrl, getCacheStats } from './url-cache';
export const wasabiConfig = {
    region: import.meta.env.VITE_WASABI_REGION || 'us-west-1',
    endpoint: import.meta.env.VITE_WASABI_ENDPOINT || 'https://s3.us-west-1.wasabisys.com',
    bucketName: import.meta.env.VITE_WASABI_BUCKET_NAME || 'meetup-photos-west-coast',
    accessKeyId: import.meta.env.VITE_WASABI_ACCESS_KEY_ID || '',
    secretAccessKey: import.meta.env.VITE_WASABI_SECRET_ACCESS_KEY || '',
};
let wasabiClient = null;
try {
    if (wasabiConfig.accessKeyId && wasabiConfig.secretAccessKey) {
        wasabiClient = new S3Client({
            region: wasabiConfig.region,
            endpoint: wasabiConfig.endpoint,
            credentials: {
                accessKeyId: wasabiConfig.accessKeyId,
                secretAccessKey: wasabiConfig.secretAccessKey,
            },
            forcePathStyle: true,
        });
        console.log('Wasabi S3 client initialized successfully');
    }
    else {
        console.log('Wasabi credentials not found. Using passthrough mode for URLs.');
    }
}
catch (error) {
    console.error('Failed to initialize Wasabi client:', error);
}
export const getUploadPresignedUrl = async (filePath, contentType, expiresIn = 7200, isAnonymous = false) => {
    try {
        if (!wasabiClient) {
            console.log('No Wasabi client available, using API fallback for uploads');
            const apiUrl = import.meta.env.VITE_API_URL;
            if (apiUrl) {
                const uploadUrl = `${apiUrl}/get-upload-url?path=${filePath}&type=${encodeURIComponent(contentType)}`;
                return {
                    success: true,
                    uploadUrl,
                    path: filePath,
                    error: null,
                };
            }
            return {
                success: false,
                uploadUrl: null,
                path: filePath,
                error: 'Missing both Wasabi credentials and API fallback. Image uploads unavailable.',
            };
        }
        const command = new PutObjectCommand({
            Bucket: wasabiConfig.bucketName,
            Key: filePath,
            ContentType: contentType,
        });
        const uploadUrl = await getSignedUrl(wasabiClient, command, { expiresIn });
        return {
            success: true,
            uploadUrl,
            path: filePath,
            error: null,
        };
    }
    catch (error) {
        console.error('Error generating presigned URL:', error);
        return {
            success: false,
            uploadUrl: null,
            path: null,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};
export const getSignedViewUrl = async (path, expiresIn = 7200, isAnonymous = false) => {
    try {
        if (!wasabiClient || path.startsWith('http')) {
            return path;
        }
        const command = new GetObjectCommand({
            Bucket: wasabiConfig.bucketName,
            Key: path,
        });
        const signedUrl = await getSignedUrl(wasabiClient, command, { expiresIn });
        return signedUrl;
    }
    catch (error) {
        console.error('Error generating signed view URL:', error);
        return path;
    }
};
export const extractPathFromWasabiUrl = (urlOrPath) => {
    if (!urlOrPath)
        return null;
    if (!urlOrPath.startsWith('http')) {
        return urlOrPath;
    }
    try {
        const url = new URL(urlOrPath);
        if (url.searchParams.has('X-Amz-Signature') ||
            url.searchParams.has('X-Amz-Algorithm') ||
            url.searchParams.has('AWSAccessKeyId')) {
            return urlOrPath;
        }
        let path = url.pathname;
        if (wasabiConfig.bucketName && path.includes(wasabiConfig.bucketName)) {
            const parts = path.split('/');
            const bucketIndex = parts.findIndex(p => p === wasabiConfig.bucketName);
            if (bucketIndex >= 0 && bucketIndex < parts.length - 1) {
                path = '/' + parts.slice(bucketIndex + 1).join('/');
            }
        }
        return path.startsWith('/') ? path.substring(1) : path;
    }
    catch (error) {
        console.error('Invalid URL format:', urlOrPath, error);
        return null;
    }
};
export const getSignedUrlFromFullUrl = async (urlOrPath, expiresIn = 86400, isAnonymous = false) => {
    if (!urlOrPath) {
        if (process.env.NODE_ENV === 'development') {
            console.log('[URL Cache] SKIP: Empty path provided');
        }
        return null;
    }
    if (urlOrPath.includes('X-Amz-Signature=') ||
        urlOrPath.includes('X-Amz-Algorithm=') ||
        urlOrPath.includes('AWSAccessKeyId=')) {
        return urlOrPath;
    }
    const cacheKey = `${urlOrPath}:${isAnonymous ? 'anon' : 'auth'}`;
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
    const path = extractPathFromWasabiUrl(urlOrPath);
    if (!path) {
        console.error('Invalid URL or path provided:', urlOrPath);
        return urlOrPath;
    }
    if (path.startsWith('http')) {
        return path;
    }
    try {
        if (!wasabiClient) {
            return urlOrPath;
        }
        const signedUrl = await getSignedViewUrl(path, expiresIn, isAnonymous);
        if (signedUrl) {
            setCachedUrl(cacheKey, signedUrl, expiresIn);
        }
        return signedUrl;
    }
    catch (error) {
        console.error('Error generating signed URL:', error);
        return urlOrPath;
    }
};
export const logCacheStats = () => {
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
//# sourceMappingURL=wasabi-storage.js.map