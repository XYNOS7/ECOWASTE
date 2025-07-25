
import { supabase, getValidSession } from "./supabase"

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

  // Sign out with proper session validation
  async signOut() {
    try {
      console.log("Sign out button clicked")
      
      // Check if we have a valid session before attempting signout
      const session = await getValidSession()
      if (!session) {
        console.warn("No active session to sign out from - clearing local state")
        // Still clear local storage even if no session
        this.clearLocalStorage()
        return { error: null }
      }
      
      console.log("Valid session found, proceeding with signout")
      
      // Try to sign out from Supabase
      const { error } = await supabase.auth.signOut({
        scope: 'global' // Sign out from all sessions
      })
      
      if (error) {
        console.error("Supabase signout error:", error)
        // Don't return early - still proceed with local cleanup
      } else {
        console.log("Supabase sign out successful")
      }
      
      // Always clear local storage regardless of server response
      this.clearLocalStorage()
      
      return { error: null } // Always return success for local cleanup
    } catch (err) {
      console.error("Auth signout error:", err)
      
      // Force local cleanup even on error
      this.clearLocalStorage()
      
      return { error: null } // Return success to force state reset
    }
  },

  // Clear local storage helper
  clearLocalStorage() {
    if (typeof window !== 'undefined') {
      try {
        // Clear all supabase related items
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('supabase') || 
              key.startsWith('sb-') || 
              key.includes('auth') || 
              key.includes('session') ||
              key.includes('ecotrack')) {
            localStorage.removeItem(key)
          }
        })
        
        // Clear session storage
        sessionStorage.clear()
        
        console.log("Local storage cleared successfully")
      } catch (err) {
        console.error("Error clearing local storage:", err)
      }
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

  // Get current session with error handling
  async getCurrentSession() {
    try {
      const session = await getValidSession()
      return { session, error: null }
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
