"use client"

import type React from "react"
import { useState, useEffect, createContext, useContext } from "react"
import { auth } from "@/lib/auth"
import { database } from "@/lib/database"
import type { Profile } from "@/lib/supabase"

interface AuthContextType {
  user: any
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, userData?: any) => Promise<any>
  signOut: () => Promise<any>
  refreshProfile: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const createProfileIfNeeded = async (user: any) => {
    if (!user) return null

    try {
      // First try to get existing profile
      const existingProfile = await database.profiles.get(user.id)

      // Whether the row exists or not, run an UPSERT
      const { data: upsertedProfile, error } = await database.profiles.create({
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username || user.email?.split("@")[0] || "user",
        full_name: user.user_metadata?.full_name || "",
      })

      if (error) {
        console.error("Upsert profile error:", error)
      }

      const profileData = upsertedProfile ?? existingProfile
      return profileData
    } catch (error) {
      console.error("Error in createProfileIfNeeded:", error)
      // Return a basic profile with user data
      return {
        id: user.id,
        username: user.email?.split("@")[0] || "user",
        email: user.email || "",
        full_name: user.user_metadata?.full_name || "",
        eco_coins: 0,
        waste_collected: 0,
        streak: 0,
        level: 1,
        total_reports: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }
  }

  const refreshProfile = async () => {
    if (user?.id) {
      try {
        const profileData = await database.profiles.get(user.id)
        setProfile(profileData)
      } catch (error) {
        console.error("Error refreshing profile:", error)
      }
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (user?.id) {
      try {
        const { data, error } = await database.profiles.update(user.id, updates)
        if (!error && data) {
          setProfile(data)
        }
        return { data, error }
      } catch (error) {
        console.error("Error updating profile:", error)
        return { data: null, error }
      }
    }
    return { data: null, error: new Error("No user logged in") }
  }

  useEffect(() => {
    // Get initial session
    auth.getCurrentSession().then(async ({ session }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        const profileData = await createProfileIfNeeded(currentUser)
        setProfile(profileData)
      }

      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

     if (currentUser) {
  try {
    const profileData = await createProfileIfNeeded(currentUser)
    setProfile(profileData)
  } catch (err) {
    console.error("Error loading profile:", err)
  }
}
setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const result = await auth.signIn(email, password)

      if (result.error) {
        console.error("Sign in failed:", result.error)
        return result
      }

      return result
    } catch (error) {
      console.error("Sign in error:", error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, userData?: any) => {
    setLoading(true)
    try {
      const result = await auth.signUp(email, password, userData)

      if (result.error) {
        console.error("Sign up failed:", result.error)
        return result
      }

      return result
    } catch (error) {
      console.error("Sign up error:", error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await auth.signOut()
    } catch (error) {
      console.error("Sign out error:", error)
    }

    setUser(null)
    setProfile(null)
    return { error: null }
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
