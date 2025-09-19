"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import type { PermissionScope } from "@prisma/client"

// Types for user management
export interface CreateUserInput {
  email: string
  username: string
  name: string
  password: string
  isActive?: boolean
}

export interface UpdateUserInput {
  email?: string
  username?: string
  name?: string
  password?: string
  isActive?: boolean
}

export interface UserWithAssignments {
  id: string
  email: string
  username: string
  name: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  userBusinessUnitRole: Array<{
    businessUnitId: string
    roleId: string
    assignedAt: Date
    assignedBy: string | null
    role: {
      id: string
      name: string
      displayName: string
      description: string | null
      isSystem: boolean
    }
    businessUnit: {
      id: string
      name: string
      code: string
    }
  }>
  userPermission: Array<{
    permissionId: string
    createdAt: Date
    createdBy: string | null
    permission: {
      id: string
      name: string
      displayName: string
      description: string | null
      scope: PermissionScope
      module: string
    }
  }>
}

export interface AssignRoleInput {
  userId: string
  businessUnitId: string
  roleId: string
  assignedBy?: string
}

export interface AssignPermissionInput {
  userId: string
  permissionId: string
  createdBy?: string
}

// Get all users with their role assignments and permissions
export async function getUsers(businessUnitId?: string): Promise<{
  success: boolean
  users?: UserWithAssignments[]
  error?: string
}> {
  try {
    const users = await prisma.user.findMany({
      where: businessUnitId
        ? {
            userBusinessUnitRole: {
              some: {
                businessUnitId,
              },
            },
          }
        : undefined,
      include: {
        userBusinessUnitRole: {
          include: {
            role: true,
            businessUnit: {
              select: {
                id: true,
                code: true,
                name: true,
                // Exclude taxRate and other Decimal fields
              },
            },
          },
        },
        userPermission: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return { success: true, users }
  } catch (error) {
    console.error("Error fetching users:", error)
    return { success: false, error: "Failed to fetch users" }
  }
}

// Get user by ID with full details
export async function getUserById(userId: string): Promise<{
  success: boolean
  user?: UserWithAssignments
  error?: string
}> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userBusinessUnitRole: {
          include: {
            role: true,
            businessUnit: true,
          },
        },
        userPermission: {
          include: {
            permission: true,
          },
        },
      },
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    return { success: true, user }
  } catch (error) {
    console.error("Error fetching user:", error)
    return { success: false, error: "Failed to fetch user" }
  }
}

// Create new user
export async function createUser(userData: CreateUserInput): Promise<{
  success: boolean
  user?: UserWithAssignments
  error?: string
}> {
  try {
    // Check if email or username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: userData.email }, { username: userData.username }],
      },
    })

    if (existingUser) {
      return {
        success: false,
        error: existingUser.email === userData.email ? "Email already exists" : "Username already exists",
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        username: userData.username,
        name: userData.name,
        passwordHash,
        isActive: userData.isActive ?? true,
      },
      include: {
        userBusinessUnitRole: {
          include: {
            role: true,
            businessUnit: true,
          },
        },
        userPermission: {
          include: {
            permission: true,
          },
        },
      },
    })

    revalidatePath("/admin/users")
    return { success: true, user }
  } catch (error) {
    console.error("Error creating user:", error)
    return { success: false, error: "Failed to create user" }
  }
}

// Update user
export async function updateUser(
  userId: string,
  userData: UpdateUserInput,
): Promise<{
  success: boolean
  user?: UserWithAssignments
  error?: string
}> {
  try {
    // Check if email or username conflicts with other users
    if (userData.email || userData.username) {
      const whereConditions = []
      if (userData.email) {
        whereConditions.push({ email: userData.email })
      }
      if (userData.username) {
        whereConditions.push({ username: userData.username })
      }

      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: userId } },
            { OR: whereConditions },
          ],
        },
      })

      if (existingUser) {
        return {
          success: false,
          error: existingUser.email === userData.email ? "Email already exists" : "Username already exists",
        }
      }
    }

    // Prepare update data
    const updateData: {
      email?: string
      username?: string
      name?: string
      isActive?: boolean
      passwordHash?: string
    } = {}

    if (userData.email) updateData.email = userData.email
    if (userData.username) updateData.username = userData.username
    if (userData.name) updateData.name = userData.name
    if (userData.isActive !== undefined) updateData.isActive = userData.isActive

    // Hash password if provided
    if (userData.password) {
      updateData.passwordHash = await bcrypt.hash(userData.password, 12)
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        userBusinessUnitRole: {
          include: {
            role: true,
            businessUnit: true,
          },
        },
        userPermission: {
          include: {
            permission: true,
          },
        },
      },
    })

    revalidatePath("/admin/users")
    return { success: true, user }
  } catch (error) {
    console.error("Error updating user:", error)
    return { success: false, error: "Failed to update user" }
  }
}

