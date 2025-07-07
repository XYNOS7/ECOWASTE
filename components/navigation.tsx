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
}</old_str>

const navItems = [
  { id: "home" as Screen, icon: Home, label: "Home" },
  { id: "map" as Screen, icon: MapPin, label: "Map" },
  { id: "report-waste" as Screen, icon: Camera, label: "Camera", isCamera: true },
  { id: "rewards" as Screen, icon: Gift, label: "Rewards" },
  { id: "settings" as Screen, icon: Settings, label: "Settings" },
]

export function Navigation({ currentScreen, onNavigate }: NavigationProps) {
  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-50"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="bg-background/95 backdrop-blur-lg border-t border-border/50 shadow-lg">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentScreen === item.id

            return (
              <motion.button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 relative",
                  item.isCamera
                    ? "bg-black text-white rounded-full w-12 h-12"
                    : isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                )}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
              >
                {isActive && !item.isCamera && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon
                  className={cn(
                    "mb-1",
                    item.isCamera ? "w-6 h-6" : "w-5 h-5",
                    isActive && !item.isCamera && "text-primary",
                  )}
                />
                {!item.isCamera && (
                  <span className={cn("text-xs font-medium transition-colors", isActive && "text-primary")}>
                    {item.label}
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.nav>
  )
}
