
"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Lightbulb, 
  Leaf, 
  Recycle, 
  Droplets, 
  Zap, 
  TreePine, 
  Car, 
  Home,
  ShoppingBag,
  Trash2,
  Heart,
  Award
} from "lucide-react"

interface EcoTip {
  id: string
  title: string
  description: string
  category: string
  difficulty: "Easy" | "Medium" | "Hard"
  impact: "Low" | "Medium" | "High"
  icon: any
  savings?: string
}

const ecoTips: EcoTip[] = [
  {
    id: "1",
    title: "Use Reusable Water Bottles",
    description: "Replace single-use plastic bottles with a reusable water bottle. This simple switch can save hundreds of plastic bottles per year and reduce your carbon footprint significantly.",
    category: "Daily Habits",
    difficulty: "Easy",
    impact: "Medium",
    icon: Droplets,
    savings: "Save $200+ yearly"
  },
  {
    id: "2", 
    title: "Switch to LED Bulbs",
    description: "LED bulbs use 75% less energy and last 25 times longer than incandescent bulbs. They're a simple upgrade that reduces electricity bills and environmental impact.",
    category: "Energy",
    difficulty: "Easy",
    impact: "Medium",
    icon: Zap,
    savings: "Save 75% energy"
  },
  {
    id: "3",
    title: "Start Composting",
    description: "Turn your food scraps into nutrient-rich soil. Composting reduces landfill waste and creates natural fertilizer for plants, completing the natural cycle.",
    category: "Waste",
    difficulty: "Medium",
    impact: "High",
    icon: Recycle,
    savings: "Reduce waste by 30%"
  },
  {
    id: "4",
    title: "Use Public Transportation",
    description: "Taking public transport, cycling, or walking instead of driving reduces carbon emissions, saves money, and often provides good exercise too.",
    category: "Transportation",
    difficulty: "Medium",
    impact: "High",
    icon: Car,
    savings: "Save $2000+ yearly"
  },
  {
    id: "5",
    title: "Reduce Meat Consumption",
    description: "Even reducing meat consumption by one day per week can significantly lower your environmental impact. Try 'Meatless Monday' to start.",
    category: "Food",
    difficulty: "Medium",
    impact: "High",
    icon: Heart,
    savings: "Reduce CO2 by 1,900 lbs/year"
  },
  {
    id: "6",
    title: "Unplug Electronics",
    description: "Electronics continue to draw power even when turned off. Unplugging devices or using power strips can reduce 'phantom loads' and save energy.",
    category: "Energy",
    difficulty: "Easy",
    impact: "Low",
    icon: Zap,
    savings: "Save 10% on electric bill"
  },
  {
    id: "7",
    title: "Buy Local Produce",
    description: "Purchasing locally grown food reduces transportation emissions and supports local farmers. Plus, local produce is often fresher and more nutritious.",
    category: "Food",
    difficulty: "Easy",
    impact: "Medium",
    icon: Leaf,
    savings: "Support local economy"
  },
  {
    id: "8",
    title: "Use Eco-Friendly Cleaning Products",
    description: "Switch to biodegradable, non-toxic cleaning products to reduce harmful chemicals in your home and prevent water pollution.",
    category: "Home",
    difficulty: "Easy",
    impact: "Medium",
    icon: Home,
    savings: "Healthier home environment"
  }
]

const environmentalFacts = [
  {
    fact: "A single plastic bottle takes 450 years to decompose",
    icon: "🌍",
    category: "Waste"
  },
  {
    fact: "If everyone in the US recycled their newspapers, we could save 250 million trees each year",
    icon: "📰", 
    category: "Recycling"
  },
  {
    fact: "The average American uses 2.5 million plastic bottles in their lifetime",
    icon: "💧",
    category: "Consumption"
  },
  {
    fact: "LED bulbs use 80% less energy than traditional incandescent bulbs",
    icon: "💡",
    category: "Energy"
  },
  {
    fact: "Transportation accounts for 29% of greenhouse gas emissions in the US",
    icon: "🚗",
    category: "Transport"
  },
  {
    fact: "Composting can reduce household waste by up to 30%",
    icon: "🌱",
    category: "Waste"
  }
]

export function EcoTipsScreen() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [currentFactIndex, setCurrentFactIndex] = useState(0)

  const categories = ["All", "Daily Habits", "Energy", "Waste", "Transportation", "Food", "Home"]

  const filteredTips = selectedCategory === "All" 
    ? ecoTips 
    : ecoTips.filter(tip => tip.category === selectedCategory)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-800"
      case "Medium": return "bg-yellow-100 text-yellow-800"
      case "Hard": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "Low": return "bg-blue-100 text-blue-800"
      case "Medium": return "bg-purple-100 text-purple-800"
      case "High": return "bg-emerald-100 text-emerald-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const nextFact = () => {
    setCurrentFactIndex((prev) => (prev + 1) % environmentalFacts.length)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-green-600 to-emerald-500 text-white border-0">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Lightbulb className="w-8 h-8" />
              <CardTitle className="text-3xl font-bold">EcoTips</CardTitle>
            </div>
            <p className="text-green-100">
              Discover practical ways to live more sustainably and help protect our planet
            </p>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Environmental Fact of the Day */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-2xl">{environmentalFacts[currentFactIndex].icon}</span>
              Did You Know?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-4">{environmentalFacts[currentFactIndex].fact}</p>
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                {environmentalFacts[currentFactIndex].category}
              </Badge>
              <Button onClick={nextFact} variant="outline" size="sm">
                Next Fact
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Tabs defaultValue="tips" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tips" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Eco Tips
            </TabsTrigger>
            <TabsTrigger value="challenges" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Weekly Challenge
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tips" className="space-y-6">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Tips Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTips.map((tip, index) => (
                <motion.div
                  key={tip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full w-10 h-10 flex items-center justify-center">
                          <tip.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{tip.title}</CardTitle>
                          <div className="flex gap-2 mb-2">
                            <Badge className={getDifficultyColor(tip.difficulty)} variant="secondary">
                              {tip.difficulty}
                            </Badge>
                            <Badge className={getImpactColor(tip.impact)} variant="secondary">
                              {tip.impact} Impact
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        {tip.description}
                      </p>
                      {tip.savings && (
                        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3">
                          <p className="text-sm font-medium text-green-700 dark:text-green-300">
                            💰 {tip.savings}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="challenges" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-yellow-500" />
                  This Week's Challenge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-3">Zero Waste Week</h3>
                  <p className="mb-4">
                    Try to produce zero waste for one full day this week. Plan your meals, bring reusable containers, 
                    and avoid single-use items. Share your experience and tips with the community!
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">🗑️</div>
                      <p className="text-sm font-medium">Zero Waste Day</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">♻️</div>
                      <p className="text-sm font-medium">Reuse Everything</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">🌱</div>
                      <p className="text-sm font-medium">Share Your Tips</p>
                    </div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800" variant="secondary">
                    Reward: +50 EcoCoins
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
