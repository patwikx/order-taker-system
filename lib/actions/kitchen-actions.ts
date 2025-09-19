"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { KitchenOrderStatus, OrderStatus, OrderItemStatus, ItemType } from "@prisma/client"

export interface KitchenOrderWithDetails {
  id: string
  orderNumber: string
  tableNumber: number
  waiterName: string
  items: KitchenOrderItem[]
  status: KitchenOrderStatus
  estimatedTime?: number
  startedAt?: Date
  completedAt?: Date
  pickedUpAt?: Date
  createdAt: Date
  notes?: string
  isAdditionalItems?: boolean
}

export interface KitchenOrderItem {
  id: string
  name: string
  quantity: number
  notes?: string
  prepTime?: number
}

// Type guard to validate KitchenOrderItem
function isKitchenOrderItem(item: unknown): item is KitchenOrderItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof (item as KitchenOrderItem).id === 'string' &&
    typeof (item as KitchenOrderItem).name === 'string' &&
    typeof (item as KitchenOrderItem).quantity === 'number'
  )
}

// Transform and validate JSON items to KitchenOrderItem[]
function transformToKitchenOrderItems(jsonItems: unknown): KitchenOrderItem[] {
  if (!Array.isArray(jsonItems)) {
    return []
  }

  return jsonItems.filter(isKitchenOrderItem)
}

// Get all active kitchen orders (3 stages: PENDING, PREPARING, READY)
export async function getKitchenOrders(businessUnitId: string) {
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

    const kitchenOrders = await prisma.kitchenOrder.findMany({
      where: {
        orderNumber: {
          in: allOrderNumbers
        },
        status: {
          in: [KitchenOrderStatus.PENDING, KitchenOrderStatus.PREPARING, KitchenOrderStatus.READY]
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ]
    })

    return kitchenOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      waiterName: order.waiterName,
      items: transformToKitchenOrderItems(order.items),
      status: order.status,
      estimatedTime: order.estimatedTime ?? undefined,
      startedAt: order.startedAt ?? undefined,
      completedAt: order.completedAt ?? undefined,
      pickedUpAt: order.pickedUpAt ?? undefined,
      createdAt: order.createdAt,
      notes: order.notes ?? undefined,
      isAdditionalItems: order.orderNumber.includes('-ADD')
    })) as KitchenOrderWithDetails[]
  } catch (error) {
    console.error("Error fetching kitchen orders:", error)
    return []
  }
}

// Get completed/served kitchen orders for history view
export async function getCompletedKitchenOrders(businessUnitId: string) {
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

    const completedOrders = await prisma.kitchenOrder.findMany({
      where: {
        orderNumber: {
          in: allOrderNumbers
        },
        status: KitchenOrderStatus.SERVED,
        // Only show orders from the last 24 hours
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      orderBy: [
        { pickedUpAt: 'desc' },
        { completedAt: 'desc' }
      ]
    })

    return completedOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      waiterName: order.waiterName,
      items: transformToKitchenOrderItems(order.items),
      status: order.status,
      estimatedTime: order.estimatedTime ?? undefined,
      startedAt: order.startedAt ?? undefined,
      completedAt: order.completedAt ?? undefined,
      pickedUpAt: order.pickedUpAt ?? undefined,
      createdAt: order.createdAt,
      notes: order.notes ?? undefined,
      isAdditionalItems: order.orderNumber.includes('-ADD')
    })) as KitchenOrderWithDetails[]
  } catch (error) {
    console.error("Error fetching completed kitchen orders:", error)
    return []
  }
}

