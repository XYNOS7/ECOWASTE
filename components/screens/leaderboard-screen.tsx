"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Medal, Award, Coins, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { database } from "@/lib/database"
import type { Profile } from "@/lib/supabase"

interface LeaderboardScreenProps {
  profile: Profile
}

interface LeaderboardUser {
  id: string
  username: string
  total_reports: number
  eco_coins: number
  avatar_url?: string
  rank: number
  isCurrentUser?: boolean
}

export function LeaderboardScreen({ profile }: LeaderboardScreenProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([])
  const [userAchievements, setUserAchievements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchLeaderboard = async () => {
    try {
      const { data: profiles, error } = await database.profiles.getLeaderboard(50) // Get top 50

      if (error) {
        console.error("Error fetching leaderboard:", error)
        return
      }

      if (!profiles || profiles.length === 0) {
        setLeaderboardData([])
        return
      }

      // Add rank and mark current user
      const rankedData = profiles.map((user, index) => ({
        ...user,
        rank: index + 1,
        isCurrentUser: user.id === profile.id,
      }))

      setLeaderboardData(rankedData)
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
      setLeaderboardData([])
    }
  }

  const fetchUserAchievements = async () => {
    try {
      const { data: achievements } = await database.achievements.getUserAchievements(profile.id)
      setUserAchievements(achievements || [])
    } catch (error) {
      console.error("Error fetching achievements:", error)
      setUserAchievements([])
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchLeaderboard(), fetchUserAchievements()])
    setRefreshing(false)
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchLeaderboard(), fetchUserAchievements()])
      setLoading(false)
    }

    loadData()

    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchLeaderboard, 30000)
    return () => clearInterval(interval)
  }, [profile.id])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const currentUserRank = leaderboardData.find((user) => user.isCurrentUser)?.rank || 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-4"></div>
          <div className="h-32 bg-muted rounded mb-6"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Live Leaderboard</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* User Rank Card */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Your Current Rank</p>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-8 h-8 text-primary" />
                <span className="text-4xl font-bold text-primary">
                  {currentUserRank > 0 ? `#${currentUserRank}` : "Unranked"}
                </span>
              </div>
              <p className="text-muted-foreground">
                {leaderboardData.length > 1
                  ? `Competing with ${leaderboardData.length - 1} other eco-warriors!`
                  : "Be the first to start earning points!"}
              </p>
              <div className="flex justify-center gap-4 mt-4">
                <Badge variant="secondary">{profile.total_reports} Reports</Badge>
                <Badge variant="outline">{profile.eco_coins} EcoCoins</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Leaderboard List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Top Eco-Warriors</span>
              <Badge variant="outline" className="text-xs">
                {leaderboardData.length} Active Users
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {leaderboardData.length > 0 ? (
              leaderboardData.slice(0, 20).map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                    user.isCurrentUser ? "bg-primary/10 border border-primary/20 shadow-sm" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-center w-12 h-12">{getRankIcon(user.rank)}</div>

                  <Avatar className="w-10 h-10">
                    <AvatarFallback className={user.isCurrentUser ? "bg-primary text-primary-foreground" : ""}>
                      {user.username?.slice(0, 2).toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className={`font-medium ${user.isCurrentUser ? "text-primary" : ""}`}>
                      {user.username || "Anonymous"}
                      {user.isCurrentUser && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {user.total_reports} reports • Level {Math.floor(user.total_reports / 10) + 1}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Coins className="w-4 h-4 text-yellow-500" />
                    <span className="font-bold">{user.eco_coins}</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Rankings Yet</h3>
                <p className="text-muted-foreground mb-4">Be the first to submit a report and claim the top spot!</p>
                <Badge variant="outline">Start your eco-journey today</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Real User Achievements */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle>Your Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            {userAchievements.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {userAchievements.map((userAchievement, index) => (
                  <motion.div
                    key={userAchievement.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="text-center p-4 rounded-lg border bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                  >
                    <div className="text-2xl mb-2">{userAchievement.achievements?.icon || "🏆"}</div>
                    <p className="text-sm font-medium">{userAchievement.achievements?.title || "Achievement"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(userAchievement.earned_at).toLocaleDateString()}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🎯</div>
                <p className="text-muted-foreground">No achievements yet</p>
                <p className="text-sm text-muted-foreground mt-2">Submit reports to unlock achievements!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Live Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader>
            <CardTitle>Community Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-green-600">
                  {leaderboardData.reduce((sum, user) => sum + user.total_reports, 0)}
                </div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-blue-600">{leaderboardData.length}</div>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-yellow-600">
                  {leaderboardData.reduce((sum, user) => sum + user.eco_coins, 0)}
                </div>
                <p className="text-sm text-muted-foreground">Total EcoCoins</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.floor(leaderboardData.reduce((sum, user) => sum + user.total_reports, 0) * 5)}kg
                </div>
                <p className="text-sm text-muted-foreground">Waste Collected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
