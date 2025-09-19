"use client"

import type React from "react"
import { useState, useTransition } from "react"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  MoreHorizontal,
  User,
  Shield,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Filter,
  X,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCheck,
  UserX,
  Crown,
  Key,
  Building,
  Mail,
  AtSign,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  createUser,
  updateUser,
  deleteUser,
  assignUserRole,
  removeUserRole,
  assignUserPermission,
  removeUserPermission,
  type CreateUserInput,
  type UpdateUserInput,
  type UserWithAssignments,
  type AssignRoleInput,
  type AssignPermissionInput,
} from "@/lib/actions/user-management-actions"

interface BusinessUnit {
  id: string
  name: string
  code: string
  isActive: boolean
}

interface Role {
  id: string
  name: string
  displayName: string
  description: string | null
  isSystem: boolean
}

interface Permission {
  id: string
  name: string
  displayName: string
  description: string | null
  scope: string
  module: string
}

interface UserManagementProps {
  businessUnitId: string
  initialUsers: UserWithAssignments[]
  businessUnits: BusinessUnit[]
  roles: Role[]
  permissions: Permission[]
}

interface UserFormData {
  email: string
  username: string
  name: string
  password: string
  confirmPassword: string
  isActive: boolean
}

const getUserStatusColor = (isActive: boolean) => {
  return isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
}

const getRoleColor = (isSystem: boolean) => {
  return isSystem ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
}

