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
  // Pickup Agents operations
  pickupAgents: {
    async create(agent: any): Promise<{ data: any; error: any }> {
      try {
        const { data, error } = await supabase
          .from("pickup_agents")
          .insert(agent)
          .select()
          .single()

        return { data, error }
      } catch (err) {
        console.error("Database pickup agent create error:", err)
        return { data: null, error: err }
      }
    },

    async getByPhoneNumber(phoneNumber: string): Promise<{ data: any; error: any }> {
      try {
        const { data, error } = await supabase
          .from("pickup_agents")
          .select("*")
          .eq("phone_number", phoneNumber)
          .eq("is_active", true)
          .maybeSingle()

        return { data, error }
      } catch (err) {
        console.error("Database pickup agent getByPhoneNumber error:", err)
        return { data: null, error: err }
      }
    },

    async getTasks(agentId: string) {
      try {
        const { data, error } = await supabase
          .from("collection_tasks")
          .select(`
            *,
            waste_report:waste_reports(
              id,
              title,
              description,
              category,
              location_address,
              location_lat,
              location_lng,
              user_id,
              status,
              profiles:user_id(username)
            )
          `)
          .eq("pickup_agent_id", agentId)
          .in("status", ["assigned", "in_progress"])
          .order("assigned_at", { ascending: false })

        // Filter out tasks where waste report is completed or not in-progress
        const filteredData = data?.filter(task => 
          task.waste_report && task.waste_report.status === 'in-progress'
        ) || []

        console.log("Fetched collection tasks for agent:", agentId, "Tasks:", filteredData.length)
        return { data: filteredData, error }
      } catch (err) {
        console.error("Database pickup agent getTasks error:", err)
        return { data: [], error: err }
      }
    },

    async updateTaskStatus(taskId: string, status: string) {
      try {
        const updateData: any = { 
          status, 
          updated_at: new Date().toISOString() 
        }

        if (status === 'in_progress') {
          updateData.started_at = new Date().toISOString()
        } else if (status === 'completed') {
          updateData.completed_at = new Date().toISOString()
        }

        const { data, error } = await supabase
          .from("collection_tasks")
          .update(updateData)
          .eq("id", taskId)
          .select()

        return { data, error }
      } catch (err) {
        console.error("Database pickup agent updateTaskStatus error:", err)
        return { data: null, error: err }
      }
    },

    async createCollectionTask(wasteReportId: string) {
      try {
        // Get available pickup agents (simple round-robin assignment for now)
        const { data: agents, error: agentsError } = await supabase
          .from("pickup_agents")
          .select("id")
          .eq("is_active", true)
          .limit(1)

        if (agentsError || !agents || agents.length === 0) {
          console.log("No available pickup agents found")
          return { data: null, error: { message: "No available pickup agents" } }
        }

        // Create collection task
        const { data, error } = await supabase
          .from("collection_tasks")
          .insert({
            pickup_agent_id: agents[0].id,
            waste_report_id: wasteReportId,
            status: 'assigned',
            assigned_at: new Date().toISOString()
          })
          .select()
          .single()

        return { data, error }
      } catch (err) {
        console.error("Database createCollectionTask error:", err)
        return { data: null, error: err }
      }
    },

    async autoCompleteTasksForReport(wasteReportId: string) {
      try {
        // Auto-complete any active collection tasks for this waste report
        const { data, error } = await supabase
          .from("collection_tasks")
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq("waste_report_id", wasteReportId)
          .in("status", ["assigned", "in_progress"])
          .select()

        console.log("Auto-completed collection tasks for waste report:", wasteReportId, "Completed:", data?.length || 0)
        return { data, error }
      } catch (err) {
        console.error("Database autoCompleteTasksForReport error:", err)
        return { data: null, error: err }
      }
    },
  },

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

        if (error) {
          console.error("Supabase error fetching admins:", error)
          return { data: null, error }
        }

        console.log("Successfully fetched", data?.length || 0, "admins")
        return { data: data || [], error: null }
      } catch (err) {
        console.error("Database admins getAll error:", err)
        return { data: null, error: err }
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
        console.log('Updating waste report:', { reportId, status })

        // First, check if the report exists
        const { data: existingReport, error: checkError } = await supabase
          .from("waste_reports")
          .select("id, status, user_id")
          .eq("id", reportId)
          .maybeSingle()

        console.log('Existing report check:', { existingReport, checkError })

        if (checkError) {
          console.error('Error checking existing report:', checkError)
          return { data: null, error: checkError }
        }

        if (!existingReport) {
          console.error('Report not found:', reportId)
          return { data: null, error: new Error('Report not found') }
        }

        // Also update coins_earned if status is completed
        const updateData: any = { 
          status, 
          updated_at: new Date().toISOString() 
        }

        if (status === 'completed' || status === 'collected') {
          updateData.coins_earned = 10 // Award coins when completed
        }

        // Try to update with admin bypass
        const { data, error } = await supabase
          .from("waste_reports")
          .update(updateData)
          .eq("id", reportId)
          .select()

        console.log('Waste report update result:', { data, error, rowCount: data?.length })

        if (error) {
          console.error('Supabase error:', error)
          return { data: null, error }
        }

        if (!data || data.length === 0) {
          console.error('No rows updated for reportId:', reportId)
          return { data: null, error: new Error('Report not found or no changes made - likely RLS policy blocking admin update') }
        }

        // Return the first item if data exists, otherwise null
        return { data: data[0], error: null }
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
    async getAll() {
      try {
        const { data, error } = await supabase
          .from("dirty_area_reports")
          .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
          .order('created_at', { ascending: false })

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
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        return { data, error }
      } catch (err) {
        console.error("Database dirty area reports getByUser error:", err)
        return { data: [], error: err }
      }
    },

    async create(report: Omit<DirtyAreaReport, 'id' | 'created_at' | 'updated_at' | 'coins_earned' | 'status'>) {
      try {
        const { data, error } = await supabase
          .from('dirty_area_reports')
          .insert([{
            ...report,
            status: 'pending'
          }])
          .select()
          .single()

        return { data, error }
      } catch (err) {
        console.error("Database dirty area report create error:", err)
        return { data: null, error: err }
      }
    },

    updateStatus: async (reportId: string, status: 'pending' | 'reported' | 'in-progress' | 'waiting' | 'cleaned' | 'completed') => {
      try {
        console.log('Updating dirty area report:', { reportId, status })

        // First, check if the report exists
        const { data: existingReport, error: checkError } = await supabase
          .from('dirty_area_reports')
          .select('id, status, user_id')
          .eq('id', reportId)
          .maybeSingle()

        console.log('Existing dirty area report check:', { existingReport, checkError })

        if (checkError) {
          console.error('Error checking existing dirty area report:', checkError)
          return { data: null, error: checkError }
        }

        if (!existingReport) {
          console.error('Dirty area report not found:', reportId)
          return { data: null, error: new Error('Report not found') }
        }

        // Also update coins_earned if status is completed
        const updateData: any = { 
          status, 
          updated_at: new Date().toISOString() 
        }

        if (status === 'completed' || status === 'cleaned') {
          updateData.coins_earned = 15 // Award coins when completed
        }

        // Try to update with admin bypass
        const { data, error } = await supabase
          .from('dirty_area_reports')
          .update(updateData)
          .eq('id', reportId)
          .select()

        console.log('Dirty area report update result:', { data, error, rowCount: data?.length })

        if (error) {
          console.error('Supabase error:', error)
          return { data: null, error }
        }

        if (!data || data.length === 0) {
          console.error('No rows updated for reportId:', reportId)
          return { data: null, error: new Error('Report not found or no changes made - likely RLS policy blocking admin update') }
        }

        // Return the first item if data exists, otherwise null
        return { data: data[0], error: null }
      } catch (err) {
        console.error("Database dirty area report updateStatus error:", err)
        return { data: null, error: err }
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
          .order("cost", { ascending: true })

        return { data, error }
      } catch (err) {
        console.error("Database rewards getAll error:", err)
        return { data: [], error: err }
      }
    },

    async redeem(userId: string, rewardId: string) {
      try {
        // First check if user has enough coins and reward exists
        const { data: reward } = await supabase
          .from("rewards")
          .select("cost, is_available")
          .eq("id", rewardId)
          .single()

        if (!reward || !reward.is_available) {
          return { data: null, error: { message: "Reward not available" } }
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("eco_coins")
          .eq("id", userId)
          .single()

        if (!profile || profile.eco_coins < reward.cost) {
          return { data: null, error: { message: "Insufficient coins" } }
        }

        // Check if already redeemed
        const { data: existingReward } = await supabase
          .from("user_rewards")
          .select("id")
          .eq("user_id", userId)
          .eq("reward_id", rewardId)
          .single()

        if (existingReward) {
          return { data: null, error: { message: "Reward already redeemed" } }
        }

        // Deduct coins from user
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ eco_coins: profile.eco_coins - reward.cost })
          .eq("id", userId)

        if (updateError) {
          return { data: null, error: updateError }
        }

        // Add to user rewards
        const { data, error } = await supabase
          .from("user_rewards")
          .insert({
            user_id: userId,
            reward_id: rewardId,
            status: 'redeemed'
          })
          .select()
          .single()

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