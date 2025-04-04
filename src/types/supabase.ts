export type TJson = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type TMeetupStatus = 'active' | 'cancelled' | 'completed';

export interface IDatabase {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          credits: number;
        };
        Insert: {
          id: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          credits?: number;
        };
        Update: {
          id?: string;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          credits?: number;
        };
      };
      meetups: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          description: string;
          lat: number;
          lng: number;
          address: string;
          max_participants: number;
          current_participants: number;
          duration: number;
          start_time: string;
          status: MeetupStatus;
          image_url: string | null;
          created_by: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          title: string;
          description: string;
          lat: number;
          lng: number;
          address: string;
          max_participants: number;
          current_participants?: number;
          duration: number;
          start_time: string;
          status?: MeetupStatus;
          image_url?: string | null;
          created_by: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          title?: string;
          description?: string;
          lat?: number;
          lng?: number;
          address?: string;
          max_participants?: number;
          current_participants?: number;
          duration?: number;
          start_time?: string;
          status?: MeetupStatus;
          image_url?: string | null;
          created_by?: string;
          updated_at?: string;
        };
      };
      meetup_participants: {
        Row: {
          id: string;
          created_at: string;
          meetup_id: string;
          user_id: string;
          status: 'pending' | 'accepted' | 'rejected';
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          meetup_id: string;
          user_id: string;
          status?: 'pending' | 'accepted' | 'rejected';
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          meetup_id?: string;
          user_id?: string;
          status?: 'pending' | 'accepted' | 'rejected';
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_user_credits: {
        Args: {
          user_id: string;
          amount: number;
        };
        Returns: {
          success: boolean;
          error?: string;
        };
      };
      create_meetup: {
        Args: {
          title: string;
          description: string;
          lat: number;
          lng: number;
          address: string;
          max_participants: number;
          duration: number;
          start_time: string;
          image_url?: string;
          created_by: string;
        };
        Returns: {
          success: boolean;
          meetup?: Database['public']['Tables']['meetups']['Row'];
          error?: string;
        };
      };
      join_meetup: {
        Args: {
          meetup_id: string;
          user_id: string;
        };
        Returns: {
          success: boolean;
          error?: string;
        };
      };
      leave_meetup: {
        Args: {
          meetup_id: string;
          user_id: string;
        };
        Returns: {
          success: boolean;
          error?: string;
        };
      };
    };
    Enums: {
      meetup_status: MeetupStatus;
    };
  };
}