// Delete user
export async function deleteUser(userId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await prisma.user.delete({
      where: { id: userId },
    })

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { success: false, error: "Failed to delete user" }
  }
}

// Assign role to user in business unit
export async function assignUserRole(assignmentData: AssignRoleInput): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await prisma.userBusinessUnitRole.create({
      data: {
        userId: assignmentData.userId,
        businessUnitId: assignmentData.businessUnitId,
        roleId: assignmentData.roleId,
        assignedBy: assignmentData.assignedBy,
      },
    })

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("Error assigning role:", error)
    return { success: false, error: "Failed to assign role" }
  }
}

// Remove role from user in business unit
export async function removeUserRole(
  userId: string,
  businessUnitId: string,
  roleId: string,
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await prisma.userBusinessUnitRole.delete({
      where: {
        userId_businessUnitId_roleId: {
          userId,
          businessUnitId,
          roleId,
        },
      },
    })

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("Error removing role:", error)
    return { success: false, error: "Failed to remove role" }
  }
}

// Assign permission directly to user
export async function assignUserPermission(assignmentData: AssignPermissionInput): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await prisma.userPermission.create({
      data: {
        userId: assignmentData.userId,
        permissionId: assignmentData.permissionId,
        createdBy: assignmentData.createdBy,
      },
    })

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("Error assigning permission:", error)
    return { success: false, error: "Failed to assign permission" }
  }
}

// Remove permission from user
export async function removeUserPermission(
  userId: string,
  permissionId: string,
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    await prisma.userPermission.delete({
      where: {
        userId_permissionId: {
          userId,
          permissionId,
        },
      },
    })

    revalidatePath("/admin/users")
    return { success: true }
  } catch (error) {
    console.error("Error removing permission:", error)
    return { success: false, error: "Failed to remove permission" }
  }
}

// Get user's effective permissions (from roles + direct assignments)
export async function getUserEffectivePermissions(
  userId: string,
  businessUnitId?: string,
): Promise<{
  success: boolean
  permissions?: Array<{
    id: string
    name: string
    displayName: string
    description: string | null
    scope: PermissionScope
    module: string
    source: "role" | "direct"
    roleName?: string
  }>
  error?: string
}> {
  try {
    // Get permissions from roles - Fixed the relation query
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        role: {
          assignments: {
            some: {
              userId,
              ...(businessUnitId && { businessUnitId }),
            },
          },
        },
      },
      include: {
        permission: true,
        role: true,
      },
    })

    // Get direct permissions
    const directPermissions = await prisma.userPermission.findMany({
      where: { userId },
      include: {
        permission: true,
      },
    })

    // Combine and deduplicate permissions
    const permissionMap = new Map<string, {
      id: string
      name: string
      displayName: string
      description: string | null
      scope: PermissionScope
      module: string
      source: "role" | "direct"
      roleName?: string
    }>()

    // Add role-based permissions
    rolePermissions.forEach((rolePermission) => {
      const key = rolePermission.permission.id
      if (!permissionMap.has(key)) {
        permissionMap.set(key, {
          id: rolePermission.permission.id,
          name: rolePermission.permission.name,
          displayName: rolePermission.permission.displayName,
          description: rolePermission.permission.description,
          scope: rolePermission.permission.scope,
          module: rolePermission.permission.module,
          source: "role",
          roleName: rolePermission.role.displayName,
        })
      }
    })

    // Add direct permissions
    directPermissions.forEach((userPermission) => {
      const key = userPermission.permission.id
      if (!permissionMap.has(key)) {
        permissionMap.set(key, {
          id: userPermission.permission.id,
          name: userPermission.permission.name,
          displayName: userPermission.permission.displayName,
          description: userPermission.permission.description,
          scope: userPermission.permission.scope,
          module: userPermission.permission.module,
          source: "direct",
        })
      }
    })

    const permissions = Array.from(permissionMap.values())

    return { success: true, permissions }
  } catch (error) {
    console.error("Error fetching user permissions:", error)
    return { success: false, error: "Failed to fetch user permissions" }
  }
}

export async function getAllUsers(): Promise<UserWithAssignments[]> {
  const result = await getUsers()
  return result.users || []
}

export async function getAllRoles(): Promise<
  Array<{
    id: string
    name: string
    displayName: string
    description: string | null
    isSystem: boolean
  }>
> {
  try {
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        isSystem: true,
      },
      orderBy: [{ isSystem: "desc" }, { displayName: "asc" }],
    })
    return roles
  } catch (error) {
    console.error("Error fetching all roles:", error)
    return []
  }
}

export async function getAllPermissions(): Promise<
  Array<{
    id: string
    name: string
    displayName: string
    description: string | null
    scope: PermissionScope
    module: string
  }>
> {
  try {
    const permissions = await prisma.permission.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        scope: true,
        module: true,
      },
      orderBy: [{ module: "asc" }, { displayName: "asc" }],
    })
    return permissions
  } catch (error) {
    console.error("Error fetching all permissions:", error)
    return []
  }
}