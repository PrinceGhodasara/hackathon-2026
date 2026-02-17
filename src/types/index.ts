import { SupabaseClient } from '@supabase/supabase-js'

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
      // Add your table types here
      [key: string]: never
    }
    Views: {
      // Add your view types here
      [key: string]: never
    }
    Functions: {
      // Add your function types here
      [key: string]: never
    }
    Enums: {
      // Add your enum types here
      [key: string]: never
    }
  }
}

export type User = {
  id: string
  email: string | null
  user_metadata: {
    [key: string]: unknown
  }
}

export type SupabaseClientType = SupabaseClient<Database>
