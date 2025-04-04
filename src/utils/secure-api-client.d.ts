export interface IApiConfig {
    requestTimeout: number;
    maxRetries: number;
    enforceHttps: boolean;
    enforceAuthentication: boolean;
    logRequests: boolean;
    validateResponses: boolean;
    allowedTables: string[];
    secureOperations: string[];
    readOperations: string[];
}
export interface IOperationOptions {
    filters?: {
        eq?: Record<string, unknown>;
        order?: {
            column: string;
            ascending: boolean;
        };
        limit?: number;
        range?: [number, number];
    };
    returning?: string;
    single?: boolean;
}
export interface IMeetupData {
    location: {
        lat: number;
        lng: number;
    };
    title?: string;
    description?: string | null;
    address?: string | null;
    image_url?: string | null;
    starts_at?: string;
    expires_at?: string;
    is_free_meetup?: boolean;
    status?: string;
}
export interface IApiResponse<T> {
    data: T | null;
    error: Error | null;
}
export declare const secureDbOperation: <T>(table: string, operation: string, data?: Record<string, unknown>, options?: OperationOptions) => Promise<ApiResponse<T>>;
export declare const secureSelect: <T>(table: string, options?: OperationOptions) => Promise<ApiResponse<T>>;
export declare const secureInsert: <T>(table: string, data: Record<string, unknown>, options?: OperationOptions) => Promise<ApiResponse<T>>;
export declare const secureUpdate: <T>(table: string, data: Record<string, unknown>, options?: OperationOptions) => Promise<ApiResponse<T>>;
export declare const secureDelete: <T>(table: string, options?: OperationOptions) => Promise<ApiResponse<T>>;
export declare const secureRpc: <T>(functionName: string, params?: Record<string, unknown>, options?: OperationOptions) => Promise<ApiResponse<T>>;
export declare const getUserProfile: (userId: string) => Promise<Record<string, unknown>>;
export declare const getNearbyMeetups: (latitude: number, longitude: number, radius?: number) => Promise<{
    success: boolean;
    meetups: MeetupData[];
}>;
export declare const createMeetup: (meetupData: MeetupData) => Promise<MeetupData>;
