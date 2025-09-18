"use server"

import { prisma } from "@/lib/prisma"
import { TableStatus, OrderStatus } from "@prisma/client"

export interface TableWithCurrentOrder {
  id: string
  businessUnitId: string
  number: number
  capacity: number
  status: TableStatus
  location?: string
  isActive: boolean
  currentOrder?: {
    id: string
    orderNumber: string
    status: OrderStatus
    totalAmount: number
    customerCount?: number
    isWalkIn: boolean
    walkInName?: string
    createdAt: Date
    customer?: {
      firstName?: string
      lastName?: string
    }
  }
}

// Get all tables for a business unit
export async function getTables(businessUnitId: string) {
  try {
    const tables = await prisma.table.findMany({
      where: {
        businessUnitId,
        isActive: true
      },
      include: {
        orders: {
          where: {
            status: {
              in: [
                OrderStatus.PENDING,
                OrderStatus.CONFIRMED,
                OrderStatus.IN_PROGRESS,
                OrderStatus.READY,
                OrderStatus.SERVED
              ]
            }
          },
          include: {
            customer: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        number: 'asc'
      }
    })

    // Transform to include current order
    const tablesWithCurrentOrder: TableWithCurrentOrder[] = tables.map(table => ({
      id: table.id,
      businessUnitId: table.businessUnitId,
      number: table.number,
      capacity: table.capacity,
      status: table.status,
      location: table.location ?? undefined,
      isActive: table.isActive,
      currentOrder: table.orders[0] ? {
        id: table.orders[0].id,
        orderNumber: table.orders[0].orderNumber,
        status: table.orders[0].status,
        totalAmount: Number(table.orders[0].totalAmount),
        customerCount: table.orders[0].customerCount ?? undefined,
        isWalkIn: table.orders[0].isWalkIn,
        walkInName: table.orders[0].walkInName ?? undefined,
        createdAt: table.orders[0].createdAt,
        customer: table.orders[0].customer ? {
          firstName: table.orders[0].customer.firstName ?? undefined,
          lastName: table.orders[0].customer.lastName ?? undefined
        } : undefined
      } : undefined
    }))

    return tablesWithCurrentOrder
  } catch (error) {
    console.error("Error fetching tables:", error)
    return []
  }
}

// Update table status
export async function updateTableStatus(businessUnitId: string, tableId: string, status: TableStatus) {
  try {
    const table = await prisma.table.findFirst({
      where: {
        id: tableId,
        businessUnitId
      }
    })

    if (!table) {
      throw new Error("Table not found")
    }

    await prisma.table.update({
      where: { id: tableId },
      data: { status }
    })

    return { success: true }
  } catch (error) {
    console.error("Error updating table status:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update table status" 
    }
  }
}