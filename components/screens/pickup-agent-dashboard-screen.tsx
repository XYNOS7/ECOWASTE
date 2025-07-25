
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Star, 
  Phone, 
  LogOut, 
  User,
  Award,
  Calendar,
  Navigation
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { database } from "@/lib/database"

interface PickupAgentDashboardScreenProps {
  agent: any
  onSignOut: () => void
}

interface CollectionTask {
  id: string
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  waste_report_id: string
  assigned_at: string
  started_at?: string
  completed_at?: string
  notes?: string
  waste_report?: {
    title: string
    description: string
    category: string
    location_address: string
    location_lat?: number
    location_lng?: number
    user_id: string
    profiles?: {
      username: string
      phone_number?: string
    }
  }
}

export function PickupAgentDashboardScreen({ agent, onSignOut }: PickupAgentDashboardScreenProps) {
  const [tasks, setTasks] = useState<CollectionTask[]>([])
  const [completedTasks, setCompletedTasks] = useState<CollectionTask[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("tasks")
  const { toast } = useToast()

  useEffect(() => {
    loadTasks()
  }, [agent.id])

  const loadTasks = async () => {
    try {
      const { data: allTasks, error } = await database.pickupAgents.getTasks(agent.id)
      if (error) {
        console.error("Error loading tasks:", error)
        return
      }

      const activeTasks = allTasks?.filter(task => 
        task.status === 'assigned' || task.status === 'in_progress'
      ) || []
      const completedTasks = allTasks?.filter(task => 
        task.status === 'completed'
      ) || []

      setTasks(activeTasks)
      setCompletedTasks(completedTasks)
    } catch (err) {
      console.error("Error loading tasks:", err)
    } finally {
      setLoading(false)
    }
  }

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const { error } = await database.pickupAgents.updateTaskStatus(taskId, status)
      if (error) {
        toast({
          title: "Error",
          description: "Failed to update task status",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: `Task ${status === 'in_progress' ? 'started' : 'completed'} successfully`,
      })

      // Reload tasks
      loadTasks()
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'assigned':
        return <Badge variant="secondary">Assigned</Badge>
      case 'in_progress':
        return <Badge variant="default" className="bg-orange-500">In Progress</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Truck className="w-8 h-8 animate-pulse mx-auto mb-2" />
          <p>Loading your tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-green-500 rounded-lg flex items-center justify-center mr-3">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Eco Guardian
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Welcome back, {agent.full_name}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={onSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Truck className="w-8 h-8 text-orange-500 mr-3" />
                  <div>
                    <p className="text-sm text-muted-foreground">Active Tasks</p>
                    <p className="text-2xl font-bold">{tasks.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">{agent.total_collections || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Award className="w-8 h-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm text-muted-foreground">Points Earned</p>
                    <p className="text-2xl font-bold">{agent.points_earned || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Star className="w-8 h-8 text-yellow-500 mr-3" />
                  <div>
                    <p className="text-sm text-muted-foreground">Rating</p>
                    <p className="text-2xl font-bold">4.8</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tasks">Collection Tasks</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="help">Help</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your Collection Tasks</h2>
            </div>
            
            {tasks.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Truck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Active Tasks</h3>
                  <p className="text-muted-foreground">New collection tasks will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <Card key={task.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">
                              {task.waste_report?.category?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Collection
                            </h3>
                            {getStatusBadge(task.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {task.waste_report?.title}
                          </p>
                          <div className="flex items-center text-sm text-muted-foreground mb-2">
                            <MapPin className="w-4 h-4 mr-1" />
                            {task.waste_report?.location_address}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="w-4 h-4 mr-1" />
                            Assigned: {formatDate(task.assigned_at)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {task.status === 'assigned' && (
                          <Button 
                            onClick={() => updateTaskStatus(task.id, 'in_progress')}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            Start Collection
                          </Button>
                        )}
                        {task.status === 'in_progress' && (
                          <Button 
                            onClick={() => updateTaskStatus(task.id, 'completed')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Mark Completed
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Navigation className="w-4 h-4 mr-1" />
                          Navigate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <h2 className="text-2xl font-bold">Past Pickups</h2>
            
            {completedTasks.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Completed Tasks</h3>
                  <p className="text-muted-foreground">Your completed tasks will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedTasks.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <h3 className="text-lg font-semibold">
                              {task.waste_report?.category?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Collection
                            </h3>
                            <Badge variant="default" className="bg-green-500">Completed</Badge>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 mr-1" />
                            {task.waste_report?.location_address}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Clock className="w-4 h-4 mr-1" />
                            Completed: {task.completed_at ? formatDate(task.completed_at) : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-center">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-green-600" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name:</p>
                    <p className="text-lg font-semibold">{agent.full_name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Phone Number:</p>
                    <p className="text-lg font-semibold">{agent.phone_number}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Points Earned:</p>
                    <p className="text-lg font-semibold">{agent.points_earned || 0}</p>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  onClick={onSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="help" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Help & Support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">How to start a collection?</h3>
                    <p className="text-sm text-muted-foreground">
                      Click "Start Collection" on any assigned task to begin the pickup process.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">How to mark a task as completed?</h3>
                    <p className="text-sm text-muted-foreground">
                      Once you've collected the waste, click "Mark Completed" to finish the task.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Need assistance?</h3>
                    <p className="text-sm text-muted-foreground">
                      Contact support at +91 9876543210 for any help.
                    </p>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Support
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
