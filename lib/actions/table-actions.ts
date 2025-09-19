"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
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

export interface CreateTableInput {
  number: number
  capacity: number
  location?: string
}

export interface UpdateTableInput {
  number?: number
  capacity?: number
  location?: string
  status?: TableStatus
  isActive?: boolean
}

// Get all tables for a business unit
export async function getTables(businessUnitId: string) {
  try {
    const tables = await prisma.table.findMany({
      where: {
        businessUnitId,
        isActive: true,
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
                OrderStatus.SERVED,
              ],
            },
          },
          include: {
            customer: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        number: "asc",
      },
    })

    // Transform to include current order
    const tablesWithCurrentOrder: TableWithCurrentOrder[] = tables.map((table) => ({
      id: table.id,
      businessUnitId: table.businessUnitId,
      number: table.number,
      capacity: table.capacity,
      status: table.status,
      location: table.location ?? undefined,
      isActive: table.isActive,
      currentOrder: table.orders[0]
        ? {
            id: table.orders[0].id,
            orderNumber: table.orders[0].orderNumber,
            status: table.orders[0].status,
            totalAmount: Number(table.orders[0].totalAmount),
            customerCount: table.orders[0].customerCount ?? undefined,
            isWalkIn: table.orders[0].isWalkIn,
            walkInName: table.orders[0].walkInName ?? undefined,
            createdAt: table.orders[0].createdAt,
            customer: table.orders[0].customer
              ? {
                  firstName: table.orders[0].customer.firstName ?? undefined,
                  lastName: table.orders[0].customer.lastName ?? undefined,
                }
              : undefined,
          }
        : undefined,
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
        businessUnitId,
      },
    })

    if (!table) {
      throw new Error("Table not found")
    }

    await prisma.table.update({
      where: { id: tableId },
      data: { status },
    })

    return { success: true }
  } catch (error) {
    console.error("Error updating table status:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update table status",
    }
  }
}

// Create a new table
export async function createTable(businessUnitId: string, tableData: CreateTableInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Validate business unit exists and user has access
    const businessUnit = await prisma.businessUnit.findFirst({
      where: {
        id: businessUnitId,
        isActive: true,
        users: {
          some: {
            userId: session.user.id,
            isActive: true,
          },
        },
      },
    })

    if (!businessUnit) {
      throw new Error("Business unit not found or access denied")
    }

    // Check if table number already exists
    const existingTable = await prisma.table.findFirst({
      where: {
        businessUnitId,
        number: tableData.number,
        isActive: true,
      },
    })

    if (existingTable) {
      throw new Error(`Table number ${tableData.number} already exists`)
    }

    const table = await prisma.table.create({
      data: {
        businessUnitId,
        number: tableData.number,
        capacity: tableData.capacity,
        location: tableData.location,
        status: TableStatus.AVAILABLE,
        isActive: true,
      },
    })

    revalidatePath(`/${businessUnitId}`)
    return {
      success: true,
      table: {
        ...table,
        location: table.location ?? undefined,
      },
    }
  } catch (error) {
    console.error("Error creating table:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create table",
    }
  }
}

// Update a table
export async function updateTable(businessUnitId: string, tableId: string, tableData: UpdateTableInput) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Validate table exists and belongs to business unit
    const existingTable = await prisma.table.findFirst({
      where: {
        id: tableId,
        businessUnitId,
        businessUnit: {
          users: {
            some: {
              userId: session.user.id,
              isActive: true,
            },
          },
        },
      },
    })

    if (!existingTable) {
      throw new Error("Table not found or access denied")
    }

    // If table number is being updated, check for conflicts
    if (tableData.number && tableData.number !== existingTable.number) {
      const conflictingTable = await prisma.table.findFirst({
        where: {
          businessUnitId,
          number: tableData.number,
          isActive: true,
          id: { not: tableId },
        },
      })

      if (conflictingTable) {
        throw new Error(`Table number ${tableData.number} already exists`)
      }
    }

    // Check if table has active orders before changing critical properties
    if (tableData.status === TableStatus.OUT_OF_ORDER || tableData.isActive === false) {
      const activeOrder = await prisma.order.findFirst({
        where: {
          tableId,
          status: {
            in: [
              OrderStatus.PENDING,
              OrderStatus.CONFIRMED,
              OrderStatus.IN_PROGRESS,
              OrderStatus.READY,
              OrderStatus.SERVED,
            ],
          },
        },
      })

      if (activeOrder) {
        throw new Error("Cannot modify table with active orders. Please complete or cancel the order first.")
      }
    }

    const table = await prisma.table.update({
      where: { id: tableId },
      data: tableData,
    })

    revalidatePath(`/${businessUnitId}`)
    return {
      success: true,
      table: {
        ...table,
        location: table.location ?? undefined,
      },
    }
  } catch (error) {
    console.error("Error updating table:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update table",
    }
  }
}

