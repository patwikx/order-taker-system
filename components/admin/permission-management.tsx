"use client"

import type React from "react"
import { useState, useTransition } from "react"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  MoreHorizontal,
  Key,
  Shield,
  Users,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Filter,
  X,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Hash,
  Package,
  Globe,
  Building,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { PermissionScope } from "@prisma/client"
import {
  createPermission,
  updatePermission,
  deletePermission,
  type CreatePermissionInput,
  type UpdatePermissionInput,
  type PermissionWithUsage,
} from "@/lib/actions/permission-management-actions"

interface PermissionManagementProps {
  initialPermissions: PermissionWithUsage[]
}

interface PermissionFormData {
  name: string
  displayName: string
  description: string
  scope: PermissionScope
  module: string
}

const getPermissionScopeColor = (scope: PermissionScope) => {
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

const getScopeIcon = (scope: PermissionScope) => {
  switch (scope) {
    case "GLOBAL":
      return Globe
    case "BUSINESS_UNIT":
      return Building
    case "DEPARTMENT":
      return Layers
    default:
      return Package
  }
}

const getModuleColor = (module: string) => {
  const colors = [
    "bg-blue-100 text-blue-800",
    "bg-green-100 text-green-800",
    "bg-purple-100 text-purple-800",
    "bg-pink-100 text-pink-800",
    "bg-indigo-100 text-indigo-800",
    "bg-yellow-100 text-yellow-800",
    "bg-red-100 text-red-800",
    "bg-teal-100 text-teal-800",
  ]
  const hash = module.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0)
    return a & a
  }, 0)
  return colors[Math.abs(hash) % colors.length]
}

