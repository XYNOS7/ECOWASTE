"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Camera, MapPin, Brain, ArrowLeft, Upload, Loader2, Navigation } from "lucide-react"
import { database } from "@/lib/database"
import { useAuth } from "@/hooks/use-auth"

interface ReportWasteScreenProps {
  onSubmit: (type: "waste" | "dirty-area", data: any) => void
  onBack: () => void
}

export function ReportWasteScreen({ onSubmit, onBack }: ReportWasteScreenProps) {
  const { user } = useAuth()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [aiResult, setAiResult] = useState<string | null>(null)
  const [location, setLocation] = useState<{
    lat: number
    lng: number
    address: string
  } | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  const getCurrentLocation = async () => {
    setIsGettingLocation(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.")
      setIsGettingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        try {
          // Reverse geocoding to get readable address
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          )
          const data = await response.json()
          
          setLocation({
            lat: latitude,
            lng: longitude,
            address: data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          })
        } catch (error) {
          console.error("Error getting address:", error)
          setLocation({
            lat: latitude,
            lng: longitude,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          })
        }
        
        setIsGettingLocation(false)
      },
      (error) => {
        console.error("Error getting location:", error)
        setLocationError("Unable to get your location. Please enable location services.")
        setIsGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }

  useEffect(() => {
    // Automatically get location when component mounts
    getCurrentLocation()
  }, [])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAIAnalysis = async () => {
    if (!selectedImage) return

    setIsAnalyzing(true)
    // Simulate AI analysis
    setTimeout(() => {
      setAiResult("E-Waste (Electronic components detected)")
      setCategory("e-waste")
      setIsAnalyzing(false)
    }, 2000)
  }

  const handleSubmit = async () => {
    if (!user || !selectedFile) return

    setIsUploading(true)
    try {
      // Upload image to Supabase storage
      const { url: imageUrl, error: uploadError } = await database.storage.uploadImage(
        selectedFile,
        user.id,
        "waste-reports"
      )

      if (uploadError) {
        console.error("Image upload error:", uploadError)
        setIsUploading(false)
        return
      }

      // Submit the report with the uploaded image URL and location
      onSubmit("waste", {
        title: `${category.replace('-', ' ')} waste report`,
        imageUrl,
        category,
        description,
        location: location?.address || "Location not available",
        locationLat: location?.lat,
        locationLng: location?.lng,
        aiDetectedCategory: aiResult,
      })
    } catch (error) {
      console.error("Error uploading image:", error)
    }
    setIsUploading(false)
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">Report Waste</h1>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle>Upload Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                {selectedImage ? (
                  <div className="space-y-4">
                    <img
                      src={selectedImage || "/placeholder.svg"}
                      alt="Uploaded waste"
                      className="max-h-64 mx-auto rounded-lg shadow-md"
                    />
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Change Photo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Camera className="w-16 h-16 mx-auto text-muted-foreground" />
                    <div>
                      <p className="font-medium">Click to upload or take a photo</p>
                      <p className="text-sm text-muted-foreground">PNG, JPG up to 10MB</p>
                    </div>
                  </div>
                )}
              </div>

              <input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

              {selectedImage && (
                <Button onClick={handleAIAnalysis} disabled={isAnalyzing} className="w-full" variant="secondary">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Detect Waste Type with AI
                    </>
                  )}
                </Button>
              )}

              {aiResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                    >
                      AI Detected
                    </Badge>
                    <span className="font-medium">{aiResult}</span>
                  </div>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle>Waste Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select waste category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dry-waste">Dry Waste</SelectItem>
                  <SelectItem value="e-waste">E-Waste</SelectItem>
                  <SelectItem value="reusable">Reusable Items</SelectItem>
                  <SelectItem value="hazardous">Hazardous Waste</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm flex-1">
                    {location ? location.address : isGettingLocation ? "Getting location..." : "Location not available"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                  >
                    {isGettingLocation ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Navigation className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {locationError && (
                  <p className="text-sm text-red-500">{locationError}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Additional Details</label>
              <Textarea
                placeholder="Add any additional information about the waste..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Button onClick={handleSubmit} disabled={!selectedImage || !category || isUploading} className="w-full" size="lg">
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            "Submit Report"
          )}
        </Button>
      </motion.div>
    </div>
  )
}
