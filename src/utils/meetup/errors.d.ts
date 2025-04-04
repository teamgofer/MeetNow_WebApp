import type { MeetupError } from '../../types/meetup';
export declare const ERROR_CATEGORIES: {
    readonly VALIDATION: "validation";
    readonly NETWORK: "network";
    readonly STORAGE: "storage";
    readonly DATABASE: "database";
    readonly UNKNOWN: "unknown";
};
export type TErrorCategory = (typeof ERROR_CATEGORIES)[keyof typeof ERROR_CATEGORIES];
export declare const handleMeetupError: (error: Error, operation: string) => MeetupError;
