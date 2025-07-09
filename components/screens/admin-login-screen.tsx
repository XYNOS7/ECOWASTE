
"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Eye, EyeOff, Loader2, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { auth } from "@/lib/auth"
import { database } from "@/lib/database"

interface AdminLoginScreenProps {
  onAdminLogin: () => void
  onBackToUser: () => void
}

export function AdminLoginScreen({ onAdminLogin, onBackToUser }: AdminLoginScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let result

      if (isSignUp) {
        // Admin sign-up: Create auth user first
        result = await auth.signUp(email, password, { 
          username, 
          full_name: fullName
        })

        if (result.error) {
          toast({
            title: "Sign Up Failed",
            description: result.error.message || "Failed to create admin account",
            variant: "destructive",
          })
          return
        }

        // If signup successful and user is created, add to admins table
        if (result.data?.user) {
          const adminData = {
            id: result.data.user.id,
            username: username,
            email: email,
            full_name: fullName,
            avatar_url: null
          }

          const { error: adminError } = await database.admins.create(adminData)
          
          if (adminError) {
            toast({
              title: "Admin Setup Failed",
              description: "Account created but admin permissions failed. Please contact support.",
              variant: "destructive",
            })
            return
          }
        }

        toast({
          title: "Admin Account Created!",
          description: "Please check your email to verify your account, then sign in.",
        })
        
        // Switch to sign-in mode after successful sign-up
        setIsSignUp(false)
        setEmail("")
        setPassword("")
        setUsername("")
        setFullName("")
        
      } else {
        // Admin sign-in
        result = await auth.signIn(email, password)

        if (result.error) {
          toast({
            title: "Login Failed",
            description: result.error.message || "Invalid credentials",
            variant: "destructive",
          })
          return
        }

        if (result.data?.user) {
          // Check if user is admin by checking admins table
          const isAdmin = await database.admins.checkIfAdmin(result.data.user.id)
          if (isAdmin) {
            toast({
              title: "Welcome Admin!",
              description: "Redirecting to admin dashboard...",
            })
            onAdminLogin()
          } else {
            await auth.signOut()
            toast({
              title: "Access Denied",
              description: "This account does not have admin privileges",
              variant: "destructive",
            })
          }
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
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
              className="mx-auto bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full w-16 h-16 flex items-center justify-center mb-4"
            >
              <Shield className="w-8 h-8" />
            </motion.div>
            <CardTitle className="text-2xl font-bold">
              <span className="text-slate-700 dark:text-slate-300">Admin</span>
              <span className="text-slate-500"> Portal</span>
            </CardTitle>
            <p className="text-muted-foreground">
              {isSignUp ? "Create admin account" : "Access the admin dashboard"}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Choose a username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isSignUp ? "Creating Account..." : "Signing In..."}
                  </>
                ) : (
                  isSignUp ? "Create Admin Account" : "Sign In as Admin"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <div>
                {isSignUp ? "Already have an admin account?" : "Don't have an admin account?"}{" "}
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-normal" 
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp ? "Sign in" : "Sign up"}
                </Button>
              </div>
              <Button variant="link" onClick={onBackToUser} className="text-sm">
                Back to User Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
