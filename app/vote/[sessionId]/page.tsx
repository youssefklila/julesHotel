"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, CheckCircle, XCircle, Timer } from "lucide-react"
import { motion } from "framer-motion"
import { format, differenceInSeconds } from "date-fns"
import VotingForm from "@/components/voting/voting-form"

interface VotingSession {
  id: string
  title: string
  description?: string
  duration: number
  startTime?: Date
  endTime?: Date
  status: "draft" | "active" | "completed" | "paused"
  qrCode: string
  votingUrl: string
  votes: any[]
  createdAt: Date
}

export default function VotePage() {
  const params = useParams()
  const router = useRouter()
  const [session, setSession] = useState<VotingSession | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isExpired, setIsExpired] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const sessionId = params.sessionId as string

    // Load session data
    const savedSessions = JSON.parse(localStorage.getItem("votingSessions") || "[]")
    const foundSession = savedSessions.find((s: VotingSession) => s.id === sessionId)

    if (!foundSession) {
      setIsLoading(false)
      return
    }

    // Convert date strings back to Date objects
    if (foundSession.startTime) foundSession.startTime = new Date(foundSession.startTime)
    if (foundSession.endTime) foundSession.endTime = new Date(foundSession.endTime)
    if (foundSession.createdAt) foundSession.createdAt = new Date(foundSession.createdAt)

    setSession(foundSession)
    setIsLoading(false)

    // Check if user has already voted
    const userVote = localStorage.getItem(`vote-${sessionId}`)
    if (userVote) {
      setHasVoted(true)
    }

    // Real-time session status checking
    const statusInterval = setInterval(() => {
      const currentSessions = JSON.parse(localStorage.getItem("votingSessions") || "[]")
      const currentSession = currentSessions.find((s: VotingSession) => s.id === sessionId)

      if (currentSession && currentSession.status !== foundSession.status) {
        // Convert date strings back to Date objects
        if (currentSession.startTime) currentSession.startTime = new Date(currentSession.startTime)
        if (currentSession.endTime) currentSession.endTime = new Date(currentSession.endTime)
        if (currentSession.createdAt) currentSession.createdAt = new Date(currentSession.createdAt)

        setSession(currentSession)
      }
    }, 2000) // Check every 2 seconds

    return () => clearInterval(statusInterval)
  }, [params.sessionId])

  useEffect(() => {
    if (!session || !session.endTime || session.status !== "active") return

    const timer = setInterval(() => {
      const now = new Date()
      const remaining = differenceInSeconds(session.endTime!, now)

      if (remaining <= 0) {
        setIsExpired(true)
        setTimeRemaining(0)
        clearInterval(timer)
      } else {
        setTimeRemaining(remaining)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [session])

  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getProgressPercentage = () => {
    if (!session || !session.startTime || !session.endTime) return 0

    const totalDuration = differenceInSeconds(session.endTime, session.startTime)
    const elapsed = totalDuration - timeRemaining
    return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading voting session...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <Card className="text-center">
            <CardContent className="pt-6">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Session Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The voting session you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => router.push("/")} variant="outline">
                Go Home
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (session.status === "draft") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Timer className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Session Not Started</h2>
              <p className="text-muted-foreground mb-4">
                This voting session hasn't started yet. Please wait for the restaurant staff to begin the session.
              </p>
              <Badge variant="outline" className="mb-4">
                {session.title}
              </Badge>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (session.status === "paused") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <Card className="text-center">
            <CardContent className="pt-6">
              <Timer className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Session Paused</h2>
              <p className="text-muted-foreground mb-4">
                This voting session is temporarily paused. Please wait for it to resume.
              </p>
              <Badge variant="outline" className="mb-4">
                {session.title}
              </Badge>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (session.status === "completed" || isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <Card className="text-center">
            <CardContent className="pt-6">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Voting Closed</h2>
              <p className="text-muted-foreground mb-4">
                This voting session has ended. Thank you for your interest in providing feedback.
              </p>
              <Badge variant="outline" className="mb-4">
                {session.title}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Session ended at {session.endTime ? format(session.endTime, "HH:mm") : "N/A"}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (hasVoted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <Card className="text-center">
            <CardContent className="pt-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
              <p className="text-muted-foreground mb-4">
                You have already submitted your rating for this session. We appreciate your feedback!
              </p>
              <Badge variant="outline" className="mb-4">
                {session.title}
              </Badge>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Session Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-primary">{session.title}</CardTitle>
              {session.description && <CardDescription className="text-lg">{session.description}</CardDescription>}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Time Remaining */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="text-lg font-semibold">Time Remaining: {formatTimeRemaining(timeRemaining)}</span>
                  </div>
                  <Progress value={getProgressPercentage()} className="h-2" />
                </div>

                {/* Session Info */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Session Duration</p>
                    <p className="font-medium">{session.duration} minutes</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Votes Collected</p>
                    <p className="font-medium">{session.votes.length}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Voting Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <VotingForm session={session} onVoteSubmitted={() => setHasVoted(true)} />
        </motion.div>
      </div>
    </div>
  )
}
