"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Shield, Search, CheckCircle, Clock, Trash2, Eye, LogOut, Filter, Users, TrendingUp, AlertTriangle, Activity, Coins, Camera } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { database } from "@/lib/database"
import { auth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import type { WasteReport, DirtyAreaReport } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"

interface AdminDashboardScreenProps {
  onSignOut: () => void
}

type CombinedReport = (WasteReport | DirtyAreaReport) & {
  type: 'waste' | 'dirty-area'
  profiles?: { username: string; avatar_url?: string }
}

interface DashboardStats {
  totalUsers: number
  totalReports: number
  incompleteReports: number
  userGrowth: string
  reportsGrowth: string
}

interface User {
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

export function AdminDashboardScreen({ onSignOut }: AdminDashboardScreenProps) {
  const { user } = useAuth()
  const [admin, setAdmin] = useState<any>(null)
  const [reports, setReports] = useState<CombinedReport[]>([])
  const [admins, setAdmins] = useState<any[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [filteredReports, setFilteredReports] = useState<CombinedReport[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [searchTerm, setSearchTerm] = useState("")
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalReports: 0,
    incompleteReports: 0,
    userGrowth: "+0%",
    reportsGrowth: "+0%"
  })
  const [recentActivity, setRecentActivity] = useState<CombinedReport[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      loadAdminData()
      fetchReports()
      loadUsers()
      fetchDashboardStats()
      // Load admins separately to ensure it's not interfering with other calls
      loadAdmins()
    }
  }, [user])

  const loadUsers = async () => {
    try {
      const { data, error } = await database.profiles.getLeaderboard(1000)
      if (error) {
        console.error("Error loading users:", error)
      } else {
        setUsers(data || [])
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const loadAdminData = async () => {
    if (!user) return
    const adminData = await database.admins.get(user.id)
    setAdmin(adminData)
  }

  const loadAdmins = async () => {
    try {
      const { data, error } = await database.admins.getAll()
      if (error) {
        console.error("Error loading admins:", error)
        // Only show toast if it's not a network error that might resolve itself
        if (!error.message?.includes('Failed to fetch')) {
          toast({
            title: "Error",
            description: "Failed to load admin data",
            variant: "destructive",
          })
        }
      } else if (data) {
        console.log("Loaded admins:", data.length, "admins")
        setAdmins(data)
      }
    } catch (error) {
      console.error("Exception loading admins:", error)
      // Only show toast for non-network errors
      if (!error.message?.includes('Failed to fetch')) {
        toast({
          title: "Error", 
          description: "Failed to load admin data",
          variant: "destructive",
        })
      }
    }
  }

  const fetchDashboardStats = async () => {
    try {
      // Get all profiles for total users
      const { data: allProfiles } = await database.profiles.getLeaderboard(1000)
      const totalUsers = allProfiles?.length || 0

      // Get all reports
      const [wasteReportsData, dirtyAreaReportsData] = await Promise.all([
        database.wasteReports.getAll(),
        database.dirtyAreaReports.getAll()
      ])

      const allReports = [
        ...(wasteReportsData.data || []),
        ...(dirtyAreaReportsData.data || [])
      ]

      const totalReports = allReports.length
      const incompleteReports = allReports.filter(report => 
        report.status === 'pending' || 
        report.status === 'reported' || 
        report.status === 'in-progress' || 
        report.status === 'waiting'
      ).length

      // Calculate growth percentages (mock data for now - you can implement real calculation)
      const userGrowth = totalUsers > 0 ? `+${Math.floor(Math.random() * 20)}%` : "+0%"
      const reportsGrowth = totalReports > 0 ? `+${Math.floor(Math.random() * 15)}%` : "+0%"

      setDashboardStats({
        totalUsers,
        totalReports,
        incompleteReports,
        userGrowth,
        reportsGrowth
      })

      // Get recent pending reports for activity
      const pendingReports = allReports
        .filter(report => report.status === 'pending' || report.status === 'reported')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)

      const recentWithType = [
        ...pendingReports.filter(report => 'category' in report).map(report => ({ ...report, type: 'waste' as const })),
        ...pendingReports.filter(report => !('category' in report)).map(report => ({ ...report, type: 'dirty-area' as const }))
      ]

      setRecentActivity(recentWithType)

    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    }
  }

  useEffect(() => {
    fetchReports()

    // Set up real-time subscriptions
    const wasteReportsSubscription = supabase
      .channel('waste_reports_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waste_reports' }, () => {
        fetchReports()
        fetchDashboardStats()
      })
      .subscribe()

    const dirtyAreaSubscription = supabase
      .channel('dirty_area_reports_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dirty_area_reports' }, () => {
        fetchReports()
        fetchDashboardStats()
      })
      .subscribe()

    // Add real-time subscription for admin table changes
    const adminSubscription = supabase
      .channel('admin_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admins' }, () => {
        console.log("Admin table changed, reloading admins...")
        loadAdmins()
      })
      .subscribe()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardStats()
      // Only refresh admins if we're on the settings tab to avoid unnecessary calls
      if (activeTab === "settings") {
        loadAdmins()
      }
    }, 30000)

    return () => {
      wasteReportsSubscription.unsubscribe()
      dirtyAreaSubscription.unsubscribe()
      adminSubscription.unsubscribe()
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    filterReports()
  }, [reports, searchTerm, statusFilter, typeFilter])

  useEffect(() => {
    filterUsers()
  }, [users, userSearchTerm])

  const filterUsers = () => {
    let filtered = users

    if (userSearchTerm) {
      filtered = filtered.filter(user => 
        user.full_name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
      )
    }

    setFilteredUsers(filtered)
  }

  const fetchReports = async () => {
    try {
      const [wasteReportsData, dirtyAreaReportsData] = await Promise.all([
        database.wasteReports.getAll(),
        database.dirtyAreaReports.getAll()
      ])

      const combinedReports: CombinedReport[] = [
        ...(wasteReportsData.data || []).map(report => ({ ...report, type: 'waste' as const })),
        ...(dirtyAreaReportsData.data || []).map(report => ({ ...report, type: 'dirty-area' as const }))
      ]

      combinedReports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setReports(combinedReports)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch reports",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterReports = () => {
    let filtered = reports

    if (searchTerm) {
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.profiles?.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(report => report.status === statusFilter)
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(report => report.type === typeFilter)
    }

    setFilteredReports(filtered)
  }

  const updateReportStatus = async (reportId: string, newStatus: string, reportType: 'waste' | 'dirty-area') => {
    try {
      setLoading(true)

      let result
      if (reportType === 'waste') {
        result = await database.wasteReports.updateStatus(reportId, newStatus as any)
      } else {
        result = await database.dirtyAreaReports.updateStatus(reportId, newStatus as any)
      }

      if (result.error) {
        throw new Error(result.error.message || 'Failed to update report status')
      }

      if (!result.data) {
        throw new Error('Report not found or update failed')
      }

      // Update local state
      setReports(prevReports => 
        prevReports.map(report => 
          report.id === reportId && report.type === reportType
            ? { ...report, status: newStatus, updated_at: new Date().toISOString() }
            : report
        )
      )

      toast({
        title: "Success",
        description: `Report status updated to ${newStatus.replace('-', ' ')}`,
      })

      // Refresh data
      await Promise.all([fetchReports(), fetchDashboardStats()])
    } catch (error: any) {
      console.error('Error updating report status:', error)
      toast({
        title: "Error",
        description: error?.message || "Failed to update report status",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteReport = async (reportId: string, reportType: 'waste' | 'dirty-area') => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return
    }

    try {
      setLoading(true)
      const tableName = reportType === 'waste' ? 'waste_reports' : 'dirty_area_reports'
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', reportId)

      if (error) throw error

      setReports(prevReports => 
        prevReports.filter(report => !(report.id === reportId && report.type === reportType))
      )

      toast({
        title: "Success",
        description: "Report deleted successfully",
      })

      await fetchDashboardStats()
    } catch (error: any) {
      console.error('Error deleting report:', error)
      toast({
        title: "Error",
        description: error?.message || "Failed to delete report",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to permanently delete ${userName} and all their data? This action cannot be undone.`)) {
      return
    }

    try {
      setLoading(true)

      // Delete user's waste reports
      const { error: wasteReportsError } = await supabase
        .from('waste_reports')
        .delete()
        .eq('user_id', userId)

      if (wasteReportsError) {
        console.error('Error deleting waste reports:', wasteReportsError)
      }

      // Delete user's dirty area reports
      const { error: dirtyAreaReportsError } = await supabase
        .from('dirty_area_reports')
        .delete()
        .eq('user_id', userId)

      if (dirtyAreaReportsError) {
        console.error('Error deleting dirty area reports:', dirtyAreaReportsError)
      }

      // Delete user's activity logs
      const { error: activityLogsError } = await supabase
        .from('activity_logs')
        .delete()
        .eq('user_id', userId)

      if (activityLogsError) {
        console.error('Error deleting activity logs:', activityLogsError)
      }

      // Delete user's achievements
      const { error: achievementsError } = await supabase
        .from('user_achievements')
        .delete()
        .eq('user_id', userId)

      if (achievementsError) {
        console.error('Error deleting user achievements:', achievementsError)
      }

      // Delete user's rewards
      const { error: rewardsError } = await supabase
        .from('user_rewards')
        .delete()
        .eq('user_id', userId)

      if (rewardsError) {
        console.error('Error deleting user rewards:', rewardsError)
      }

      // Delete user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileError) throw profileError

      // Delete auth user (this will cascade delete everything else)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)

      if (authError) {
        console.error('Error deleting auth user:', authError)
        // Still continue if profile deletion worked
      }

      // Update local state
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId))

      toast({
        title: "Success",
        description: `User ${userName} and all their data has been permanently deleted`,
      })

      // Refresh dashboard stats
      await Promise.all([fetchDashboardStats(), loadUsers()])
    } catch (error: any) {
      console.error('Error deleting user:', error)
      toast({
        title: "Error",
        description: error?.message || "Failed to delete user. Some data may have been partially deleted.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await auth.signOut()
    onSignOut()
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary'
      case 'reported': return 'secondary'
      case 'in-progress': return 'default'
      case 'waiting': return 'default'
      case 'collected': return 'default'
      case 'cleaned': return 'default'
      case 'completed': return 'default'
      default: return 'secondary'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600'
      case 'reported': return 'text-yellow-600'
      case 'in-progress': return 'text-blue-600'
      case 'waiting': return 'text-blue-600'
      case 'collected': return 'text-green-600'
      case 'cleaned': return 'text-green-600'
      case 'completed': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getNextStatus = (currentStatus: string, reportType: 'waste' | 'dirty-area') => {
    if (currentStatus === 'pending' || currentStatus === 'reported') {
      return 'in-progress'
    }
    if (currentStatus === 'in-progress' || currentStatus === 'waiting') {
      return reportType === 'waste' ? 'completed' : 'completed'
    }
    return null
  }

  const getActionButtonText = (status: string) => {
    if (status === 'pending' || status === 'reported') {
      return 'Verify'
    }
    if (status === 'in-progress' || status === 'waiting') {
      return 'Complete'
    }
    return null
  }

  const getPriorityBadge = (status: string) => {
    if (status === 'pending' || status === 'reported') {
      return <Badge variant="destructive" className="text-xs">HIGH</Badge>
    }
    if (status === 'in-progress' || status === 'waiting') {
      return <Badge variant="default" className="text-xs">MEDIUM</Badge>
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center mr-3">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  EcoWaste Admin
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage your eco-friendly platform with style
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
            <Button 
              variant={activeTab === "dashboard" ? "default" : "ghost"} 
              size="sm" 
              className={activeTab === "dashboard" ? "bg-blue-600 text-white" : "text-gray-600"}
              onClick={() => setActiveTab("dashboard")}
            >
              Dashboard
            </Button>
            <Button 
              variant={activeTab === "users" ? "default" : "ghost"} 
              size="sm" 
              className={activeTab === "users" ? "bg-green-600 text-white" : "text-gray-600"}
              onClick={() => setActiveTab("users")}
            >
              Users
            </Button>
            <Button 
              variant={activeTab === "reports" ? "default" : "ghost"} 
              size="sm" 
              className={activeTab === "reports" ? "bg-purple-600 text-white" : "text-gray-600"}
              onClick={() => setActiveTab("reports")}
            >
              Reports
            </Button>
            <Button 
              variant={activeTab === "settings" ? "default" : "ghost"} 
              size="sm" 
              className={activeTab === "settings" ? "bg-indigo-600 text-white" : "text-gray-600"}
              onClick={() => setActiveTab("settings")}
            >
              Settings
            </Button>
          </div>
        </div>

        {/* Dashboard Stats Cards - Only show on dashboard tab */}
        {activeTab === "dashboard" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium mb-1">Total Users</p>
                    <p className="text-3xl font-bold">{dashboardStats.totalUsers.toLocaleString()}</p>
                    <p className="text-blue-100 text-sm mt-2">{dashboardStats.userGrowth} from last month</p>
                  </div>
                  <Users className="w-12 h-12 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Reports */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium mb-1">Total Reports</p>
                    <p className="text-3xl font-bold">{dashboardStats.totalReports.toLocaleString()}</p>
                    <p className="text-green-100 text-sm mt-2">{dashboardStats.reportsGrowth} from yesterday</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Incomplete Reports */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium mb-1">Incomplete Reports</p>
                    <p className="text-3xl font-bold">{dashboardStats.incompleteReports}</p>
                    <p className="text-orange-100 text-sm mt-2">Requires attention</p>
                  </div>
                  <AlertTriangle className="w-12 h-12 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        )}

        {/* Recent Reports Activity */}
        {activeTab === "dashboard" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                <CardTitle className="text-white">Recent Reports Activity</CardTitle>
              </div>
              <p className="text-purple-100 text-sm">Latest user reports that need attention or are in progress</p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse bg-purple-400/30 h-16 rounded-lg"></div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((report, index) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5 text-yellow-300" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{report.profiles?.username || 'Anonymous User'}</span>
                              {getPriorityBadge(report.status)}
                              <Badge variant="outline" className="text-white border-white/30 text-xs">
                                {report.status.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-purple-100 text-sm">{report.title}</p>
                            <p className="text-purple-200 text-xs">
                              Submitted report • {new Date(report.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="border-white/30 text-white hover:bg-white/10"
                          onClick={() => setActiveTab("reports")}
                        >
                          View Report
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 mx-auto text-purple-200 mb-3" />
                  <p className="text-purple-100">No recent activity</p>
                  <p className="text-purple-200 text-sm">All reports are up to date!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        )}

        {/* Users Section */}
        {activeTab === "users" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6" />
                <CardTitle className="text-white text-xl">User Management</CardTitle>
              </div>
              <p className="text-green-100 text-sm">Manage user accounts and permissions</p>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-200 w-4 h-4" />
                <Input
                  placeholder="Search users..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-green-200"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Registered Users ({filteredUsers.length})
              </CardTitle>
              <CardDescription>
                All registered users in the system with their details and actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Eco Coins</TableHead>
                        <TableHead>Reports</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((userItem) => (
                        <TableRow key={userItem.id}>
                          <TableCell className="font-medium">{userItem.username}</TableCell>
                          <TableCell className="font-mono text-sm">{userItem.email}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Coins className="w-4 h-4 text-yellow-500" />
                              {userItem.eco_coins}
                            </div>
                          </TableCell>
                          <TableCell>{userItem.total_reports}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={loading}
                              onClick={() => deleteUser(userItem.id, userItem.full_name || userItem.username)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No users found matching your search.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        )}

        {/* Settings Section */}
        {activeTab === "settings" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Admin Profile Section */}
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">Admin Profile</CardTitle>
                  <p className="text-blue-100 text-sm">Manage your admin account and preferences</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {admin?.username?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{admin?.full_name || 'Admin User'}</h3>
                    <p className="text-blue-100">@{admin?.username || 'admin'}</p>
                    <p className="text-blue-200 text-sm">{admin?.email || 'admin@example.com'}</p>
                    <Badge className="mt-2 bg-blue-500 text-white">ADMIN</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-100 text-sm">
                    <Activity className="w-4 h-4" />
                    Member Since
                  </div>
                  <p className="text-white font-semibold">
                    {admin?.created_at ? new Date(admin.created_at).toLocaleDateString() : '7/10/2025'}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-100 text-sm">
                    <Users className="w-4 h-4" />
                    Last Updated
                  </div>
                  <p className="text-white font-semibold">
                    {admin?.updated_at ? new Date(admin.updated_at).toLocaleDateString() : '7/10/2025'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Management Section */}
          <Card className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-white" />
                <div>
                  <CardTitle className="text-white text-xl">Admin Management</CardTitle>
                  <p className="text-purple-100 text-sm">View and manage other admin accounts</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-200 w-4 h-4" />
                <Input
                  placeholder="Search admins..."
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-purple-200"
                />
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : admins.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-purple-200 mb-3" />
                  <p className="text-purple-100">No admin accounts found</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 border-white/30 text-white hover:bg-white/10"
                    onClick={loadAdmins}
                  >
                    Refresh Admins
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {admins.map((adminItem, index) => (
                    <motion.div
                      key={adminItem.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.1 }}
                      className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {adminItem.username?.charAt(0).toUpperCase() || 'A'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{adminItem.full_name || adminItem.username}</span>
                              <Badge className="bg-indigo-500 text-white text-xs">
                                {adminItem.id === admin?.id ? 'SUPER ADMIN' : 'ADMIN'}
                              </Badge>
                            </div>
                            <p className="text-purple-100 text-sm">@{adminItem.username}</p>
                            <p className="text-purple-200 text-xs">{adminItem.email}</p>
                            <p className="text-purple-200 text-xs">
                              Last active: {new Date(adminItem.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {adminItem.id === admin?.id ? (
                            <>
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span className="text-green-300 text-xs">ACTIVE</span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <span className="text-gray-300 text-xs">OFFLINE</span>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Account Actions</CardTitle>
              <CardDescription>Manage your admin session</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-red-600" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-700 dark:text-red-400">Sign Out</h4>
                    <p className="text-sm text-red-600 dark:text-red-300">End your current admin session</p>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={handleSignOut}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        )}

        {/* Reports Section - Only show on reports tab */}
        {activeTab === "reports" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Reports Content */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search reports, users, descriptions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reported">Reported</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="collected">Collected</SelectItem>
                    <SelectItem value="cleaned">Cleaned</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="waste">Waste Reports</SelectItem>
                    <SelectItem value="dirty-area">Dirty Area Reports</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Reports ({filteredReports.length})
              </CardTitle>
            </CardHeader>
            <CardContent>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Image</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReports.map((report) => {
                          const nextStatus = getNextStatus(report.status, report.type)
                          const actionText = getActionButtonText(report.status)

                          return (
                            <TableRow key={`${report.type}-${report.id}`}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {report.image_url ? (
                                    <img
                                      src={report.image_url}
                                      alt={report.title}
                                      className="w-12 h-12 rounded-lg object-cover shadow-sm border"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border">
                                      <Camera className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                  )}
                                  <Badge variant={report.type === 'waste' ? 'default' : 'secondary'} className="text-xs">
                                    {report.type === 'waste' ? 'Waste' : 'Dirty Area'}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {report.title}
                              </TableCell>
                              <TableCell>
                                {report.profiles?.username || 'Unknown User'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(report.status)} className={getStatusColor(report.status)}>
                                  {report.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {'category' in report ? report.category : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {new Date(report.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {nextStatus && actionText && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={loading}
                                      onClick={() => updateReportStatus(report.id, nextStatus, report.type)}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      {actionText}
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700"
                                    disabled={loading}
                                    onClick={() => deleteReport(report.id, report.type)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                  <Button 
                            variant="default" 
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200"
                            onClick={() => {
                              // Scroll to top of reports section
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                              // You could also implement a modal or detailed view here
                            }}
                          >
                            View Report
                          </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                    {filteredReports.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No reports found matching your filters.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
        </motion.div>
        )}
      </div>
    </div>
  )
}