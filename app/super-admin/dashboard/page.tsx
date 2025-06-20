"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Crown, LogOut, QrCode, Users, Clock, Activity, Shield, UserCog, KeyRound } from "lucide-react"
import VotingSessionManager from "@/components/super-admin/voting-session-manager"
import AuditLogViewer from "@/components/super-admin/audit-log-viewer"
import UserManagement from "@/components/super-admin/user-management"
import { format } from "date-fns"
import ChangePasswordDialog from "@/components/admin/change-password-dialog"

export default function SuperAdminDashboard() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState("")
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])

  useEffect(() => {
    // Check authentication using cookies instead of localStorage
    // The middleware.ts file will handle redirecting if not authenticated
    // We just need to fetch the current user info from the server
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/user-info')
        if (!response.ok) {
          // If not authenticated, the middleware should have redirected already
          // But just in case, we'll handle it here too
          router.push("/super-admin/login")
          return
        }
        
        const userData = await response.json()
        // Verify the user is a super admin
        if (userData.role !== 'superadmin') {
          router.push("/super-admin/login")
          return
        }
        
        setIsAuthenticated(true)
        setCurrentUser(userData.username || "")
      } catch (error) {
        console.error('Error fetching user info:', error)
        router.push("/super-admin/login")
      }
    }
    
    fetchUserInfo()

    // Load voting sessions from API
    const fetchVotingSessions = async () => {
      try {
        const response = await fetch('/api/voting-sessions')
        if (response.ok) {
          const data = await response.json()
          setSessions(data)
        }
      } catch (error) {
        console.error('Error fetching voting sessions:', error)
      }
    }
    
    // Load audit logs from API
    const fetchAuditLogs = async () => {
      try {
        const response = await fetch('/api/audit-logs')
        if (response.ok) {
          const data = await response.json()
          setAuditLogs(data)
        }
      } catch (error) {
        console.error('Error fetching audit logs:', error)
      }
    }
    
    // Create session access log via API
    const createAccessLog = async () => {
      try {
        await fetch('/api/audit-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'DASHBOARD_ACCESS',
            details: 'Accessed Super Admin dashboard',
          }),
        })
      } catch (error) {
        console.error('Error creating access log:', error)
      }
    }
    
    fetchVotingSessions()
    fetchAuditLogs()
    createAccessLog()
  }, [router])

  const handleLogout = async () => {
    try {
      // Create logout audit log via API
      await fetch("/api/audit-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "SUPER_ADMIN_LOGOUT",
          details: "Super Admin logged out",
        }),
      })

      // Call logout API to clear cookies
      await fetch("/api/logout", {
        method: "POST",
      })

      // Redirect to login page
      router.push("/super-admin/login")
    } catch (error) {
      console.error("Error during logout:", error)
      // Even if there's an error, try to redirect to login
      router.push("/super-admin/login")
    }
  }

  const notifyAdmins = async () => {
    try {
      // Create notification for admins about new session data via API
      await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "NEW_SESSION_DATA",
          message: "New voting session data is available for review",
        }),
      })

      // Create audit log via API
      const auditResponse = await fetch("/api/audit-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "ADMIN_NOTIFICATION_SENT",
          details: "Notification sent to admins about new session data",
        }),
      })
      
      // Refresh audit logs
      const logsResponse = await fetch("/api/audit-logs")
      if (logsResponse.ok) {
        const updatedLogs = await logsResponse.json()
        setAuditLogs(updatedLogs)
      }
    } catch (error) {
      console.error("Error notifying admins:", error)
    }
  }

  if (!isAuthenticated) {
    return <div>Loading...</div>
  }

  // Calculate metrics
  const activeSessions = sessions.filter((s) => s.status === "active").length
  const totalVotes = sessions.reduce((sum, s) => sum + (s.votes?.length || 0), 0)
  const completedToday = sessions.filter(
    (s) =>
      s.status === "completed" &&
      s.createdAt &&
      format(new Date(s.createdAt), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"),
  ).length

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Change Password Dialog */}
      <ChangePasswordDialog 
        open={isChangePasswordOpen} 
        onOpenChange={setIsChangePasswordOpen} 
        username={currentUser} 
      />
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-yellow-50 to-yellow-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Crown className="h-8 w-8 text-yellow-600" />
            <div>
              <h1 className="text-2xl font-bold text-yellow-800">Super Admin Dashboard</h1>
              <p className="text-yellow-700">Voting Session Management & System Control</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-yellow-600 text-yellow-700">
              <Shield className="h-3 w-3 mr-1" />
              {currentUser}
            </Badge>
            <Button onClick={notifyAdmins} variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              Notify Admins
            </Button>
            <Button onClick={() => setIsChangePasswordOpen(true)} variant="outline" className="gap-2 border-yellow-600 text-yellow-700 hover:text-yellow-800">
              <KeyRound className="h-4 w-4" />
              Change Password
            </Button>
            <Button onClick={handleLogout} variant="ghost" className="gap-2 text-yellow-700 hover:text-yellow-800">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Activity className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700">{activeSessions}</div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <QrCode className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700">{sessions.length}</div>
              <p className="text-xs text-muted-foreground">All time created</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
              <Users className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700">{totalVotes}</div>
              <p className="text-xs text-muted-foreground">Collected responses</p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700">{completedToday}</div>
              <p className="text-xs text-muted-foreground">Sessions finished</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sessions">Voting Sessions</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions">
            <VotingSessionManager 
              sessions={sessions}
              setSessions={setSessions}
              currentUser={currentUser}
              auditLogs={auditLogs}
              setAuditLogs={setAuditLogs}
            />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogViewer auditLogs={auditLogs} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
