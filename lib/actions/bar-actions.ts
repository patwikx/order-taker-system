"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { BarOrderStatus, OrderStatus, OrderItemStatus, ItemType } from "@prisma/client"

export interface BarOrderWithDetails {
  id: string
  orderNumber: string
  tableNumber: number
  waiterName: string
  items: BarOrderItem[]
  status: BarOrderStatus
  estimatedTime?: number
  startedAt?: Date
  completedAt?: Date
  createdAt: Date
  notes?: string
  isAdditionalItems?: boolean
}

export interface BarOrderItem {
  id: string
  name: string
  quantity: number
  notes?: string
  prepTime?: number
}

// Type guard to validate BarOrderItem
function isBarOrderItem(item: unknown): item is BarOrderItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof (item as BarOrderItem).id === 'string' &&
    typeof (item as BarOrderItem).name === 'string' &&
    typeof (item as BarOrderItem).quantity === 'number'
  )
}

// Transform and validate JSON items to BarOrderItem[]
function transformToBarOrderItems(jsonItems: unknown): BarOrderItem[] {
  if (!Array.isArray(jsonItems)) {
    return []
  }

  return jsonItems.filter(isBarOrderItem)
}

// Get all active bar orders (3 stages: PENDING, PREPARING, READY)
export async function getBarOrders(businessUnitId: string) {
  try {
    // Get base order numbers for this business unit
    const baseOrderNumbers = await prisma.order.findMany({
      where: { businessUnitId },
      select: { orderNumber: true }
    }).then(orders => orders.map(o => o.orderNumber))

    // Create array that includes both base orders and their additional orders
    const allOrderNumbers: string[] = []
    
    for (const orderNumber of baseOrderNumbers) {
      allOrderNumbers.push(orderNumber) // Base order
      allOrderNumbers.push(`${orderNumber}-ADD`) // Additional items order
    }

    const barOrders = await prisma.barOrder.findMany({
      where: {
        orderNumber: {
          in: allOrderNumbers
        },
        status: {
          in: [BarOrderStatus.PENDING, BarOrderStatus.PREPARING, BarOrderStatus.READY]
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ]
    })

    return barOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      waiterName: order.waiterName,
      items: transformToBarOrderItems(order.items),
      status: order.status,
      estimatedTime: order.estimatedTime ?? undefined,
      startedAt: order.startedAt ?? undefined,
      completedAt: order.completedAt ?? undefined,
      createdAt: order.createdAt,
      notes: order.notes ?? undefined,
      isAdditionalItems: order.orderNumber.includes('-ADD')
    })) as BarOrderWithDetails[]
  } catch (error) {
    console.error("Error fetching bar orders:", error)
    return []
  }
}

// Get completed/served bar orders for history view
export async function getCompletedBarOrders(businessUnitId: string) {
  try {
    // Get base order numbers for this business unit
    const baseOrderNumbers = await prisma.order.findMany({
      where: { businessUnitId },
      select: { orderNumber: true }
    }).then(orders => orders.map(o => o.orderNumber))

    // Create array that includes both base orders and their additional orders
    const allOrderNumbers: string[] = []
    
    for (const orderNumber of baseOrderNumbers) {
      allOrderNumbers.push(orderNumber) // Base order
      allOrderNumbers.push(`${orderNumber}-ADD`) // Additional items order
    }

    const completedOrders = await prisma.barOrder.findMany({
      where: {
        orderNumber: {
          in: allOrderNumbers
        },
        status: BarOrderStatus.SERVED,
        // Only show orders from the last 24 hours
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      orderBy: [
        { completedAt: 'desc' }
      ]
    })

    return completedOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      waiterName: order.waiterName,
      items: transformToBarOrderItems(order.items),
      status: order.status,
      estimatedTime: order.estimatedTime ?? undefined,
      startedAt: order.startedAt ?? undefined,
      completedAt: order.completedAt ?? undefined,
      createdAt: order.createdAt,
      notes: order.notes ?? undefined,
      isAdditionalItems: order.orderNumber.includes('-ADD')
    })) as BarOrderWithDetails[]
  } catch (error) {
    console.error("Error fetching completed bar orders:", error)
    return []
  }
}

