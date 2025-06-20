"use client"

import { useState, useEffect } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  UserPlus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  AlertCircle, 
  Check, 
  X,
  Shield,
  Crown,
  Search
} from "lucide-react"
import { format } from "date-fns"
import { User } from "@/lib/user-schema"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function UserManagement() {
  const [users, setUsers] = useState<Partial<User>[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<Partial<User> | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Form states
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"admin" | "superadmin">("admin")
  const [isActive, setIsActive] = useState(true)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  
  // Current super admin username
  const [currentSuperAdmin, setCurrentSuperAdmin] = useState("")

  useEffect(() => {
    // Get current super admin username from localStorage
    const superAdminUser = localStorage.getItem("superAdminUser")
    if (superAdminUser) {
      setCurrentSuperAdmin(superAdminUser)
    }
    
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      // In a real app, this would be an actual API call with proper auth
      const response = await fetch("/api/users", {
        headers: {
          "Authorization": "Bearer dummy-token" // In a real app, this would be a real token
        },
        // Add cache busting parameter to prevent caching issues
        cache: 'no-store'
      })
      
      if (response.ok) {
        const data = await response.json()
        // Use a functional update to ensure we're working with the latest state
        setUsers(data)
      } else {
        console.error("Failed to fetch users")
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async () => {
    // Set loading state to prevent multiple actions
    setIsActionLoading(true)
    
    // Validate form
    const errors: Record<string, string> = {}
    
    if (!username) errors.username = "Username is required"
    if (!password) errors.password = "Password is required"
    if (!role) errors.role = "Role is required"
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      setIsActionLoading(false)
      return
    }
    
    setFormErrors({})
    
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer dummy-token" // In a real app, this would be a real token
        },
        body: JSON.stringify({
          username,
          password,
          role,
          isActive,
          createdBy: currentSuperAdmin || "superadmin"
        }),
        cache: 'no-store'
      })
      
      if (response.ok) {
        // Get the created user
        const newUser = await response.json()
        
        // Add the new user to the local state
        setUsers(prevUsers => [...prevUsers, newUser])
        
        toast({
          title: "Success",
          description: "User created successfully",
        })
        
        // Create audit log
        const auditLog = {
          id: `audit-${Date.now()}`,
          action: "USER_CREATED",
          user: currentSuperAdmin || "superadmin",
          timestamp: new Date().toISOString(),
          details: `Created new ${role} user: ${username}`,
        }

        const existingLogs = JSON.parse(localStorage.getItem("auditLogs") || "[]")
        existingLogs.push(auditLog)
        localStorage.setItem("auditLogs", JSON.stringify(existingLogs))
        
        // Small delay before closing dialog and allowing new actions
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Reset form
        setUsername("")
        setPassword("")
        setRole("admin")
        setIsActive(true)
        
        // Close dialog
        setIsCreateDialogOpen(false)
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to create user",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error creating user:", error)
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive"
      })
    } finally {
      // Always reset loading state
      setIsActionLoading(false)
    }
  }

  const handleEditUser = async () => {
    if (!currentUser) return
    
    // Set loading state to prevent multiple actions
    setIsActionLoading(true)
    
    // Validate form
    const errors: Record<string, string> = {}
    
    if (!username) errors.username = "Username is required"
    if (!role) errors.role = "Role is required"
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      setIsActionLoading(false)
      return
    }
    
    setFormErrors({})
    
    try {
      const response = await fetch(`/api/users?id=${currentUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer dummy-token" // In a real app, this would be a real token
        },
        body: JSON.stringify({
          username,
          password: password || undefined, // Only send password if it's changed
          role,
          isActive
        }),
        cache: 'no-store'
      })
      
      if (response.ok) {
        // Get the updated user data
        const updatedUser = await response.json()
        
        // Update the user in the local state
        setUsers(prevUsers => 
          prevUsers.map(u => {
            if (u.id === currentUser.id) {
              return { 
                ...u, 
                username, 
                role, 
                isActive 
              }
            }
            return u
          })
        )
        
        toast({
          title: "Success",
          description: "User updated successfully",
        })
        
        // Create audit log
        const auditLog = {
          id: `audit-${Date.now()}`,
          action: "USER_UPDATED",
          user: currentSuperAdmin || "superadmin",
          timestamp: new Date().toISOString(),
          details: `Updated user: ${username}`,
        }

        const existingLogs = JSON.parse(localStorage.getItem("auditLogs") || "[]")
        existingLogs.push(auditLog)
        localStorage.setItem("auditLogs", JSON.stringify(existingLogs))
        
        // Small delay before closing dialog and allowing new actions
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Close dialog
        setIsEditDialogOpen(false)
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to update user",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive"
      })
    } finally {
      // Always reset loading state
      setIsActionLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!currentUser) return
    
    // Set loading state to prevent multiple actions
    setIsActionLoading(true)
    
    try {
      const response = await fetch(`/api/users?id=${currentUser.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": "Bearer dummy-token" // In a real app, this would be a real token
        },
        cache: 'no-store'
      })
      
      if (response.ok) {
        // Remove the user from the local state
        setUsers(prevUsers => prevUsers.filter(u => u.id !== currentUser.id))
        
        toast({
          title: "Success",
          description: "User deleted successfully",
        })
        
        // Create audit log
        const auditLog = {
          id: `audit-${Date.now()}`,
          action: "USER_DELETED",
          user: currentSuperAdmin || "superadmin",
          timestamp: new Date().toISOString(),
          details: `Deleted user: ${currentUser.username}`,
        }

        const existingLogs = JSON.parse(localStorage.getItem("auditLogs") || "[]")
        existingLogs.push(auditLog)
        localStorage.setItem("auditLogs", JSON.stringify(existingLogs))
        
        // Small delay before closing dialog and allowing new actions
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Close dialog
        setIsDeleteDialogOpen(false)
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete user",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      })
    } finally {
      // Always reset loading state
      setIsActionLoading(false)
    }
  }

  const handleToggleUserStatus = async (event: React.MouseEvent, user: Partial<User>) => {
    // Prevent default behavior and stop propagation
    event.preventDefault()
    event.stopPropagation()
    
    // Set loading state to prevent multiple actions
    setIsActionLoading(true)
    
    try {
      const response = await fetch(`/api/users?id=${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer dummy-token" // In a real app, this would be a real token
        },
        body: JSON.stringify({
          isActive: !user.isActive
        }),
        cache: 'no-store'
      })
      
      if (response.ok) {
        // Get the updated user from the response
        const updatedUser = await response.json()
        
        // Update the user in the local state to avoid a full refresh
        setUsers(prevUsers => 
          prevUsers.map(u => {
            if (u.id === user.id) {
              return { ...u, isActive: !user.isActive }
            }
            return u
          })
        )
        
        toast({
          title: "Success",
          description: `User ${user.isActive ? "deactivated" : "activated"} successfully`,
        })
        
        // Create audit log
        const auditLog = {
          id: `audit-${Date.now()}`,
          action: user.isActive ? "USER_DEACTIVATED" : "USER_ACTIVATED",
          user: currentSuperAdmin || "superadmin",
          timestamp: new Date().toISOString(),
          details: `${user.isActive ? "Deactivated" : "Activated"} user: ${user.username}`,
        }

        const existingLogs = JSON.parse(localStorage.getItem("auditLogs") || "[]")
        existingLogs.push(auditLog)
        localStorage.setItem("auditLogs", JSON.stringify(existingLogs))
        
        // Small delay before allowing new actions
        await new Promise(resolve => setTimeout(resolve, 300))
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || `Failed to ${user.isActive ? "deactivate" : "activate"} user`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error(`Error ${user.isActive ? "deactivating" : "activating"} user:`, error)
      toast({
        title: "Error",
        description: `Failed to ${user.isActive ? "deactivate" : "activate"} user`,
        variant: "destructive"
      })
    } finally {
      // Always reset loading state
      setIsActionLoading(false)
    }
  }

  const openEditDialog = (event: React.MouseEvent, user: Partial<User>) => {
    // Prevent default behavior and stop propagation
    event.preventDefault()
    event.stopPropagation()
    
    setCurrentUser(user)
    setUsername(user.username || "")
    setPassword("") // Don't populate password
    setRole(user.role as "admin" | "superadmin" || "admin")
    setIsActive(user.isActive !== undefined ? user.isActive : true)
    setFormErrors({})
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (event: React.MouseEvent, user: Partial<User>) => {
    // Prevent default behavior and stop propagation
    event.preventDefault()
    event.stopPropagation()
    
    setCurrentUser(user)
    setIsDeleteDialogOpen(true)
  }

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Toaster />
      
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-yellow-800">User Management</h2>
          <p className="text-muted-foreground">Manage admin and super admin accounts</p>
        </div>
        <Button onClick={() => {
          setUsername("")
          setPassword("")
          setRole("admin")
          setIsActive(true)
          setFormErrors({})
          setIsCreateDialogOpen(true)
        }} className="bg-yellow-600 hover:bg-yellow-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-700"></div>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="bg-yellow-50">
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>
                      {user.role === "superadmin" ? (
                        <Badge variant="outline" className="border-yellow-600 text-yellow-700 flex items-center w-fit gap-1">
                          <Crown className="h-3 w-3" />
                          Super Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-primary text-primary flex items-center w-fit gap-1">
                          <Shield className="h-3 w-3" />
                          Admin
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge variant="outline" className="border-green-600 text-green-700 bg-green-50 flex items-center w-fit gap-1">
                          <Check className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-red-600 text-red-700 bg-red-50 flex items-center w-fit gap-1">
                          <X className="h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "N/A"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.lastLogin ? format(new Date(user.lastLogin), "MMM d, yyyy HH:mm") : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => openEditDialog(e, user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => handleToggleUserStatus(e, user)}
                            disabled={isActionLoading}
                          >
                            {user.isActive ? (
                              <>
                                <X className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={(e) => openDeleteDialog(e, user)}
                            className="text-red-600 focus:text-red-600"
                            disabled={user.username === currentSuperAdmin || isActionLoading}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new admin or super admin user to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
              />
              {formErrors.username && (
                <p className="text-sm text-red-500">{formErrors.username}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
              {formErrors.password && (
                <p className="text-sm text-red-500">{formErrors.password}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as "admin" | "superadmin")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.role && (
                <p className="text-sm text-red-500">{formErrors.role}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive">Account Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} className="bg-yellow-600 hover:bg-yellow-700">
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
              />
              {formErrors.username && (
                <p className="text-sm text-red-500">{formErrors.username}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">
                Password <span className="text-muted-foreground">(leave blank to keep current)</span>
              </Label>
              <Input
                id="edit-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as "admin" | "superadmin")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              {formErrors.role && (
                <p className="text-sm text-red-500">{formErrors.role}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="edit-isActive">Account Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} className="bg-yellow-600 hover:bg-yellow-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                You are about to delete user "{currentUser?.username}". This action is permanent.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
