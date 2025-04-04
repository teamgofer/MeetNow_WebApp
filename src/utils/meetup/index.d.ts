import { IMeetup } from '../../components/map/MeetupMarkers';
export * from './search';
export * from './validation';
export * from './error-handling';
export declare const refreshMeetupImageUrls: (meetups: IMeetup[], expirySeconds?: number, visibleCount?: number, onUpdate?: (meetup: IMeetup, index: number) => void) => Promise<IMeetup[]>;
export declare const formatMeetupDistance: (distance?: number) => string;
export declare const formatTimeAgo: (timestamp: string) => string;
export declare function getMeetupWithSignedImageUrl(meetupId: string): Promise<IMeetup>;
export declare function addSignedImageUrlsToMeetups(meetups: IMeetup[]): Promise<IMeetup[]>;
