import { supabase, type Profile, type WasteReport, type DirtyAreaReport } from "./supabase"

export interface Admin {
  id: string
  username: string
  email: string
  full_name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export const database = {
  // Admin operations
  admins: {
    async get(adminId: string): Promise<Admin | null> {
      try {
        const { data, error } = await supabase.from("admins").select("*").eq("id", adminId).maybeSingle()

        if (error) {
          console.error("Error fetching admin:", error)
          return null
        }
        return data
      } catch (err) {
        console.error("Database admin get error:", err)
        return null
      }
    },

    async create(admin: Partial<Admin>): Promise<{ data: Admin | null; error: any }> {
      try {
        const { data, error } = await supabase
          .from("admins")
          .upsert(admin, {
            onConflict: "id",
            ignoreDuplicates: false,
            defaultToNull: false,
          })
          .select()
          .single()

        return { data, error }
      } catch (err) {
        console.error("Database admin create error:", err)
        return { data: null, error: err }
      }
    },

    async update(adminId: string, updates: Partial<Admin>) {
      try {
        const { data, error } = await supabase
          .from("admins")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", adminId)
          .select()
          .single()

        return { data, error }
      } catch (err) {
        console.error("Database admin update error:", err)
        return { data: null, error: err }
      }
    },

    async getAll() {
      try {
        const { data, error } = await supabase
          .from("admins")
          .select("*")
          .order("created_at", { ascending: false })

        return { data, error }
      } catch (err) {
        console.error("Database admins getAll error:", err)
        return { data: [], error: err }
      }
    },

    async checkIfAdmin(userId: string): Promise<boolean> {
      try {
        const { data, error } = await supabase
          .from("admins")
          .select("id")
          .eq("id", userId)
          .maybeSingle()

        return !error && data !== null
      } catch (err) {
        console.error("Database checkIfAdmin error:", err)
        return false
      }
    },
  },
  // Profile operations
  profiles: {
    async get(userId: string): Promise<Profile | null> {
      try {
        // Check if we have a valid connection
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co"
        if (supabaseUrl === "https://example.supabase.co") {
          console.error("❌ Database not configured - returning mock data")
          return {
            id: userId,
            username: "demo_user",
            email: "demo@example.com",
            full_name: "Demo User",
            avatar_url: null,
            eco_coins: 0,
            waste_collected: 0,
            streak: 0,
            level: 1,
            total_reports: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }

        const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()

        if (error) {
          console.error("Error fetching profile:", error)
          return null
        }
        return data
      } catch (err) {
        console.error("Database connection error:", err)
        return null
      }
    },

    async create(profile: Partial<Profile>): Promise<{ data: Profile | null; error: any }> {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .upsert(profile, {
            onConflict: "id",
            ignoreDuplicates: false,
            defaultToNull: false,
          })
          .select()
          .single()

        return { data, error }
      } catch (err) {
        console.error("Database profile upsert error:", err)
        return { data: null, error: err }
      }
    },

    async update(userId: string, updates: Partial<Profile>) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", userId)
          .select()
          .single()

        return { data, error }
      } catch (err) {
        console.error("Database profile update error:", err)
        return { data: null, error: err }
      }
    },

    async getLeaderboard(limit = 10) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, total_reports, eco_coins, avatar_url")
          .order("eco_coins", { ascending: false })
          .limit(limit)

