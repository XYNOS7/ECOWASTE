
"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Truck, Eye, EyeOff, Loader2, User, Phone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { database } from "@/lib/database"
const bcrypt = require('bcryptjs')

interface PickupAgentLoginScreenProps {
  onPickupAgentLogin: (agent: any) => void
  onBackToUser: () => void
}

export function PickupAgentLoginScreen({ onPickupAgentLogin, onBackToUser }: PickupAgentLoginScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^[+]?[0-9]{10,15}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!validatePhoneNumber(phoneNumber)) {
        toast({
          title: "Invalid Phone Number",
          description: "Please enter a valid phone number (10-15 digits)",
          variant: "destructive",
        })
        return
      }

      if (isSignUp) {
        // Pickup agent sign-up
        if (fullName.trim().length < 2) {
          toast({
            title: "Invalid Name",
            description: "Please enter your full name",
            variant: "destructive",
          })
          return
        }

        if (password.length < 6) {
          toast({
            title: "Password Too Short",
            description: "Password must be at least 6 characters long",
            variant: "destructive",
          })
          return
        }

        // Hash password
        const saltRounds = 10
        const passwordHash = await bcrypt.hash(password, saltRounds)

        const agentData = {
          phone_number: phoneNumber.replace(/\s/g, ''),
          full_name: fullName.trim(),
          password_hash: passwordHash,
          points_earned: 0,
          total_collections: 0,
          is_active: true
        }

        const { data, error } = await database.pickupAgents.create(agentData)
        
        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            toast({
              title: "Phone Number Already Registered",
              description: "This phone number is already registered. Please sign in instead.",
              variant: "destructive",
            })
          } else {
            toast({
              title: "Sign Up Failed",
              description: error.message || "Failed to create pickup agent account",
              variant: "destructive",
            })
          }
          return
        }

        toast({
          title: "Account Created Successfully!",
          description: `Welcome aboard, ${agentData.full_name}!`,
        })
        
        // Automatically log in the newly created agent
        const newAgent = {
          ...data,
          full_name: agentData.full_name,
          phone_number: agentData.phone_number,
          points_earned: agentData.points_earned,
          total_collections: agentData.total_collections,
          is_active: agentData.is_active
        }
        
        console.log("Agent signup successful, calling callback with:", newAgent)
        onPickupAgentLogin(newAgent)
        
      } else {
        // Pickup agent sign-in
        const { data: agent, error } = await database.pickupAgents.getByPhoneNumber(phoneNumber.replace(/\s/g, ''))

        if (error || !agent) {
          toast({
            title: "Login Failed",
            description: "Phone number not found. Please check your credentials or sign up.",
            variant: "destructive",
          })
          return
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, agent.password_hash)
        
        if (!isPasswordValid) {
          toast({
            title: "Login Failed",
            description: "Invalid password. Please try again.",
            variant: "destructive",
          })
          return
        }

        if (!agent.is_active) {
          toast({
            title: "Account Deactivated",
            description: "Your account has been deactivated. Please contact support.",
            variant: "destructive",
          })
          return
        }

        toast({
          title: "Welcome Back!",
          description: `Signed in successfully as ${agent.full_name}`,
        })
        
        console.log("Agent login successful, calling callback with:", agent)
        onPickupAgentLogin(agent)
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-green-50 dark:from-orange-950 dark:to-green-950 p-4">
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
              className="mx-auto bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 rounded-full w-16 h-16 flex items-center justify-center mb-4"
            >
              <Truck className="w-8 h-8" />
            </motion.div>
            <CardTitle className="text-2xl font-bold">
              <span className="text-orange-600">Pickup</span>
              <span className="text-green-600"> Agent</span>
            </CardTitle>
            <p className="text-muted-foreground">
              {isSignUp ? "Join our pickup team" : "Access your collection dashboard"}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="pl-10"
                    />
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <div className="relative">
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="pl-10"
                  />
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
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
                    className="pr-10"
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

              <Button 
                type="submit" 
                className="w-full bg-orange-600 hover:bg-orange-700" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isSignUp ? "Creating Account..." : "Signing In..."}
                  </>
                ) : (
                  isSignUp ? "Create Pickup Agent Account" : "Sign In as Pickup Agent"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <div>
                {isSignUp ? "Already have a pickup agent account?" : "Don't have a pickup agent account?"}{" "}
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
