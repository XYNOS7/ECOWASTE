
"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Coins, Star, Check, Lock, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { database } from "@/lib/database"
import type { Profile } from "@/lib/supabase"

interface RewardsScreenProps {
  profile: Profile
}

interface Reward {
  id: string
  title: string
  description: string
  cost: number
  image_url?: string
  category: string
  is_available: boolean
}

interface UserReward {
  id: string
  reward_id: string
  status: string
  redeemed_at: string
  rewards: Reward
}

export function RewardsScreen({ profile }: RewardsScreenProps) {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [userRewards, setUserRewards] = useState<UserReward[]>([])
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [userCoins, setUserCoins] = useState(profile.eco_coins)
  const { toast } = useToast()

  const categories = ["All", "Food & Drink", "Entertainment", "Shopping", "Environment"]

  useEffect(() => {
    loadRewards()
    loadUserRewards()
  }, [profile.id])

  const loadRewards = async () => {
    try {
      const { data, error } = await database.rewards.getAll()
      if (error) {
        console.error("Error loading rewards:", error)
        toast({
          title: "Error",
          description: "Failed to load rewards",
          variant: "destructive",
        })
      } else {
        setRewards(data || [])
      }
    } catch (error) {
      console.error("Exception loading rewards:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserRewards = async () => {
    try {
      const { data, error } = await database.rewards.getUserRewards(profile.id)
      if (error) {
        console.error("Error loading user rewards:", error)
      } else {
        setUserRewards(data || [])
      }
    } catch (error) {
      console.error("Exception loading user rewards:", error)
    }
  }

  const redeemReward = async (rewardId: string, rewardTitle: string, cost: number) => {
    if (userCoins < cost) {
      toast({
        title: "Insufficient Coins",
        description: `You need ${cost} EcoCoins to redeem this reward. You have ${userCoins} coins.`,
        variant: "destructive",
      })
      return
    }

    setRedeeming(rewardId)
    try {
      const { data, error } = await database.rewards.redeem(profile.id, rewardId)
      
      if (error) {
        throw new Error(error.message || 'Failed to redeem reward')
      }

      if (!data) {
        throw new Error('Redemption failed')
      }

      // Update local state
      setUserCoins(userCoins - cost)
      
      // Reload user rewards to show the newly redeemed reward
      await loadUserRewards()

      toast({
        title: "Reward Redeemed!",
        description: `Successfully redeemed "${rewardTitle}" for ${cost} EcoCoins!`,
      })

    } catch (error: any) {
      console.error('Error redeeming reward:', error)
      toast({
        title: "Redemption Failed",
        description: error?.message || "Failed to redeem reward. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRedeeming(null)
    }
  }

  const isRewardRedeemed = (rewardId: string) => {
    return userRewards.some(ur => ur.reward_id === rewardId)
  }

  const getButtonState = (reward: Reward) => {
    if (!reward.is_available) {
      return { text: "Locked", disabled: true, variant: "secondary" as const, icon: Lock }
    }
    
    if (isRewardRedeemed(reward.id)) {
      return { text: "Redeemed", disabled: true, variant: "default" as const, icon: Check }
    }
    
    if (userCoins < reward.cost) {
      return { text: "Insufficient", disabled: true, variant: "destructive" as const, icon: AlertCircle }
    }
    
    return { text: "Redeem", disabled: false, variant: "default" as const, icon: Coins }
  }

  const filteredRewards = rewards.filter(reward => 
    selectedCategory === "All" || reward.category === selectedCategory
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

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
                {userCoins} EcoCoins
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
        {categories.map((category) => (
          <Button 
            key={category} 
            variant={selectedCategory === category ? "default" : "outline"} 
            size="sm" 
            className="whitespace-nowrap"
            onClick={() => setSelectedCategory(category)}
          >
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
        {filteredRewards.map((reward, index) => {
          const buttonState = getButtonState(reward)
          const ButtonIcon = buttonState.icon

          return (
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
                  reward.is_available ? "hover:shadow-lg cursor-pointer" : "opacity-75"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <img
                        src={reward.image_url || "/placeholder.svg"}
                        alt={reward.title}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      {!reward.is_available && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <Lock className="text-white w-4 h-4" />
                        </div>
                      )}
                      {isRewardRedeemed(reward.id) && (
                        <div className="absolute inset-0 bg-green-500/80 rounded-lg flex items-center justify-center">
                          <Check className="text-white w-4 h-4" />
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
                          variant={buttonState.variant}
                          disabled={buttonState.disabled || redeeming === reward.id}
                          className="text-xs flex items-center gap-1"
                          onClick={() => {
                            if (!buttonState.disabled && reward.is_available && !isRewardRedeemed(reward.id)) {
                              redeemReward(reward.id, reward.title, reward.cost)
                            }
                          }}
                        >
                          {redeeming === reward.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                          ) : (
                            <ButtonIcon className="w-3 h-3" />
                          )}
                          {redeeming === reward.id ? "Redeeming..." : buttonState.text}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {filteredRewards.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Coins className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No rewards found in this category.</p>
        </div>
      )}

      {/* Redeemed Rewards Section */}
      {userRewards.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                Your Redeemed Rewards ({userRewards.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userRewards.map((userReward, index) => (
                  <motion.div
                    key={userReward.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={userReward.rewards.image_url || "/placeholder.svg"}
                        alt={userReward.rewards.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-green-700 dark:text-green-400">
                          {userReward.rewards.title}
                        </h4>
                        <p className="text-xs text-green-600 dark:text-green-300">
                          Redeemed on {new Date(userReward.redeemed_at).toLocaleDateString()}
                        </p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {userReward.status}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

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
