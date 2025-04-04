export declare const wasabiConfig: {
    region: string;
    endpoint: string;
    bucketName: string;
    accessKeyId: string;
    secretAccessKey: string;
};
export declare const getUploadPresignedUrl: (filePath: string, contentType: string, expiresIn?: number, isAnonymous?: boolean) => Promise<{
    success: boolean;
    uploadUrl: string | null;
    path: string | null;
    error: string | null;
}>;
export declare const getSignedViewUrl: (path: string, expiresIn?: number, isAnonymous?: boolean) => Promise<string | null>;
export declare const extractPathFromWasabiUrl: (urlOrPath: string) => string | null;
export declare const getSignedUrlFromFullUrl: (urlOrPath?: string | null, expiresIn?: number, isAnonymous?: boolean) => Promise<string | null>;
export declare const logCacheStats: () => void;
declare const _default: {
    getUploadPresignedUrl: (filePath: string, contentType: string, expiresIn?: number, isAnonymous?: boolean) => Promise<{
        success: boolean;
        uploadUrl: string | null;
        path: string | null;
        error: string | null;
    }>;
    getSignedViewUrl: (path: string, expiresIn?: number, isAnonymous?: boolean) => Promise<string | null>;
    extractPathFromWasabiUrl: (urlOrPath: string) => string | null;
    getSignedUrlFromFullUrl: (urlOrPath?: string | null, expiresIn?: number, isAnonymous?: boolean) => Promise<string | null>;
    logCacheStats: () => void;
    wasabiConfig: {
        region: string;
        endpoint: string;
        bucketName: string;
        accessKeyId: string;
        secretAccessKey: string;
    };
};
export default _default;
