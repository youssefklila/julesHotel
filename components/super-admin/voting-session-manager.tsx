"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Play, Pause, Square, QrCode, Plus, Copy, CheckCircle, Trash2 } from "lucide-react"
import { motion } from "framer-motion"
import QRCodeGenerator from "@/components/admin/qr-code-generator"
import { format, addMinutes } from "date-fns"

const sessionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  duration: z.number().min(5, "Minimum duration is 5 minutes").max(480, "Maximum duration is 8 hours"),
  autoStart: z.boolean()
})

type SessionForm = z.infer<typeof sessionSchema>

interface VotingSessionManagerProps {
  sessions: any[]
  setSessions: (sessions: any[]) => void
  currentUser: string
  auditLogs: any[]
  setAuditLogs: (logs: any[]) => void
}

export default function VotingSessionManager({
  sessions,
  setSessions,
  currentUser,
  auditLogs,
  setAuditLogs,
}: VotingSessionManagerProps) {
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  const methods = useForm<SessionForm>({
    resolver: zodResolver(sessionSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      duration: 30,
      autoStart: false,
    },
    mode: "onChange"
  })

  const createAuditLog = async (action: string, details: string, sessionId?: string) => {
    try {
      // Create audit log via API
      const response = await fetch('/api/audit-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          details,
          sessionId,
        }),
      })
      
      if (response.ok) {
        // Refresh audit logs
        const logsResponse = await fetch('/api/audit-logs')
        if (logsResponse.ok) {
          const updatedLogs = await logsResponse.json()
          setAuditLogs(updatedLogs)
        }
      }
    } catch (error) {
      console.error('Error creating audit log:', error)
    }
  }

  const createSession = async (data: SessionForm, event?: React.BaseSyntheticEvent) => {
    event?.preventDefault(); // Prevent default form submission
    
    try {
      // Create a special URL for the QR code that will show the language selector
      const votingUrl = `${window.location.origin}/rating/`
      const tempSessionId = Date.now().toString() // Temporary ID for the session

      // Prepare the request body
      const requestBody = {
        title: data.title,
        description: data.description || '', // Ensure description is always a string
        duration: Number(data.duration), // Ensure duration is a number
        status: data.autoStart ? "active" : "draft",
        startTime: data.autoStart ? new Date().toISOString() : null,
        endTime: data.autoStart ? addMinutes(new Date(), Number(data.duration)).toISOString() : null,
        qrCodeUrl: votingUrl,
        votingUrl,
      };

      console.log('Sending request to /api/voting-sessions with data:', requestBody);

      // Create session via API
      const response = await fetch('/api/voting-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        console.error('Error response from server:', {
          status: response.status,
          statusText: response.statusText,
          response: responseData
        });
        throw new Error(`Failed to create session: ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
      }

      console.log('Session created successfully:', responseData);
      const newSession = responseData;
      const createdSessionId = newSession.id || tempSessionId;
      
      try {
        // Refresh sessions
        const sessionsResponse = await fetch('/api/voting-sessions');
        if (sessionsResponse.ok) {
          const updatedSessions = await sessionsResponse.json();
          setSessions(updatedSessions);
        }

        // Create audit log with the session ID
        await createAuditLog(
          "SESSION_CREATED",
          `Created voting session: ${data.title} (${data.duration} minutes)${data.autoStart ? " - Auto-started" : ""}`,
          createdSessionId,
        );

        // Reset form and hide the form
        methods.reset();
        setShowCreateForm(false);
        
        // Show success message or notification here if needed
        
      } catch (innerError) {
        console.error('Error in post-creation steps:', innerError);
        // Continue even if post-creation steps fail
      }
      
    } catch (error: unknown) {
      console.error('Error creating session:', error);
      // Show error message to the user
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      alert(`Failed to create session: ${errorMessage}`);
    }
  }

  const updateSessionStatus = (sessionId: string, newStatus: string, action: string) => {
    const updatedSessions = sessions.map((session) => {
      if (session.id === sessionId) {
        let updates: any = { status: newStatus }

        if (newStatus === "active" && session.status !== "active") {
          const startTime = new Date()
          updates = {
            ...updates,
            startTime,
            endTime: addMinutes(startTime, session.duration),
          }
        }

        return { ...session, ...updates }
      }
      return session
    })

    setSessions(updatedSessions)

    // Save to localStorage
    const sessionsForStorage = updatedSessions.map((session) => ({
      ...session,
      startTime: session.startTime?.toISOString(),
      endTime: session.endTime?.toISOString(),
      createdAt: session.createdAt?.toISOString(),
    }))
    localStorage.setItem("votingSessions", JSON.stringify(sessionsForStorage))

    // Create audit log
    const session = sessions.find((s) => s.id === sessionId)
    createAuditLog(action, `${action.replace("_", " ").toLowerCase()}: ${session?.title}`, sessionId)
  }

  const deleteSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId)
    const updatedSessions = sessions.filter((s) => s.id !== sessionId)
    setSessions(updatedSessions)

    // Save to localStorage
    const sessionsForStorage = updatedSessions.map((session) => ({
      ...session,
      startTime: session.startTime?.toISOString(),
      endTime: session.endTime?.toISOString(),
      createdAt: session.createdAt?.toISOString(),
    }))
    localStorage.setItem("votingSessions", JSON.stringify(sessionsForStorage))

    // Create audit log
    createAuditLog("SESSION_DELETED", `Deleted voting session: ${session?.title}`, sessionId)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      case "draft":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Play className="h-4 w-4" />
      case "paused":
        return <Pause className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "draft":
        return <Square className="h-4 w-4" />
      default:
        return <Square className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Create Session Form */}
      {showCreateForm && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-yellow-200">
            <CardHeader>
              <CardTitle className="text-yellow-800">Create New Voting Session</CardTitle>
              <CardDescription>Set up a time-limited rating session for restaurant guests</CardDescription>
            </CardHeader>
            <CardContent>
              <FormProvider {...methods}>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  methods.handleSubmit((data) => createSession(data, e))();
                }} className="space-y-4">
                  <FormField
                    control={methods.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter session title" {...field} />
                        </FormControl>
                        {methods.formState.errors.title && (
                          <FormMessage>{methods.formState.errors.title.message as string}</FormMessage>
                        )}
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
                        {methods.formState.errors.duration && (
                          <FormMessage>{methods.formState.errors.duration.message as string}</FormMessage>
                        )}
                      </FormItem>
                    )}
                  />

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
                    <Button type="submit" className="bg-yellow-600 hover:bg-yellow-700">
                      Create Session
                    </Button>
                  </div>
                </form>
              </FormProvider>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.map((session) => (
          <Card key={session.id} className="border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{session.title}</h3>
                    <Badge className={getStatusColor(session.status)}>
                      {getStatusIcon(session.status)}
                      {session.status}
                    </Badge>
                  </div>

                  {session.description && <p className="text-muted-foreground mb-3">{session.description}</p>}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Duration:</span>
                      <p className="font-medium">{session.duration} minutes</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Votes:</span>
                      <p className="font-medium">{session.votes?.length || 0}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <p className="font-medium">{format(new Date(session.createdAt), "MMM dd, HH:mm")}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created by:</span>
                      <p className="font-medium">{session.createdBy || "Unknown"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  {session.status === "draft" && (
                    <Button
                      onClick={() => updateSessionStatus(session.id, "active", "SESSION_STARTED")}
                      size="sm"
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <Play className="h-3 w-3" />
                      Start
                    </Button>
                  )}

                  {session.status === "active" && (
                    <>
                      <Button
                        onClick={() => updateSessionStatus(session.id, "paused", "SESSION_PAUSED")}
                        size="sm"
                        variant="outline"
                        className="gap-2"
                      >
                        <Pause className="h-3 w-3" />
                        Pause
                      </Button>
                      <Button
                        onClick={() => updateSessionStatus(session.id, "completed", "SESSION_STOPPED")}
                        size="sm"
                        variant="destructive"
                        className="gap-2"
                      >
                        <Square className="h-3 w-3" />
                        Stop
                      </Button>
                    </>
                  )}

                  {session.status === "paused" && (
                    <Button
                      onClick={() => updateSessionStatus(session.id, "active", "SESSION_RESUMED")}
                      size="sm"
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
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

                  <Button
                    onClick={() => deleteSession(session.id)}
                    size="sm"
                    variant="outline"
                    className="gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sessions.length === 0 && (
        <Card className="border-yellow-200">
          <CardContent className="text-center py-12">
            <QrCode className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No voting sessions yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first time-limited voting session for restaurant guests
            </p>
            <Button onClick={() => setShowCreateForm(true)} className="gap-2 bg-yellow-600 hover:bg-yellow-700">
              <Plus className="h-4 w-4" />
              Create First Session
            </Button>
          </CardContent>
        </Card>
      )}

      {/* QR Code Modal */}
      {selectedSession && <QRCodeGenerator session={selectedSession} onClose={() => setSelectedSession(null)} />}
    </div>
  )
}
