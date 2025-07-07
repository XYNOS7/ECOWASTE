"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { Leaf, Mail, Lock, User } from "lucide-react"

export function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()
  const { toast } = useToast()
  const t = useTranslations()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let result
      if (isSignUp) {
        result = await signUp(email, password, { username, full_name: fullName })
      } else {
        result = await signIn(email, password)
      }

      if (result.error) {
        throw result.error
      }

      toast({
        title: isSignUp ? t('app.accountCreated') : t('app.welcomeBack'),
        description: isSignUp
          ? t('app.checkEmail')
          : t('app.signedInSuccessfully'),
      })
    } catch (error: any) {
      toast({
        title: t('app.error'),
        description: error.message || t('app.somethingWentWrong'),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
              className="mx-auto bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full w-16 h-16 flex items-center justify-center mb-4"
            >
              <Leaf className="w-8 h-8" />
            </motion.div>
            <CardTitle className="text-2xl font-bold">
              <span className="text-green-600">Eco</span>
              <span className="text-green-500">Track</span>
            </CardTitle>
            <p className="text-muted-foreground">{isSignUp ? t('app.createYourAccount') : t('app.welcomeBack')}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t('common.fullName')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder={t('placeholders.enterFullName')}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">{t('common.username')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        type="text"
                        placeholder={t('placeholders.chooseUsername')}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t('common.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('placeholders.enterEmail')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('common.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('placeholders.enterPassword')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('common.loading') : isSignUp ? t('common.createAccount') : t('common.signin')}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Button variant="link" onClick={() => setIsSignUp(!isSignUp)} className="text-sm">
                {isSignUp ? t('common.alreadyHaveAccount') : t('common.dontHaveAccount')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