const PermissionForm = ({
  permission,
  onSubmit,
  onCancel,
  isLoading,
  existingModules,
}: {
  permission?: PermissionWithUsage
  onSubmit: (data: PermissionFormData) => void
  onCancel: () => void
  isLoading: boolean
  existingModules: string[]
}) => {
  const [formData, setFormData] = useState<PermissionFormData>({
    name: permission?.name || "",
    displayName: permission?.displayName || "",
    description: permission?.description || "",
    scope: permission?.scope || PermissionScope.BUSINESS_UNIT,
    module: permission?.module || "",
  })

  const [isCustomModule, setIsCustomModule] = useState(
    permission ? !existingModules.includes(permission.module) : false,
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Permission Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., users.create, orders.view"
            required
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500">Used internally for access control</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name *</Label>
          <Input
            id="displayName"
            value={formData.displayName}
            onChange={(e) => setFormData((prev) => ({ ...prev, displayName: e.target.value }))}
            placeholder="e.g., Create Users, View Orders"
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
          placeholder="Describe what this permission allows"
          rows={3}
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scope">Scope *</Label>
          <Select
            value={formData.scope}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, scope: value as PermissionScope }))}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PermissionScope.GLOBAL}>
                <div className="flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  Global - System-wide access
                </div>
              </SelectItem>
              <SelectItem value={PermissionScope.BUSINESS_UNIT}>
                <div className="flex items-center">
                  <Building className="w-4 h-4 mr-2" />
                  Business Unit - Per location
                </div>
              </SelectItem>
              <SelectItem value={PermissionScope.DEPARTMENT}>
                <div className="flex items-center">
                  <Layers className="w-4 h-4 mr-2" />
                  Department - Per department
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="module">Module *</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant={!isCustomModule ? "default" : "outline"}
                size="sm"
                onClick={() => setIsCustomModule(false)}
                disabled={isLoading}
              >
                Existing
              </Button>
              <Button
                type="button"
                variant={isCustomModule ? "default" : "outline"}
                size="sm"
                onClick={() => setIsCustomModule(true)}
                disabled={isLoading}
              >
                New Module
              </Button>
            </div>

            {isCustomModule ? (
              <Input
                value={formData.module}
                onChange={(e) => setFormData((prev) => ({ ...prev, module: e.target.value }))}
                placeholder="Enter new module name"
                required
                disabled={isLoading}
              />
            ) : (
              <Select
                value={formData.module}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, module: value }))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select existing module" />
                </SelectTrigger>
                <SelectContent>
                  {existingModules.map((module) => (
                    <SelectItem key={module} value={module}>
                      <div className="flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        {module}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
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
              {permission ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>{permission ? "Update Permission" : "Create Permission"}</>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

const PermissionStatsCard = ({
  title,
  value,
  icon: Icon,
  color = "text-blue-600",
  bgColor = "bg-blue-100",
}: {
  title: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  color?: string
  bgColor?: string
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
)

export function PermissionManagement({ initialPermissions }: PermissionManagementProps) {
  const [permissions, setPermissions] = useState<PermissionWithUsage[]>(initialPermissions)
  const [searchQuery, setSearchQuery] = useState("")
  const [moduleFilter, setModuleFilter] = useState<string>("all")
  const [scopeFilter, setScopeFilter] = useState<string>("all")
  const [usageFilter, setUsageFilter] = useState<string>("all")
  const [selectedPermission, setSelectedPermission] = useState<PermissionWithUsage | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState("list")
  const [isPending, startTransition] = useTransition()

  const itemsPerPage = 10

  // Get unique modules and scopes
  const modules = Array.from(new Set(permissions.map((p) => p.module))).sort()
  const scopes = Object.values(PermissionScope)

  // Filter permissions based on search, module, scope, and usage
  const filteredPermissions = permissions.filter((permission) => {
    const matchesSearch =
      permission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permission.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permission.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (permission.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)

    const matchesModule = moduleFilter === "all" || permission.module === moduleFilter
    const matchesScope = scopeFilter === "all" || permission.scope === scopeFilter

    const totalUsage = permission._count.rolePermissions + permission._count.userPermissions
    const matchesUsage =
      usageFilter === "all" ||
      (usageFilter === "used" && totalUsage > 0) ||
      (usageFilter === "unused" && totalUsage === 0)

    return matchesSearch && matchesModule && matchesScope && matchesUsage
  })

  // Group permissions by module for module view
  const permissionsByModule = permissions.reduce(
    (acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = []
      }
      acc[permission.module].push(permission)
      return acc
    },
    {} as Record<string, PermissionWithUsage[]>,
  )

  // Pagination calculations
  const totalPages = Math.ceil(filteredPermissions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPermissions = filteredPermissions.slice(startIndex, endIndex)

  // Reset to first page when filters change
  const resetToFirstPage = () => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }

  const handleCreatePermission = (formData: PermissionFormData) => {
    startTransition(async () => {
      const permissionData: CreatePermissionInput = {
        name: formData.name,
        displayName: formData.displayName,
        description: formData.description || undefined,
        scope: formData.scope,
        module: formData.module,
      }

      const result = await createPermission(permissionData)

      if (result.success && result.permission) {
        setPermissions((prev) => [result.permission!, ...prev])
        setIsCreateDialogOpen(false)
        toast.success("Permission created successfully.")
      } else {
        toast.error(result.error || "Failed to create permission.")
      }
    })
  }

  const handleUpdatePermission = (formData: PermissionFormData) => {
    if (!selectedPermission) return

    startTransition(async () => {
      const updateData: UpdatePermissionInput = {
        name: formData.name,
        displayName: formData.displayName,
        description: formData.description || undefined,
        scope: formData.scope,
        module: formData.module,
      }

      const result = await updatePermission(selectedPermission.id, updateData)

      if (result.success && result.permission) {
        setPermissions((prev) =>
          prev.map((permission) => (permission.id === selectedPermission.id ? result.permission! : permission)),
        )
        setIsEditDialogOpen(false)
        setSelectedPermission(null)
        toast.success("Permission updated successfully.")
      } else {
        toast.error(result.error || "Failed to update permission.")
      }
    })
  }

  const handleDeletePermission = () => {
    if (!selectedPermission) return

    startTransition(async () => {
      const result = await deletePermission(selectedPermission.id)

      if (result.success) {
        setPermissions((prev) => prev.filter((permission) => permission.id !== selectedPermission.id))
        setIsDeleteDialogOpen(false)
        setSelectedPermission(null)
        toast.success("Permission deleted successfully.")
      } else {
        toast.error(result.error || "Failed to delete permission.")
      }
    })
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setModuleFilter("all")
    setScopeFilter("all")
    setUsageFilter("all")
    setCurrentPage(1)
  }

  const statsData = {
    totalPermissions: permissions.length,
    usedPermissions: permissions.filter((p) => p._count.rolePermissions > 0 || p._count.userPermissions > 0).length,
    unusedPermissions: permissions.filter((p) => p._count.rolePermissions === 0 && p._count.userPermissions === 0)
      .length,
    moduleCount: modules.length,
    avgUsagePerPermission:
      permissions.length > 0
        ? Math.round(
            permissions.reduce((sum, p) => sum + p._count.rolePermissions + p._count.userPermissions, 0) /
              permissions.length,
          )
        : 0,
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
                  placeholder="Search permissions..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    resetToFirstPage()
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Module Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Module</Label>
              <Select
                value={moduleFilter}
                onValueChange={(value) => {
                  setModuleFilter(value)
                  resetToFirstPage()
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {modules.map((module) => (
                    <SelectItem key={module} value={module}>
                      <div className="flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        {module}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Scope Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Scope</Label>
              <Select
                value={scopeFilter}
                onValueChange={(value) => {
                  setScopeFilter(value)
                  resetToFirstPage()
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Scopes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scopes</SelectItem>
                  {scopes.map((scope) => {
                    const ScopeIcon = getScopeIcon(scope)
                    return (
                      <SelectItem key={scope} value={scope}>
                        <div className="flex items-center">
                          <ScopeIcon className="w-4 h-4 mr-2" />
                          {scope}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Usage Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Usage</Label>
              <Select
                value={usageFilter}
                onValueChange={(value) => {
                  setUsageFilter(value)
                  resetToFirstPage()
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Permissions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Permissions</SelectItem>
                  <SelectItem value="used">
                    <div className="flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                      Used
                    </div>
                  </SelectItem>
                  <SelectItem value="unused">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                      Unused
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
              disabled={searchQuery === "" && moduleFilter === "all" && scopeFilter === "all" && usageFilter === "all"}
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
                    <span className="text-gray-600">Total:</span>
                  </div>
                  <span className="font-medium">{statsData.totalPermissions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                    <span className="text-gray-600">Used:</span>
                  </div>
                  <span className="font-medium text-green-600">{statsData.usedPermissions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1 text-red-500" />
                    <span className="text-gray-600">Unused:</span>
                  </div>
                  <span className="font-medium text-red-600">{statsData.unusedPermissions}</span>
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Package className="w-3 h-3 mr-1 text-purple-500" />
                    <span className="text-gray-600">Modules:</span>
                  </div>
                  <span className="font-medium">{statsData.moduleCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <BarChart3 className="w-3 h-3 mr-1 text-orange-500" />
                    <span className="text-gray-600">Avg Usage:</span>
                  </div>
                  <span className="font-medium">{statsData.avgUsagePerPermission}</span>
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
              <h1 className="text-2xl font-bold text-gray-900">Permission Management</h1>
              <p className="text-gray-600 mt-1">Manage system permissions and access control</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Permission
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Permission</DialogTitle>
                  <DialogDescription>Add a new permission to the system</DialogDescription>
                </DialogHeader>
                <PermissionForm
                  onSubmit={handleCreatePermission}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  isLoading={isPending}
                  existingModules={modules}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="modules">By Module</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* List View */}
            <TabsContent value="list" className="mt-0">
              {filteredPermissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Key className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No permissions found</h3>
                  <p className="text-gray-500 text-center mb-6 max-w-md">
                    {searchQuery || moduleFilter !== "all" || scopeFilter !== "all" || usageFilter !== "all"
                      ? "No permissions match your current filters. Try adjusting your search criteria."
                      : "Get started by creating your first permission."}
                  </p>
                  {!searchQuery && moduleFilter === "all" && scopeFilter === "all" && usageFilter === "all" && (
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Permission
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="font-semibold">Permission</TableHead>
                            <TableHead className="font-semibold">Module</TableHead>
                            <TableHead className="font-semibold">Scope</TableHead>
                            <TableHead className="font-semibold">Usage</TableHead>
                            <TableHead className="font-semibold">Created</TableHead>
                            <TableHead className="font-semibold w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedPermissions.map((permission) => {
                            const ScopeIcon = getScopeIcon(permission.scope)
                            const totalUsage = permission._count.rolePermissions + permission._count.userPermissions

                            return (
                              <TableRow key={permission.id} className="hover:bg-gray-50">
                                <TableCell>
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                      <Key className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="font-medium text-gray-900">{permission.displayName}</div>
                                      <div className="text-sm text-gray-500">{permission.name}</div>
                                      {permission.description && (
                                        <div
                                          className="text-xs text-gray-400 truncate max-w-xs"
                                          title={permission.description}
                                        >
                                          {permission.description}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getModuleColor(permission.module)}>
                                    <Package className="w-3 h-3 mr-1" />
                                    {permission.module}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getPermissionScopeColor(permission.scope)}>
                                    <ScopeIcon className="w-3 h-3 mr-1" />
                                    {permission.scope}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <div className="flex items-center space-x-1">
                                      <Shield className="w-4 h-4 text-blue-500" />
                                      <span className="text-sm font-medium">{permission._count.rolePermissions}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Users className="w-4 h-4 text-green-500" />
                                      <span className="text-sm font-medium">{permission._count.userPermissions}</span>
                                    </div>
                                    {totalUsage === 0 && (
                                      <Badge variant="secondary" className="text-xs">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Unused
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-gray-500">
                                  {permission.createdAt.toLocaleDateString()}
                                </TableCell>
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
                                          setSelectedPermission(permission)
                                          setIsEditDialogOpen(true)
                                        }}
                                      >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Permission
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedPermission(permission)
                                          setIsDeleteDialogOpen(true)
                                        }}
                                        className="text-red-600"
                                        disabled={totalUsage > 0}
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Permission
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Pagination */}
                  {filteredPermissions.length > 0 && totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages} ({filteredPermissions.length} permissions)
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
                                {index > 0 && pageNum > arr[index - 1] + 1 && (
                                  <span className="px-2 text-gray-400">...</span>
                                )}
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
                </>
              )}
            </TabsContent>

            {/* Module View */}
            <TabsContent value="modules" className="mt-0">
              <div className="space-y-6">
                {Object.entries(permissionsByModule).map(([module, modulePermissions]) => (
                  <Card key={module}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Package className="w-5 h-5" />
                        <span>{module}</span>
                        <Badge variant="outline">{modulePermissions.length} permissions</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {modulePermissions.map((permission) => {
                          const ScopeIcon = getScopeIcon(permission.scope)
                          const totalUsage = permission._count.rolePermissions + permission._count.userPermissions

                          return (
                            <div
                              key={permission.id}
                              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{permission.displayName}</h4>
                                  <p className="text-sm text-gray-500">{permission.name}</p>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedPermission(permission)
                                        setIsEditDialogOpen(true)
                                      }}
                                    >
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedPermission(permission)
                                        setIsDeleteDialogOpen(true)
                                      }}
                                      className="text-red-600"
                                      disabled={totalUsage > 0}
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {permission.description && (
                                <p className="text-xs text-gray-400 mb-3">{permission.description}</p>
                              )}

                              <div className="flex items-center justify-between">
                                <Badge className={getPermissionScopeColor(permission.scope)}>
                                  <ScopeIcon className="w-3 h-3 mr-1" />
                                  {permission.scope}
                                </Badge>

                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <Shield className="w-3 h-3" />
                                    <span>{permission._count.rolePermissions}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Users className="w-3 h-3" />
                                    <span>{permission._count.userPermissions}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Statistics View */}
            <TabsContent value="stats" className="mt-0">
              <div className="space-y-6">
                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <PermissionStatsCard
                    title="Total Permissions"
                    value={statsData.totalPermissions}
                    icon={Key}
                    color="text-blue-600"
                    bgColor="bg-blue-100"
                  />
                  <PermissionStatsCard
                    title="Used Permissions"
                    value={statsData.usedPermissions}
                    icon={CheckCircle2}
                    color="text-green-600"
                    bgColor="bg-green-100"
                  />
                  <PermissionStatsCard
                    title="Unused Permissions"
                    value={statsData.unusedPermissions}
                    icon={AlertCircle}
                    color="text-red-600"
                    bgColor="bg-red-100"
                  />
                  <PermissionStatsCard
                    title="Modules"
                    value={statsData.moduleCount}
                    icon={Package}
                    color="text-purple-600"
                    bgColor="bg-purple-100"
                  />
                </div>

                {/* Module Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Permissions by Module</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {modules.map((module) => {
                        const modulePerms = permissionsByModule[module] || []
                        const usedCount = modulePerms.filter(
                          (p) => p._count.rolePermissions > 0 || p._count.userPermissions > 0,
                        ).length
                        const unusedCount = modulePerms.length - usedCount

                        return (
                          <div
                            key={module}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{module}</h4>
                                <p className="text-sm text-gray-500">{modulePerms.length} permissions</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-center">
                                <div className="text-lg font-bold text-green-600">{usedCount}</div>
                                <div className="text-xs text-gray-500">Used</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-red-600">{unusedCount}</div>
                                <div className="text-xs text-gray-500">Unused</div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Scope Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Permissions by Scope</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {scopes.map((scope) => {
                        const ScopeIcon = getScopeIcon(scope)
                        const scopePerms = permissions.filter((p) => p.scope === scope)
                        const usedCount = scopePerms.filter(
                          (p) => p._count.rolePermissions > 0 || p._count.userPermissions > 0,
                        ).length

                        return (
                          <div key={scope} className="p-4 border border-gray-200 rounded-lg text-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                              <ScopeIcon className="w-6 h-6 text-gray-600" />
                            </div>
                            <h4 className="font-medium text-gray-900 mb-1">{scope}</h4>
                            <div className="text-2xl font-bold text-blue-600 mb-1">{scopePerms.length}</div>
                            <div className="text-sm text-gray-500">
                              {usedCount} used, {scopePerms.length - usedCount} unused
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Permission</DialogTitle>
            <DialogDescription>Update the permission information</DialogDescription>
          </DialogHeader>
          {selectedPermission && (
            <PermissionForm
              permission={selectedPermission}
              onSubmit={handleUpdatePermission}
              onCancel={() => {
                setIsEditDialogOpen(false)
                setSelectedPermission(null)
              }}
              isLoading={isPending}
              existingModules={modules}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Permission</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedPermission?.displayName}&quot;? This action cannot be undone.
              {selectedPermission &&
                (selectedPermission._count.rolePermissions > 0 || selectedPermission._count.userPermissions > 0) &&
                " This permission is currently assigned to roles or users."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedPermission(null)
              }}
              disabled={isPending}
            >
              Cancel
            </Button>

<Button
  variant="destructive"
  onClick={handleDeletePermission}
  disabled={Boolean(
    isPending ||
    (selectedPermission &&
      (selectedPermission._count.rolePermissions > 0 || selectedPermission._count.userPermissions > 0))
  )}
>
  {isPending ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Deleting...
    </>
  ) : (
    "Delete Permission"
  )}
</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
