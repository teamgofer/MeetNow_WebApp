import type { IMeetupCreateData } from '../../types/meetup';
export declare const createMeetup: (data: IMeetupCreateData) => Promise<any>;
export declare const joinMeetup: (meetupId: string) => Promise<void>;
export declare const leaveMeetup: (meetupId: string) => Promise<void>;
export declare const cancelMeetup: (meetupId: string) => Promise<void>;
