"use client"

import { motion } from "framer-motion"
import { Home, MapPin, Gift, Settings, Camera } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Screen } from "@/app/page"

interface NavigationProps {
  currentScreen: Screen
  onNavigate: (screen: Screen) => void
}

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
