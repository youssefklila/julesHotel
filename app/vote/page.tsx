"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Vote, Wifi, WifiOff, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { format, differenceInSeconds } from "date-fns"

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
  const router = useRouter()
  const [activeSessions, setActiveSessions] = useState<VotingSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date>(new Date())

  const checkForActiveSessions = () => {
    const savedSessions = JSON.parse(localStorage.getItem("votingSessions") || "[]")
    const active = savedSessions.filter((session: VotingSession) => {
      // Convert date strings back to Date objects
      if (session.startTime) session.startTime = new Date(session.startTime)
      if (session.endTime) session.endTime = new Date(session.endTime)
      if (session.createdAt) session.createdAt = new Date(session.createdAt)

      return session.status === "active" && session.endTime && new Date() < session.endTime
    })

    setActiveSessions(active)
    setLastChecked(new Date())
    setIsLoading(false)
  }

  useEffect(() => {
    checkForActiveSessions()

    // Check for active sessions every 3 seconds
    const interval = setInterval(checkForActiveSessions, 3000)

    return () => clearInterval(interval)
  }, [])

  const joinSession = (sessionId: string) => {
    router.push(`/vote/${sessionId}`)
  }

  const formatTimeRemaining = (endTime: Date) => {
    const remaining = differenceInSeconds(endTime, new Date())
    if (remaining <= 0) return "Expired"

    const minutes = Math.floor(remaining / 60)
    const seconds = remaining % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking for active voting sessions...</p>
        </div>
      </div>
    )
  }

  if (activeSessions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
          <Card className="text-center border-2 border-dashed border-muted-foreground/25">
            <CardContent className="pt-8 pb-8">
              <div className="mb-6">
                <WifiOff className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2 text-foreground">Voting Not Open</h2>
                <p className="text-muted-foreground mb-4">
                  There are currently no active voting sessions. Please wait for the restaurant staff to start a
                  session.
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Wifi className="h-4 w-4" />
                    <span>Checking for sessions automatically...</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Last checked: {format(lastChecked, "HH:mm:ss")}</p>
                </div>

                <Button onClick={checkForActiveSessions} variant="outline" className="w-full gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Check Again
                </Button>

                <div className="text-xs text-muted-foreground">
                  <p>💡 This page will automatically refresh when a session becomes available</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <Vote className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Active Voting Sessions</h1>
          <p className="text-muted-foreground">Choose a session to participate in the feedback survey</p>
        </motion.div>

        <div className="space-y-4">
          {activeSessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-primary mb-2">{session.title}</h3>
                      {session.description && <p className="text-muted-foreground mb-3">{session.description}</p>}
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                      Active
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Time Remaining:</span>
                      <p className="font-medium text-primary">
                        {session.endTime ? formatTimeRemaining(session.endTime) : "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Participants:</span>
                      <p className="font-medium">{session.votes?.length || 0}</p>
                    </div>
                  </div>

                  <Button onClick={() => joinSession(session.id)} className="w-full gap-2" size="lg">
                    <Vote className="h-4 w-4" />
                    Join This Session
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">Sessions are automatically updated every 3 seconds</p>
        </div>
      </div>
    </div>
  )
}
