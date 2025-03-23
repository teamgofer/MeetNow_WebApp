export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type MeetupStatus = 'active' | 'expired' | 'cancelled';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      meetups: {
        Row: {
          id: string
          creator_id: string | null
          title: string
          description: string | null
          location: unknown // PostGIS geography type - converted to/from lat/lng in code
          address: string | null
          image_url: string | null
          status: MeetupStatus
          max_participants: number
          current_participants: number
          created_at: string
          expires_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id?: string | null
          title: string
          description?: string | null
          location: unknown // PostGIS geography type - we'll provide conversion functions
          address?: string | null
          image_url?: string | null
          status?: MeetupStatus
          max_participants?: number
          current_participants?: number
          created_at?: string
          expires_at: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string | null
          title?: string
          description?: string | null
          location?: unknown
          address?: string | null
          image_url?: string | null
          status?: MeetupStatus
          max_participants?: number
          current_participants?: number
          created_at?: string
          expires_at?: string
          updated_at?: string
        }
      }
      meetup_participants: {
        Row: {
          meetup_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          meetup_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          meetup_id?: string
          user_id?: string
          joined_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      nearby_meetups: {
        Args: {
          lat: number
          lng: number
          radius_meters?: number
          max_results?: number
        }
        Returns: {
          id: string
          title: string
          description: string | null
          location: unknown
          address: string | null
          image_url: string | null
          status: MeetupStatus
          max_participants: number
          current_participants: number
          created_at: string
          expires_at: string
          distance_meters: number
          creator_name: string | null
        }[]
      }
    }
    Enums: {
      meetup_status: MeetupStatus
    }
  }
} 