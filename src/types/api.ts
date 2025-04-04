import type { Database } from './supabase';

export type TMeetup = Database['public']['Tables']['meetups']['Row'];
export type TProfile = Database['public']['Tables']['profiles']['Row'];
export type TMeetupParticipant = Database['public']['Tables']['meetup_participants']['Row'];

export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ICreateMeetupResponse {
  success: boolean;
  meetup?: Meetup;
  error?: string;
}

export interface IGetMeetupsResponse {
  success: boolean;
  meetups?: Meetup[];
  error?: string;
}

export interface IGetMeetupResponse {
  success: boolean;
  meetup?: Meetup;
  error?: string;
}

export interface IUpdateMeetupResponse {
  success: boolean;
  meetup?: Meetup;
  error?: string;
}

export interface IDeleteMeetupResponse {
  success: boolean;
  error?: string;
}

export interface IJoinMeetupResponse {
  success: boolean;
  error?: string;
}

export interface ILeaveMeetupResponse {
  success: boolean;
  error?: string;
}

export interface IGetProfileResponse {
  success: boolean;
  profile?: Profile;
  error?: string;
}

export interface IUpdateProfileResponse {
  success: boolean;
  profile?: Profile;
  error?: string;
}

export interface IAddCreditsResponse {
  success: boolean;
  error?: string;
}

export interface IGetParticipantsResponse {
  success: boolean;
  participants?: MeetupParticipant[];
  error?: string;
}

export interface IUpdateParticipantStatusResponse {
  success: boolean;
  participant?: MeetupParticipant;
  error?: string;
}
