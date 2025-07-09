"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Coins, Leaf, Flame, TrendingUp, Camera, MapPin, Lightbulb, Trophy } from "lucide-react"
import { database } from "@/lib/database"
import type { Screen } from "@/app/page"
import type { Profile, ActivityLog } from "@/lib/supabase"
import { Activity } from "lucide-react"

interface HomeScreenProps {
  profile: Profile
  onNavigate: (screen: Screen) => void
}

export function HomeScreen({ profile, onNavigate }: HomeScreenProps) {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [communityStats, setCommunityStats] = useState({
    totalUsers: 0,
    totalReports: 0,
    totalCoins: 0,
  })
  const [loading, setLoading] = useState(true)
  const [userReports, setUserReports] = useState<any[]>([])

  const levelProgress = ((profile.total_reports % 10) / 10) * 100

  const quickActions = [
    {
      title: "Report Waste",
      description: "Upload photos for pickup",
      icon: Camera,
      color: "bg-green-500",
      action: () => onNavigate("report-waste"),
    },
    {
      title: "View Map",
      description: "Find nearby reports",
      icon: MapPin,
      color: "bg-blue-500",
      action: () => onNavigate("map"),
    },
    {
      title: "Leaderboard",
      description: "See top eco-warriors",
      icon: Trophy,
      color: "bg-yellow-500",
      action: () => onNavigate("leaderboard"),
    },
    {
      title: "Eco Tips",
      description: "Learn sustainability",
      icon: Lightbulb,
      color: "bg-purple-500",
      action: () => {},
    },
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user's activity logs
        const { data: logs } = await database.activityLogs.getByUser(profile.id, 5)
        setActivityLogs(logs || [])

        // Fetch community stats
        const { data: leaderboard } = await database.profiles.getLeaderboard(100)
        if (leaderboard) {
          setCommunityStats({
            totalUsers: leaderboard.length,
            totalReports: leaderboard.reduce((sum, user) => sum + user.total_reports, 0),
            totalCoins: leaderboard.reduce((sum, user) => sum + user.eco_coins, 0),
          })
        }

        // Fetch user reports (both waste and dirty area reports)
        const [wasteReportsResult, dirtyAreaReportsResult] = await Promise.all([
          database.wasteReports.getByUser(profile.id),
          database.dirtyAreaReports.getByUser(profile.id)
        ])

        const allReports = [
          ...(wasteReportsResult.data || []).map(report => ({ ...report, type: 'waste' })),
          ...(dirtyAreaReportsResult.data || []).map(report => ({ ...report, type: 'dirty' }))
        ]

        // Sort by creation date and limit to 5 most recent
        allReports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setUserReports(allReports.slice(0, 5))

      } catch (error) {
        console.error("Error fetching home screen data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Auto-refresh community stats every 2 minutes
    const interval = setInterval(async () => {
      try {
        const { data: leaderboard } = await database.profiles.getLeaderboard(100)
        if (leaderboard) {
          setCommunityStats({
            totalUsers: leaderboard.length,
            totalReports: leaderboard.reduce((sum, user) => sum + user.total_reports, 0),
            totalCoins: leaderboard.reduce((sum, user) => sum + user.eco_coins, 0),
          })
        }
      } catch (error) {
        console.error("Error refreshing community stats:", error)
      }
    }, 120000) // 2 minutes

    return () => clearInterval(interval)
  }, [profile.id])

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="bg-gradient-to-r from-green-600 to-emerald-500 text-white border-0 overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <CardHeader className="relative">
            <CardTitle className="text-2xl font-bold">Welcome back, {profile.username}! 👋</CardTitle>
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="bg-yellow-400 text-black rounded-full w-8 h-8 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <span className="font-semibold">{profile.eco_coins} EcoCoins</span>
              </div>
              <div className="flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-200" />
                <span>{profile.waste_collected}kg Collected</span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-200" />
                <span>{profile.streak} Day Streak</span>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Level Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Level {profile.level}</CardTitle>
              <Badge variant="secondary" className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {profile.total_reports}/10 Reports
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={levelProgress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {10 - (profile.total_reports % 10)} more reports to level up!
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Community Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Live Community Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{communityStats.totalUsers}</div>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{communityStats.totalReports}</div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{communityStats.totalCoins}</div>
                <p className="text-sm text-muted-foreground">EcoCoins Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            >
              <Card
                className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 bg-gradient-to-br from-background to-muted/20"
                onClick={action.action}
              >
                <CardContent className="p-6">
                  <div
                    className={`${action.color} text-white rounded-full w-12 h-12 flex items-center justify-center mb-4`}
                  >
                    <action.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{action.title}</h3>
                  <p className="text-muted-foreground text-sm">{action.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : userReports.length > 0 ? (
              <div className="space-y-3">
                {userReports.slice(0, 5).map((report, index) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <div className="relative">
                      {report.image_url ? (
                        <img
                          src={report.image_url || "/placeholder.svg"}
                          alt={report.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <Camera className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                        report.status === 'collected' || report.status === 'cleaned' ? 'bg-green-500' :
                        report.status === 'in-progress' ? 'bg-yellow-500' : 'bg-orange-500'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{report.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.location_address || 'Location not specified'} • {new Date(report.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {report.type === 'waste' ? 'Waste' : 'Dirty Area'}
                        </Badge>
                        <Badge variant={
                          report.status === 'collected' || report.status === 'cleaned' ? 'default' : 'outline'
                        } className="text-xs">
                          {report.status}
                        </Badge>
                      </div>
                    </div>
                    {report.coins_earned > 0 && (
                      <Badge variant="outline" className="text-xs">
                        +{report.coins_earned}
                      </Badge>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No reports yet</p>
                <p className="text-sm text-muted-foreground mt-1">Start reporting to see your activity here!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}