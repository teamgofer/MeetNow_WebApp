import type { MeetupSearchResult } from '../../types/meetup';
export declare function searchNearbyMeetups(location: {
    lat: number;
    lng: number;
}, distanceMeters?: number, limit?: number, freeOnly?: boolean): Promise<MeetupSearchResult[]>;
export declare function isMeetupExpired(meetupId: string): Promise<boolean>;
