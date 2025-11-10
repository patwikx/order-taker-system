"use client"

import type React from "react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Shield,
  Key,
  Building,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Crown,
  Package,
  Globe,
  Layers,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import type { PermissionScope } from "@prisma/client"
import {
  assignRolePermission,
  removeRolePermission,
  type RoleWithPermissions,
} from "@/lib/actions/role-management-actions"

interface Permission {
  id: string
  name: string
  displayName: string
  description: string | null
  scope: PermissionScope
  module: string
}

interface RolePermissionManagementProps {
  businessUnitId: string
  role: RoleWithPermissions
  permissions: Permission[]
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

export function RolePermissionManagement({ 
  businessUnitId, 
  role, 
  permissions 
}: RolePermissionManagementProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingPermissions, setPendingPermissions] = useState<Set<string>>(new Set())

  // Get role's current permissions
  const rolePermissions = new Set(
    role.permissions.map(rp => rp.permissionId)
  )

  // Group permissions by module
  const permissionsByModule = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = []
    }
    acc[permission.module].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  const handlePermissionToggle = async (permissionId: string, isAssigned: boolean) => {
    setPendingPermissions(prev => new Set(prev).add(permissionId))
    
    startTransition(async () => {
      try {
        let result
        if (isAssigned) {
          result = await removeRolePermission(role.id, permissionId)
        } else {
          result = await assignRolePermission({
            roleId: role.id,
            permissionId,
          })
        }

        if (result.success) {
          toast.success(
            isAssigned 
              ? "Permission removed from role" 
              : "Permission assigned to role"
          )
          // Refresh the page to get updated data
          router.refresh()
        } else {
          toast.error(result.error || "Failed to update permission")
        }
      } catch (error) {
        console.error("Error updating permission:", error)
        toast.error("Failed to update permission")
      } finally {
        setPendingPermissions(prev => {
          const newSet = new Set(prev)
          newSet.delete(permissionId)
          return newSet
        })
      }
    })
  }

  const handleGoBack = () => {
    router.push(`/${businessUnitId}/admin/roles`)
  }

  const handleRefresh = () => {
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Roles
            </Button>
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              {role.isSystem ? (
                <Crown className="w-8 h-8 text-purple-600" />
              ) : (
                <Shield className="w-8 h-8 text-blue-600" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Role Permissions</h1>
              <p className="text-gray-600 mt-1">
                Configure permissions for {role.displayName}
              </p>
            </div>
          </div>
        </div>

        {/* Role Info Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Role Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Role Name</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{role.displayName}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Internal Name</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Key className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 font-mono text-sm">{role.name}</span>
                  </div>
                </div>
                {role.description && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Description</Label>
                    <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Type</Label>
                  <div className="mt-1">
                    <Badge className={role.isSystem ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}>
                      {role.isSystem ? (
                        <>
                          <Crown className="w-3 h-3 mr-1" />
                          System Role
                        </>
                      ) : (
                        <>
                          <Shield className="w-3 h-3 mr-1" />
                          Custom Role
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">User Assignments</Label>
                  <div className="mt-1">
                    <div className="text-2xl font-bold text-green-600">
                      {role._count.assignments}
                    </div>
                    <div className="text-xs text-gray-500">users assigned to this role</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Current Permissions</Label>
                  <div className="mt-1">
                    <div className="text-2xl font-bold text-blue-600">
                      {role._count.permissions}
                    </div>
                    <div className="text-xs text-gray-500">permissions assigned</div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Created</Label>
                  <div className="text-sm text-gray-600 mt-1">
                    {role.createdAt.toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissions by Module */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Role Permissions</h2>
            <div className="text-sm text-gray-600">
              {Object.keys(permissionsByModule).length} modules • {permissions.length} total permissions
            </div>
          </div>

          {Object.entries(permissionsByModule).map(([module, modulePermissions]) => (
            <Card key={module}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  <span>{module}</span>
                  <Badge variant="outline">{modulePermissions.length} permissions</Badge>
                  <Badge className="bg-green-100 text-green-800">
                    {modulePermissions.filter(p => rolePermissions.has(p.id)).length} assigned
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {modulePermissions.map((permission) => {
                    const ScopeIcon = getScopeIcon(permission.scope)
                    const isAssigned = rolePermissions.has(permission.id)
                    const isPending = pendingPermissions.has(permission.id)

                    return (
                      <div
                        key={permission.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <Key className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900">{permission.displayName}</h4>
                              <Badge className={getModuleColor(permission.module)}>
                                {permission.module}
                              </Badge>
                              <Badge className={getPermissionScopeColor(permission.scope)}>
                                <ScopeIcon className="w-3 h-3 mr-1" />
                                {permission.scope}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 mb-1">{permission.name}</p>
                            {permission.description && (
                              <p className="text-xs text-gray-400">{permission.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {isAssigned && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Assigned
                            </Badge>
                          )}
                          
                          <div className="flex items-center gap-2">
                            {isPending && (
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            )}
                            <Switch
                              checked={isAssigned}
                              onCheckedChange={() => handlePermissionToggle(permission.id, isAssigned)}
                              disabled={isPending}
                            />
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

        {/* Summary Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Role Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {role._count.permissions}
                </div>
                <div className="text-sm text-gray-600">Assigned Permissions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {role._count.assignments}
                </div>
                <div className="text-sm text-gray-600">User Assignments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Object.keys(permissionsByModule).length}
                </div>
                <div className="text-sm text-gray-600">Modules Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {permissions.length}
                </div>
                <div className="text-sm text-gray-600">Total Permissions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning Note */}
        <Card className="mt-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-900 mb-1">Important Note</h4>
                <p className="text-sm text-orange-800">
                  Role permissions affect all users assigned to this role across all business units. 
                  Changes take effect immediately for all {role._count.assignments} assigned users.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}