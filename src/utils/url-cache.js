const urlCache = {};
const stats = {
    hits: 0,
    misses: 0,
    expired: 0
};
export const getCachedUrl = (path) => {
    const cached = urlCache[path];
    if (!cached) {
        stats.misses++;
        return null;
    }
    if (cached.expiry < Date.now()) {
        stats.expired++;
        setTimeout(() => {
            delete urlCache[path];
        }, 100);
        return null;
    }
    stats.hits++;
    return cached.url;
};
export const setCachedUrl = (path, url, expiresIn) => {
    const bufferMs = 60 * 1000;
    urlCache[path] = {
        url,
        expiry: Date.now() + (expiresIn * 1000) - bufferMs,
        createdAt: Date.now()
    };
};
export const cleanupExpiredUrls = () => {
    const now = Date.now();
    let cleaned = 0;
    Object.keys(urlCache).forEach(key => {
        const cachedItem = urlCache[key];
        if (cachedItem && cachedItem.expiry < now) {
            delete urlCache[key];
            cleaned++;
        }
    });
    console.log(`URL cache cleanup: removed ${cleaned} expired URLs`);
};
export const invalidateCache = (pathPattern) => {
    if (pathPattern) {
        Object.keys(urlCache).forEach(key => {
            if (pathPattern.test(key)) {
                delete urlCache[key];
            }
        });
    }
    else {
        Object.keys(urlCache).forEach(key => {
            delete urlCache[key];
        });
    }
};
export const getCacheStats = () => {
    return { ...stats };
};
setInterval(cleanupExpiredUrls, 5 * 60 * 1000);
//# sourceMappingURL=url-cache.js.map