const getPermissionScopeColor = (scope: string) => {
  switch (scope) {
    case "GLOBAL":
      return "bg-orange-100 text-orange-800"
    case "BUSINESS_UNIT":
      return "bg-cyan-100 text-cyan-800"
    case "DEPARTMENT":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const UserForm = ({
  user,
  onSubmit,
  onCancel,
  isLoading,
}: {
  user?: UserWithAssignments
  onSubmit: (data: UserFormData) => void
  onCancel: () => void
  isLoading: boolean
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    email: user?.email || "",
    username: user?.username || "",
    name: user?.name || "",
    password: "",
    confirmPassword: "",
    isActive: user?.isActive ?? true,
  })

  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!user && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (!user && formData.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Enter full name"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username *</Label>
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
              placeholder="Enter username"
              className="pl-10"
              required
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address *</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="Enter email address"
            className="pl-10"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      {!user && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
                className="pl-10 pr-10"
                required
                disabled={isLoading}
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm password"
                className="pl-10"
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
          disabled={isLoading}
        />
        <Label htmlFor="isActive" className="text-sm text-gray-600">
          User is active
        </Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {user ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>{user ? "Update User" : "Create User"}</>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

const RoleAssignmentDialog = ({
  user,
  businessUnits,
  roles,
  onAssign,
  onRemove,
  isOpen,
  onClose,
  isLoading,
}: {
  user: UserWithAssignments
  businessUnits: BusinessUnit[]
  roles: Role[]
  onAssign: (data: AssignRoleInput) => void
  onRemove: (userId: string, businessUnitId: string, roleId: string) => void
  isOpen: boolean
  onClose: () => void
  isLoading: boolean
}) => {
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState("")
  const [selectedRole, setSelectedRole] = useState("")

  const handleAssign = () => {
    if (!selectedBusinessUnit || !selectedRole) {
      toast.error("Please select both business unit and role")
      return
    }

    onAssign({
      userId: user.id,
      businessUnitId: selectedBusinessUnit,
      roleId: selectedRole,
    })

    setSelectedBusinessUnit("")
    setSelectedRole("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Roles - {user.name}</DialogTitle>
          <DialogDescription>Assign or remove roles for this user across different business units</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Assignments */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Current Role Assignments</Label>
            {user.userBusinessUnitRole.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No roles assigned</p>
            ) : (
              <div className="space-y-2">
                {user.userBusinessUnitRole.map((assignment) => (
                  <div
                    key={`${assignment.businessUnitId}-${assignment.roleId}`}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <Building className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="font-medium text-sm">{assignment.businessUnit.name}</div>
                        <div className="text-xs text-gray-500">{assignment.businessUnit.code}</div>
                      </div>
                      <Badge className={getRoleColor(assignment.role.isSystem)}>
                        {assignment.role.isSystem && <Crown className="w-3 h-3 mr-1" />}
                        {assignment.role.displayName}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(user.id, assignment.businessUnitId, assignment.roleId)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assign New Role */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Assign New Role</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessUnit">Business Unit</Label>
                <Select value={selectedBusinessUnit} onValueChange={setSelectedBusinessUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessUnits
                      .filter((bu) => bu.isActive)
                      .map((businessUnit) => (
                        <SelectItem key={businessUnit.id} value={businessUnit.id}>
                          <div className="flex items-center">
                            <Building className="w-4 h-4 mr-2" />
                            {businessUnit.name} ({businessUnit.code})
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center">
                          {role.isSystem ? <Crown className="w-4 h-4 mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                          {role.displayName}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleAssign}
              disabled={!selectedBusinessUnit || !selectedRole || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Assign Role
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const PermissionAssignmentDialog = ({
  user,
  permissions,
  onAssign,
  onRemove,
  isOpen,
  onClose,
  isLoading,
}: {
  user: UserWithAssignments
  permissions: Permission[]
  onAssign: (data: AssignPermissionInput) => void
  onRemove: (userId: string, permissionId: string) => void
  isOpen: boolean
  onClose: () => void
  isLoading: boolean
}) => {
  const [selectedPermission, setSelectedPermission] = useState("")
  const [filterModule, setFilterModule] = useState("all")

  const modules = Array.from(new Set(permissions.map((p) => p.module))).sort()
  const filteredPermissions =
    filterModule === "all" ? permissions : permissions.filter((p) => p.module === filterModule)

  const handleAssign = () => {
    if (!selectedPermission) {
      toast.error("Please select a permission")
      return
    }

    onAssign({
      userId: user.id,
      permissionId: selectedPermission,
    })

    setSelectedPermission("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Manage Direct Permissions - {user.name}</DialogTitle>
          <DialogDescription>
            Assign or remove direct permissions for this user (in addition to role-based permissions)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Direct Permissions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Current Direct Permissions</Label>
            {user.userPermission.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No direct permissions assigned</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {user.userPermission.map((assignment) => (
                  <div
                    key={assignment.permissionId}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      <Key className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="font-medium text-sm">{assignment.permission.displayName}</div>
                        <div className="text-xs text-gray-500">{assignment.permission.module}</div>
                      </div>
                      <Badge className={getPermissionScopeColor(assignment.permission.scope)}>
                        {assignment.permission.scope}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(user.id, assignment.permissionId)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assign New Permission */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Assign New Permission</Label>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="module">Filter by Module</Label>
                <Select value={filterModule} onValueChange={setFilterModule}>
                  <SelectTrigger>
                    <SelectValue placeholder="All modules" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modules</SelectItem>
                    {modules.map((module) => (
                      <SelectItem key={module} value={module}>
                        {module}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="permission">Permission</Label>
                <Select value={selectedPermission} onValueChange={setSelectedPermission}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select permission" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPermissions
                      .filter((p) => !user.userPermission.some((up) => up.permissionId === p.id))
                      .map((permission) => (
                        <SelectItem key={permission.id} value={permission.id}>
                          <div className="flex items-center">
                            <Key className="w-4 h-4 mr-2" />
                            <div>
                              <div className="font-medium">{permission.displayName}</div>
                              <div className="text-xs text-gray-500">
                                {permission.module} • {permission.scope}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleAssign} disabled={!selectedPermission || isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Assign Permission
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function UserManagement({
  initialUsers,
  businessUnits,
  roles,
  permissions,
}: UserManagementProps) {
  const [users, setUsers] = useState<UserWithAssignments[]>(initialUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<UserWithAssignments | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [isPending, startTransition] = useTransition()

  const itemsPerPage = 10

  // Filter users based on search, status, and role
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.isActive) ||
      (statusFilter === "inactive" && !user.isActive)

    const matchesRole =
      roleFilter === "all" || user.userBusinessUnitRole.some((assignment) => assignment.roleId === roleFilter)

    return matchesSearch && matchesStatus && matchesRole
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  // Reset to first page when filters change
  const resetToFirstPage = () => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }

  const handleCreateUser = (formData: UserFormData) => {
    startTransition(async () => {
      const userData: CreateUserInput = {
        email: formData.email,
        username: formData.username,
        name: formData.name,
        password: formData.password,
        isActive: formData.isActive,
      }

      const result = await createUser(userData)

      if (result.success && result.user) {
        setUsers((prev) => [result.user!, ...prev])
        setIsCreateDialogOpen(false)
        toast.success("User created successfully.")
      } else {
        toast.error(result.error || "Failed to create user.")
      }
    })
  }

  const handleUpdateUser = (formData: UserFormData) => {
    if (!selectedUser) return

    startTransition(async () => {
      const updateData: UpdateUserInput = {
        email: formData.email,
        username: formData.username,
        name: formData.name,
        isActive: formData.isActive,
      }

      if (formData.password) {
        updateData.password = formData.password
      }

      const result = await updateUser(selectedUser.id, updateData)

      if (result.success && result.user) {
        setUsers((prev) => prev.map((user) => (user.id === selectedUser.id ? result.user! : user)))
        setIsEditDialogOpen(false)
        setSelectedUser(null)
        toast.success("User updated successfully.")
      } else {
        toast.error(result.error || "Failed to update user.")
      }
    })
  }

  const handleDeleteUser = () => {
    if (!selectedUser) return

    startTransition(async () => {
      const result = await deleteUser(selectedUser.id)

      if (result.success) {
        setUsers((prev) => prev.filter((user) => user.id !== selectedUser.id))
        setIsDeleteDialogOpen(false)
        setSelectedUser(null)
        toast.success("User deleted successfully.")
      } else {
        toast.error(result.error || "Failed to delete user.")
      }
    })
  }

  const handleAssignRole = (assignmentData: AssignRoleInput) => {
    startTransition(async () => {
      const result = await assignUserRole(assignmentData)

      if (result.success) {
        // Refresh user data - in a real app, you might want to refetch from server
        toast.success("Role assigned successfully.")
        // For now, close dialog and let user refresh
        setIsRoleDialogOpen(false)
      } else {
        toast.error(result.error || "Failed to assign role.")
      }
    })
  }

  const handleRemoveRole = (userId: string, businessUnitId: string, roleId: string) => {
    startTransition(async () => {
      const result = await removeUserRole(userId, businessUnitId, roleId)

      if (result.success) {
        toast.success("Role removed successfully.")
        // Update local state
        setUsers((prev) =>
          prev.map((user) => {
            if (user.id === userId) {
              return {
                ...user,
                userBusinessUnitRole: user.userBusinessUnitRole.filter(
                  (assignment) => !(assignment.businessUnitId === businessUnitId && assignment.roleId === roleId),
                ),
              }
            }
            return user
          }),
        )
      } else {
        toast.error(result.error || "Failed to remove role.")
      }
    })
  }

  const handleAssignPermission = (assignmentData: AssignPermissionInput) => {
    startTransition(async () => {
      const result = await assignUserPermission(assignmentData)

      if (result.success) {
        toast.success("Permission assigned successfully.")
        setIsPermissionDialogOpen(false)
      } else {
        toast.error(result.error || "Failed to assign permission.")
      }
    })
  }

  const handleRemovePermission = (userId: string, permissionId: string) => {
    startTransition(async () => {
      const result = await removeUserPermission(userId, permissionId)

      if (result.success) {
        toast.success("Permission removed successfully.")
        // Update local state
        setUsers((prev) =>
          prev.map((user) => {
            if (user.id === userId) {
              return {
                ...user,
                userPermission: user.userPermission.filter((assignment) => assignment.permissionId !== permissionId),
              }
            }
            return user
          }),
        )
      } else {
        toast.error(result.error || "Failed to remove permission.")
      }
    })
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setRoleFilter("all")
    setCurrentPage(1)
  }

  const statsData = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.isActive).length,
    inactiveUsers: users.filter((u) => !u.isActive).length,
    usersWithRoles: users.filter((u) => u.userBusinessUnitRole.length > 0).length,
    usersWithDirectPermissions: users.filter((u) => u.userPermission.length > 0).length,
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${isSidebarOpen ? "w-80" : "w-16"} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {isSidebarOpen && (
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-900">Filters</span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2">
              {isSidebarOpen ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Sidebar Content */}
        {isSidebarOpen && (
          <div className="flex-1 p-4 space-y-6 overflow-y-auto">
            {/* Search */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    resetToFirstPage()
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value)
                  resetToFirstPage()
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">
                    <div className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                      Inactive
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Role Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Role</Label>
              <Select
                value={roleFilter}
                onValueChange={(value) => {
                  setRoleFilter(value)
                  resetToFirstPage()
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center">
                        {role.isSystem ? (
                          <Crown className="w-4 h-4 mr-2 text-purple-500" />
                        ) : (
                          <Shield className="w-4 h-4 mr-2 text-blue-500" />
                        )}
                        {role.displayName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="w-full bg-transparent"
              disabled={searchQuery === "" && statusFilter === "all" && roleFilter === "all"}
            >
              <X className="w-4 h-4 mr-2" />
              Clear All Filters
            </Button>

            <Separator />

            {/* Quick Stats */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Quick Stats
              </Label>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Users className="w-3 h-3 mr-1 text-blue-500" />
                    <span className="text-gray-600">Total Users:</span>
                  </div>
                  <span className="font-medium">{statsData.totalUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <UserCheck className="w-3 h-3 mr-1 text-green-500" />
                    <span className="text-gray-600">Active:</span>
                  </div>
                  <span className="font-medium text-green-600">{statsData.activeUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <UserX className="w-3 h-3 mr-1 text-red-500" />
                    <span className="text-gray-600">Inactive:</span>
                  </div>
                  <span className="font-medium text-red-600">{statsData.inactiveUsers}</span>
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Shield className="w-3 h-3 mr-1 text-blue-500" />
                    <span className="text-gray-600">With Roles:</span>
                  </div>
                  <span className="font-medium">{statsData.usersWithRoles}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Key className="w-3 h-3 mr-1 text-orange-500" />
                    <span className="text-gray-600">Direct Permissions:</span>
                  </div>
                  <span className="font-medium">{statsData.usersWithDirectPermissions}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Manage users, roles, and permissions</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>Add a new user to the system</DialogDescription>
                </DialogHeader>
                <UserForm
                  onSubmit={handleCreateUser}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  isLoading={isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-2">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500 text-center mb-6 max-w-md">
                {searchQuery || statusFilter !== "all" || roleFilter !== "all"
                  ? "No users match your current filters. Try adjusting your search criteria."
                  : "Get started by creating your first user account."}
              </p>
              {!searchQuery && statusFilter === "all" && roleFilter === "all" && (
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create User
                </Button>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">User</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Roles</TableHead>
                      <TableHead className="font-semibold">Direct Permissions</TableHead>
                      <TableHead className="font-semibold">Created</TableHead>
                      <TableHead className="font-semibold w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getUserStatusColor(user.isActive)}>
                            {user.isActive ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {user.userBusinessUnitRole.length === 0 ? (
                              <span className="text-gray-400 text-sm">No roles</span>
                            ) : (
                              user.userBusinessUnitRole.slice(0, 2).map((assignment) => (
                                <Badge
                                  key={`${assignment.businessUnitId}-${assignment.roleId}`}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {assignment.role.displayName}
                                </Badge>
                              ))
                            )}
                            {user.userBusinessUnitRole.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{user.userBusinessUnitRole.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Key className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium">{user.userPermission.length}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{user.createdAt.toLocaleDateString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user)
                                  setIsRoleDialogOpen(true)
                                }}
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Manage Roles
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user)
                                  setIsPermissionDialogOpen(true)
                                }}
                              >
                                <Key className="w-4 h-4 mr-2" />
                                Manage Permissions
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user)
                                  setIsDeleteDialogOpen(true)
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {filteredUsers.length > 0 && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} ({filteredUsers.length} users)
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>

                {/* Page numbers */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((pageNum) => {
                      if (pageNum === 1 || pageNum === totalPages) return true
                      if (pageNum >= currentPage - 1 && pageNum <= currentPage + 1) return true
                      return false
                    })
                    .map((pageNum, index, arr) => (
                      <div key={pageNum} className="flex items-center">
                        {index > 0 && pageNum > arr[index - 1] + 1 && <span className="px-2 text-gray-400">...</span>}
                        <Button
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      </div>
                    ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update the user information</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <UserForm
              user={selectedUser}
              onSubmit={handleUpdateUser}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedUser(null)
              }}
              isLoading={isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedUser?.name}&quot;? This action cannot be undone and will remove all
              role assignments and permissions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedUser(null)
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Assignment Dialog */}
      {selectedUser && (
        <RoleAssignmentDialog
          user={selectedUser}
          businessUnits={businessUnits}
          roles={roles}
          onAssign={handleAssignRole}
          onRemove={handleRemoveRole}
          isOpen={isRoleDialogOpen}
          onClose={() => {
            setIsRoleDialogOpen(false)
            setSelectedUser(null)
          }}
          isLoading={isPending}
        />
      )}

      {/* Permission Assignment Dialog */}
      {selectedUser && (
        <PermissionAssignmentDialog
          user={selectedUser}
          permissions={permissions}
          onAssign={handleAssignPermission}
          onRemove={handleRemovePermission}
          isOpen={isPermissionDialogOpen}
          onClose={() => {
            setIsPermissionDialogOpen(false)
            setSelectedUser(null)
          }}
          isLoading={isPending}
        />
      )}
    </div>
  )
}