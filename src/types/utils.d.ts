import type { LatLng } from 'leaflet';
import type { ApiResponse } from './api';
import type { MeetupData } from './components';
export interface IGeocodingOptions {
    limit?: number;
    language?: string;
    countrycodes?: string[];
}
export interface IStorageOptions {
    bucket: string;
    path: string;
    contentType?: string;
    cacheControl?: string;
}
export interface IStorageUploadResponse {
    path: string;
    url: string;
    error?: string;
}
export interface IValidationResult {
    isValid: boolean;
    errors: string[];
}
export interface IDateTimeFormatOptions {
    format?: string;
    locale?: string;
    timezone?: string;
}
export interface IDistanceOptions {
    unit?: 'km' | 'mi';
    precision?: number;
}
export interface ImageProcessingOptions {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
}
export interface IPerformanceMetrics {
    renderTime: number;
    mountTime: number;
    updateTime: number;
    networkTime: number;
    resourceTime: number;
}
export interface ILoggerOptions {
    level?: 'debug' | 'info' | 'warn' | 'error';
    tags?: string[];
    metadata?: Record<string, any>;
}
export interface ICacheOptions {
    ttl?: number;
    namespace?: string;
}
export interface IRetryOptions {
    attempts?: number;
    delay?: number;
    backoff?: 'linear' | 'exponential';
}
export interface IUtils {
    geocoding: {
        search: (query: string, options?: GeocodingOptions) => Promise<ApiResponse>;
        reverse: (latlng: LatLng, options?: GeocodingOptions) => Promise<ApiResponse>;
    };
    storage: {
        upload: (file: File, options: StorageOptions) => Promise<StorageUploadResponse>;
        getUrl: (path: string) => string;
        delete: (path: string) => Promise<void>;
    };
    validation: {
        validateMeetup: (data: Partial<MeetupData>) => ValidationResult;
        validateImage: (file: File) => ValidationResult;
    };
    datetime: {
        format: (date: Date | string, options?: DateTimeFormatOptions) => string;
        parse: (dateString: string, format?: string) => Date;
        isValid: (dateString: string, format?: string) => boolean;
    };
    distance: {
        calculate: (point1: LatLng, point2: LatLng, options?: DistanceOptions) => number;
        format: (meters: number, options?: DistanceOptions) => string;
    };
    image: {
        process: (file: File, options?: ImageProcessingOptions) => Promise<Blob>;
        resize: (file: File, width: number, height: number) => Promise<Blob>;
        compress: (file: File, quality: number) => Promise<Blob>;
    };
    performance: {
        measure: (name: string, fn: () => any) => Promise<number>;
        getMetrics: () => PerformanceMetrics;
        clearMetrics: () => void;
    };
    logger: {
        debug: (message: string, options?: LoggerOptions) => void;
        info: (message: string, options?: LoggerOptions) => void;
        warn: (message: string, options?: LoggerOptions) => void;
        error: (message: string, options?: LoggerOptions) => void;
    };
    cache: {
        get: <T>(key: string, options?: CacheOptions) => Promise<T | null>;
        set: <T>(key: string, value: T, options?: CacheOptions) => Promise<void>;
        delete: (key: string) => Promise<void>;
        clear: () => Promise<void>;
    };
    retry: {
        wrap: <T>(fn: () => Promise<T>, options?: RetryOptions) => Promise<T>;
    };
}
