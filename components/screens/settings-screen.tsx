"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { database } from "@/lib/database"
import { Moon, Sun, Globe, Bell, Shield, HelpCircle, LogOut, Camera, Save, Loader2, Edit3 } from "lucide-react"

export function SettingsScreen() {
  const { theme, setTheme } = useTheme()
  const { profile, signOut, refreshProfile } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [notifications, setNotifications] = useState(true)
  const [language, setLanguage] = useState("en")
  const [isEditing, setIsEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit form state
  const [editForm, setEditForm] = useState({
    username: profile?.username || "",
    full_name: profile?.full_name || "",
    email: profile?.email || "",
  })

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "hi", name: "हिंदी", flag: "🇮🇳" },
    { code: "bn", name: "বাংলা", flag: "🇧🇩" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
  ]

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      // Upload image to storage
      const { url, error } = await database.storage.uploadImage(file, profile.id)

      if (error) {
        throw error
      }

      if (url) {
        // Update profile with new avatar URL
        const { error: updateError } = await database.profiles.update(profile.id, {
          avatar_url: url,
        })

        if (updateError) {
          throw updateError
        }

        // Refresh profile to show new avatar
        await refreshProfile()

        toast({
          title: "Profile photo updated! 📸",
          description: "Your new profile photo has been saved.",
        })
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return

    // Validate username
    if (editForm.username.length < 3) {
      toast({
        title: "Username too short",
        description: "Username must be at least 3 characters long",
        variant: "destructive",
      })
      return
    }

    // Validate full name
    if (editForm.full_name.length < 2) {
      toast({
        title: "Name too short",
        description: "Full name must be at least 2 characters long",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const { error } = await database.profiles.update(profile.id, {
        username: editForm.username.trim(),
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim(),
      })

      if (error) {
        throw error
      }

      // Refresh profile to show updated data
      await refreshProfile()

      setIsEditing(false)
      toast({
        title: "Profile updated! ✨",
        description: "Your profile changes have been saved.",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await signOut()
      
      if (!error) {
        toast({
          title: "Signed out",
          description: "You have been signed out successfully.",
        })
      } else {
        toast({
          title: "Sign out completed",
          description: "You have been signed out locally.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Sign out error:", error)
      toast({
        title: "Sign out completed",
        description: "You have been signed out locally.",
        variant: "default",
      })
    }
  }

  const handleThemeChange = (isDark: boolean) => {
    setTheme(isDark ? "dark" : "light")
    toast({
      title: `${isDark ? "Dark" : "Light"} mode enabled`,
      description: `Switched to ${isDark ? "dark" : "light"} theme`,
    })
  }

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode)
    const selectedLang = languages.find((lang) => lang.code === langCode)
    toast({
      title: "Language changed",
      description: `Language set to ${selectedLang?.name}`,
    })
  }

  const settingSections = [
    {
      title: "Appearance",
      items: [
        {
          icon: theme === "dark" ? Moon : Sun,
          title: "Theme",
          description: "Switch between light and dark mode",
          action: (
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4" />
              <Switch checked={theme === "dark"} onCheckedChange={handleThemeChange} />
              <Moon className="w-4 h-4" />
            </div>
          ),
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: Globe,
          title: "Language",
          description: "Choose your preferred language",
          action: (
            <div className="flex gap-2 flex-wrap">
              {languages.map((lang) => (
                <Button
                  key={lang.code}
                  variant={language === lang.code ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleLanguageChange(lang.code)}
                  className="text-xs"
                >
                  {lang.flag} {lang.name}
                </Button>
              ))}
            </div>
          ),
        },
        {
          icon: Bell,
          title: "Notifications",
          description: "Receive updates about reports and rewards",
          action: (
            <Switch
              checked={notifications}
              onCheckedChange={(checked) => {
                setNotifications(checked)
                toast({
                  title: `Notifications ${checked ? "enabled" : "disabled"}`,
                  description: `You will ${checked ? "receive" : "not receive"} push notifications`,
                })
              }}
            />
          ),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: HelpCircle,
          title: "Help & Support",
          description: "Get help and contact support",
          action: (
            <Button variant="ghost" size="sm">
              Contact
            </Button>
          ),
        },
        {
          icon: Shield,
          title: "Privacy Policy",
          description: "View our privacy policy",
          action: (
            <Button variant="ghost" size="sm">
              View
            </Button>
          ),
        },
      ],
    },
  ]

  if (!profile) return null

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.username} />
                  <AvatarFallback className="text-lg">
                    {profile.username?.slice(0, 2).toUpperCase() || "??"}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="username" className="text-sm">
                        Username
                      </Label>
                      <Input
                        id="username"
                        value={editForm.username}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, username: e.target.value }))}
                        className="mt-1"
                        placeholder="Enter username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fullName" className="text-sm">
                        Full Name
                      </Label>
                      <Input
                        id="fullName"
                        value={editForm.full_name}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, full_name: e.target.value }))}
                        className="mt-1"
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                        className="mt-1"
                        placeholder="Enter email"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false)
                          setEditForm({
                            username: profile.username || "",
                            full_name: profile.full_name || "",
                            email: profile.email || "",
                          })
                        }}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold">{profile.username}</h2>
                      <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="w-8 h-8">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-muted-foreground">{profile.full_name}</p>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                  </div>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary">Level {profile.level}</Badge>
              <Badge variant="outline">{profile.streak} Day Streak</Badge>
              <Badge variant="outline">{profile.total_reports} Reports</Badge>
              <Badge variant="outline">{profile.eco_coins} EcoCoins</Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Settings Sections */}
      {settingSections.map((section, sectionIndex) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 + sectionIndex * 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.items.map((item, itemIndex) => (
                <motion.div
                  key={item.title}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  whileHover={{ scale: 1.01 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + itemIndex * 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  {item.action}
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Sign Out */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card>
          <CardContent className="pt-6">
            <Button variant="destructive" className="w-full" size="lg" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* App Info */}
      <div className="text-center text-sm text-muted-foreground pb-4">
        <p>EcoTrack v2.0.0</p>
        <div className="flex justify-center gap-4 mt-2">
          <Button variant="link" size="sm">
            Privacy Policy
          </Button>
          <Button variant="link" size="sm">
            Terms of Service
          </Button>
        </div>
      </div>
    </div>
  )
}
