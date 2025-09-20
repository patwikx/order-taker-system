"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { AuditAction } from "@prisma/client"

export interface AuditLogEntry {
  id: string
  businessUnitId: string
  tableName: string
  recordId: string
  action: AuditAction
  oldValues?: Record<string, string | number | boolean | null>
  newValues?: Record<string, string | number | boolean | null>
  userId?: string
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  createdAt: Date
  user?: {
    id: string
    name: string
    email: string
  }
}

export interface CreateAuditLogInput {
  tableName: string
  recordId: string
  action: AuditAction
  oldValues?: Record<string, string | number | boolean | null>
  newValues?: Record<string, string | number | boolean | null>
  ipAddress?: string
  userAgent?: string
  sessionId?: string
}

// Create audit log entry
export async function createAuditLog(
  businessUnitId: string,
  auditData: CreateAuditLogInput
) {
  try {
    const session = await auth()
    
    const auditLog = await prisma.auditLog.create({
      data: {
        businessUnitId,
        tableName: auditData.tableName,
        recordId: auditData.recordId,
        action: auditData.action,
        oldValues: auditData.oldValues as Record<string, string | number | boolean | null> | undefined,
        newValues: auditData.newValues as Record<string, string | number | boolean | null> | undefined,
        userId: session?.user?.id,
        ipAddress: auditData.ipAddress,
        userAgent: auditData.userAgent,
        sessionId: auditData.sessionId
      }
    })

    return { success: true, auditLog }
  } catch (error) {
    console.error("Error creating audit log:", error)
    return { success: false, error: "Failed to create audit log" }
  }
}

// Get audit logs for a business unit
export async function getAuditLogs(
  businessUnitId: string,
  options?: {
    tableName?: string
    action?: AuditAction
    userId?: string
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }
): Promise<AuditLogEntry[]> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Check if user has admin access
    const hasAccess = await prisma.userBusinessUnitRole.findFirst({
      where: {
        userId: session.user.id,
        businessUnitId,
        role: {
          name: { in: ["admin", "manager"] }
        }
      }
    })

    if (!hasAccess) {
      throw new Error("Access denied")
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        businessUnitId,
        ...(options?.tableName && { tableName: options.tableName }),
        ...(options?.action && { action: options.action }),
        ...(options?.userId && { userId: options.userId }),
        ...(options?.startDate && options?.endDate && {
          createdAt: {
            gte: options.startDate,
            lte: options.endDate
          }
        })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: options?.limit || 100,
      skip: options?.offset || 0
    })

    return auditLogs.map(log => ({
      id: log.id,
      businessUnitId: log.businessUnitId,
      tableName: log.tableName,
      recordId: log.recordId,
      action: log.action,
      oldValues: (log.oldValues as Record<string, string | number | boolean | null>) ?? undefined,
      newValues: (log.newValues as Record<string, string | number | boolean | null>) ?? undefined,
      userId: log.userId ?? undefined,
      ipAddress: log.ipAddress ?? undefined,
      userAgent: log.userAgent ?? undefined,
      sessionId: log.sessionId ?? undefined,
      createdAt: log.createdAt,
      user: log.user ? {
        id: log.user.id,
        name: log.user.name,
        email: log.user.email
      } : undefined
    }))
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    return []
  }
}

// Get audit log statistics
export async function getAuditLogStats(businessUnitId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Check admin access
    const hasAccess = await prisma.userBusinessUnitRole.findFirst({
      where: {
        userId: session.user.id,
        businessUnitId,
        role: {
          name: { in: ["admin", "manager"] }
        }
      }
    })

    if (!hasAccess) {
      throw new Error("Access denied")
    }

    const [totalLogs, actionCounts, tableCounts, userCounts] = await Promise.all([
      prisma.auditLog.count({
        where: { businessUnitId }
      }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where: { businessUnitId },
        _count: { action: true }
      }),
      prisma.auditLog.groupBy({
        by: ['tableName'],
        where: { businessUnitId },
        _count: { tableName: true },
        orderBy: { _count: { tableName: 'desc' } },
        take: 10
      }),
      prisma.auditLog.groupBy({
        by: ['userId'],
        where: { 
          businessUnitId,
          userId: { not: null }
        },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10
      })
    ])

    return {
      success: true,
      stats: {
        totalLogs,
        actionCounts: actionCounts.reduce((acc, item) => {
          acc[item.action] = item._count.action
          return acc
        }, {} as Record<AuditAction, number>),
        tableCounts: tableCounts.map(item => ({
          tableName: item.tableName,
          count: item._count.tableName
        })),
        userCounts: userCounts.map(item => ({
          userId: item.userId!,
          count: item._count.userId
        }))
      }
    }
  } catch (error) {
    console.error("Error fetching audit log stats:", error)
    return { success: false, error: "Failed to fetch audit log statistics" }
  }
}