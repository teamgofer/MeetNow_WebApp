import type { Location, User, TimeRange } from './common';
import type { Database } from './supabase';
export interface IMeetupData {
  lat: number;
  lng: number;
  address: string;
  title: string;
  description?: string;
  image?: File | string;
  imageSignedUrl?: string | null;
  duration?: number;
  user_id?: string | null;
  status?: 'active' | 'cancelled' | 'expired';
  image_url?: string | null;
  created_at?: string;
  expires_at?: string;
}
export interface IMeetup extends MeetupData {
  id: string;
  created_at: string;
  expires_at: string;
  status: 'active' | 'cancelled' | 'expired';
}
export interface IMeetupCreateInput {
  title: string;
  description: string;
  location: Location;
  address: string;
  image?: File;
  category?: string;
  tags?: string[];
  is_private?: boolean;
  max_participants?: number;
  metadata?: Record<string, unknown>;
}
export interface IMeetupUpdateInput {
  title?: string;
  description?: string;
  location?: Location;
  address?: string;
  image?: File;
  category?: string;
  tags?: string[];
  is_private?: boolean;
  max_participants?: number;
  metadata?: Record<string, unknown>;
}
export interface IMeetupFilters {
  category?: string;
  tags?: string[];
  is_private?: boolean;
  is_active?: boolean;
  is_featured?: boolean;
  is_sponsored?: boolean;
  timeRange?: TimeRange;
  location?: Location;
  radius?: number;
  max_participants?: number;
  min_participants?: number;
}
export interface IMeetupParticipant {
  user_id: string;
  meetup_id: string;
  joined_at: Date;
  left_at?: Date;
  user?: User;
}
export interface IMeetupStats {
  total_meetups: number;
  active_meetups: number;
  total_participants: number;
  average_participants: number;
  categories: Record<string, number>;
  tags: Record<string, number>;
}
export type TMeetupStatus = 'active' | 'cancelled' | 'expired' | 'completed';
export interface IMeetupLocation {
  lat: number;
  lng: number;
  address?: string;
}
export interface IMeetupBase {
  id: string;
  title: string;
  description?: string;
  address: string;
  lat: number;
  lng: number;
  status: MeetupStatus;
  user_id: string;
  created_at: string;
  expires_at: string;
  duration_minutes: number;
  image_url?: string;
}
export interface IMeetupCreateData
  extends Omit<MeetupData, 'created_at' | 'expires_at' | 'status'> {
  duration: number;
  isPublic?: boolean;
}
export interface IMeetupValidationError {
  field: string;
  message: string;
}
export interface IMeetupError {
  success: false;
  error: string;
  category: 'validation' | 'network' | 'storage' | 'database' | 'unknown';
}
export interface IMeetupSearchOptions {
  limit?: number;
  userLocation?: {
    lat: number;
    lng: number;
  };
  proximityRadius?: number;
  proximityFactor?: number;
  freeOnly?: boolean;
}
export interface IMeetupSearchResult extends Meetup {
  distance?: number;
  importance?: number;
}
export interface IMeetupWithSignedUrl extends MeetupBase {
  signedImageUrl?: string | null;
}
export type TDatabaseMeetup = Database['public']['Tables']['meetups']['Row'];
export type TDatabaseMeetupInsert = Database['public']['Tables']['meetups']['Insert'];
export type TDatabaseMeetupUpdate = Database['public']['Tables']['meetups']['Update'];