// Update bar order status
export async function updateBarOrderStatus(
  businessUnitId: string,
  barOrderId: string,
  status: BarOrderStatus
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Get base order numbers for this business unit
    const baseOrderNumbers = await prisma.order.findMany({
      where: { businessUnitId },
      select: { orderNumber: true }
    }).then(orders => orders.map(o => o.orderNumber))

    // Create array that includes both base orders and their additional orders
    const allOrderNumbers: string[] = []
    
    for (const orderNumber of baseOrderNumbers) {
      allOrderNumbers.push(orderNumber) // Base order
      allOrderNumbers.push(`${orderNumber}-ADD`) // Additional items order
    }

    // Verify the bar order exists and belongs to this business unit
    const barOrder = await prisma.barOrder.findFirst({
      where: {
        id: barOrderId,
        orderNumber: {
          in: allOrderNumbers
        }
      }
    })

    if (!barOrder) {
      throw new Error("Bar order not found")
    }

    const updateData: {
      status: BarOrderStatus
      startedAt?: Date
      completedAt?: Date
      updatedAt: Date
    } = {
      status,
      updatedAt: new Date()
    }

    // Set timestamps based on status
    if (status === BarOrderStatus.PREPARING && !barOrder.startedAt) {
      updateData.startedAt = new Date()
    } else if (status === BarOrderStatus.READY && !barOrder.completedAt) {
      updateData.completedAt = new Date()
    }

    // Update bar order
    await prisma.barOrder.update({
      where: { id: barOrderId },
      data: updateData
    })

    // If order is ready, update the main order items status
    if (status === BarOrderStatus.READY) {
      // Get the base order number (remove -ADD suffix if present)
      const baseOrderNumber = barOrder.orderNumber.replace('-ADD', '')
      
      const mainOrder = await prisma.order.findFirst({
        where: { orderNumber: baseOrderNumber },
        include: { orderItems: { include: { menuItem: true } } }
      })

      if (mainOrder) {
        // Update drink items to READY status
        const drinkItemIds = mainOrder.orderItems
          .filter(item => item.menuItem.type === ItemType.DRINK)
          .map(item => item.id)

        if (drinkItemIds.length > 0) {
          await prisma.orderItem.updateMany({
            where: { id: { in: drinkItemIds } },
            data: { status: OrderItemStatus.READY }
          })
        }

        // Check if all items are ready to update main order status
        const allItems = await prisma.orderItem.findMany({
          where: { orderId: mainOrder.id },
          include: { menuItem: true }
        })

        const allItemsReady = allItems.every(item => 
          item.status === OrderItemStatus.READY || 
          item.status === OrderItemStatus.SERVED
        )

        if (allItemsReady && mainOrder.status !== OrderStatus.READY) {
          await prisma.order.update({
            where: { id: mainOrder.id },
            data: { status: OrderStatus.READY }
          })
        }
      }
    }

    // If order is marked as served, update main order items to SERVED
    if (status === BarOrderStatus.SERVED) {
      const baseOrderNumber = barOrder.orderNumber.replace('-ADD', '')
      
      const mainOrder = await prisma.order.findFirst({
        where: { orderNumber: baseOrderNumber },
        include: { orderItems: { include: { menuItem: true } } }
      })

      if (mainOrder) {
        // Update drink items to SERVED status
        const drinkItemIds = mainOrder.orderItems
          .filter(item => item.menuItem.type === ItemType.DRINK)
          .map(item => item.id)

        if (drinkItemIds.length > 0) {
          await prisma.orderItem.updateMany({
            where: { id: { in: drinkItemIds } },
            data: { status: OrderItemStatus.SERVED }
          })
        }
      }
    }

    revalidatePath(`/${businessUnitId}/bar`)
    revalidatePath(`/${businessUnitId}`)
    return { success: true }
  } catch (error) {
    console.error("Error updating bar order status:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update bar order status" 
    }
  }
}

// Start preparing bar order (PENDING -> PREPARING)
export async function startPreparingBarOrder(businessUnitId: string, barOrderId: string) {
  return updateBarOrderStatus(businessUnitId, barOrderId, BarOrderStatus.PREPARING)
}

// Mark bar order as ready (PREPARING -> READY)
export async function markBarOrderReady(businessUnitId: string, barOrderId: string) {
  return updateBarOrderStatus(businessUnitId, barOrderId, BarOrderStatus.READY)
}

// Mark bar order as served (READY -> SERVED)
export async function markBarOrderServed(businessUnitId: string, barOrderId: string) {
  return updateBarOrderStatus(businessUnitId, barOrderId, BarOrderStatus.SERVED)
}

// Alias for compatibility with kitchen workflow naming
export async function markBarOrderPickedUp(businessUnitId: string, barOrderId: string) {
  return updateBarOrderStatus(businessUnitId, barOrderId, BarOrderStatus.SERVED)
}

// Auto-accept all pending bar orders (called periodically or on new orders)
export async function autoAcceptPendingBarOrders(businessUnitId: string) {
  try {
    // Get base order numbers for this business unit
    const baseOrderNumbers = await prisma.order.findMany({
      where: { businessUnitId },
      select: { orderNumber: true }
    }).then(orders => orders.map(o => o.orderNumber))

    // Create array that includes both base orders and their additional orders
    const allOrderNumbers: string[] = []
    
    for (const orderNumber of baseOrderNumbers) {
      allOrderNumbers.push(orderNumber) // Base order
      allOrderNumbers.push(`${orderNumber}-ADD`) // Additional items order
    }

    // Auto-accept all pending orders
    await prisma.barOrder.updateMany({
      where: {
        orderNumber: {
          in: allOrderNumbers
        },
        status: BarOrderStatus.PENDING
      },
      data: {
        status: BarOrderStatus.PENDING, // Keep as PENDING for bar staff to start
        updatedAt: new Date()
      }
    })

    revalidatePath(`/${businessUnitId}/bar`)
    return { success: true }
  } catch (error) {
    console.error("Error auto-accepting bar orders:", error)
    return { success: false, error: "Failed to auto-accept bar orders" }
  }
}

// Remove completed orders from bar display
export async function removeCompletedBarOrders(businessUnitId: string) {
  try {
    // Get base order numbers for this business unit
    const baseOrderNumbers = await prisma.order.findMany({
      where: { businessUnitId },
      select: { orderNumber: true }
    }).then(orders => orders.map(o => o.orderNumber))

    // Create array that includes both base orders and their additional orders
    const allOrderNumbers: string[] = []
    
    for (const orderNumber of baseOrderNumbers) {
      allOrderNumbers.push(orderNumber) // Base order
      allOrderNumbers.push(`${orderNumber}-ADD`) // Additional items order
    }

    // Delete completed orders older than 24 hours
    await prisma.barOrder.deleteMany({
      where: {
        orderNumber: {
          in: allOrderNumbers
        },
        status: BarOrderStatus.SERVED,
        completedAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
        }
      }
    })

    revalidatePath(`/${businessUnitId}/bar`)
    return { success: true }
  } catch (error) {
    console.error("Error removing completed bar orders:", error)
    return { success: false, error: "Failed to remove completed bar orders" }
  }
}