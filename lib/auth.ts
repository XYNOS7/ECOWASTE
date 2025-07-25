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
      console.log("Sign out button clicked")
      
      // First refresh session to ensure we're working with the latest state
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      console.log("Current session before signout:", sessionData?.session ? "Active" : "None")
      
      if (sessionError) {
        console.error("Session error before signout:", sessionError)
      }
      
      // Try to sign out from Supabase
      const { error } = await supabase.auth.signOut({
        scope: 'global' // Sign out from all sessions
      })
      
      if (error) {
        console.error("Supabase signout error:", error)
        // Don't return early - still proceed with local cleanup
      } else {
        console.log("Sign out successful")
      }
      
      // Force clear all auth-related storage
      if (typeof window !== 'undefined') {
        // Clear all supabase related items
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('supabase') || key.includes('auth')) {
            localStorage.removeItem(key)
          }
        })
        
        // Clear session storage
        sessionStorage.clear()
        
        // Also clear any remaining tokens
        localStorage.removeItem('supabase.auth.token')
        
        // Clear any Supabase auth tokens that might exist
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') && key.includes('-auth-token')) {
            localStorage.removeItem(key)
          }
        })
      }
      
      return { error: null } // Always return success for local cleanup
    } catch (err) {
      console.error("Auth signout error:", err)
      
      // Force local cleanup even on error
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('supabase') || key.includes('auth')) {
            localStorage.removeItem(key)
          }
        })
        sessionStorage.clear()
      }
      
      return { error: null } // Return success to force state reset
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
