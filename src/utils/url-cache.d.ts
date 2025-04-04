declare const stats: {
    hits: number;
    misses: number;
    expired: number;
};
export declare const getCachedUrl: (path: string) => string | null;
export declare const setCachedUrl: (path: string, url: string, expiresIn: number) => void;
export declare const cleanupExpiredUrls: () => void;
export declare const invalidateCache: (pathPattern?: RegExp) => void;
export declare const getCacheStats: () => typeof stats;
export {};
