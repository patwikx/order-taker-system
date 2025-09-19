"use client"

import type React from "react"
import { useState, useTransition } from "react"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  MoreHorizontal,
  Shield,
  Crown,
  Key,
  CheckCircle2,
  Loader2,
  Filter,
  X,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Users,
  Hash,
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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import {
  createRole,
  updateRole,
  deleteRole,
  assignRolePermission,
  removeRolePermission,
  bulkAssignRolePermissions,
  bulkRemoveRolePermissions,
  type CreateRoleInput,
  type UpdateRoleInput,
  type RoleWithPermissions,
  type AssignRolePermissionInput,
} from "@/lib/actions/role-management-actions"

interface Permission {
  id: string
  name: string
  displayName: string
  description: string | null
  scope: string
  module: string
}

interface RoleManagementProps {
  initialRoles: RoleWithPermissions[]
  permissions: Permission[]
}

interface RoleFormData {
  name: string
  displayName: string
  description: string
  isSystem: boolean
}

const getRoleTypeColor = (isSystem: boolean) => {
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

const RoleForm = ({
  role,
  onSubmit,
  onCancel,
  isLoading,
}: {
  role?: RoleWithPermissions
  onSubmit: (data: RoleFormData) => void
  onCancel: () => void
  isLoading: boolean
}) => {
  const [formData, setFormData] = useState<RoleFormData>({
    name: role?.name || "",
    displayName: role?.displayName || "",
    description: role?.description || "",
    isSystem: role?.isSystem ?? false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Role Name *</Label>
<Input
  id="name"
  value={formData.name}
  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
  placeholder="Enter role name (e.g., admin, manager)"
  required
  disabled={Boolean(isLoading || (role?.isSystem && role.name))}
/>
          <p className="text-xs text-gray-500">Used internally for permissions</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name *</Label>
          <Input
            id="displayName"
            value={formData.displayName}
            onChange={(e) => setFormData((prev) => ({ ...prev, displayName: e.target.value }))}
            placeholder="Enter display name (e.g., Administrator, Manager)"
            required
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500">Shown to users</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the role's purpose and responsibilities"
          rows={3}
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
        <Switch
          id="isSystem"
          checked={formData.isSystem}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isSystem: checked }))}
          disabled={isLoading || role?.isSystem}
        />
        <div className="flex-1">
          <Label htmlFor="isSystem" className="text-sm font-medium">
            System Role
          </Label>
          <p className="text-xs text-gray-500">System roles cannot be deleted and have special privileges</p>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {role ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>{role ? "Update Role" : "Create Role"}</>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

const PermissionAssignmentDialog = ({
  role,
  permissions,
  onAssign,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRemove,
  onBulkAssign,
  onBulkRemove,
  isOpen,
  onClose,
  isLoading,
}: {
  role: RoleWithPermissions
  permissions: Permission[]
  onAssign: (data: AssignRolePermissionInput) => void
  onRemove: (roleId: string, permissionId: string) => void
  onBulkAssign: (roleId: string, permissionIds: string[]) => void
  onBulkRemove: (roleId: string, permissionIds: string[]) => void
  isOpen: boolean
  onClose: () => void
  isLoading: boolean
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [filterModule, setFilterModule] = useState("all")
  const [filterScope, setFilterScope] = useState("all")
  const [showAssigned, setShowAssigned] = useState(true)
  const [showUnassigned, setShowUnassigned] = useState(true)

  const modules = Array.from(new Set(permissions.map((p) => p.module))).sort()
  const scopes = Array.from(new Set(permissions.map((p) => p.scope))).sort()

  const assignedPermissionIds = new Set(role.permissions.map((rp) => rp.permissionId))

  const filteredPermissions = permissions.filter((permission) => {
    const matchesModule = filterModule === "all" || permission.module === filterModule
    const matchesScope = filterScope === "all" || permission.scope === filterScope
    const isAssigned = assignedPermissionIds.has(permission.id)
    const matchesAssignmentFilter = (showAssigned && isAssigned) || (showUnassigned && !isAssigned)

    return matchesModule && matchesScope && matchesAssignmentFilter
  })

  const handleBulkAssign = () => {
    const unassignedSelected = selectedPermissions.filter((id) => !assignedPermissionIds.has(id))
    if (unassignedSelected.length === 0) {
      toast.error("No unassigned permissions selected")
      return
    }
    onBulkAssign(role.id, unassignedSelected)
    setSelectedPermissions([])
  }

  const handleBulkRemove = () => {
    const assignedSelected = selectedPermissions.filter((id) => assignedPermissionIds.has(id))
    if (assignedSelected.length === 0) {
      toast.error("No assigned permissions selected")
      return
    }
    onBulkRemove(role.id, assignedSelected)
    setSelectedPermissions([])
  }

  const handleSelectAll = () => {
    if (selectedPermissions.length === filteredPermissions.length) {
      setSelectedPermissions([])
    } else {
      setSelectedPermissions(filteredPermissions.map((p) => p.id))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Manage Permissions - {role.displayName}</DialogTitle>
          <DialogDescription>Assign or remove permissions for this role</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Module</Label>
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
              <Label>Scope</Label>
              <Select value={filterScope} onValueChange={setFilterScope}>
                <SelectTrigger>
                  <SelectValue placeholder="All scopes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scopes</SelectItem>
                  {scopes.map((scope) => (
                    <SelectItem key={scope} value={scope}>
                      {scope}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Show</Label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
<Checkbox 
  id="showAssigned" 
  checked={showAssigned} 
  onCheckedChange={(checked) => setShowAssigned(checked === true)} 
/>
                  <Label htmlFor="showAssigned" className="text-sm">
                    Assigned
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
<Checkbox 
  id="showUnassigned" 
  checked={showUnassigned} 
  onCheckedChange={(checked) => setShowUnassigned(checked === true)} 
/>
                  <Label htmlFor="showUnassigned" className="text-sm">
                    Available
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Actions</Label>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkAssign}
                  disabled={isLoading || selectedPermissions.length === 0}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Assign
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkRemove}
                  disabled={isLoading || selectedPermissions.length === 0}
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          </div>

          {/* Permissions List */}
          <div className="border rounded-lg">
            <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedPermissions.length === filteredPermissions.length && filteredPermissions.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label className="text-sm font-medium">Select All ({selectedPermissions.length} selected)</Label>
              </div>
              <div className="text-sm text-gray-600">{filteredPermissions.length} permissions</div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {filteredPermissions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No permissions match the current filters</div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredPermissions.map((permission) => {
                    const isAssigned = assignedPermissionIds.has(permission.id)
                    const isSelected = selectedPermissions.includes(permission.id)

                    return (
                      <div
                        key={permission.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isAssigned ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                        } ${isSelected ? "ring-2 ring-blue-500" : ""}`}
                      >
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPermissions((prev) => [...prev, permission.id])
                              } else {
                                setSelectedPermissions((prev) => prev.filter((id) => id !== permission.id))
                              }
                            }}
                          />
                          <Key className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-sm">{permission.displayName}</div>
                            <div className="text-xs text-gray-500">
                              {permission.module} • {permission.name}
                            </div>
                            {permission.description && (
                              <div className="text-xs text-gray-400 mt-1">{permission.description}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPermissionScopeColor(permission.scope)}>{permission.scope}</Badge>
                          {isAssigned ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Assigned
                            </Badge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onAssign({ roleId: role.id, permissionId: permission.id })}
                              disabled={isLoading}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RoleManagement({ initialRoles, permissions }: RoleManagementProps) {
  const [roles, setRoles] = useState<RoleWithPermissions[]>(initialRoles)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [isPending, startTransition] = useTransition()

  const itemsPerPage = 10

  // Filter roles based on search and type
  const filteredRoles = roles.filter((role) => {
    const matchesSearch =
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (role.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)

    const matchesType =
      typeFilter === "all" || (typeFilter === "system" && role.isSystem) || (typeFilter === "custom" && !role.isSystem)

    return matchesSearch && matchesType
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedRoles = filteredRoles.slice(startIndex, endIndex)

  // Reset to first page when filters change
  const resetToFirstPage = () => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }

  const handleCreateRole = (formData: RoleFormData) => {
    startTransition(async () => {
      const roleData: CreateRoleInput = {
        name: formData.name,
        displayName: formData.displayName,
        description: formData.description || undefined,
        isSystem: formData.isSystem,
      }

      const result = await createRole(roleData)

      if (result.success && result.role) {
        setRoles((prev) => [result.role!, ...prev])
        setIsCreateDialogOpen(false)
        toast.success("Role created successfully.")
      } else {
        toast.error(result.error || "Failed to create role.")
      }
    })
  }

  const handleUpdateRole = (formData: RoleFormData) => {
    if (!selectedRole) return

    startTransition(async () => {
      const updateData: UpdateRoleInput = {
        name: formData.name,
        displayName: formData.displayName,
        description: formData.description || undefined,
        isSystem: formData.isSystem,
      }

      const result = await updateRole(selectedRole.id, updateData)

      if (result.success && result.role) {
        setRoles((prev) => prev.map((role) => (role.id === selectedRole.id ? result.role! : role)))
        setIsEditDialogOpen(false)
        setSelectedRole(null)
        toast.success("Role updated successfully.")
      } else {
        toast.error(result.error || "Failed to update role.")
      }
    })
  }

  const handleDeleteRole = () => {
    if (!selectedRole) return

    startTransition(async () => {
      const result = await deleteRole(selectedRole.id)

      if (result.success) {
        setRoles((prev) => prev.filter((role) => role.id !== selectedRole.id))
        setIsDeleteDialogOpen(false)
        setSelectedRole(null)
        toast.success("Role deleted successfully.")
      } else {
        toast.error(result.error || "Failed to delete role.")
      }
    })
  }

  const handleAssignPermission = (assignmentData: AssignRolePermissionInput) => {
    startTransition(async () => {
      const result = await assignRolePermission(assignmentData)

      if (result.success) {
        toast.success("Permission assigned successfully.")
        // Update local state
        setRoles((prev) =>
          prev.map((role) => {
            if (role.id === assignmentData.roleId) {
              const permission = permissions.find((p) => p.id === assignmentData.permissionId)
              if (permission) {
                return {
                  ...role,
                  permissions: [
                    ...role.permissions,
                    {
                      permissionId: assignmentData.permissionId,
                      createdAt: new Date(),
                      permission: {
                        id: permission.id,
                        name: permission.name,
                        displayName: permission.displayName,
                        description: permission.description,
                        scope: permission.scope,
                        module: permission.module,
                      },
                    },
                  ],
                  _count: {
                    ...role._count,
                    permissions: role._count.permissions + 1,
                  },
                }
              }
            }
            return role
          }),
        )
      } else {
        toast.error(result.error || "Failed to assign permission.")
      }
    })
  }

  const handleRemovePermission = (roleId: string, permissionId: string) => {
    startTransition(async () => {
      const result = await removeRolePermission(roleId, permissionId)

      if (result.success) {
        toast.success("Permission removed successfully.")
        // Update local state
        setRoles((prev) =>
          prev.map((role) => {
            if (role.id === roleId) {
              return {
                ...role,
                permissions: role.permissions.filter((rp) => rp.permissionId !== permissionId),
                _count: {
                  ...role._count,
                  permissions: role._count.permissions - 1,
                },
              }
            }
            return role
          }),
        )
      } else {
        toast.error(result.error || "Failed to remove permission.")
      }
    })
  }

  const handleBulkAssignPermissions = (roleId: string, permissionIds: string[]) => {
    startTransition(async () => {
      const result = await bulkAssignRolePermissions(roleId, permissionIds)

      if (result.success) {
        toast.success(`${permissionIds.length} permissions assigned successfully.`)
        // Update local state
        setRoles((prev) =>
          prev.map((role) => {
            if (role.id === roleId) {
              const newPermissions = permissionIds
                .map((permissionId) => {
                  const permission = permissions.find((p) => p.id === permissionId)
                  return permission
                    ? {
                        permissionId,
                        createdAt: new Date(),
                        permission: {
                          id: permission.id,
                          name: permission.name,
                          displayName: permission.displayName,
                          description: permission.description,
                          scope: permission.scope,
                          module: permission.module,
                        },
                      }
                    : null
                })
           .filter((item): item is NonNullable<typeof item> => Boolean(item))

              return {
                ...role,
                permissions: [...role.permissions, ...newPermissions],
                _count: {
                  ...role._count,
                  permissions: role._count.permissions + newPermissions.length,
                },
              }
            }
            return role
          }),
        )
      } else {
        toast.error(result.error || "Failed to assign permissions.")
      }
    })
  }

  const handleBulkRemovePermissions = (roleId: string, permissionIds: string[]) => {
    startTransition(async () => {
      const result = await bulkRemoveRolePermissions(roleId, permissionIds)

      if (result.success) {
        toast.success(`${permissionIds.length} permissions removed successfully.`)
        // Update local state
        setRoles((prev) =>
          prev.map((role) => {
            if (role.id === roleId) {
              return {
                ...role,
                permissions: role.permissions.filter((rp) => !permissionIds.includes(rp.permissionId)),
                _count: {
                  ...role._count,
                  permissions: role._count.permissions - permissionIds.length,
                },
              }
            }
            return role
          }),
        )
      } else {
        toast.error(result.error || "Failed to remove permissions.")
      }
    })
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setTypeFilter("all")
    setCurrentPage(1)
  }

  const statsData = {
    totalRoles: roles.length,
    systemRoles: roles.filter((r) => r.isSystem).length,
    customRoles: roles.filter((r) => !r.isSystem).length,
    rolesWithUsers: roles.filter((r) => r._count.assignments > 0).length,
    avgPermissionsPerRole:
      roles.length > 0 ? Math.round(roles.reduce((sum, role) => sum + role._count.permissions, 0) / roles.length) : 0,
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
                  placeholder="Search roles..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    resetToFirstPage()
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Type</Label>
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  setTypeFilter(value)
                  resetToFirstPage()
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center">
                      <Crown className="w-4 h-4 mr-2 text-purple-500" />
                      System Roles
                    </div>
                  </SelectItem>
                  <SelectItem value="custom">
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 mr-2 text-blue-500" />
                      Custom Roles
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={clearAllFilters}
              className="w-full bg-transparent"
              disabled={searchQuery === "" && typeFilter === "all"}
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
                    <Hash className="w-3 h-3 mr-1 text-blue-500" />
                    <span className="text-gray-600">Total Roles:</span>
                  </div>
                  <span className="font-medium">{statsData.totalRoles}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Crown className="w-3 h-3 mr-1 text-purple-500" />
                    <span className="text-gray-600">System:</span>
                  </div>
                  <span className="font-medium text-purple-600">{statsData.systemRoles}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Shield className="w-3 h-3 mr-1 text-blue-500" />
                    <span className="text-gray-600">Custom:</span>
                  </div>
                  <span className="font-medium text-blue-600">{statsData.customRoles}</span>
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Users className="w-3 h-3 mr-1 text-green-500" />
                    <span className="text-gray-600">With Users:</span>
                  </div>
                  <span className="font-medium">{statsData.rolesWithUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Key className="w-3 h-3 mr-1 text-orange-500" />
                    <span className="text-gray-600">Avg Permissions:</span>
                  </div>
                  <span className="font-medium">{statsData.avgPermissionsPerRole}</span>
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
              <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
              <p className="text-gray-600 mt-1">Manage roles and their permissions</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Role
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                  <DialogDescription>Add a new role to the system</DialogDescription>
                </DialogHeader>
                <RoleForm
                  onSubmit={handleCreateRole}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  isLoading={isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6">
          {filteredRoles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No roles found</h3>
              <p className="text-gray-500 text-center mb-6 max-w-md">
                {searchQuery || typeFilter !== "all"
                  ? "No roles match your current filters. Try adjusting your search criteria."
                  : "Get started by creating your first role."}
              </p>
              {!searchQuery && typeFilter === "all" && (
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Role
                </Button>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Role</TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">Permissions</TableHead>
                      <TableHead className="font-semibold">Users</TableHead>
                      <TableHead className="font-semibold">Created</TableHead>
                      <TableHead className="font-semibold w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRoles.map((role) => (
                      <TableRow key={role.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                              {role.isSystem ? (
                                <Crown className="w-5 h-5 text-purple-500" />
                              ) : (
                                <Shield className="w-5 h-5 text-blue-500" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-900">{role.displayName}</div>
                              <div className="text-sm text-gray-500">{role.name}</div>
                              {role.description && (
                                <div className="text-xs text-gray-400 truncate max-w-xs" title={role.description}>
                                  {role.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleTypeColor(role.isSystem)}>
                            {role.isSystem ? (
                              <>
                                <Crown className="w-3 h-3 mr-1" />
                                System
                              </>
                            ) : (
                              <>
                                <Shield className="w-3 h-3 mr-1" />
                                Custom
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Key className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium">{role._count.permissions}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium">{role._count.assignments}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{role.createdAt.toLocaleDateString()}</TableCell>
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
                                  setSelectedRole(role)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Role
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedRole(role)
                                  setIsPermissionDialogOpen(true)
                                }}
                              >
                                <Key className="w-4 h-4 mr-2" />
                                Manage Permissions
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedRole(role)
                                  setIsDeleteDialogOpen(true)
                                }}
                                className="text-red-600"
                                disabled={role.isSystem || role._count.assignments > 0}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Role
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
          {filteredRoles.length > 0 && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} ({filteredRoles.length} roles)
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
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update the role information</DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <RoleForm
              role={selectedRole}
              onSubmit={handleUpdateRole}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedRole(null)
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
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedRole?.displayName}&quot;? This action cannot be undone.
              {selectedRole?.isSystem && " System roles cannot be deleted."}
              {selectedRole && selectedRole._count.assignments > 0 && " This role is currently assigned to users."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedRole(null)
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
  variant="destructive"
  onClick={handleDeleteRole}
  disabled={Boolean(
    isPending || 
    selectedRole?.isSystem || 
    (selectedRole && selectedRole._count.assignments > 0)
  )}
>
  {isPending ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Deleting...
    </>
  ) : (
    "Delete Role"
  )}
</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permission Assignment Dialog */}
      {selectedRole && (
        <PermissionAssignmentDialog
          role={selectedRole}
          permissions={permissions}
          onAssign={handleAssignPermission}
          onRemove={handleRemovePermission}
          onBulkAssign={handleBulkAssignPermissions}
          onBulkRemove={handleBulkRemovePermissions}
          isOpen={isPermissionDialogOpen}
          onClose={() => {
            setIsPermissionDialogOpen(false)
            setSelectedRole(null)
          }}
          isLoading={isPending}
        />
      )}
    </div>
  )
}
