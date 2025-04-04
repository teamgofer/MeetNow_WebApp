export const getSignedUrlFromFullUrl = async (url, expirySeconds = 3600, forceRefresh = false) => {
    if (!url || !isStorageUrl(url)) {
        return url;
    }
    if (isAlreadySigned(url) && !forceRefresh) {
        return url;
    }
    try {
        const timestamp = Date.now();
        const expiryTime = timestamp + expirySeconds * 1000;
        const signedUrl = `${url}?signature=demo&expires=${expiryTime}`;
        return signedUrl;
    }
    catch (error) {
        console.error('Error signing URL:', error);
        return url;
    }
};
function isStorageUrl(url) {
    const storagePatterns = [
        /supabase\.co\/storage/,
        /googleapis\.com\/storage/,
        /s3\.amazonaws\.com/,
        /cloudinary\.com/,
    ];
    return storagePatterns.some(pattern => pattern.test(url));
}
function isAlreadySigned(url) {
    return url.includes('signature=') && url.includes('expires=');
}
//# sourceMappingURL=image.js.map