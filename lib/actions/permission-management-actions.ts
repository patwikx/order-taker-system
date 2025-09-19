"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { PermissionScope } from "@prisma/client"

// Types for permission management
export interface CreatePermissionInput {
  name: string
  displayName: string
  description?: string
  scope: PermissionScope
  module: string
}

export interface UpdatePermissionInput {
  name?: string
  displayName?: string
  description?: string
  scope?: PermissionScope
  module?: string
}

export interface PermissionWithUsage {
  id: string
  name: string
  displayName: string
  description: string | null
  scope: PermissionScope
  module: string
  createdAt: Date
  updatedAt: Date
  rolePermissions: Array<{
    roleId: string
    createdAt: Date
    role: {
      id: string
      name: string
      displayName: string
      isSystem: boolean
    }
  }>
  userPermissions: Array<{
    userId: string
    createdAt: Date
    createdBy: string | null
    user: {
      id: string
      name: string
      email: string
      username: string
    }
  }>
  _count: {
    rolePermissions: number
    userPermissions: number
  }
}

// Get all permissions with their usage information
export async function getPermissions(): Promise<{
  success: boolean
  permissions?: PermissionWithUsage[]
  error?: string
}> {
  try {
    const permissions = await prisma.permission.findMany({
      include: {
        rolePermissions: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
                isSystem: true,
              },
            },
          },
        },
        userPermissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            rolePermissions: true,
            userPermissions: true,
          },
        },
      },
      orderBy: [{ module: "asc" }, { displayName: "asc" }],
    })

    return { success: true, permissions }
  } catch (error) {
    console.error("Error fetching permissions:", error)
    return { success: false, error: "Failed to fetch permissions" }
  }
}

// Get permissions grouped by module
export async function getPermissionsByModule(): Promise<{
  success: boolean
  modules?: Record<string, PermissionWithUsage[]>
  error?: string
}> {
  try {
    const result = await getPermissions()
    if (!result.success || !result.permissions) {
      return result
    }

    const modules: Record<string, PermissionWithUsage[]> = {}

    result.permissions.forEach((permission) => {
      if (!modules[permission.module]) {
        modules[permission.module] = []
      }
      modules[permission.module].push(permission)
    })

    return { success: true, modules }
  } catch (error) {
    console.error("Error grouping permissions by module:", error)
    return { success: false, error: "Failed to group permissions" }
  }
}

// Get permission by ID with full details
export async function getPermissionById(permissionId: string): Promise<{
  success: boolean
  permission?: PermissionWithUsage
  error?: string
}> {
  try {
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
      include: {
        rolePermissions: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
                isSystem: true,
              },
            },
          },
        },
        userPermissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            rolePermissions: true,
            userPermissions: true,
          },
        },
      },
    })

    if (!permission) {
      return { success: false, error: "Permission not found" }
    }

    return { success: true, permission }
  } catch (error) {
    console.error("Error fetching permission:", error)
    return { success: false, error: "Failed to fetch permission" }
  }
}

// Create new permission
export async function createPermission(permissionData: CreatePermissionInput): Promise<{
  success: boolean
  permission?: PermissionWithUsage
  error?: string
}> {
  try {
    // Check if permission name already exists
    const existingPermission = await prisma.permission.findUnique({
      where: { name: permissionData.name },
    })

    if (existingPermission) {
      return { success: false, error: "Permission name already exists" }
    }

    const permission = await prisma.permission.create({
      data: {
        name: permissionData.name,
        displayName: permissionData.displayName,
        description: permissionData.description,
        scope: permissionData.scope,
        module: permissionData.module,
      },
      include: {
        rolePermissions: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
                isSystem: true,
              },
            },
          },
        },
        userPermissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            rolePermissions: true,
            userPermissions: true,
          },
        },
      },
    })

    revalidatePath("/admin/permissions")
    return { success: true, permission }
  } catch (error) {
    console.error("Error creating permission:", error)
    return { success: false, error: "Failed to create permission" }
  }
}

// Update permission
export async function updatePermission(
  permissionId: string,
  permissionData: UpdatePermissionInput,
): Promise<{
  success: boolean
  permission?: PermissionWithUsage
  error?: string
}> {
  try {
    // Check if permission name conflicts with other permissions
    if (permissionData.name) {
      const existingPermission = await prisma.permission.findFirst({
        where: {
          AND: [{ id: { not: permissionId } }, { name: permissionData.name }],
        },
      })

      if (existingPermission) {
        return { success: false, error: "Permission name already exists" }
      }
    }

    const permission = await prisma.permission.update({
      where: { id: permissionId },
      data: {
        ...(permissionData.name && { name: permissionData.name }),
        ...(permissionData.displayName && { displayName: permissionData.displayName }),
        ...(permissionData.description !== undefined && { description: permissionData.description }),
        ...(permissionData.scope && { scope: permissionData.scope }),
        ...(permissionData.module && { module: permissionData.module }),
      },
      include: {
        rolePermissions: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
                isSystem: true,
              },
            },
          },
        },
        userPermissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            rolePermissions: true,
            userPermissions: true,
          },
        },
      },
    })

    revalidatePath("/admin/permissions")
    return { success: true, permission }
  } catch (error) {
    console.error("Error updating permission:", error)
    return { success: false, error: "Failed to update permission" }
  }
}

