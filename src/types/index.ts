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
    }
    Views: {
      // Add your view types here
    }
    Functions: {
      // Add your function types here
    }
    Enums: {
      // Add your enum types here
    }
  }
}

export type User = {
  id: string
  email: string | null
  user_metadata: {
    [key: string]: any
  }
}

export type SupabaseClientType = SupabaseClient<Database>
