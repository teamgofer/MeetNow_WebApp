export interface IMeetup {
    id: string;
    title: string;
    description?: string;
    location: {
        lat: number;
        lng: number;
    };
    address: string;
    creator_id?: string;
    image_url?: string;
    created_at: Date;
    expires_at: Date;
}
export declare function createFreeMeetup(data: {
    title: string;
    description?: string;
    location: {
        lat: number;
        lng: number;
    };
    address: string;
    image?: string;
}): Promise<{
    success: boolean;
    meetupId: any;
    error?: never;
} | {
    success: boolean;
    error: string;
    meetupId?: never;
}>;
export declare function getNearbyFreeMeetups(location: {
    lat: number;
    lng: number;
}, radius?: number): Promise<any[]>;
export declare function nearbyMeetups(location: {
    lat: number;
    lng: number;
}, radius?: number): Promise<any[]>;
