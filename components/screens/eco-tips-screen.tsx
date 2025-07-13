
"use client"

import { useState, useEffect } from "react"
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
  Car, 
  Home, 
  ShoppingBag,
  RefreshCw,
  BookOpen,
  TrendingUp,
  Award
} from "lucide-react"

interface EcoTipsScreenProps {
  onNavigate?: (screen: any) => void
}

export function EcoTipsScreen({ onNavigate }: EcoTipsScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState("daily")
  const [tipOfTheDay, setTipOfTheDay] = useState(0)

  // Rotate tip of the day
  useEffect(() => {
    const interval = setInterval(() => {
      setTipOfTheDay((prev) => (prev + 1) % dailyTips.length)
    }, 10000) // Change every 10 seconds

    return () => clearInterval(interval)
  }, [])

  const dailyTips = [
    {
      title: "Use Reusable Water Bottles",
      description: "A single reusable bottle can replace 1,460 plastic bottles per year!",
      icon: "💧",
      impact: "Save 1,460 plastic bottles/year"
    },
    {
      title: "Switch to LED Bulbs",
      description: "LED bulbs use 75% less energy and last 25 times longer than incandescent bulbs.",
      icon: "💡",
      impact: "75% less energy consumption"
    },
    {
      title: "Start Composting",
      description: "Composting reduces waste by 30% and creates nutrient-rich soil for plants.",
      icon: "🌱",
      impact: "Reduce waste by 30%"
    },
    {
      title: "Use Public Transport",
      description: "One bus can take up to 40 cars off the road, reducing CO2 emissions significantly.",
      icon: "🚌",
      impact: "Reduce CO2 by 4,800 lbs/year"
    }
  ]

  const categories = [
    {
      id: "daily",
      name: "Daily Habits",
      icon: Home,
      tips: [
        {
          title: "Unplug Electronics",
          description: "Electronics in standby mode consume 10% of household energy.",
          action: "Unplug when not in use",
          difficulty: "Easy",
          impact: "Medium"
        },
        {
          title: "Take Shorter Showers",
          description: "Reducing shower time by 2 minutes saves 10 gallons of water.",
          action: "Set a 5-minute timer",
          difficulty: "Easy",
          impact: "High"
        },
        {
          title: "Use Cold Water for Washing",
          description: "90% of washing machine energy goes to heating water.",
          action: "Switch to cold water settings",
          difficulty: "Easy",
          impact: "Medium"
        },
        {
          title: "Air Dry Clothes",
          description: "Dryers use 5% of home electricity. Air drying is free!",
          action: "Use clotheslines or drying racks",
          difficulty: "Easy",
          impact: "Medium"
        }
      ]
    },
    {
      id: "waste",
      name: "Waste Reduction",
      icon: Recycle,
      tips: [
        {
          title: "Follow the 5 R's",
          description: "Refuse, Reduce, Reuse, Recycle, Rot - in that order of priority.",
          action: "Apply before buying anything",
          difficulty: "Medium",
          impact: "High"
        },
        {
          title: "Buy in Bulk",
          description: "Reduces packaging waste by up to 80% compared to individual items.",
          action: "Plan meals and shop with containers",
          difficulty: "Medium",
          impact: "Medium"
        },
        {
          title: "Repair Instead of Replace",
          description: "Extending product life by just 9 months reduces environmental impact by 30%.",
          action: "Learn basic repair skills",
          difficulty: "Hard",
          impact: "High"
        },
        {
          title: "Use Digital Receipts",
          description: "Paper receipts often contain harmful chemicals and can't be recycled.",
          action: "Choose email receipts when shopping",
          difficulty: "Easy",
          impact: "Low"
        }
      ]
    },
    {
      id: "energy",
      name: "Energy Saving",
      icon: Zap,
      tips: [
        {
          title: "Optimize Thermostat",
          description: "Setting thermostat 7-10°F lower for 8 hours saves 10% on heating/cooling.",
          action: "Use programmable thermostat",
          difficulty: "Easy",
          impact: "High"
        },
        {
          title: "Seal Air Leaks",
          description: "Air leaks can waste 10-20% of heating and cooling energy.",
          action: "Use weatherstripping and caulk",
          difficulty: "Medium",
          impact: "High"
        },
        {
          title: "Use Natural Light",
          description: "Maximizing daylight reduces electricity use and improves mood.",
          action: "Open blinds, use light colors",
          difficulty: "Easy",
          impact: "Medium"
        },
        {
          title: "Cook Efficiently",
          description: "Using lids on pots reduces cooking time and energy by 25%.",
          action: "Cover pots and match pot size to burner",
          difficulty: "Easy",
          impact: "Low"
        }
      ]
    },
    {
      id: "transport",
      name: "Green Transport",
      icon: Car,
      tips: [
        {
          title: "Walk or Bike Short Trips",
          description: "50% of car trips are under 3 miles - perfect for walking or cycling.",
          action: "Plan active transportation",
          difficulty: "Easy",
          impact: "High"
        },
        {
          title: "Combine Errands",
          description: "Trip chaining reduces fuel consumption by 20% and saves time.",
          action: "Plan efficient routes",
          difficulty: "Easy",
          impact: "Medium"
        },
        {
          title: "Maintain Your Vehicle",
          description: "Proper tire pressure and regular tune-ups improve fuel efficiency by 15%.",
          action: "Follow maintenance schedule",
          difficulty: "Medium",
          impact: "Medium"
        },
        {
          title: "Use Eco-Driving Techniques",
          description: "Smooth acceleration and braking can improve fuel economy by 40%.",
          action: "Drive like an egg is under your foot",
          difficulty: "Easy",
          impact: "Medium"
        }
      ]
    }
  ]

  const environmentalFacts = [
    {
      fact: "The Great Pacific Garbage Patch is twice the size of Texas",
      category: "Ocean Pollution",
      icon: "🌊"
    },
    {
      fact: "One ton of recycled paper saves 17 trees and 7,000 gallons of water",
      category: "Recycling",
      icon: "📄"
    },
    {
      fact: "Bamboo grows 35 inches in a single day - fastest growing plant on Earth",
      category: "Renewable Resources",
      icon: "🎋"
    },
    {
      fact: "A single tree can absorb 48 lbs of CO2 per year",
      category: "Carbon Absorption",
      icon: "🌳"
    },
    {
      fact: "Plastic takes 450-1000 years to decompose in landfills",
      category: "Waste Impact",
      icon: "♻️"
    },
    {
      fact: "Earth's temperature has risen 1.1°C since the late 1800s",
      category: "Climate Change",
      icon: "🌡️"
    }
  ]

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory)

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
      case "High": return "bg-blue-100 text-blue-800"
      case "Medium": return "bg-purple-100 text-purple-800"
      case "Low": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-green-600 to-emerald-500 text-white border-0">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-3">
                <Lightbulb className="w-8 h-8" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">EcoTips & Facts</CardTitle>
                <p className="text-green-100">Learn how to make a positive environmental impact</p>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Tip of the Day */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <Award className="w-5 h-5" />
                Tip of the Day
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setTipOfTheDay((prev) => (prev + 1) % dailyTips.length)}
                className="text-yellow-700 border-yellow-300"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="text-4xl">{dailyTips[tipOfTheDay].icon}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-2">
                  {dailyTips[tipOfTheDay].title}
                </h3>
                <p className="text-yellow-800 mb-3">
                  {dailyTips[tipOfTheDay].description}
                </p>
                <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                  {dailyTips[tipOfTheDay].impact}
                </Badge>
              </div>
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
        <Tabs defaultValue="tips" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tips" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Eco Tips
            </TabsTrigger>
            <TabsTrigger value="facts" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Environmental Facts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tips" className="space-y-6">
            {/* Category Selection */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedCategory === category.id
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <category.icon className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">{category.name}</p>
                </motion.button>
              ))}
            </div>

            {/* Tips Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedCategoryData?.tips.map((tip, index) => (
                <motion.div
                  key={tip.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{tip.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge className={getDifficultyColor(tip.difficulty)}>
                          {tip.difficulty}
                        </Badge>
                        <Badge className={getImpactColor(tip.impact)}>
                          {tip.impact} Impact
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-3">{tip.description}</p>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-green-800">
                          <strong>Action:</strong> {tip.action}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="facts" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {environmentalFacts.map((factItem, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-green-50">
                    <CardContent className="p-6">
                      <div className="text-3xl mb-3 text-center">{factItem.icon}</div>
                      <Badge variant="outline" className="mb-3 text-xs">
                        {factItem.category}
                      </Badge>
                      <p className="font-medium text-gray-800 leading-relaxed">
                        {factItem.fact}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Call to Action */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
                <CardContent className="p-6 text-center">
                  <Leaf className="w-12 h-12 mx-auto mb-4 text-green-200" />
                  <h3 className="text-xl font-bold mb-2">Start Making a Difference Today!</h3>
                  <p className="text-green-100 mb-4">
                    Every small action counts. Choose one tip and start your eco-journey now.
                  </p>
                  <Button 
                    variant="secondary" 
                    onClick={() => onNavigate && onNavigate("report-waste")}
                    className="bg-white text-green-600 hover:bg-green-50"
                  >
                    Report Waste & Earn EcoCoins
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