// Update kitchen order status
export async function updateKitchenOrderStatus(
  businessUnitId: string,
  kitchenOrderId: string,
  status: KitchenOrderStatus
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

    // Verify the kitchen order exists and belongs to this business unit
    const kitchenOrder = await prisma.kitchenOrder.findFirst({
      where: {
        id: kitchenOrderId,
        orderNumber: {
          in: allOrderNumbers
        }
      }
    })

    if (!kitchenOrder) {
      throw new Error("Kitchen order not found")
    }

    const updateData: {
      status: KitchenOrderStatus
      startedAt?: Date
      completedAt?: Date
      pickedUpAt?: Date
      updatedAt: Date
    } = {
      status,
      updatedAt: new Date()
    }

    // Set timestamps based on status
    if (status === KitchenOrderStatus.PREPARING && !kitchenOrder.startedAt) {
      updateData.startedAt = new Date()
    } else if (status === KitchenOrderStatus.READY && !kitchenOrder.completedAt) {
      updateData.completedAt = new Date()
    } else if (status === KitchenOrderStatus.SERVED) {
      updateData.pickedUpAt = new Date()
    }

    // Update kitchen order
    await prisma.kitchenOrder.update({
      where: { id: kitchenOrderId },
      data: updateData
    })

    // If order is ready, update the main order items status
    if (status === KitchenOrderStatus.READY) {
      // Get the base order number (remove -ADD suffix if present)
      const baseOrderNumber = kitchenOrder.orderNumber.replace('-ADD', '')
      
      const mainOrder = await prisma.order.findFirst({
        where: { orderNumber: baseOrderNumber },
        include: { orderItems: { include: { menuItem: true } } }
      })

      if (mainOrder) {
        // Update food items to READY status
        const foodItemIds = mainOrder.orderItems
          .filter(item => item.menuItem.type === ItemType.FOOD)
          .map(item => item.id)

        if (foodItemIds.length > 0) {
          await prisma.orderItem.updateMany({
            where: { id: { in: foodItemIds } },
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

    // If order is marked as served/picked up, update main order items to SERVED
    if (status === KitchenOrderStatus.SERVED) {
      const baseOrderNumber = kitchenOrder.orderNumber.replace('-ADD', '')
      
      const mainOrder = await prisma.order.findFirst({
        where: { orderNumber: baseOrderNumber },
        include: { orderItems: { include: { menuItem: true } } }
      })

      if (mainOrder) {
        // Update food items to SERVED status
        const foodItemIds = mainOrder.orderItems
          .filter(item => item.menuItem.type === ItemType.FOOD)
          .map(item => item.id)

        if (foodItemIds.length > 0) {
          await prisma.orderItem.updateMany({
            where: { id: { in: foodItemIds } },
            data: { status: OrderItemStatus.SERVED }
          })
        }
      }
    }

    revalidatePath(`/${businessUnitId}/kitchen`)
    revalidatePath(`/${businessUnitId}`)
    return { success: true }
  } catch (error) {
    console.error("Error updating kitchen order status:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update kitchen order status" 
    }
  }
}

// Start preparing kitchen order (PENDING -> PREPARING)
export async function startPreparingOrder(businessUnitId: string, kitchenOrderId: string) {
  return updateKitchenOrderStatus(businessUnitId, kitchenOrderId, KitchenOrderStatus.PREPARING)
}

// Mark kitchen order as ready (PREPARING -> READY)
export async function markOrderReady(businessUnitId: string, kitchenOrderId: string) {
  return updateKitchenOrderStatus(businessUnitId, kitchenOrderId, KitchenOrderStatus.READY)
}

// Mark kitchen order as picked up/served (READY -> SERVED)
export async function markOrderPickedUp(businessUnitId: string, kitchenOrderId: string) {
  return updateKitchenOrderStatus(businessUnitId, kitchenOrderId, KitchenOrderStatus.SERVED)
}

// Auto-accept all pending orders (called periodically or on new orders)
export async function autoAcceptPendingOrders(businessUnitId: string) {
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
    await prisma.kitchenOrder.updateMany({
      where: {
        orderNumber: {
          in: allOrderNumbers
        },
        status: KitchenOrderStatus.PENDING
      },
      data: {
        status: KitchenOrderStatus.PENDING, // Keep as PENDING for kitchen staff to start
        updatedAt: new Date()
      }
    })

    revalidatePath(`/${businessUnitId}/kitchen`)
    return { success: true }
  } catch (error) {
    console.error("Error auto-accepting orders:", error)
    return { success: false, error: "Failed to auto-accept orders" }
  }
}

// Remove completed orders from kitchen display
export async function removeCompletedOrders(businessUnitId: string) {
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

    // Update completed orders to a final status (or delete them)
    await prisma.kitchenOrder.deleteMany({
      where: {
        orderNumber: {
          in: allOrderNumbers
        },
        status: KitchenOrderStatus.SERVED,
        pickedUpAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
        }
      }
    })

    revalidatePath(`/${businessUnitId}/kitchen`)
    return { success: true }
  } catch (error) {
    console.error("Error removing completed orders:", error)
    return { success: false, error: "Failed to remove completed orders" }
  }
}