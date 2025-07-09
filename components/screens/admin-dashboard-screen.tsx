
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
import { Shield, Search, CheckCircle, Clock, Trash2, Eye, LogOut, Filter, Users } from "lucide-react"
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
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      loadAdminData()
      fetchReports()
      loadAdmins()
    }
  }, [user])

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

  useEffect(() => {
    fetchReports()

    // Set up real-time subscriptions
    const wasteReportsSubscription = supabase
      .channel('waste_reports_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waste_reports' }, () => {
        fetchReports()
      })
      .subscribe()

    const dirtyAreaSubscription = supabase
      .channel('dirty_area_reports_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dirty_area_reports' }, () => {
        fetchReports()
      })
      .subscribe()

    return () => {
      wasteReportsSubscription.unsubscribe()
      dirtyAreaSubscription.unsubscribe()
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
      
      console.log('Updating report:', { reportId, newStatus, reportType })
      
      let result
      if (reportType === 'waste') {
        result = await database.wasteReports.updateStatus(reportId, newStatus as any)
      } else {
        result = await database.dirtyAreaReports.updateStatus(reportId, newStatus as any)
      }

      console.log('Update result:', result)

      if (result.error) {
        console.error('Database error:', result.error)
        throw new Error(result.error.message || 'Failed to update report status')
      }

      if (!result.data) {
        console.error('No data returned from update')
        throw new Error('Report not found or update failed')
      }

      // Update local state immediately for better UX
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

      // Refresh reports to get the latest data
      await fetchReports()
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
    // Confirm deletion with stronger warning
    if (!confirm('⚠️ PERMANENT DELETION WARNING ⚠️\n\nThis will PERMANENTLY delete this report from the database and cannot be undone.\n\nThe user\'s report count will be decremented and this action is irreversible.\n\nAre you absolutely sure you want to proceed?')) {
      return
    }

    try {
      setLoading(true)
      
      // Get the report details before deletion to update user stats
      const report = reports.find(r => r.id === reportId && r.type === reportType)
      
      if (!report) {
        throw new Error('Report not found')
      }

      console.log('🗑️ Admin permanently deleting report:', { reportId, reportType, userId: report.user_id })

      // Permanently delete from database
      let deleteResult
      if (reportType === 'waste') {
        deleteResult = await database.wasteReports.delete(reportId)
      } else {
        // For dirty area reports, use direct Supabase delete
        deleteResult = await supabase
          .from('dirty_area_reports')
          .delete()
          .eq('id', reportId)
          .select()
          .single()
      }

      if (deleteResult.error) {
        throw deleteResult.error
      }

      // Update user's profile to decrement total_reports
      if (report.user_id) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('total_reports')
          .eq('id', report.user_id)
          .single()

        if (userProfile) {
          await supabase
            .from('profiles')
            .update({ 
              total_reports: Math.max(userProfile.total_reports - 1, 0),
              updated_at: new Date().toISOString()
            })
            .eq('id', report.user_id)
        }
      }

      // Update local state immediately
      setReports(prevReports => 
        prevReports.filter(report => !(report.id === reportId && report.type === reportType))
      )

      toast({
        title: "Report Permanently Deleted",
        description: `${reportType === 'waste' ? 'Waste' : 'Dirty Area'} report has been permanently removed from the database`,
      })

      console.log('✅ Report permanently deleted successfully')

      // Real-time subscriptions will notify user dashboards automatically
    } catch (error: any) {
      console.error('❌ Error permanently deleting report:', error)
      toast({
        title: "Deletion Failed",
        description: error?.message || "Failed to permanently delete report",
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
      case 'rejected': return 'destructive'
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
      case 'rejected': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getNextStatus = (currentStatus: string, reportType: 'waste' | 'dirty-area') => {
    if (currentStatus === 'pending' || currentStatus === 'reported') {
      return 'in-progress'
    }
    if (currentStatus === 'in-progress' || currentStatus === 'waiting') {
      return reportType === 'waste' ? 'collected' : 'cleaned'
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-slate-600 dark:text-slate-400 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  EcoTrack Management Portal
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { title: "Total Reports", value: reports.length, color: "text-blue-600" },
            { title: "Pending", value: reports.filter(r => r.status === 'pending' || r.status === 'reported').length, color: "text-yellow-600" },
            { title: "In Progress", value: reports.filter(r => r.status === 'in-progress' || r.status === 'waiting').length, color: "text-blue-600" },
            { title: "Completed", value: reports.filter(r => r.status === 'collected' || r.status === 'cleaned').length, color: "text-green-600" },
          ].map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.title}
                      </p>
                      <p className={`text-3xl font-bold ${stat.color}`}>
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs for Reports and Admin Management */}
        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reports">Waste Reports</TabsTrigger>
            <TabsTrigger value="admins">Admin Management</TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
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
          </TabsContent>

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
        </Tabs>
      </div>
    </div>
  )
}