// Delete permission
export async function deletePermission(permissionId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Check if permission is in use
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
      select: {
        _count: {
          select: {
            rolePermissions: true,
            userPermissions: true,
          },
        },
      },
    })

    if (!permission) {
      return { success: false, error: "Permission not found" }
    }

    if (permission._count.rolePermissions > 0 || permission._count.userPermissions > 0) {
      return { success: false, error: "Cannot delete permission that is currently assigned" }
    }

    await prisma.permission.delete({
      where: { id: permissionId },
    })

    revalidatePath("/admin/permissions")
    return { success: true }
  } catch (error) {
    console.error("Error deleting permission:", error)
    return { success: false, error: "Failed to delete permission" }
  }
}

// Get unique modules
export async function getPermissionModules(): Promise<{
  success: boolean
  modules?: string[]
  error?: string
}> {
  try {
    const result = await prisma.permission.findMany({
      select: { module: true },
      distinct: ["module"],
      orderBy: { module: "asc" },
    })

    const modules = result.map((r) => r.module)
    return { success: true, modules }
  } catch (error) {
    console.error("Error fetching permission modules:", error)
    return { success: false, error: "Failed to fetch modules" }
  }
}

// Get permissions by scope
export async function getPermissionsByScope(scope: PermissionScope): Promise<{
  success: boolean
  permissions?: PermissionWithUsage[]
  error?: string
}> {
  try {
    const permissions = await prisma.permission.findMany({
      where: { scope },
      include: {
        rolePermissions: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                displayName: true,
                isSystem: true,
              },
            },
          },
        },
        userPermissions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            rolePermissions: true,
            userPermissions: true,
          },
        },
      },
      orderBy: [{ module: "asc" }, { displayName: "asc" }],
    })

    return { success: true, permissions }
  } catch (error) {
    console.error("Error fetching permissions by scope:", error)
    return { success: false, error: "Failed to fetch permissions" }
  }
}

// Bulk create permissions
export async function bulkCreatePermissions(permissions: CreatePermissionInput[]): Promise<{
  success: boolean
  created?: number
  errors?: string[]
}> {
  try {
    const errors: string[] = []
    let created = 0

    for (const permissionData of permissions) {
      try {
        const result = await createPermission(permissionData)
        if (result.success) {
          created++
        } else {
          errors.push(`${permissionData.name}: ${result.error}`)
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        errors.push(`${permissionData.name}: Failed to create`)
      }
    }

    return {
      success: created > 0,
      created,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error) {
    console.error("Error bulk creating permissions:", error)
    return { success: false, errors: ["Failed to bulk create permissions"] }
  }
}

// Get permission usage statistics
export async function getPermissionStats(): Promise<{
  success: boolean
  stats?: {
    totalPermissions: number
    permissionsByScope: Record<PermissionScope, number>
    permissionsByModule: Record<string, number>
    mostUsedPermissions: Array<{
      id: string
      name: string
      displayName: string
      totalUsage: number
      roleUsage: number
      userUsage: number
    }>
    unusedPermissions: Array<{
      id: string
      name: string
      displayName: string
      module: string
    }>
  }
  error?: string
}> {
  try {
    const permissions = await prisma.permission.findMany({
      include: {
        _count: {
          select: {
            rolePermissions: true,
            userPermissions: true,
          },
        },
      },
    })

    const totalPermissions = permissions.length

    // Group by scope
    const permissionsByScope: Record<PermissionScope, number> = {
      GLOBAL: 0,
      BUSINESS_UNIT: 0,
      DEPARTMENT: 0,
    }

    // Group by module
    const permissionsByModule: Record<string, number> = {}

    // Track usage
    const mostUsedPermissions: Array<{
      id: string
      name: string
      displayName: string
      totalUsage: number
      roleUsage: number
      userUsage: number
    }> = []

    const unusedPermissions: Array<{
      id: string
      name: string
      displayName: string
      module: string
    }> = []

    permissions.forEach((permission) => {
      // Count by scope
      permissionsByScope[permission.scope]++

      // Count by module
      permissionsByModule[permission.module] = (permissionsByModule[permission.module] || 0) + 1

      // Track usage
      const roleUsage = permission._count.rolePermissions
      const userUsage = permission._count.userPermissions
      const totalUsage = roleUsage + userUsage

      if (totalUsage === 0) {
        unusedPermissions.push({
          id: permission.id,
          name: permission.name,
          displayName: permission.displayName,
          module: permission.module,
        })
      } else {
        mostUsedPermissions.push({
          id: permission.id,
          name: permission.name,
          displayName: permission.displayName,
          totalUsage,
          roleUsage,
          userUsage,
        })
      }
    })

    // Sort most used permissions by total usage
    mostUsedPermissions.sort((a, b) => b.totalUsage - a.totalUsage)

    const stats = {
      totalPermissions,
      permissionsByScope,
      permissionsByModule,
      mostUsedPermissions: mostUsedPermissions.slice(0, 10), // Top 10
      unusedPermissions,
    }

    return { success: true, stats }
  } catch (error) {
    console.error("Error fetching permission stats:", error)
    return { success: false, error: "Failed to fetch permission statistics" }
  }
}
