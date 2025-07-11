"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Shield, Search, CheckCircle, Clock, Trash2, Eye, LogOut, Filter, Users, TrendingUp, AlertTriangle, Activity } from "lucide-react"
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

export function AdminDashboardScreen({ onSignOut }: AdminDashboardScreenProps) {
  const { user } = useAuth()
  const [admin, setAdmin] = useState<any>(null)
  const [reports, setReports] = useState<CombinedReport[]>([])
  const [admins, setAdmins] = useState<any[]>([])
  const [filteredReports, setFilteredReports] = useState<CombinedReport[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
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

  // New states for user management
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("reports") // Default to reports tab

  useEffect(() => {
    if (user) {
      loadAdminData()
      fetchReports()
      loadAdmins()
      fetchDashboardStats()
      fetchUsers() // Load users
    }
  }, [user])

  // Fetch users from database
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await database.profiles.getLeaderboard(1000) // Assuming 1000 is enough for now
      if (error) {
        throw error
      }
      setUsers(data || [])
      setFilteredUsers(data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    filterUsers()
  }, [users, userSearchTerm])

  const filterUsers = () => {
    let filtered = users

    if (userSearchTerm) {
      filtered = filtered.filter(user =>
        user.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
      )
    }

    setFilteredUsers(filtered)
  }

  const deleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to permanently delete user ${userEmail}? This action cannot be undone.`)) {
      return
    }

    try {
      setLoading(true)
      // Delete user from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      if (authError) {
        throw authError
      }

      // Delete user from profiles table
      const { error: profilesError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profilesError) {
        throw profilesError
      }

      // Optimistically update the UI
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId))
      setFilteredUsers(prevFilteredUsers => prevFilteredUsers.filter(user => user.id !== userId))

      toast({
        title: "Success",
        description: `User ${userEmail} deleted successfully`,
      })
    } catch (error: any) {
      console.error('Error deleting user:', error)
      toast({
        title: "Error",
        description: error.message || `Failed to delete user ${userEmail}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAdminData = async () => {
    if (!user) return
    const adminData = await database.admins.get(user.id)
    setAdmin(adminData)
  }

  const loadAdmins = async () => {
    const { data, error } = await database.admins.getAll()
    if (error) {
      console.error("Error loading admins:", error)
    } else {
      setAdmins(data || [])
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

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardStats()
    }, 30000)

    return () => {
      wasteReportsSubscription.unsubscribe()
      dirtyAreaSubscription.unsubscribe()
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    filterReports()
  }, [reports, searchTerm, statusFilter, typeFilter])

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
        {/* Navigation Tabs */}
        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reports" onClick={() => setActiveTab("reports")}>Waste Reports</TabsTrigger>
            <TabsTrigger value="users" onClick={() => setActiveTab("users")}>Users</TabsTrigger>
            <TabsTrigger value="admins">Admin Management</TabsTrigger>
          </TabsList>

          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Admin Management
                </CardTitle>
                <CardDescription>
                  Manage admin accounts and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((adminItem) => (
                      <TableRow key={adminItem.id}>
                        <TableCell className="font-medium">{adminItem.full_name}</TableCell>
                        <TableCell>{adminItem.username}</TableCell>
                        <TableCell>{adminItem.email}</TableCell>
                        <TableCell>{new Date(adminItem.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">Admin</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <>
        {/* Users Management Section */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* User Management Header */}
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8" />
                    <div>
                      <h2 className="text-2xl font-bold">User Management</h2>
                      <p className="text-green-100">Manage user accounts and permissions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">{users.length}</p>
                    <p className="text-green-100 text-sm">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search Users */}
            <Card>
              <CardContent className="p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search users..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Users ({filteredUsers.length})
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
                          <TableHead>Name</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Eco Coins</TableHead>
                          <TableHead>Reports</TableHead>
                          <TableHead>Level</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((userItem) => (
                          <TableRow key={userItem.id}>
                            <TableCell className="font-medium">
                              {userItem.full_name || 'N/A'}
                            </TableCell>
                            <TableCell>{userItem.username || 'N/A'}</TableCell>
                            <TableCell>{userItem.email}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {userItem.eco_coins || 0}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {userItem.total_reports || 0}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="default">
                                Level {userItem.level || 1}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(userItem.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={loading}
                                onClick={() => deleteUser(userItem.id, userItem.email)}
                                className="hover:bg-red-600"
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
          </div>
        )}

        {/* Reports Management Section */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            {/* Filters */}
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

            {/* Reports Table */}
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
                          <TableHead>Type</TableHead>
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
                                <Badge variant={report.type === 'waste' ? 'default' : 'secondary'}>
                                  {report.type === 'waste' ? 'Waste' : 'Dirty Area'}
                                </Badge>
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
          </div>
        )}
      </div>
    </div>
  )
}