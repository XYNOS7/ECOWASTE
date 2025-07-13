
"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
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
  Award,
  Sparkles,
  Loader2,
  RefreshCw,
  MessageSquare
} from "lucide-react"
import { GoogleGenerativeAI } from "@google/generative-ai"

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

interface AITip {
  title: string
  description: string
  category: string
  difficulty: "Easy" | "Medium" | "Hard"
  impact: "Low" | "Medium" | "High"
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
  const [aiTips, setAiTips] = useState<AITip[]>([])
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [customQuery, setCustomQuery] = useState("")
  const [hasGeneratedInitialTips, setHasGeneratedInitialTips] = useState(false)

  const categories = ["All", "Daily Habits", "Energy", "Waste", "Transportation", "Food", "Home"]

  const filteredTips = selectedCategory === "All" 
    ? ecoTips 
    : ecoTips.filter(tip => tip.category === selectedCategory)

  const filteredAITips = selectedCategory === "All" 
    ? aiTips 
    : aiTips.filter(tip => tip.category === selectedCategory)

  const allTips = [...filteredTips, ...filteredAITips]

  // Initialize Gemini API
  const initializeGemini = () => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      console.error("Gemini API key not found. Please add NEXT_PUBLIC_GEMINI_API_KEY to your environment variables.")
      return null
    }
    return new GoogleGenerativeAI(apiKey)
  }

  const generateAITips = async (query?: string) => {
    setIsLoadingAI(true)
    try {
      const genAI = initializeGemini()
      if (!genAI) {
        throw new Error("Gemini API not configured")
      }

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      const prompt = query 
        ? `Generate 3 specific eco-friendly tips related to: "${query}". Format each tip as JSON with fields: title, description, category (choose from: Daily Habits, Energy, Waste, Transportation, Food, Home), difficulty (Easy/Medium/Hard), impact (Low/Medium/High), and savings (optional benefit text). Make them practical and actionable.`
        : `Generate 4 diverse eco-friendly tips for sustainable living. Format each tip as JSON with fields: title, description, category (choose from: Daily Habits, Energy, Waste, Transportation, Food, Home), difficulty (Easy/Medium/Hard), impact (Low/Medium/High), and savings (optional benefit text). Make them practical and actionable for everyday life.`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Parse the response to extract JSON objects
      const jsonMatches = text.match(/\{[^}]+\}/g)
      if (jsonMatches) {
        const newAITips: AITip[] = []
        jsonMatches.forEach((jsonStr, index) => {
          try {
            const tip = JSON.parse(jsonStr)
            if (tip.title && tip.description && tip.category) {
              newAITips.push({
                title: tip.title,
                description: tip.description,
                category: tip.category,
                difficulty: tip.difficulty || "Medium",
                impact: tip.impact || "Medium",
                savings: tip.savings
              })
            }
          } catch (e) {
            console.error("Error parsing AI tip:", e)
          }
        })
        
        if (query) {
          setAiTips(prev => [...prev, ...newAITips])
        } else {
          setAiTips(newAITips)
        }
      }
    } catch (error) {
      console.error("Error generating AI tips:", error)
    } finally {
      setIsLoadingAI(false)
    }
  }

  // Generate initial AI tips on component mount
  useEffect(() => {
    if (!hasGeneratedInitialTips) {
      generateAITips()
      setHasGeneratedInitialTips(true)
    }
  }, [hasGeneratedInitialTips])

  const handleCustomQuery = async () => {
    if (!customQuery.trim()) return
    await generateAITips(customQuery)
    setCustomQuery("")
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "Medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "Hard": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "Low": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "Medium": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "High": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const nextFact = () => {
    setCurrentFactIndex((prev) => (prev + 1) % environmentalFacts.length)
  }

  const getIconForCategory = (category: string) => {
    switch (category) {
      case "Energy": return Zap
      case "Waste": return Recycle
      case "Transportation": return Car
      case "Food": return Heart
      case "Home": return Home
      case "Daily Habits": return Leaf
      default: return Lightbulb
    }
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
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <p className="text-green-100">
              Discover practical ways to live more sustainably with AI-powered personalized suggestions
            </p>
          </CardHeader>
        </Card>
      </motion.div>

      {/* AI-Powered Custom Query */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Ask AI for Custom Eco Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Ask for specific eco tips... (e.g., 'tips for reducing plastic waste')"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCustomQuery()}
                className="flex-1"
              />
              <Button 
                onClick={handleCustomQuery} 
                disabled={isLoadingAI || !customQuery.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isLoadingAI ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-sm text-muted-foreground">
                Get personalized eco-friendly suggestions powered by AI
              </p>
              <Button 
                onClick={() => generateAITips()} 
                disabled={isLoadingAI}
                variant="outline" 
                size="sm"
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                {isLoadingAI ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-1" />
                )}
                Refresh AI Tips
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Environmental Fact of the Day */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
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
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Tabs defaultValue="tips" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tips" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Eco Tips ({allTips.length})
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

            {/* Loading Animation for AI Tips */}
            <AnimatePresence>
              {isLoadingAI && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center justify-center py-8"
                >
                  <div className="flex items-center gap-3 text-purple-600">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-lg font-medium">Generating AI-powered eco tips...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tips Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {allTips.map((tip, index) => {
                  const isAITip = !ecoTips.find(t => t.id === (tip as any).id)
                  const IconComponent = isAITip ? getIconForCategory(tip.category) : (tip as EcoTip).icon
                  
                  return (
                    <motion.div
                      key={isAITip ? `ai-${index}` : (tip as EcoTip).id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      layout
                    >
                      <Card className={`h-full hover:shadow-lg transition-all duration-200 ${
                        isAITip ? 'ring-2 ring-purple-200 dark:ring-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950' : ''
                      }`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            <div className={`${
                              isAITip 
                                ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400' 
                                : 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                            } rounded-full w-10 h-10 flex items-center justify-center`}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <CardTitle className="text-lg">{tip.title}</CardTitle>
                                {isAITip && (
                                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    AI
                                  </Badge>
                                )}
                              </div>
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
                            <div className={`${
                              isAITip 
                                ? 'bg-purple-50 dark:bg-purple-950' 
                                : 'bg-green-50 dark:bg-green-950'
                            } rounded-lg p-3`}>
                              <p className={`text-sm font-medium ${
                                isAITip 
                                  ? 'text-purple-700 dark:text-purple-300' 
                                  : 'text-green-700 dark:text-green-300'
                              }`}>
                                💰 {tip.savings}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
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
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" variant="secondary">
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
