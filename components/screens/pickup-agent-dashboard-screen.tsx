
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Navigation,
  Home,
  History,
  HelpCircle,
  Play,
  Camera,
  Upload
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { database } from "@/lib/database"
import { supabase } from "@/lib/supabase"

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
  const [activeView, setActiveView] = useState("home")
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadTasks()
    
    // Set up real-time subscriptions for collection tasks
    const taskSubscription = supabase
      .channel('collection_tasks_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'collection_tasks'
      }, (payload) => {
        console.log('Collection task changed:', payload)
        loadTasks() // Refresh tasks when any task changes
      })
      .subscribe()

    // Also listen for waste report status changes
    const wasteReportSubscription = supabase
      .channel('waste_reports_changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'waste_reports'
      }, (payload) => {
        console.log('Waste report changed:', payload)
        loadTasks() // Refresh tasks when waste reports change
      })
      .subscribe()

    // Set up backup refresh every 30 seconds
    const interval = setInterval(() => {
      loadTasks()
    }, 30000)

    return () => {
      taskSubscription.unsubscribe()
      wasteReportSubscription.unsubscribe()
      clearInterval(interval)
    }
  }, [agent.id])

  const loadTasks = async () => {
    try {
      console.log("Loading tasks for agent:", agent.id)
      
      // Fetch real collection tasks for this agent from database
      const { data: collectionTasks, error } = await database.pickupAgents.getTasks(agent.id)
      
      if (error) {
        console.error("Error loading tasks:", error)
        setTasks([])
        setCompletedTasks([])
        setLoading(false)
        return
      }

      console.log("Received collection tasks:", collectionTasks?.length || 0, collectionTasks)

      // Filter tasks based on waste report status for real-time updates
      const activeTasks = (collectionTasks || []).filter(task => {
        // Only show tasks that are assigned or in progress AND have waste reports that are in-progress
        const isActiveStatus = task.status === 'assigned' || task.status === 'in_progress'
        const hasActiveWasteReport = task.waste_report && task.waste_report.status === 'in-progress'
        
        return isActiveStatus && hasActiveWasteReport
      })

      // Get completed tasks (either collection task is completed OR waste report is completed)
      const completedTasksData = (collectionTasks || []).filter(task => {
        const isTaskCompleted = task.status === 'completed'
        const isWasteReportCompleted = task.waste_report && task.waste_report.status === 'completed'
        
        return isTaskCompleted || isWasteReportCompleted
      })

      console.log("Active tasks:", activeTasks.length, "Completed tasks:", completedTasksData.length)

      setTasks(activeTasks)
      setCompletedTasks(completedTasksData)
      setLoading(false)
    } catch (error) {
      console.error("Error loading tasks:", error)
      setTasks([])
      setCompletedTasks([])
      setLoading(false)
    }
  }

  const startCollection = async (taskId: string) => {
    try {
      // First assign the task to this agent
      const { data: assignedTask, error: assignError } = await database.pickupAgents.assignTaskToAgent(taskId, agent.id)
      
      if (assignError || !assignedTask) {
        throw new Error(assignError?.message || 'Failed to assign task - may have been taken by another agent')
      }

      // Then update task status to in_progress
      const { data, error } = await database.pickupAgents.updateTaskStatus(taskId, 'in_progress')
      
      if (error) {
        throw new Error(error.message || 'Failed to start collection')
      }

      // Refresh tasks to get updated data and remove task from other agents
      await loadTasks()

      toast({
        title: "Collection Started!",
        description: "Task assigned to you and collection started.",
      })
    } catch (error) {
      console.error("Error starting collection:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to start collection. Please try again.",
        variant: "destructive",
      })
      
      // Refresh tasks in case of error to get latest state
      await loadTasks()
    }
  }

  const handleUploadPhoto = async (taskId: string) => {
    try {
      setUploadingPhoto(taskId)
      
      // Create file input element
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.capture = 'environment' // Use back camera on mobile
      
      const filePromise = new Promise<File | null>((resolve) => {
        input.onchange = (e) => {
          const target = e.target as HTMLInputElement
          const file = target.files?.[0] || null
          resolve(file)
        }
        input.oncancel = () => resolve(null)
      })
      
      input.click()
      const file = await filePromise
      
      if (!file) {
        setUploadingPhoto(null)
        return
      }

      // Upload photo to storage
      const { url, error: uploadError } = await database.storage.uploadImage(file, agent.id, "collection-photos")
      
      if (uploadError || !url) {
        throw new Error(uploadError?.message || 'Failed to upload photo')
      }

      // Update collection task with photo URL
      const { error: updateError } = await database.pickupAgents.updateTaskPhoto(taskId, url)
      
      if (updateError) {
        throw new Error(updateError.message || 'Failed to save photo reference')
      }

      toast({
        title: "Photo Uploaded!",
        description: "Collection photo has been uploaded successfully.",
      })
      
      // Refresh tasks to get updated data
      await loadTasks()
      
    } catch (error) {
      console.error("Error uploading photo:", error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload collection photo. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingPhoto(null)
    }
  }

  const completeCollection = async (taskId: string) => {
    try {
      // Update task status in database
      const { data, error } = await database.pickupAgents.updateTaskStatus(taskId, 'completed')
      
      if (error) {
        throw new Error(error.message || 'Failed to complete collection')
      }

      // Refresh tasks to get updated data
      await loadTasks()

      toast({
        title: "Collection Completed!",
        description: "Great job! The waste has been collected successfully.",
      })
    } catch (error) {
      console.error("Error completing collection:", error)
      toast({
        title: "Error",
        description: "Failed to complete collection. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unassigned':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Available for Pickup</Badge>
      case 'assigned':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Assigned to You</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Completed</Badge>
      default:
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Pending</Badge>
    }
  }

  const getDistance = (task: CollectionTask) => {
    // Calculate mock distance based on location
    const distances = ["2.3 km", "1.5 km", "3.8 km"]
    return distances[Math.floor(Math.random() * distances.length)]
  }

  const getTimeSlot = (task: CollectionTask) => {
    const now = new Date()
    const today = now.toLocaleDateString('en-US', { weekday: 'long' })
    const tomorrow = new Date(now.getTime() + 86400000).toLocaleDateString('en-US', { weekday: 'long' })
    const yesterday = new Date(now.getTime() - 86400000).toLocaleDateString('en-US', { weekday: 'long' })
    
    if (task.status === 'completed') {
      return `${yesterday}, 3:00 PM - 5:00 PM`
    } else if (task.id === "2") {
      return `${tomorrow}, 10:00 AM - 12:00 PM`
    }
    return `${today}, 2:00 PM - 4:00 PM`
  }

  const renderTaskCard = (task: CollectionTask) => (
    <Card key={task.id} className="mb-4 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
              {task.waste_report?.category === 'e-waste' ? (
                <Truck className="w-4 h-4 text-gray-600" />
              ) : (
                <Star className="w-4 h-4 text-blue-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {task.waste_report?.title || "Collection Task"}
              </h3>
              <p className="text-sm text-gray-500">
                {getDistance(task)} away
              </p>
            </div>
          </div>
          {getStatusBadge(task.status)}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{task.waste_report?.location_address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{getTimeSlot(task)}</span>
          </div>
        </div>

        {(task.status === 'unassigned' || task.status === 'assigned') && (
          <Button 
            onClick={() => startCollection(task.id)}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <Play className="w-4 h-4 mr-2" />
            {task.status === 'unassigned' ? 'Accept & Start Collection' : 'Start Collection'}
          </Button>
        )}

        {task.status === 'in_progress' && (
          <div className="space-y-3">
            <Button 
              onClick={() => handleUploadPhoto(task.id)}
              disabled={uploadingPhoto === task.id}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
            >
              {uploadingPhoto === task.id ? (
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Camera className="w-4 h-4 mr-2" />
              )}
              {uploadingPhoto === task.id ? 'Uploading...' : 'Upload Collection Photo'}
            </Button>
            <Button 
              onClick={() => completeCollection(task.id)}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Completed
            </Button>
          </div>
        )}

        {task.status === 'completed' && (
          <Button 
            variant="outline"
            className="w-full border-gray-200 text-gray-600"
            disabled
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Completed
          </Button>
        )}
      </CardContent>
    </Card>
  )

  const renderHomeView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Truck className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Eco Guardian</h1>
            <p className="text-sm text-gray-500">Welcome back, {agent.full_name}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSignOut}
          className="text-gray-500 hover:text-gray-700"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Collection Tasks</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={loadTasks}
            disabled={loading}
            className="text-green-600 border-green-200 hover:bg-green-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Navigation className="w-4 h-4" />
            )}
          </Button>
        </div>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No active collection tasks</p>
              <p className="text-sm text-gray-400 mt-1">Check back later for new assignments</p>
            </div>
          ) : (
            tasks.map(renderTaskCard)
          )}
        </div>
      </div>
    </div>
  )

  const renderHistoryView = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Collection History</h2>
      <div className="space-y-4">
        {completedTasks.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No completed collections yet</p>
          </div>
        ) : (
          completedTasks.map(renderTaskCard)
        )}
      </div>
    </div>
  )

  const renderProfileView = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">{agent.full_name}</h2>
        <p className="text-gray-500">{agent.phone_number}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{agent.points_earned || 0}</p>
            <p className="text-sm text-gray-500">Points Earned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{agent.total_collections || 0}</p>
            <p className="text-sm text-gray-500">Collections</p>
          </CardContent>
        </Card>
      </div>

      <Button 
        onClick={onSignOut}
        variant="outline" 
        className="w-full border-red-200 text-red-600 hover:bg-red-50"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    </div>
  )

  const renderHelpView = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Help & Support</h2>
      
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">How to start a collection?</h3>
            <p className="text-sm text-gray-600">
              Tap on "Start Collection" button on any assigned task to begin the pickup process.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Contact Support</h3>
            <p className="text-sm text-gray-600 mb-2">
              Need help? Contact our support team:
            </p>
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Phone className="w-4 h-4" />
              <span>+91 9876543210</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <div className="p-4 pb-20">
          {activeView === "home" && renderHomeView()}
          {activeView === "history" && renderHistoryView()}
          {activeView === "profile" && renderProfileView()}
          {activeView === "help" && renderHelpView()}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200">
          <div className="flex justify-around py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveView("home")}
              className={`flex flex-col items-center gap-1 ${
                activeView === "home" ? "text-green-600" : "text-gray-400"
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveView("history")}
              className={`flex flex-col items-center gap-1 ${
                activeView === "history" ? "text-green-600" : "text-gray-400"
              }`}
            >
              <History className="w-5 h-5" />
              <span className="text-xs">History</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveView("profile")}
              className={`flex flex-col items-center gap-1 ${
                activeView === "profile" ? "text-green-600" : "text-gray-400"
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-xs">Profile</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveView("help")}
              className={`flex flex-col items-center gap-1 ${
                activeView === "help" ? "text-green-600" : "text-gray-400"
              }`}
            >
              <HelpCircle className="w-5 h-5" />
              <span className="text-xs">Help</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
