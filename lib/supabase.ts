
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "public-anon-key"

/**
 * In the v0 preview (Next.js) environment, NEXT_PUBLIC_* env vars
 * are not injected.  We fall back to dummy credentials so the app
 * doesn't crash while you preview it.  Replace these values (or add
 * real env vars) before deploying.
 */
if (supabaseUrl === "https://example.supabase.co" || supabaseAnonKey === "public-anon-key") {
  console.error(
    "[EcoTrack] ❌ CRITICAL: Supabase database not configured! " +
      "Reports, coins, and map features will not work.\n" +
      "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY " +
      "in your Secrets tab to enable database functionality.",
  )
}

// Create a stable singleton Supabase client to prevent session corruption
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'ecotrack-auth-token',
    debug: false
  },
  db: {
    schema: "public",
  },
  global: {
    headers: {
      "x-my-custom-header": "ecotrack-app",
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Ensure client is accessible globally for debugging
if (typeof window !== 'undefined') {
  ;(window as any).supabase = supabase
}

// Test database connection
export async function testConnection() {
  try {
    const { data, error } = await supabase.from("profiles").select("count").limit(1)
    return { connected: !error, error }
  } catch (err) {
    return { connected: false, error: err }
  }
}

// Session management utilities
export async function getValidSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error("Session validation error:", error)
      return null
    }
    return session
  } catch (err) {
    console.error("Session validation failed:", err)
    return null
  }
}

export async function refreshSession() {
  try {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) {
      console.error("Session refresh error:", error)
      return null
    }
    return data.session
  } catch (err) {
    console.error("Session refresh failed:", err)
    return null
  }
}

// Types
export interface Profile {
  id: string
  username: string
  email: string
  full_name: string
  avatar_url?: string
  eco_coins: number
  waste_collected: number
  streak: number
  level: number
  total_reports: number
  created_at: string
  updated_at: string
}

export interface Admin {
  id: string
  username: string
  email: string
  full_name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface WasteReport {
  id: string
  user_id: string
  title: string
  description?: string
  category: "dry-waste" | "e-waste" | "reusable" | "hazardous"
  image_url?: string
  location_lat?: number
  location_lng?: number
  location_address?: string
  status: "pending" | "in-progress" | "collected" | "completed" | "rejected"
  ai_detected_category?: string
  coins_earned: number
  created_at: string
  updated_at: string
}

export interface DirtyAreaReport {
  id: string
  user_id: string
  title: string
  description?: string
  image_url?: string
  location_lat?: number
  location_lng?: number
  location_address?: string
  status: "pending" | "reported" | "in-progress" | "waiting" | "cleaned" | "completed" | "rejected"
  coins_earned: number
  created_at: string
  updated_at: string
}

export interface Reward {
  id: string
  title: string
  description: string
  cost: number
  category: string
  image_url?: string
  is_available: boolean
  stock_quantity: number
  created_at: string
  updated_at: string
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  condition_type: "reports_count" | "streak_days" | "coins_earned" | "waste_collected"
  condition_value: number
  coins_reward: number
  created_at: string
}

export interface ActivityLog {
  id: string
  user_id: string
  activity_type: string
  title: string
  description?: string
  coins_earned: number
  created_at: string
}
