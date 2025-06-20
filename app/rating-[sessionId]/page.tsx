"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import LanguageSelector from "@/components/language-selector"

export default function RatingSessionPage() {
  const router = useRouter()
  const params = useParams()
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  const sessionId = params.sessionId as string

  useEffect(() => {
    // Check if this is a valid session ID
    const checkSession = async () => {
      try {
        // Get stored sessions from localStorage
        const storedSessions = JSON.parse(localStorage.getItem("votingSessions") || "[]")
        
        // Find the session with this ID
        const session = storedSessions.find((s: any) => 
          s.id === sessionId || s.id === `session-${sessionId}`
        )
        
        if (session) {
          // Valid session, show language selector
          setIsValidSession(true)
        } else {
          // Invalid session, redirect to home
          setIsValidSession(false)
          router.push("/")
        }
      } catch (error) {
        console.error("Error checking session:", error)
        setIsValidSession(false)
        router.push("/")
      }
    }
    
    checkSession()
  }, [sessionId, router])

  // Show loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground">Validating session...</p>
        </div>
      </div>
    )
  }

  // If session is valid, show the language selector
  if (isValidSession) {
    return <LanguageSelector />
  }

  // This should not be visible as we redirect on invalid sessions
  return null
}
