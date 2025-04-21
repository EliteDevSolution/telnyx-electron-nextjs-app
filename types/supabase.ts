export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          sip_username: string | null
          sip_password: string | null
          telnyx_api_key: string | null
          telnyx_messaging_profile_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          sip_username?: string | null
          sip_password?: string | null
          telnyx_api_key?: string | null
          telnyx_messaging_profile_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          sip_username?: string | null
          sip_password?: string | null
          telnyx_api_key?: string | null
          telnyx_messaging_profile_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      call_history: {
        Row: {
          id: string
          user_id: string
          call_id: string
          direction: "incoming" | "outgoing"
          phone_number: string
          status: string
          duration: number
          started_at: string
          ended_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          call_id: string
          direction: "incoming" | "outgoing"
          phone_number: string
          status: string
          duration?: number
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          call_id?: string
          direction?: "incoming" | "outgoing"
          phone_number?: string
          status?: string
          duration?: number
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          user_id: string
          name: string
          phone_number: string
          email: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          phone_number: string
          email?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          phone_number?: string
          email?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sms_history: {
        Row: {
          id: string
          user_id: string
          message_id: string | null
          direction: "inbound" | "outbound"
          phone_number: string
          message: string
          status: string | null
          sent_at: string | null
          received_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message_id?: string | null
          direction: "inbound" | "outbound"
          phone_number: string
          message: string
          status?: string | null
          sent_at?: string | null
          received_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message_id?: string | null
          direction?: "inbound" | "outbound"
          phone_number?: string
          message?: string
          status?: string | null
          sent_at?: string | null
          received_at?: string | null
          created_at?: string
        }
      }
    }
  }
}
