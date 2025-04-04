export interface ILocation {
    lat: number;
    lng: number;
    display_name?: string;
    _source?: string;
}
export interface ITimeRange {
    start: Date;
    end: Date;
}
export interface IPaginationParams {
    page: number;
    limit: number;
}
export interface IPaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
export interface IApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
export interface IUser {
    id: string;
    email: string;
    username?: string;
    avatar_url?: string;
    created_at: Date;
    updated_at: Date;
    credits: number;
    is_admin?: boolean;
}
export interface ImageUploadResponse {
    url: string;
    signedUrl: string;
    key: string;
}
export interface IErrorResponse {
    code: string;
    message: string;
    details?: unknown;
}
export type TLoadingState = 'idle' | 'loading' | 'success' | 'error';
export interface ILoadingStateObject<T = unknown> {
    state: LoadingState;
    data?: T;
    error?: ErrorResponse;
}
