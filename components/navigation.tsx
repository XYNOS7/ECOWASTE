
'use client'

import type React from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import type { Screen } from "@/app/[locale]/page"
import { useTranslations } from 'next-intl'
import { Home, MapPin, Gift, Trophy, Settings, FileText } from "lucide-react"

interface NavigationProps {
  currentScreen: Screen
  onNavigate: (screen: Screen) => void
}

export function Navigation({ currentScreen, onNavigate }: NavigationProps) {
  const { theme } = useTheme()
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="flex justify-around items-center py-2 px-4 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentScreen === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-[60px]",
                isActive
                  ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
                  : "text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/10"
              )}
              aria-label={item.label}
            >
              <Icon className={cn("w-5 h-5 mb-1", isActive && "animate-pulse")} />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
