"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// Types for role management
export interface CreateRoleInput {
  name: string
  displayName: string
  description?: string
  isSystem?: boolean
}

export interface UpdateRoleInput {
  name?: string
  displayName?: string
  description?: string
  isSystem?: boolean
}

export interface RoleWithPermissions {
  id: string
  name: string
  displayName: string
  description: string | null
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
  permissions: Array<{
    permissionId: string
    createdAt: Date
    permission: {
      id: string
      name: string
      displayName: string
      description: string | null
      scope: string
      module: string
    }
  }>
  assignments: Array<{
    userId: string
    businessUnitId: string
    assignedAt: Date
    assignedBy: string | null
    user: {
      id: string
      name: string
      email: string
      username: string
    }
    businessUnit: {
      id: string
      name: string
      code: string
    }
  }>
  _count: {
    assignments: number
    permissions: number
  }
}

export interface AssignRolePermissionInput {
  roleId: string
  permissionId: string
}

// Get all roles with their permissions and assignment counts
export async function getRoles(): Promise<{
  success: boolean
  roles?: RoleWithPermissions[]
  error?: string
}> {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
            businessUnit: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        _count: {
          select: {
            assignments: true,
            permissions: true,
          },
        },
      },
      orderBy: [{ isSystem: "desc" }, { createdAt: "desc" }],
    })

    return { success: true, roles }
  } catch (error) {
    console.error("Error fetching roles:", error)
    return { success: false, error: "Failed to fetch roles" }
  }
}

// Get role by ID with full details
export async function getRoleById(roleId: string): Promise<{
  success: boolean
  role?: RoleWithPermissions
  error?: string
}> {
  try {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
            businessUnit: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        _count: {
          select: {
            assignments: true,
            permissions: true,
          },
        },
      },
    })

    if (!role) {
      return { success: false, error: "Role not found" }
    }

    return { success: true, role }
  } catch (error) {
    console.error("Error fetching role:", error)
    return { success: false, error: "Failed to fetch role" }
  }
}

// Create new role
export async function createRole(roleData: CreateRoleInput): Promise<{
  success: boolean
  role?: RoleWithPermissions
  error?: string
}> {
  try {
    // Check if role name already exists
    const existingRole = await prisma.role.findUnique({
      where: { name: roleData.name },
    })

    if (existingRole) {
      return { success: false, error: "Role name already exists" }
    }

    const role = await prisma.role.create({
      data: {
        name: roleData.name,
        displayName: roleData.displayName,
        description: roleData.description,
        isSystem: roleData.isSystem ?? false,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
            businessUnit: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        _count: {
          select: {
            assignments: true,
            permissions: true,
          },
        },
      },
    })

    revalidatePath("/admin/roles")
    return { success: true, role }
  } catch (error) {
    console.error("Error creating role:", error)
    return { success: false, error: "Failed to create role" }
  }
}

// Update role
export async function updateRole(
  roleId: string,
  roleData: UpdateRoleInput,
): Promise<{
  success: boolean
  role?: RoleWithPermissions
  error?: string
}> {
  try {
    // Check if role name conflicts with other roles
    if (roleData.name) {
      const existingRole = await prisma.role.findFirst({
        where: {
          AND: [{ id: { not: roleId } }, { name: roleData.name }],
        },
      })

      if (existingRole) {
        return { success: false, error: "Role name already exists" }
      }
    }

    // Check if trying to modify system role
    const currentRole = await prisma.role.findUnique({
      where: { id: roleId },
      select: { isSystem: true },
    })

    if (currentRole?.isSystem && roleData.isSystem === false) {
      return { success: false, error: "Cannot modify system role status" }
    }

    const role = await prisma.role.update({
      where: { id: roleId },
      data: {
        ...(roleData.name && { name: roleData.name }),
        ...(roleData.displayName && { displayName: roleData.displayName }),
        ...(roleData.description !== undefined && { description: roleData.description }),
        ...(roleData.isSystem !== undefined && { isSystem: roleData.isSystem }),
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
            businessUnit: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        _count: {
          select: {
            assignments: true,
            permissions: true,
          },
        },
      },
    })

    revalidatePath("/admin/roles")
    return { success: true, role }
  } catch (error) {
    console.error("Error updating role:", error)
    return { success: false, error: "Failed to update role" }
  }
}

// Delete role
export async function deleteRole(roleId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Check if role is system role
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: { isSystem: true, _count: { select: { assignments: true } } },
    })

    if (!role) {
      return { success: false, error: "Role not found" }
    }

    if (role.isSystem) {
      return { success: false, error: "Cannot delete system role" }
    }

    if (role._count.assignments > 0) {
      return { success: false, error: "Cannot delete role with active assignments" }
    }

    await prisma.role.delete({
      where: { id: roleId },
    })

    revalidatePath("/admin/roles")
    return { success: true }
  } catch (error) {
    console.error("Error deleting role:", error)
    return { success: false, error: "Failed to delete role" }
  }
}

// Assign permission to role
export async function assignRolePermission(assignmentData: AssignRolePermissionInput): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await prisma.rolePermission.create({
      data: {
        roleId: assignmentData.roleId,
        permissionId: assignmentData.permissionId,
      },
    })

    revalidatePath("/admin/roles")
    return { success: true }
  } catch (error) {
    console.error("Error assigning permission to role:", error)
    return { success: false, error: "Failed to assign permission to role" }
  }
}

// Remove permission from role
export async function removeRolePermission(
  roleId: string,
  permissionId: string,
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    })

    revalidatePath("/admin/roles")
    return { success: true }
  } catch (error) {
    console.error("Error removing permission from role:", error)
    return { success: false, error: "Failed to remove permission from role" }
  }
}

// Get available permissions for a role (not already assigned)
export async function getAvailablePermissionsForRole(roleId: string): Promise<{
  success: boolean
  permissions?: Array<{
    id: string
    name: string
    displayName: string
    description: string | null
    scope: string
    module: string
  }>
  error?: string
}> {
  try {
    const permissions = await prisma.permission.findMany({
      where: {
        rolePermissions: {
          none: {
            roleId,
          },
        },
      },
      orderBy: [{ module: "asc" }, { displayName: "asc" }],
    })

    return { success: true, permissions }
  } catch (error) {
    console.error("Error fetching available permissions:", error)
    return { success: false, error: "Failed to fetch available permissions" }
  }
}

// Bulk assign permissions to role
export async function bulkAssignRolePermissions(
  roleId: string,
  permissionIds: string[],
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      })),
      skipDuplicates: true,
    })

    revalidatePath("/admin/roles")
    return { success: true }
  } catch (error) {
    console.error("Error bulk assigning permissions:", error)
    return { success: false, error: "Failed to assign permissions" }
  }
}

// Bulk remove permissions from role
export async function bulkRemoveRolePermissions(
  roleId: string,
  permissionIds: string[],
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId: {
          in: permissionIds,
        },
      },
    })

    revalidatePath("/admin/roles")
    return { success: true }
  } catch (error) {
    console.error("Error bulk removing permissions:", error)
    return { success: false, error: "Failed to remove permissions" }
  }
}
