
'use client'

import type React from "react"
import { useState, Suspense } from "react"
import { useTranslations } from 'next-intl'
import { AuthScreen } from "@/components/screens/auth-screen"
import { HomeScreen } from "@/components/screens/home-screen"
import { ReportWasteScreen } from "@/components/screens/report-waste-screen"
import { MapScreen } from "@/components/screens/map-screen"
import { RewardsScreen } from "@/components/screens/rewards-screen"
import { LeaderboardScreen } from "@/components/screens/leaderboard-screen"
import { SettingsScreen } from "@/components/screens/settings-screen"
import { Navigation } from "@/components/navigation"
import { LoadingFallback } from "@/components/loading-fallback"
import { AchievementModal } from "@/components/achievement-modal"
import { useAuth } from "@/hooks/use-auth"

export type Screen = "home" | "report" | "map" | "rewards" | "leaderboard" | "settings"

export default function LocalizedApp() {
  const { user, loading } = useAuth()
  const [currentScreen, setCurrentScreen] = useState<Screen>("home")
  const [achievementModalOpen, setAchievementModalOpen] = useState(false)
  const t = useTranslations()

  if (loading) {
    return <LoadingFallback />
  }

  if (!user) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <AuthScreen />
      </Suspense>
    )
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "home":
        return <HomeScreen onNavigate={setCurrentScreen} onAchievement={() => setAchievementModalOpen(true)} />
      case "report":
        return <ReportWasteScreen onNavigate={setCurrentScreen} onAchievement={() => setAchievementModalOpen(true)} />
      case "map":
        return <MapScreen onNavigate={setCurrentScreen} />
      case "rewards":
        return <RewardsScreen onNavigate={setCurrentScreen} />
      case "leaderboard":
        return <LeaderboardScreen onNavigate={setCurrentScreen} />
      case "settings":
        return <SettingsScreen onNavigate={setCurrentScreen} />
      default:
        return <HomeScreen onNavigate={setCurrentScreen} onAchievement={() => setAchievementModalOpen(true)} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Suspense fallback={<LoadingFallback />}>
        {renderScreen()}
        <Navigation currentScreen={currentScreen} onNavigate={setCurrentScreen} />
        <AchievementModal 
          open={achievementModalOpen} 
          onOpenChange={setAchievementModalOpen}
          achievement={{
            id: "1",
            title: t('common.success'),
            description: t('common.success'),
            icon: "🏆",
            points: 100
          }}
        />
      </Suspense>
    </div>
  )
}
