"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Coins, Star } from "lucide-react"
import type { Profile } from "@/lib/supabase"

interface RewardsScreenProps {
  profile: Profile
}

export function RewardsScreen({ profile }: RewardsScreenProps) {
  const rewards = [
    {
      id: 1,
      title: "Coffee Shop Voucher",
      description: "Free coffee with any purchase",
      cost: 120,
      image: "/placeholder.svg?height=80&width=80",
      category: "Food & Drink",
      available: true,
    },
    {
      id: 2,
      title: "Movie Ticket Discount",
      description: "10% off on any movie ticket",
      cost: 100,
      image: "/placeholder.svg?height=80&width=80",
      category: "Entertainment",
      available: true,
    },
    {
      id: 3,
      title: "Zomato Voucher",
      description: "₹50 off on orders above ₹200",
      cost: 200,
      image: "/placeholder.svg?height=80&width=80",
      category: "Food & Drink",
      available: false,
    },
    {
      id: 4,
      title: "Amazon Gift Card",
      description: "5% off on any purchase",
      cost: 300,
      image: "/placeholder.svg?height=80&width=80",
      category: "Shopping",
      available: false,
    },
    {
      id: 5,
      title: "Plant Sapling",
      description: "Free tree sapling for planting",
      cost: 80,
      image: "/placeholder.svg?height=80&width=80",
      category: "Environment",
      available: true,
    },
    {
      id: 6,
      title: "Eco-friendly Bag",
      description: "Reusable shopping bag",
      cost: 150,
      image: "/placeholder.svg?height=80&width=80",
      category: "Environment",
      available: false,
    },
  ]

  const categories = ["All", "Food & Drink", "Entertainment", "Shopping", "Environment"]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="bg-yellow-500 text-white rounded-full w-12 h-12 flex items-center justify-center">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Reward Store</h2>
                <p className="text-muted-foreground">Redeem your EcoCoins for amazing rewards!</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                <Coins className="w-4 h-4 mr-1" />
                {profile.eco_coins} EcoCoins
              </Badge>
              <Badge variant="outline">Available Balance</Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 overflow-x-auto pb-2"
      >
        {categories.map((category, index) => (
          <Button key={category} variant={index === 0 ? "default" : "outline"} size="sm" className="whitespace-nowrap">
            {category}
          </Button>
        ))}
      </motion.div>

      {/* Rewards Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {rewards.map((reward, index) => (
          <motion.div
            key={reward.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="group"
          >
            <Card
              className={`h-full transition-all duration-200 ${
                reward.available ? "hover:shadow-lg cursor-pointer" : "opacity-75"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <img
                      src={reward.image || "/placeholder.svg"}
                      alt={reward.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    {!reward.available && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-medium">Locked</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-sm">{reward.title}</h3>
                        <p className="text-xs text-muted-foreground">{reward.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {reward.category}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        <span className="font-bold text-sm">{reward.cost}</span>
                      </div>

                      <Button
                        size="sm"
                        disabled={!reward.available || profile.eco_coins < reward.cost}
                        className="text-xs"
                      >
                        {!reward.available ? "Locked" : profile.eco_coins < reward.cost ? "Insufficient" : "Redeem"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Earning Tips */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              How to Earn More EcoCoins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { action: "Report Waste", coins: "+15 coins", icon: "📸" },
                { action: "Daily Check-in", coins: "+5 coins", icon: "📅" },
                { action: "Share Achievement", coins: "+10 coins", icon: "🎉" },
              ].map((tip, index) => (
                <div key={tip.action} className="text-center p-3 rounded-lg bg-muted/30">
                  <div className="text-2xl mb-2">{tip.icon}</div>
                  <p className="font-medium text-sm">{tip.action}</p>
                  <p className="text-xs text-green-600 font-semibold">{tip.coins}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