// Delete a table (soft delete by setting isActive to false)
export async function deleteTable(businessUnitId: string, tableId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Validate table exists and belongs to business unit
    const existingTable = await prisma.table.findFirst({
      where: {
        id: tableId,
        businessUnitId,
        businessUnit: {
          users: {
            some: {
              userId: session.user.id,
              isActive: true,
            },
          },
        },
      },
    })

    if (!existingTable) {
      throw new Error("Table not found or access denied")
    }

    // Check if table has active orders
    const activeOrder = await prisma.order.findFirst({
      where: {
        tableId,
        status: {
          in: [
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.IN_PROGRESS,
            OrderStatus.READY,
            OrderStatus.SERVED,
          ],
        },
      },
    })

    if (activeOrder) {
      throw new Error("Cannot delete table with active orders. Please complete or cancel the order first.")
    }

    // Check if table has any historical orders
    const hasOrders = await prisma.order.findFirst({
      where: { tableId },
    })

    if (hasOrders) {
      // Soft delete to preserve historical data
      await prisma.table.update({
        where: { id: tableId },
        data: {
          isActive: false,
          status: TableStatus.OUT_OF_ORDER,
        },
      })
    } else {
      // Hard delete if no orders exist
      await prisma.table.delete({
        where: { id: tableId },
      })
    }

    revalidatePath(`/${businessUnitId}`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting table:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete table",
    }
  }
}

// Get all tables including inactive ones (for admin)
export async function getAllTables(businessUnitId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const tables = await prisma.table.findMany({
      where: {
        businessUnitId,
        businessUnit: {
          users: {
            some: {
              userId: session.user.id,
              isActive: true,
            },
          },
        },
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
                OrderStatus.SERVED,
              ],
            },
          },
          include: {
            customer: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: {
        number: "asc",
      },
    })

    return tables.map((table) => ({
      id: table.id,
      businessUnitId: table.businessUnitId,
      number: table.number,
      capacity: table.capacity,
      status: table.status,
      location: table.location ?? undefined,
      isActive: table.isActive,
      totalOrders: table._count.orders,
      currentOrder: table.orders[0]
        ? {
            id: table.orders[0].id,
            orderNumber: table.orders[0].orderNumber,
            status: table.orders[0].status,
            totalAmount: Number(table.orders[0].totalAmount),
            customerCount: table.orders[0].customerCount ?? undefined,
            isWalkIn: table.orders[0].isWalkIn,
            walkInName: table.orders[0].walkInName ?? undefined,
            createdAt: table.orders[0].createdAt,
            customer: table.orders[0].customer
              ? {
                  firstName: table.orders[0].customer.firstName ?? undefined,
                  lastName: table.orders[0].customer.lastName ?? undefined,
                }
              : undefined,
          }
        : undefined,
    }))
  } catch (error) {
    console.error("Error fetching all tables:", error)
    return []
  }
}

// Get table by ID
export async function getTable(businessUnitId: string, tableId: string) {
  try {
    const table = await prisma.table.findFirst({
      where: {
        id: tableId,
        businessUnitId,
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
                OrderStatus.SERVED,
              ],
            },
          },
          include: {
            customer: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    })

    if (!table) {
      return null
    }

    return {
      id: table.id,
      businessUnitId: table.businessUnitId,
      number: table.number,
      capacity: table.capacity,
      status: table.status,
      location: table.location ?? undefined,
      isActive: table.isActive,
      currentOrder: table.orders[0]
        ? {
            id: table.orders[0].id,
            orderNumber: table.orders[0].orderNumber,
            status: table.orders[0].status,
            totalAmount: Number(table.orders[0].totalAmount),
            customerCount: table.orders[0].customerCount ?? undefined,
            isWalkIn: table.orders[0].isWalkIn,
            walkInName: table.orders[0].walkInName ?? undefined,
            createdAt: table.orders[0].createdAt,
            customer: table.orders[0].customer
              ? {
                  firstName: table.orders[0].customer.firstName ?? undefined,
                  lastName: table.orders[0].customer.lastName ?? undefined,
                }
              : undefined,
          }
        : undefined,
    } as TableWithCurrentOrder
  } catch (error) {
    console.error("Error fetching table:", error)
    return null
  }
}
