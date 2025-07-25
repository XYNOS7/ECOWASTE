"use client"

import { useState, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { HomeScreen } from "@/components/screens/home-screen"
import { ReportWasteScreen } from "@/components/screens/report-waste-screen"
import { MapScreen } from "@/components/screens/map-screen"
import { LeaderboardScreen } from "@/components/screens/leaderboard-screen"
import { RewardsScreen } from "@/components/screens/rewards-screen"
import { SettingsScreen } from "@/components/screens/settings-screen"
import { AuthScreen } from "@/components/screens/auth-screen"
import { AdminLoginScreen } from "@/components/screens/admin-login-screen"
import { AdminDashboardScreen } from "@/components/screens/admin-dashboard-screen"
import { AchievementModal } from "@/components/achievement-modal"
import { LoadingFallback } from "@/components/loading-fallback"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { database } from "@/lib/database"
import { EcoTipsScreen } from "@/components/screens/eco-tips-screen"

export type Screen = "home" | "report-waste" | "map" | "leaderboard" | "rewards" | "settings" | "auth" | "admin-login" | "admin-dashboard" | "eco-tips"

function EcoTrackAppContent() {
  const { user, profile, loading, refreshProfile, signOut } = useAuth()
  const [currentScreen, setCurrentScreen] = useState<Screen>("home")
  const [showAchievement, setShowAchievement] = useState(false)
  const [newAchievement, setNewAchievement] = useState<any>(null)
  const { toast } = useToast()
  const [isAdminMode, setIsAdminMode] = useState(false)

  const screenVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  }

  const handleReportSubmit = async (type: "waste" | "dirty-area", data: any) => {
    if (!user || !profile) return

    // Check database connection
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co"
    if (supabaseUrl === "https://example.supabase.co") {
      toast({
        title: "Database Not Connected ❌",
        description: "Please configure Supabase in Secrets tab for reports to work",
        variant: "destructive",
      })
      return
    }

    try {
      let result
      if (type === "waste") {
        result = await database.wasteReports.create({
          user_id: user.id,
          title: data.title || `${data.category} Report`,
          description: data.description,
          category: data.category,
          image_url: data.imageUrl,
          location_address: data.location,
          location_lat: data.locationLat,
          location_lng: data.locationLng,
          ai_detected_category: data.aiDetectedCategory,
        })
      } else {
        result = await database.dirtyAreaReports.create({
          user_id: user.id,
          title: data.title || "Dirty Area Report",
          description: data.description,
          image_url: data.imageUrl,
          location_address: data.location,
        })
      }

      if (result.data) {
        // Refresh the profile to get updated coins and report count from database triggers
        await refreshProfile()

        // Determine coins earned based on type and category
        let coinsEarned = 10 // Default for dirty area reports
        if (type === "waste") {
          switch (data.category) {
            case 'e-waste':
              coinsEarned = 20
              break
            case 'hazardous':
              coinsEarned = 25
              break
            default:
              coinsEarned = 15
          }
        }

        // Update user level based on total reports (every 10 reports = +1 level)
        if (profile) {
          const newReportCount = profile.total_reports + 1
          const newLevel = Math.floor(newReportCount / 10) + 1

          if (newLevel > profile.level) {
            await database.profiles.update(user.id, { level: newLevel })
          }
        }

        toast({
          title: "Report Submitted! 🎉",
          description: `You earned ${coinsEarned} EcoCoins for helping keep our environment clean!`,
        })

        setCurrentScreen("home")
      }
    } catch (error) {
      console.error("Error submitting report:", error)
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setCurrentScreen("auth")
      setIsAdminMode(false)
    } catch (error) {
      console.error("Sign out error:", error)
      setCurrentScreen("auth")
      setIsAdminMode(false)
    }
  }

  const handleAdminLogin = () => {
    setIsAdminMode(true)
    setCurrentScreen("admin-dashboard")
  }

  const handleAdminSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Admin sign out error:", error)
    } finally {
      setIsAdminMode(false)
      setCurrentScreen("home")
    }
  }

  const handleBackToUser = () => {
    setCurrentScreen("auth")
  }

  const renderScreen = () => {
    if (!profile) return null

    switch (currentScreen) {
      case "home":
        return <HomeScreen profile={profile} onNavigate={setCurrentScreen} />
      case "report-waste":
        return <ReportWasteScreen onSubmit={handleReportSubmit} onBack={() => setCurrentScreen("home")} />
      case "map":
        return <MapScreen />
      case "leaderboard":
        return <LeaderboardScreen profile={profile} />
      case "rewards":
        return <RewardsScreen profile={profile} />
      case "eco-tips":
        return <EcoTipsScreen />
      case "settings":
        return <SettingsScreen profile={profile} onSignOut={signOut} onNavigate={setCurrentScreen} />
      default:
        return <HomeScreen profile={profile} onNavigate={setCurrentScreen} />
    }
  }

  if (loading) {
    return <LoadingFallback />
  }

  // Show auth screen if not authenticated (unless in admin mode)
  if (!user || (!profile && !isAdminMode)) {
    if (currentScreen === "admin-login") {
      return (
        <AdminLoginScreen 
          onAdminLogin={handleAdminLogin}
          onBackToUser={handleBackToUser}
        />
      )
    }
    return (
      <AuthScreen 
        onAuthSuccess={() => setCurrentScreen("home")}
        onAdminLogin={() => setCurrentScreen("admin-login")}
      />
    )
  }

  // Show admin dashboard if in admin mode
  if (isAdminMode && currentScreen === "admin-dashboard") {
    return <AdminDashboardScreen onSignOut={handleAdminSignOut} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="pb-20 pt-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            variants={screenVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="container mx-auto px-4"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </div>

      <Navigation currentScreen={currentScreen} onNavigate={setCurrentScreen} />

      <AchievementModal
        isOpen={showAchievement}
        onClose={() => setShowAchievement(false)}
        achievement={
          newAchievement
            ? {
                title: newAchievement.title,
                description: newAchievement.description,
                icon: newAchievement.icon,
                coinsEarned: newAchievement.coins_reward,
              }
            : {
                title: "Achievement Unlocked!",
                description: "Great job!",
                icon: "🏆",
                coinsEarned: 0,
              }
        }
      />
    </div>
  )

}

export default function EcoTrackApp() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EcoTrackAppContent />
    </Suspense>
  )

}