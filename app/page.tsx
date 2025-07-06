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
import { AchievementModal } from "@/components/achievement-modal"
import { LoadingFallback } from "@/components/loading-fallback"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { database } from "@/lib/database"

export type Screen = "home" | "report-waste" | "map" | "leaderboard" | "rewards" | "settings"

function EcoTrackAppContent() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const [currentScreen, setCurrentScreen] = useState<Screen>("home")
  const [showAchievement, setShowAchievement] = useState(false)
  const [newAchievement, setNewAchievement] = useState<any>(null)
  const { toast } = useToast()

  const screenVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  }

  const handleReportSubmit = async (type: "waste" | "dirty-area", data: any) => {
    if (!user || !profile) return

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
          location_lat: data.latitude,
          location_lng: data.longitude,
          ai_detected_category: data.aiDetectedCategory,
        })
      } else {
        result = await database.dirtyAreaReports.create({
          user_id: user.id,
          title: data.title || "Dirty Area Report",
          description: data.description,
          image_url: data.imageUrl,
          location_address: data.location,
          location_lat: data.latitude,
          location_lng: data.longitude,
        })
      }

      const coinsEarned = type === "waste" ? 15 : 10

      // Update user's profile with new coins and report count
      if (result.data) {
        await database.profiles.update(user.id, {
          eco_coins: profile.eco_coins + coinsEarned,
          total_reports: profile.total_reports + 1,
          waste_collected: profile.waste_collected + (type === "waste" ? 5 : 0),
        })

        // Refresh the profile to show updated data
        await refreshProfile()
      }

      toast({
        title: "Report Submitted! 🎉",
        description: `You earned ${coinsEarned} EcoCoins!`,
      })

      setCurrentScreen("home")
    } catch (error) {
      console.error("Error submitting report:", error)
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      })
    }
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
      case "settings":
        return <SettingsScreen />
      default:
        return <HomeScreen profile={profile} onNavigate={setCurrentScreen} />
    }
  }

  if (loading) {
    return <LoadingFallback />
  }

  if (!user) {
    return <AuthScreen />
  }

  if (!profile) {
    return <LoadingFallback />
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