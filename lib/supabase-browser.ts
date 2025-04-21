import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

let browserClient: ReturnType<typeof createBrowserClient> | null = null

export const getSupabaseBrowserClient = () => {
  if (typeof window === "undefined") {
    throw new Error("getSupabaseBrowserClient should only be called in the browser")
  }
  if (!browserClient) {
    browserClient = createBrowserClient()
  }

  return browserClient
}
