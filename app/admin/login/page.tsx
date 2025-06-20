"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Shield } from "lucide-react"
import { motion } from "framer-motion"

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function AdminLogin() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const methods = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setError("")

    try {
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
        // The server now sets secure HTTP-only cookies for authentication
        // We don't need to store anything in localStorage
        
        // Create audit log entry via API instead of localStorage
        await fetch("/api/audit-logs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "ADMIN_LOGIN",
            details: "Admin logged in successfully",
          }),
        })
        
        router.push("/admin/dashboard")
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
        <Card className="premium-card overflow-hidden">
          <div className="h-2 premium-gradient-bg w-full"></div>
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl text-primary">Admin Dashboard</CardTitle>
            <CardDescription>Sign in to access review statistics and analytics</CardDescription>
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
                        <Input placeholder="Enter username" {...field} className="h-12" />
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

                {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}

                <Button type="submit" disabled={isLoading} className="w-full h-12 premium-button">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </FormProvider>

            <div className="text-center">
              <Button variant="link" onClick={() => router.push("/super-admin/login")} className="text-sm">
                Super Admin Access →
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
