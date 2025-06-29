"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Coins } from "lucide-react"

interface Achievement {
  title: string
  description: string
  icon: string
  coinsEarned: number
}

interface AchievementModalProps {
  isOpen: boolean
  onClose: () => void
  achievement: Achievement
}

export function AchievementModal({ isOpen, onClose, achievement }: AchievementModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-6 text-center relative">
                <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", bounce: 0.6 }}
                  className="text-6xl mb-4"
                >
                  {achievement.icon}
                </motion.div>

                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                  <h2 className="text-2xl font-bold mb-2">Achievement Unlocked!</h2>
                  <h3 className="text-xl font-semibold text-primary mb-2">{achievement.title}</h3>
                  <p className="text-muted-foreground mb-4">{achievement.description}</p>

                  <Badge variant="secondary" className="text-lg px-4 py-2 mb-6">
                    <Coins className="w-4 h-4 mr-2" />+{achievement.coinsEarned} EcoCoins
                  </Badge>

                  <Button onClick={onClose} className="w-full">
                    Awesome! 🎉
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
