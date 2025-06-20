"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Crown } from "lucide-react"
import { motion } from "framer-motion"

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  accessCode: z.string().min(1, "Access code is required"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function SuperAdminLogin() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [redirectTo, setRedirectTo] = useState("/super-admin/dashboard") // Default redirect path

  // Get redirect URL from query params
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const from = params.get('from')
      if (from && from.startsWith('/super-admin/')) {
        setRedirectTo(from)
      } else {
        setRedirectTo('/super-admin/dashboard')
      }
    }
  }, [])

  const methods = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      accessCode: "",
    },
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setError("")

    try {
      // Verify access code via API instead of hardcoding
      const accessCodeResponse = await fetch("/api/verify-access-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessCode: data.accessCode
        }),
      })
      
      if (!accessCodeResponse.ok) {
        setError("Invalid access code")
        setIsLoading(false)
        return
      }
      
      // Call authentication API
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        // Check if user is a super admin
        if (result.user.role !== "superadmin") {
          setError("Access denied. Only super admins can access this area.")
          setIsLoading(false)
          return
        }
        
        // Create audit log entry via API instead of localStorage
        await fetch("/api/audit-logs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "SUPER_ADMIN_LOGIN",
            details: "Super Admin logged in successfully",
          }),
        })

        // The server now sets secure HTTP-only cookies for authentication
        // We don't need to store anything in localStorage
        
        // Force a full page reload to ensure all auth state is properly set
        // Use replace instead of push to prevent the login page from being in history
        window.location.replace(redirectTo)
      } else {
        // Check for specific error messages
        if (response.status === 403 && result.message) {
          setError(result.message) // Account deactivated message
        } else {
          setError(result.error || "Invalid credentials")
        }
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="premium-card overflow-hidden border-2 border-yellow-200">
          <div className="h-2 bg-gradient-to-r from-yellow-400 to-yellow-600 w-full"></div>
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <Crown className="h-12 w-12 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl text-yellow-700">Super Admin Access</CardTitle>
            <CardDescription>Restricted access for voting session management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={methods.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter super admin username" {...field} className="h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={methods.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter password" {...field} className="h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={methods.control}
                  name="accessCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Code</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter access code" {...field} className="h-12" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}

                <Button type="submit" disabled={isLoading} className="w-full h-12 bg-yellow-600 hover:bg-yellow-700">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Crown className="mr-2 h-4 w-4" />
                      Access Super Admin
                    </>
                  )}
                </Button>
              </form>
            </FormProvider>

            <div className="text-center">
              <Button variant="link" onClick={() => router.push("/admin/login")} className="text-sm">
                Regular Admin Login →
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
