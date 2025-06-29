import { supabase } from "./supabase"

export const auth = {
  // Sign up
  async signUp(email: string, password: string, userData?: { username?: string; full_name?: string }) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      })

      if (error) {
        console.error("Supabase auth error:", error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (err) {
      console.error("Auth signup error:", err)
      return { data: null, error: err }
    }
  },

  // Sign in
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Supabase signin error:", error)
        return { data: null, error }
      }

      return { data, error: null }
    } catch (err) {
      console.error("Auth signin error:", err)
      return { data: null, error: err }
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (err) {
      console.error("Auth signout error:", err)
      return { error: err }
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      return { user, error }
    } catch (err) {
      console.error("Get current user error:", err)
      return { user: null, error: err }
    }
  },

  // Get current session
  async getCurrentSession() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      return { session, error }
    } catch (err) {
      console.error("Get current session error:", err)
      return { session: null, error: err }
    }
  },

  // Listen to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },
}
