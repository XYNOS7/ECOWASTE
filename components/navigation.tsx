"use client"

import { motion } from "framer-motion"
import { Home, MapPin, Gift, Settings, Camera } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Screen } from "@/app/page"

'use client'

import { useTranslations } from 'next-intl'
import { Home, MapPin, Gift, Trophy, Settings, FileText } from "lucide-react"

export type Screen = "home" | "report" | "map" | "rewards" | "leaderboard" | "settings"

interface NavigationProps {
  currentScreen: Screen
  onNavigate: (screen: Screen) => void
}

export function Navigation({ currentScreen, onNavigate }: NavigationProps) {
  const t = useTranslations('navigation')

  const navItems = [
    { id: "home" as Screen, icon: Home, label: t('home') },
    { id: "report" as Screen, icon: FileText, label: t('report') },
    { id: "map" as Screen, icon: MapPin, label: t('map') },
    { id: "rewards" as Screen, icon: Gift, label: t('rewards') },
    { id: "leaderboard" as Screen, icon: Trophy, label: t('leaderboard') },
    { id: "settings" as Screen, icon: Settings, label: t('settings') },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentScreen === item.id

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}