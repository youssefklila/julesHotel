"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Play, Pause, Square, QrCode, Clock, Plus, Copy, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import QRCodeGenerator from "@/components/admin/qr-code-generator"
import { format, addMinutes, isAfter } from "date-fns"

const sessionSchema = z.object({
  title: z.string().min(1, "Session title is required"),
  description: z.string().optional(),
  duration: z.number().min(5, "Minimum duration is 5 minutes").max(480, "Maximum duration is 8 hours"),
  autoStart: z.boolean().default(false),
})

type SessionForm = z.infer<typeof sessionSchema>

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

export default function VotingSessionsPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [sessions, setSessions] = useState<VotingSession[]>([])
  const [selectedSession, setSelectedSession] = useState<VotingSession | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  const methods = useForm<SessionForm>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: 30,
      autoStart: false,
    },
  })

  useEffect(() => {
    // Check authentication
    const auth = localStorage.getItem("adminAuth")
    if (!auth) {
      router.push("/admin/login")
      return
    }
    setIsAuthenticated(true)

    // Load existing sessions and convert date strings back to Date objects
    const savedSessions = JSON.parse(localStorage.getItem("votingSessions") || "[]")
    const sessionsWithDates = savedSessions.map((session: any) => ({
      ...session,
      startTime: session.startTime ? new Date(session.startTime) : undefined,
      endTime: session.endTime ? new Date(session.endTime) : undefined,
      createdAt: session.createdAt ? new Date(session.createdAt) : new Date(),
    }))

    setSessions(sessionsWithDates)

    // Update current time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const createSession = (data: SessionForm) => {
    const sessionId = `session-${Date.now()}`
    const votingUrl = `${window.location.origin}/vote/${sessionId}`

    const newSession: VotingSession = {
      id: sessionId,
      title: data.title,
      description: data.description,
      duration: data.duration,
      status: data.autoStart ? "active" : "draft",
      startTime: data.autoStart ? new Date() : undefined,
      endTime: data.autoStart ? addMinutes(new Date(), data.duration) : undefined,
      qrCode: votingUrl,
      votingUrl,
      votes: [],
      createdAt: new Date(),
    }

    const updatedSessions = [...sessions, newSession]
    setSessions(updatedSessions)

    // Convert dates to strings for localStorage
    const sessionsForStorage = updatedSessions.map((session) => ({
      ...session,
      startTime: session.startTime?.toISOString(),
      endTime: session.endTime?.toISOString(),
      createdAt: session.createdAt?.toISOString(),
    }))
    localStorage.setItem("votingSessions", JSON.stringify(sessionsForStorage))

    methods.reset()
    setShowCreateForm(false)
  }

  const startSession = (sessionId: string) => {
    const updatedSessions = sessions.map((session) => {
      if (session.id === sessionId) {
        const startTime = new Date()
        return {
          ...session,
          status: "active" as const,
          startTime,
          endTime: addMinutes(startTime, session.duration),
        }
      }
      return session
    })

    setSessions(updatedSessions)
    // Convert dates to strings for localStorage
    const sessionsForStorage = updatedSessions.map((session) => ({
      ...session,
      startTime: session.startTime?.toISOString(),
      endTime: session.endTime?.toISOString(),
      createdAt: session.createdAt?.toISOString(),
    }))
    localStorage.setItem("votingSessions", JSON.stringify(sessionsForStorage))
  }

  const pauseSession = (sessionId: string) => {
    const updatedSessions = sessions.map((session) =>
      session.id === sessionId ? { ...session, status: "paused" as const } : session,
    )

    setSessions(updatedSessions)
    // Convert dates to strings for localStorage
    const sessionsForStorage = updatedSessions.map((session) => ({
      ...session,
      startTime: session.startTime?.toISOString(),
      endTime: session.endTime?.toISOString(),
      createdAt: session.createdAt?.toISOString(),
    }))
    localStorage.setItem("votingSessions", JSON.stringify(sessionsForStorage))
  }

  const stopSession = (sessionId: string) => {
    const updatedSessions = sessions.map((session) =>
      session.id === sessionId ? { ...session, status: "completed" as const } : session,
    )

    setSessions(updatedSessions)
    // Convert dates to strings for localStorage
    const sessionsForStorage = updatedSessions.map((session) => ({
      ...session,
      startTime: session.startTime?.toISOString(),
      endTime: session.endTime?.toISOString(),
      createdAt: session.createdAt?.toISOString(),
    }))
    localStorage.setItem("votingSessions", JSON.stringify(sessionsForStorage))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Show success message
  }

  const getSessionStatus = (session: VotingSession) => {
    if (session.status === "active" && session.endTime) {
      // Ensure endTime is a Date object
      const endTime = session.endTime instanceof Date ? session.endTime : new Date(session.endTime)
      if (isAfter(currentTime, endTime)) {
        // Auto-complete expired sessions
        stopSession(session.id)
        return "completed"
      }
    }
    return session.status
  }

  const getTimeRemaining = (session: VotingSession) => {
    if (!session.endTime || session.status !== "active") return null

    // Ensure endTime is a Date object
    const endTime = session.endTime instanceof Date ? session.endTime : new Date(session.endTime)
    const remaining = endTime.getTime() - currentTime.getTime()

    if (remaining <= 0) return "Expired"

    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      case "draft":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Play className="h-3 w-3" />
      case "paused":
        return <Pause className="h-3 w-3" />
      case "completed":
        return <CheckCircle className="h-3 w-3" />
      case "draft":
        return <Square className="h-3 w-3" />
      default:
        return <Square className="h-3 w-3" />
    }
  }

  if (!isAuthenticated) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">Voting Sessions</h1>
            <p className="text-muted-foreground">Manage time-limited restaurant rating sessions</p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => router.push("/admin/dashboard")} variant="outline">
              Dashboard
            </Button>
            <Button onClick={() => setShowCreateForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Session
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Create Session Form */}
        {showCreateForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle>Create New Voting Session</CardTitle>
                <CardDescription>Set up a time-limited rating session for restaurant guests</CardDescription>
              </CardHeader>
              <CardContent>
                <FormProvider {...methods}>
                  <form onSubmit={methods.handleSubmit(createSession)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={methods.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Session Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Dinner Service - Table 12" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={methods.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (minutes)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="5"
                                max="480"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={methods.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Additional details about this session" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={methods.control}
                      name="autoStart"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Auto-start session</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Start the voting session immediately after creation
                            </div>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Create Session</Button>
                    </div>
                  </form>
                </FormProvider>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Active Sessions Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Active Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {sessions.filter((s) => getSessionStatus(s) === "active").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{sessions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Votes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {sessions.reduce((sum, s) => sum + s.votes.length, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Completed Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {
                  sessions.filter(
                    (s) =>
                      s.status === "completed" &&
                      s.createdAt &&
                      format(s.createdAt, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"),
                  ).length
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {sessions.map((session) => {
            const status = getSessionStatus(session)
            const timeRemaining = getTimeRemaining(session)

            return (
              <Card key={session.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{session.title}</h3>
                        <Badge className={getStatusColor(status)}>
                          {getStatusIcon(status)}
                          {status}
                        </Badge>
                        {status === "active" && timeRemaining && (
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {timeRemaining}
                          </Badge>
                        )}
                      </div>

                      {session.description && <p className="text-muted-foreground mb-3">{session.description}</p>}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <p className="font-medium">{session.duration} minutes</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Votes:</span>
                          <p className="font-medium">{session.votes.length}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Created:</span>
                          <p className="font-medium">{format(session.createdAt, "MMM dd, HH:mm")}</p>
                        </div>
                        {session.startTime && (
                          <div>
                            <span className="text-muted-foreground">Started:</span>
                            <p className="font-medium">{format(session.startTime, "MMM dd, HH:mm")}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      {status === "draft" && (
                        <Button onClick={() => startSession(session.id)} size="sm" className="gap-2">
                          <Play className="h-3 w-3" />
                          Start
                        </Button>
                      )}

                      {status === "active" && (
                        <>
                          <Button
                            onClick={() => pauseSession(session.id)}
                            size="sm"
                            variant="outline"
                            className="gap-2"
                          >
                            <Pause className="h-3 w-3" />
                            Pause
                          </Button>
                          <Button
                            onClick={() => stopSession(session.id)}
                            size="sm"
                            variant="destructive"
                            className="gap-2"
                          >
                            <Square className="h-3 w-3" />
                            Stop
                          </Button>
                        </>
                      )}

                      {status === "paused" && (
                        <Button onClick={() => startSession(session.id)} size="sm" className="gap-2">
                          <Play className="h-3 w-3" />
                          Resume
                        </Button>
                      )}

                      <Button onClick={() => setSelectedSession(session)} size="sm" variant="outline" className="gap-2">
                        <QrCode className="h-3 w-3" />
                        QR Code
                      </Button>

                      <Button
                        onClick={() => copyToClipboard(session.votingUrl)}
                        size="sm"
                        variant="outline"
                        className="gap-2"
                      >
                        <Copy className="h-3 w-3" />
                        Copy Link
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {sessions.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No voting sessions yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first time-limited voting session for restaurant guests
              </p>
              <Button onClick={() => setShowCreateForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create First Session
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* QR Code Modal */}
      {selectedSession && <QRCodeGenerator session={selectedSession} onClose={() => setSelectedSession(null)} />}
    </div>
  )
}
