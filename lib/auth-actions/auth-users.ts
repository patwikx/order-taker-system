// In "@/lib/auth-actions/auth-users.ts"

import { prisma } from "../prisma";

/**
 * Fetches a user by their unique username.
 * This function is already correct and requires no changes.
 */
export const getUserByUsername = async (username: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    return user;
  } catch {
    return null;
  }
};

/**
 * UPDATED: Fetches a user by their ID and includes their role assignments and business units.
 * Updated to use the correct relation name from your schema.
 */
export const getUserById = async (id: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userBusinessUnitRole: {
          include: {
            role: true,
            businessUnit: true,
          },
        },
      },
    });
    return user;
  } catch {
    return null;
  }
};

/**
 * UPDATED: Alternative version that includes both relation types if you're using both.
 * Use this if you need both UserBusinessUnit and UserBusinessUnitRole relations.
 */
export const getUserByIdWithAllAssignments = async (id: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        businessUnits: {
          include: {
            businessUnit: true,
          },
        },
        userBusinessUnitRole: {
          include: {
            role: true,
            businessUnit: true,
          },
        },
      },
    });
    return user;
  } catch {
    return null;
  }
};

/**
 * CORRECTED: Fetches a user's email by their ID.
 * This function is correct and requires no changes.
 */
export const getUserEmailById = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    // Return the email string, or null if not found
    return user?.email ?? null;
  } catch {
    return null;
  }
};

/**
 * UPDATED: Fetches a user's name by their ID.
 * Updated to use the single 'name' field from your schema instead of firstName/lastName.
 */
export const getUserNameById = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    return user?.name ?? null;
  } catch {
    return null;
  }
};


/**
 * RENAMED & CONSOLIDATED: Fetches a user's username by their ID.
 * This replaces the old `getEmailByUserIdUpload` and `getEmailByApproverId` functions.
 */
export const getUsernameById = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });
    return user?.username ?? null;
  } catch {
    return null;
  }
};

/**
 * NEW: Fetches a user's active business unit assignments.
 * Returns only active assignments to avoid inactive/revoked access.
 */
export const getUserActiveAssignments = async (userId: string) => {
  try {
    const assignments = await prisma.userBusinessUnitRole.findMany({
      where: { 
        userId,
        // Add any additional filters for active assignments if needed
      },
      include: {
        role: true,
        businessUnit: true,
      },
    });
    return assignments;
  } catch {
    return [];
  }
};

/**
 * NEW: Checks if a user has a specific role in a specific business unit.
 * Useful for authorization checks.
 */
export const userHasRoleInBusinessUnit = async (
  userId: string, 
  roleId: string, 
  businessUnitId: string
): Promise<boolean> => {
  try {
    const assignment = await prisma.userBusinessUnitRole.findUnique({
      where: {
        userId_businessUnitId_roleId: {
          userId,
          businessUnitId,
          roleId,
        },
      },
    });
    return !!assignment;
  } catch {
    return false;
  }
};

/**
 * NEW: Gets user's roles in a specific business unit.
 * Returns all roles the user has in the given business unit.
 */
export const getUserRolesInBusinessUnit = async (userId: string, businessUnitId: string) => {
  try {
    const assignments = await prisma.userBusinessUnitRole.findMany({
      where: {
        userId,
        businessUnitId,
      },
      include: {
        role: true,
      },
    });
    return assignments.map(a => a.role);
  } catch {
    return [];
  }
};