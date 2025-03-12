export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      free_meetups: {
        Row: {
          id: string
          created_at: string
          location: { lat: number; lng: number }
          address: string
          status: 'active' | 'cancelled'
          expires_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          location: { lat: number; lng: number }
          address: string
          status?: 'active' | 'cancelled'
          expires_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          location?: { lat: number; lng: number }
          address?: string
          status?: 'active' | 'cancelled'
          expires_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 