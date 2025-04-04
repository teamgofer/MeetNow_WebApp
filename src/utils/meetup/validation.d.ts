import type { IMeetupData, IMeetupValidationError } from '../../types/meetup';
export declare const validateMeetupData: (data: Partial<IMeetupData>) => IMeetupValidationError[];