        return { data, error }
      } catch (err) {
        console.error("Database leaderboard error:", err)
        return { data: [], error: err }
      }
    },
  },

  // Waste report operations
  wasteReports: {
    async create(report: Omit<WasteReport, "id" | "created_at" | "updated_at" | "coins_earned" | "status">) {
      try {
        const { data, error } = await supabase.from("waste_reports").insert(report).select().single()
        return { data, error }
      } catch (err) {
        console.error("Database waste report create error:", err)
        return { data: null, error: err }
      }
    },

    async getAll() {
      try {
        const { data, error } = await supabase
          .from("waste_reports")
          .select(`
            *,
            profiles:user_id (username, avatar_url)
          `)
          .order("created_at", { ascending: false })

        return { data, error }
      } catch (err) {
        console.error("Database waste reports getAll error:", err)
        return { data: [], error: err }
      }
    },

    async getByUser(userId: string) {
      try {
        const { data, error } = await supabase
          .from("waste_reports")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })

        return { data, error }
      } catch (err) {
        console.error("Database waste reports getByUser error:", err)
        return { data: [], error: err }
      }
    },

    async updateStatus(reportId: string, status: WasteReport["status"]) {
      try {
        const { data, error } = await supabase
          .from("waste_reports")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", reportId)
          .select()
          .single()

        return { data, error }
      } catch (err) {
        console.error("Database waste report updateStatus error:", err)
        return { data: null, error: err }
      }
    },

    async delete(reportId: string) {
      try {
        const { data, error } = await supabase
          .from("waste_reports")
          .delete()
          .eq("id", reportId)
          .select()
          .single()

        return { data, error }
      } catch (err) {
        console.error("Database waste report delete error:", err)
        return { data: null, error: err }
      }
    },
  },

  // Dirty area report operations
  dirtyAreaReports: {
    async create(report: Omit<DirtyAreaReport, "id" | "created_at" | "updated_at" | "coins_earned" | "status">) {
      try {
        const { data, error } = await supabase.from("dirty_area_reports").insert(report).select().single()
        return { data, error }
      } catch (err) {
        console.error("Database dirty area report create error:", err)
        return { data: null, error: err }
      }
    },

    async getAll() {
      try {
        const { data, error } = await supabase
          .from("dirty_area_reports")
          .select(`
            *,
            profiles:user_id (username, avatar_url)
          `)
          .order("created_at", { ascending: false })

        return { data, error }
      } catch (err) {
        console.error("Database dirty area reports getAll error:", err)
        return { data: [], error: err }
      }
    },

    async getByUser(userId: string) {
      try {
        const { data, error } = await supabase
          .from("dirty_area_reports")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })

        return { data, error }
      } catch (err) {
        console.error("Database dirty area reports getByUser error:", err)
        return { data: [], error: err }
      }
    },
  },

  // Reward operations
  rewards: {
    async getAll() {
      try {
        const { data, error } = await supabase
          .from("rewards")
          .select("*")
          .eq("is_available", true)
          .order("cost", { ascending: true })

        return { data, error }
      } catch (err) {
        console.error("Database rewards getAll error:", err)
        return { data: [], error: err }
      }
    },

    async redeem(userId: string, rewardId: string) {
      try {
        const { data, error } = await supabase.rpc("redeem_reward", {
          user_uuid: userId,
          reward_uuid: rewardId,
        })

        return { data, error }
      } catch (err) {
        console.error("Database reward redeem error:", err)
        return { data: null, error: err }
      }
    },

    async getUserRewards(userId: string) {
      try {
        const { data, error } = await supabase
          .from("user_rewards")
          .select(`
            *,
            rewards (*)
          `)
          .eq("user_id", userId)
          .order("redeemed_at", { ascending: false })

        return { data, error }
      } catch (err) {
        console.error("Database user rewards error:", err)
        return { data: [], error: err }
      }
    },
  },

  // Achievement operations
  achievements: {
    async getAll() {
      try {
        const { data, error } = await supabase
          .from("achievements")
          .select("*")
          .order("condition_value", { ascending: true })

        return { data, error }
      } catch (err) {
        console.error("Database achievements getAll error:", err)
        return { data: [], error: err }
      }
    },

    async getUserAchievements(userId: string) {
      try {
        const { data, error } = await supabase
          .from("user_achievements")
          .select(`
            *,
            achievements (*)
          `)
          .eq("user_id", userId)
          .order("earned_at", { ascending: false })

        return { data, error }
      } catch (err) {
        console.error("Database user achievements error:", err)
        return { data: [], error: err }
      }
    },
  },

  // Activity log operations
  activityLogs: {
    async getByUser(userId: string, limit = 10) {
      try {
        const { data, error } = await supabase
          .from("activity_logs")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit)

        return { data, error }
      } catch (err) {
        console.error("Database activity logs error:", err)
        return { data: [], error: err }
      }
    },
  },

  // File upload operations
  storage: {
    // File-upload helper -------------------------------------------------
    /**
     * Upload a file to Supabase Storage.
     *   • The object key is  <userId>/<randomFilename>
     *   • Works with any bucket that has the
     *     `auth.uid()::text = (storage.foldername(name))[1]` policy.
     *   • Automatically falls back to "images" if the bucket is missing
     *     (handy in preview deployments).
     *
     * @param file     File object from the browser
     * @param userId   Current authenticated user's UUID  (first path segment)
     * @param bucket   Storage bucket id – defaults to "avatars"
     */
    async uploadImage(file: File, userId: string, bucket = "avatars"): Promise<{ url: string | null; error: any }> {
      // Helper for a single attempt
      const tryUpload = async (bucketId: string) => {
        const ext = file.name.split(".").pop() ?? "jpg"
        const random = Math.random().toString(36).slice(2)
        const objectKey = `${userId}/${Date.now()}-${random}.${ext}`

        return supabase.storage.from(bucketId).upload(objectKey, file)
      }

      // 1️⃣ First try – requested bucket
      let { data, error } = await tryUpload(bucket)

      // 2️⃣ Missing bucket? ➜ fall back to "images"
      if (error && /bucket.*not.*found/i.test(error.message) && bucket !== "images") {
        bucket = "images"
        ;({ data, error } = await tryUpload(bucket))
      }

      if (error || !data) return { url: null, error }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(data.path)

      return { url: publicUrl, error: null }
    },
  },
}