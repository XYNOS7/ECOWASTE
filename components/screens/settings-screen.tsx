'use client'

import type React from "react"
import { useState } from "react"
import { useTranslations } from 'next-intl'
import { Camera, User, Bell, Lock, Info, LogOut, Sun, Moon, Laptop } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "next-themes"
import { useAuth } from "@/hooks/use-auth"
import { LanguageSwitcher } from "@/components/language-switcher"
import type { Screen } from "@/app/[locale]/page"

interface SettingsScreenProps {
  onNavigate: (screen: Screen) => void
}

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useAuth()
  const t = useTranslations('settings')

  const [profile, setProfile] = useState({
    name: user?.user_metadata?.full_name || "",
    email: user?.email || "",
  })

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Handle image upload logic here
      console.log("Uploading image:", file.name)
    }
  }

  const handleSaveProfile = async () => {
    // Handle profile save logic here
    console.log("Saving profile:", profile)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 pb-20">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('settings')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('manageAccount')}
          </p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('profile')}
            </CardTitle>
            <CardDescription>{t('updateProfile')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Image */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <User className="h-10 w-10 text-gray-400" />
                </div>
                <label className="absolute bottom-0 right-0 bg-green-600 text-white p-1 rounded-full cursor-pointer hover:bg-green-700 transition-colors">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {profile.name || t('anonymous')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {profile.email}
                </p>
              </div>
            </div>

            {/* Profile Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('name')}</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('enterName')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={t('enterEmail')}
                />
              </div>
              <Button onClick={handleSaveProfile} className="w-full">
                {t('saveChanges')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t('language')}</CardTitle>
            <CardDescription>{t('selectLanguage')}</CardDescription>
          </CardHeader>
          <CardContent>
            <LanguageSwitcher />
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t('theme')}</CardTitle>
            <CardDescription>{t('selectTheme')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  <span>Light</span>
                </div>
                <Switch
                  checked={theme === 'light'}
                  onCheckedChange={() => setTheme('light')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  <span>Dark</span>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={() => setTheme('dark')}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Laptop className="h-4 w-4" />
                  <span>System</span>
                </div>
                <Switch
                  checked={theme === 'system'}
                  onCheckedChange={() => setTheme('system')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('notifications')}
            </CardTitle>
            <CardDescription>{t('manageNotifications')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>{t('reportUpdates')}</span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span>{t('rewardNotifications')}</span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span>{t('marketingEmails')}</span>
                <Switch />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {t('privacy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                {t('changePassword')}
              </Button>
              <Button variant="outline" className="w-full justify-start">
                {t('downloadData')}
              </Button>
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                {t('deleteAccount')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              {t('about')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>{t('version')}</span>
                <span className="text-gray-500">1.0.0</span>
              </div>
              <Button variant="outline" className="w-full justify-start">
                {t('termsOfService')}
              </Button>
              <Button variant="outline" className="w-full justify-start">
                {t('privacyPolicy')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={signOut}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t('logout')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}