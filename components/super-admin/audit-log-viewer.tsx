"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Download, Shield, Activity, User, Clock } from "lucide-react"
import { format } from "date-fns"

interface AuditLogViewerProps {
  auditLogs: any[]
}

export default function AuditLogViewer({ auditLogs }: AuditLogViewerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterAction, setFilterAction] = useState("all")
  const [filterUser, setFilterUser] = useState("all")

  // Filter logs
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesAction = filterAction === "all" || log.action === filterAction
    const matchesUser = filterUser === "all" || log.user === filterUser

    return matchesSearch && matchesAction && matchesUser
  })

  // Get unique actions and users for filters
  const uniqueActions = [...new Set(auditLogs.map((log) => log.action))]
  const uniqueUsers = [...new Set(auditLogs.map((log) => log.user))]

  const exportLogs = () => {
    const headers = ["Timestamp", "User", "Action", "Details", "Session ID"]
    const csvData = filteredLogs.map((log) => [
      format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss"),
      log.user,
      log.action,
      `"${log.details}"`,
      log.sessionId || "N/A",
    ])

    const csv = [headers, ...csvData].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "SUPER_ADMIN_LOGIN":
      case "SUPER_ADMIN_LOGOUT":
        return "bg-yellow-100 text-yellow-800"
      case "SESSION_CREATED":
        return "bg-green-100 text-green-800"
      case "SESSION_STARTED":
      case "SESSION_RESUMED":
        return "bg-blue-100 text-blue-800"
      case "SESSION_PAUSED":
        return "bg-orange-100 text-orange-800"
      case "SESSION_STOPPED":
      case "SESSION_DELETED":
        return "bg-red-100 text-red-800"
      case "DASHBOARD_ACCESS":
        return "bg-purple-100 text-purple-800"
      case "ADMIN_NOTIFICATION_SENT":
        return "bg-indigo-100 text-indigo-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "SUPER_ADMIN_LOGIN":
      case "SUPER_ADMIN_LOGOUT":
        return <Shield className="h-3 w-3" />
      case "SESSION_CREATED":
      case "SESSION_STARTED":
      case "SESSION_RESUMED":
      case "SESSION_PAUSED":
      case "SESSION_STOPPED":
      case "SESSION_DELETED":
        return <Activity className="h-3 w-3" />
      case "DASHBOARD_ACCESS":
        return <User className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Audit Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{auditLogs.length}</div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Session Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">
              {auditLogs.filter((log) => log.action.includes("SESSION")).length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Login Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">
              {auditLogs.filter((log) => log.action.includes("LOGIN")).length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Today's Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">
              {
                auditLogs.filter(
                  (log) => format(new Date(log.timestamp), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"),
                ).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filter Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input placeholder="Search logs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {uniqueActions.map((action) => (
                <SelectItem key={action} value={action}>
                  {action.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {uniqueUsers.map((user) => (
                <SelectItem key={user} value={user}>
                  {user}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={exportLogs} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card className="border-yellow-200">
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {auditLogs.length} audit entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredLogs.map((log, index) => (
              <div key={`${log.id}-${index}`} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={getActionColor(log.action)}>
                      {getActionIcon(log.action)}
                      {log.action.replace(/_/g, " ")}
                    </Badge>
                    <span className="font-medium">{log.user}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(log.timestamp), "MMM dd, yyyy HH:mm:ss")}
                  </div>
                </div>

                <p className="text-sm">{log.details}</p>

                {log.sessionId && <div className="text-xs text-muted-foreground">Session ID: {log.sessionId}</div>}
              </div>
            ))}
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No audit logs found matching your filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
